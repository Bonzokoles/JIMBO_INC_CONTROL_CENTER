"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type * as THREE from "three"

export default function LoadingPlaceholder() {
  const wireframeRef = useRef<THREE.Group>(null)
  const dotsRef = useRef<THREE.Group>(null)

  // Create dots at vertices
  useFrame(({ clock }) => {
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y = clock.getElapsedTime() * 0.2
    }

    if (dotsRef.current) {
      // Make dots flash at different times
      dotsRef.current.children.forEach((dot, i) => {
        const material = (dot as THREE.Mesh).material as THREE.MeshStandardMaterial
        const time = clock.getElapsedTime() + i * 0.3
        material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.5
      })
    }
  })

  return (
    <>
      <group ref={wireframeRef}>
        {/* Dark QLED base mesh */}
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#111111" wireframe={true} transparent opacity={0.7} />
        </mesh>

        {/* White mesh overlay */}
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#ffffff" wireframe={true} transparent opacity={0.3} />
        </mesh>

        {/* Inner sphere */}
        <mesh>
          <sphereGeometry args={[0.75, 16, 16]} />
          <meshStandardMaterial color="#ffffff" wireframe={true} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Flashing dots at connection points */}
      <group ref={dotsRef}>
        {/* Create 8 dots at cube corners */}
        {[
          [0.75, 0.75, 0.75],
          [0.75, 0.75, -0.75],
          [0.75, -0.75, 0.75],
          [0.75, -0.75, -0.75],
          [-0.75, 0.75, 0.75],
          [-0.75, 0.75, -0.75],
          [-0.75, -0.75, 0.75],
          [-0.75, -0.75, -0.75],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ff9999" emissive="#ff5555" emissiveIntensity={0.8} />
          </mesh>
        ))}

        {/* Create dots along edges */}
        {[
          [0, 0.75, 0.75],
          [0, 0.75, -0.75],
          [0, -0.75, 0.75],
          [0, -0.75, -0.75],
          [0.75, 0, 0.75],
          [0.75, 0, -0.75],
          [-0.75, 0, 0.75],
          [-0.75, 0, -0.75],
          [0.75, 0.75, 0],
          [0.75, -0.75, 0],
          [-0.75, 0.75, 0],
          [-0.75, -0.75, 0],
        ].map((pos, i) => (
          <mesh key={i + 8} position={pos as [number, number, number]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ff9999" emissive="#ff5555" emissiveIntensity={0.6} />
          </mesh>
        ))}
      </group>
    </>
  )
}
