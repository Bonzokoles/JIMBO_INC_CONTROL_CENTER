"use client"

import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"

export default function SceneSetup() {
  const { scene, gl } = useThree()

  useEffect(() => {
    // Set background to transparent to show the CSS background
    scene.background = null

    // Enhance renderer settings for better QLED effect
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.2
    // sRGBEncoding is deprecated in newer Three.js versions
    // Use outputColorSpace instead
    gl.outputColorSpace = THREE.SRGBColorSpace
  }, [scene, gl])

  return null
}
