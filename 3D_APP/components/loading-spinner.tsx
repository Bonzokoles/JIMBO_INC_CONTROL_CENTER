"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type * as THREE from "three"

export default function LoadingSpinner() {
  const groupRef = useRef<THREE.Group>(null)
  const dotsRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.5
    }

    if (dotsRef.current) {
      // Make dots flash at different times
      dotsRef.current.children.forEach((dot, i) => {
        const material = (dot as THREE.Mesh).material as THREE.MeshStandardMaterial
        const time = clock.getElapsedTime() + i * 0.2
        material.emissiveIntensity = 0.5 + Math.sin(time * 3) * 0.5
      })
    }
  })

  return (
    <group ref={groupRef}>
      {/* Dark QLED base */}
      <mesh>
        <torusGeometry args={[1, 0.1, 16, 32]} />
        <meshStandardMaterial color="#111111" wireframe={true} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.1, 16, 32]} />
        <meshStandardMaterial color="#111111" wireframe={true} />
      </mesh>

      {/* White mesh overlay */}
      <mesh>
        <torusGeometry args={[1, 0.08, 16, 32]} />
        <meshStandardMaterial color="#ffffff" wireframe={true} transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.08, 16, 32]} />
        <meshStandardMaterial color="#ffffff" wireframe={true} transparent opacity={0.7} />
      </mesh>

      {/* Flashing dots */}
      <group ref={dotsRef}>
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(angle) * 1, Math.sin(angle) * 1, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#ff9999" emissive="#ff5555" emissiveIntensity={0.8} />
            </mesh>
          )
        })}

        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2
          return (
            <mesh key={i + 16} position={[0, Math.cos(angle) * 1, Math.sin(angle) * 1]} rotation={[0, Math.PI / 2, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#ff9999" emissive="#ff5555" emissiveIntensity={0.8} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}
