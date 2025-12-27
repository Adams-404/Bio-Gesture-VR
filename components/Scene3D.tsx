import React, { useRef, useLayoutEffect, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MoleculeData, GestureState, GestureType } from '../types';
import { ATOM_COLORS, ATOM_RADII } from '../constants';

interface Scene3DProps {
  data: MoleculeData | null;
  gesture: GestureState;
  loading: boolean;
}

const TempObject = new THREE.Object3D();
const TempColor = new THREE.Color();

const AtomInstancedMesh: React.FC<{ data: MoleculeData; gesture: GestureState }> = ({ data, gesture }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera, raycaster, scene } = useThree();
  const [hoveredAtom, setHoveredAtom] = useState<number | null>(null);

  // Memoize geometry/material to avoid recreation
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.1 }), []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    // Initialize InstancedMesh
    // Center the molecule
    const cx = data.center.x;
    const cy = data.center.y;
    const cz = data.center.z;

    data.atoms.forEach((atom, i) => {
      const scale = (ATOM_RADII[atom.element] || ATOM_RADII.DEFAULT) * 0.3; // Scale down
      TempObject.position.set(atom.x - cx, atom.y - cy, atom.z - cz);
      TempObject.scale.set(scale, scale, scale);
      TempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, TempObject.matrix);

      const color = ATOM_COLORS[atom.element] || ATOM_COLORS.DEFAULT;
      TempColor.set(color);
      meshRef.current!.setColorAt(i, TempColor);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [data]);

  useFrame(() => {
    if (!meshRef.current) return;

    // Raycasting logic for "POINT" gesture
    if (gesture.type === GestureType.POINT) {
        raycaster.setFromCamera(gesture.pointerPosition, camera);
        const intersects = raycaster.intersectObject(meshRef.current);
        
        if (intersects.length > 0) {
            const instanceId = intersects[0].instanceId;
            if (instanceId !== undefined && instanceId !== hoveredAtom) {
                setHoveredAtom(instanceId);
                // Highlight logic could go here (e.g., emission)
            }
        } else {
            setHoveredAtom(null);
        }
    } else {
        if (hoveredAtom !== null) setHoveredAtom(null);
    }
  });

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, data.atoms.length]}
        frustumCulled={false} // Prevent culling issues with large molecules
      />
      {hoveredAtom !== null && (
          <Html position={[
              data.atoms[hoveredAtom].x - data.center.x,
              data.atoms[hoveredAtom].y - data.center.y,
              data.atoms[hoveredAtom].z - data.center.z
          ]}>
              <div className="bg-black/80 text-white text-xs p-2 rounded border border-cyan-500 pointer-events-none whitespace-nowrap z-50">
                  <div className="font-bold">{data.atoms[hoveredAtom].element} - {data.atoms[hoveredAtom].id}</div>
                  <div>{data.atoms[hoveredAtom].residue} {data.atoms[hoveredAtom].resSeq}</div>
              </div>
          </Html>
      )}
    </>
  );
};

const GestureHandler = ({ gesture }: { gesture: GestureState }) => {
    const groupRef = useRef<THREE.Group>(null);
    const targetRotation = useRef({ x: 0, y: 0 });
    const targetScale = useRef(1);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // GRIP: Rotate
        if (gesture.type === GestureType.GRIP) {
            targetRotation.current.y += gesture.rotationDelta.x;
            targetRotation.current.x += gesture.rotationDelta.y;
        }

        // PINCH: Zoom
        if (gesture.type === GestureType.PINCH_ZOOM) {
            // Smooth zoom accumulation
            // targetScale.current *= gesture.scaleFactor; // This can explode quickly
            // Better: use the factor to nudge target
             if (gesture.scaleFactor > 1.05) targetScale.current *= 1.02;
             if (gesture.scaleFactor < 0.95) targetScale.current *= 0.98;
        }

        // Apply smooth lerp
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.current.y, 0.1);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.current.x, 0.1);
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale.current, targetScale.current, targetScale.current), 0.1);
    });

    return (
        <group ref={groupRef}>
             {/* This group handles the rotation/scale wrapper */}
             {/* The children components (Molecule) will be inside */}
        </group>
    )
}

// Wrapper to bridge non-component logic
const MoleculeGroup: React.FC<{ data: MoleculeData; gesture: GestureState }> = ({ data, gesture }) => {
     const groupRef = useRef<THREE.Group>(null);
     const currentRotation = useRef(new THREE.Quaternion());
     const currentScale = useRef(1);

     useFrame(() => {
         if (!groupRef.current) return;
         
         if (gesture.type === GestureType.GRIP) {
             const qx = new THREE.Quaternion();
             qx.setFromAxisAngle(new THREE.Vector3(1, 0, 0), gesture.rotationDelta.y);
             const qy = new THREE.Quaternion();
             qy.setFromAxisAngle(new THREE.Vector3(0, 1, 0), gesture.rotationDelta.x);
             
             // Multiply current rotation by delta
             groupRef.current.quaternion.multiplyQuaternions(qy, groupRef.current.quaternion);
             groupRef.current.quaternion.multiplyQuaternions(qx, groupRef.current.quaternion);
         }

         if (gesture.type === GestureType.PINCH_ZOOM) {
            // Simple scale clamping
             const newScale = currentScale.current * gesture.scaleFactor;
             const clamped = Math.max(0.1, Math.min(newScale, 5.0));
             currentScale.current = clamped;
         }
         
         // Smoothly interpolate scale
         groupRef.current.scale.lerp(new THREE.Vector3(currentScale.current, currentScale.current, currentScale.current), 0.1);
     });

     return (
         <group ref={groupRef}>
             <AtomInstancedMesh data={data} gesture={gesture} />
         </group>
     );
}

const Scene3D: React.FC<Scene3DProps> = ({ data, gesture, loading }) => {
  return (
    <Canvas camera={{ position: [0, 0, 40], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {data && !loading ? (
        <MoleculeGroup data={data} gesture={gesture} />
      ) : null}

      {!data && !loading && (
          <Html center>
              <div className="text-white text-lg opacity-50">No Molecule Loaded</div>
          </Html>
      )}

      {/* Fallback mouse controls if hands are tired */}
      <OrbitControls enablePan={false} enabled={gesture.type === GestureType.NONE} />
    </Canvas>
  );
};

export default Scene3D;
