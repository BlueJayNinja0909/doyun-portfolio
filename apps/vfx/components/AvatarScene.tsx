'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * Doyun's real Roblox avatar, exported from Studio and rendered in 3D.
 *
 * Studio's OBJ export preserves part names as groups, and `scripts/process-avatar.mjs`
 * carries them through the glTF conversion. That is what makes this worth the bytes:
 * `Player8` is the head, so it can rotate independently and genuinely look at the
 * cursor, rather than the whole figure tilting like a card.
 *
 * The rendering is on demand — the canvas only draws while the head is still easing
 * toward the cursor. An idle page costs nothing.
 */

/** Head group in the Studio export, identified geometrically: the topmost body cube. */
const HEAD_NODE = 'Player8';
/**
 * Accessories that sit on the head and must turn with it. Identified from the export's
 * bounding boxes: hat (Handle5), hair (Handle1) and glasses (Handle6) all centre above
 * the head's own centre. Handle3 straddles the neck and stays with the body — turning
 * it looked like the collar was detaching.
 */
const HEAD_ATTACHED = new Set(['Handle5', 'Handle1', 'Handle6']);

const MAX_YAW = 0.6;
const MAX_PITCH = 0.3;
const TORSO_FOLLOW = 0.22;
const EASE = 0.11;

function useAvatarGltf() {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const draco = new DRACOLoader();
    // Self-hosted rather than the Google CDN default: a hero element should not depend
    // on a third-party host being up, and it keeps the request same-origin.
    draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load(
      '/avatar/avatar.glb',
      (gltf) => {
        if (cancelled) return;
        setScene(gltf.scene);
      },
      undefined,
      () => !cancelled && setFailed(true),
    );

    return () => {
      cancelled = true;
      draco.dispose();
    };
  }, []);

  return { scene, failed };
}

function Rig({ pointer }: { pointer: React.RefObject<{ x: number; y: number }> }) {
  const { scene } = useAvatarGltf();
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const current = useRef({ yaw: 0, pitch: 0 });
  const { invalidate } = useThree();

  // Split the loaded scene into a head group and everything else, so the head can be
  // rotated about the neck rather than the model's origin.
  const split = useMemo(() => {
    if (!scene) return null;

    // Matrices must be current before any Box3 measurement, and the whole-figure box
    // must be taken BEFORE reparenting — moving every child out of `scene` leaves it
    // empty, and measuring it then yields an inverted, meaningless box.
    scene.updateMatrixWorld(true);
    const full = new THREE.Box3().setFromObject(scene);
    const size = full.getSize(new THREE.Vector3());
    const minY = full.min.y;
    const scale = 4.6 / Math.max(size.y, 0.001);

    // Horizontal centre comes from the BODY only, not the full bounding box. The
    // katanas project well past one shoulder, so centring on everything pushed the
    // figure visibly off to one side.
    const bodyOnly = new THREE.Box3();
    for (const child of scene.children) {
      if (child.name.startsWith('Player')) bodyOnly.expandByObject(child);
    }
    const centre = bodyOnly.isEmpty()
      ? full.getCenter(new THREE.Vector3())
      : bodyOnly.getCenter(new THREE.Vector3());

    const headParts: THREE.Object3D[] = [];
    const bodyParts: THREE.Object3D[] = [];
    for (const child of [...scene.children]) {
      (child.name === HEAD_NODE || HEAD_ATTACHED.has(child.name) ? headParts : bodyParts).push(child);
    }

    // Pivot at the base of the head, not its centre — a head rotating about its middle
    // reads as a floating ball rather than a neck turning.
    const headBox = new THREE.Box3();
    for (const p of headParts) headBox.expandByObject(p);
    const pivot = new THREE.Vector3(
      (headBox.min.x + headBox.max.x) / 2,
      headBox.min.y,
      (headBox.min.z + headBox.max.z) / 2,
    );

    const head = new THREE.Group();
    const body = new THREE.Group();

    // Geometry carries absolute coordinates from the export, so parts are shifted into
    // place rather than the groups being offset. Everything ends up centred on the
    // body's own axis with the feet at y=0, which makes every rotation below pivot
    // where it should instead of swinging the figure around the scene origin.
    const ground = new THREE.Vector3(centre.x, minY, centre.z);

    for (const p of headParts) {
      p.position.sub(pivot);
      head.add(p);
    }
    for (const p of bodyParts) {
      p.position.sub(ground);
      body.add(p);
    }

    // Head pivot expressed relative to the same origin the body now uses.
    const headPivot = pivot.clone().sub(ground);

    return { head, body, headPivot, scale };
  }, [scene]);

  useFrame(() => {
    if (!split || !headRef.current || !bodyRef.current) return;

    const targetYaw = THREE.MathUtils.clamp(pointer.current.x * MAX_YAW * 1.5, -MAX_YAW, MAX_YAW);
    const targetPitch = THREE.MathUtils.clamp(pointer.current.y * MAX_PITCH * 1.5, -MAX_PITCH, MAX_PITCH);

    current.current.yaw += (targetYaw - current.current.yaw) * EASE;
    current.current.pitch += (targetPitch - current.current.pitch) * EASE;

    headRef.current.rotation.y = current.current.yaw;
    headRef.current.rotation.x = current.current.pitch;
    bodyRef.current.rotation.y = current.current.yaw * TORSO_FOLLOW;

    const settled =
      Math.abs(targetYaw - current.current.yaw) < 0.0008 &&
      Math.abs(targetPitch - current.current.pitch) < 0.0008;
    if (!settled) invalidate();
  });

  useEffect(() => {
    if (split) invalidate();
  }, [split, invalidate]);

  if (!split) return null;

  return (
    // Scales the export's stud units into view and drops the feet to the floor line.
    // Parts were already centred on the body axis in the split above.
    <group scale={split.scale} position={[0, -2.3, 0]}>
      {/* Roblox exports a character facing -Z and the camera sits on +Z, so without
          this the visitor is greeted by the back of his head. It lives on its own
          group because bodyRef's rotation.y is overwritten every frame by the yaw
          follow — putting the flip there would be cancelled out immediately. */}
      <group rotation={[0, Math.PI, 0]}>
        <group ref={bodyRef}>
          <primitive object={split.body} />
          {/* Head sits at the pivot its parts were offset from, so rotating this group
              swings the head about the neck rather than about its own centre. */}
          <group
            ref={headRef}
            position={[split.headPivot.x, split.headPivot.y, split.headPivot.z]}
          >
            <primitive object={split.head} />
          </group>
        </group>
      </group>
    </group>
  );
}

export default function AvatarScene() {
  const pointer = useRef({ x: 0, y: 0 });
  const invalidateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      invalidateRef.current?.();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <Canvas
      // On demand: frames are requested when the cursor moves, not run continuously.
      frameloop="demand"
      dpr={[1, 1.6]}
      camera={{ position: [0, 0.4, 8.4], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      onCreated={({ invalidate }) => {
        invalidateRef.current = invalidate;
      }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 6, 5]} intensity={2.4} />
      <directionalLight position={[-4, 2, -3]} intensity={0.9} color="#8f7bff" />
      <Rig pointer={pointer} />
    </Canvas>
  );
}
