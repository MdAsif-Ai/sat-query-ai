'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export function RotatingEarth() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5.0);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const dayTexture = textureLoader.load('/earth_day.jpg');
    const nightTexture = textureLoader.load('/earth_night.jpg');

    dayTexture.wrapS = THREE.RepeatWrapping;
    nightTexture.wrapS = THREE.RepeatWrapping;

    // Sun light direction vector: Sunlight from the left and front
    const sunDirection = new THREE.Vector3(-1.1, 0.25, 0.85).normalize();

    // Earth Surface Shader
    const earthGeometry = new THREE.SphereGeometry(1.65, 64, 64);
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        sunDirection: { value: sunDirection }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 dayColor = texture2D(dayTexture, vUv).rgb;
          vec3 nightColor = texture2D(nightTexture, vUv).rgb * 2.8;

          // Light intensity dot product with sun
          float sunDot = dot(vNormal, normalize(sunDirection));
          float dayMix = smoothstep(-0.18, 0.22, sunDot);

          // Blend day surface with sparkling night city lights
          vec3 surfaceColor = mix(nightColor, dayColor, dayMix);

          // Atmospheric limb glow (Fresnel rim)
          vec3 viewDir = normalize(-vPosition);
          float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
          fresnel = pow(fresnel, 3.2);

          // Electric blue limb glow
          vec3 atmosphereGlow = vec3(0.22, 0.65, 1.0) * fresnel * (dayMix * 0.85 + 0.35);

          gl_FragColor = vec4(surfaceColor + atmosphereGlow, 1.0);
        }
      `
    });

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    // Real Earth axial tilt
    earthMesh.rotation.z = -0.38;
    scene.add(earthMesh);

    // Outer Atmospheric Blue Halo Ring
    const atmosphereGeometry = new THREE.SphereGeometry(1.72, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 viewDir = normalize(-vPosition);
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(0.2, 0.65, 1.0, 1.0) * intensity * 0.95;
        }
      `
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      // Slow continuous planetary rotation
      earthMesh.rotation.y += 0.0009;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize handling
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full pointer-events-none select-none flex items-center justify-center"
    />
  );
}
