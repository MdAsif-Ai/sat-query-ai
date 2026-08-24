'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export function MiniRealisticGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    const width = container.clientWidth || 180;
    const height = container.clientHeight || 180;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 4.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const dayTexture = textureLoader.load('/earth_day.jpg');
    const nightTexture = textureLoader.load('/earth_night.jpg');

    dayTexture.wrapS = THREE.RepeatWrapping;
    nightTexture.wrapS = THREE.RepeatWrapping;

    // Sun direction vector
    const sunDirection = new THREE.Vector3(-1.2, 0.4, 0.9).normalize();

    // 1. Earth Sphere
    const earthGeometry = new THREE.SphereGeometry(1.18, 48, 48);
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
          vec3 nightColor = texture2D(nightTexture, vUv).rgb * 2.5;

          float sunDot = dot(vNormal, normalize(sunDirection));
          float dayMix = smoothstep(-0.15, 0.25, sunDot);

          vec3 surfaceColor = mix(nightColor, dayColor, dayMix);

          // Atmospheric limb glow
          vec3 viewDir = normalize(-vPosition);
          float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 3.0);
          vec3 glow = vec3(0.2, 0.7, 1.0) * fresnel * (dayMix * 0.8 + 0.35);

          gl_FragColor = vec4(surfaceColor + glow, 1.0);
        }
      `
    });

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthMesh.rotation.z = -0.38;
    scene.add(earthMesh);

    // 2. Atmospheric Halo
    const atmosphereGeometry = new THREE.SphereGeometry(1.24, 48, 48);
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
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
          gl_FragColor = vec4(0.2, 0.7, 1.0, 1.0) * intensity * 0.9;
        }
      `
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // 3. 3D Orbiting Satellite Group
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = 0.55;
    orbitGroup.rotation.y = 0.25;
    scene.add(orbitGroup);

    // Orbital ring line
    const orbitRingGeometry = new THREE.RingGeometry(1.68, 1.70, 64);
    const orbitRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const orbitRing = new THREE.Mesh(orbitRingGeometry, orbitRingMaterial);
    orbitRing.rotation.x = Math.PI / 2;
    orbitGroup.add(orbitRing);

    // Satellite body
    const satGroup = new THREE.Group();
    const satBodyGeo = new THREE.BoxGeometry(0.09, 0.09, 0.14);
    const satBodyMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const satBody = new THREE.Mesh(satBodyGeo, satBodyMat);
    satGroup.add(satBody);

    // Solar panels
    const panelGeo = new THREE.BoxGeometry(0.26, 0.01, 0.08);
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    satGroup.add(panel);

    // Glowing beacon
    const beaconGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 0.06, 0);
    satGroup.add(beacon);

    orbitGroup.add(satGroup);

    // Animation loop
    let animationFrameId: number;
    let orbitAngle = 0;

    const animate = () => {
      // Planet slow rotation
      earthMesh.rotation.y += 0.003;

      // Satellite orbiting
      orbitAngle += 0.018;
      const orbitRadius = 1.69;
      satGroup.position.set(
        Math.cos(orbitAngle) * orbitRadius,
        0,
        Math.sin(orbitAngle) * orbitRadius
      );
      satGroup.rotation.y = -orbitAngle;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
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
      orbitRingGeometry.dispose();
      orbitRingMaterial.dispose();
      satBodyGeo.dispose();
      satBodyMat.dispose();
      panelGeo.dispose();
      panelMat.dispose();
      beaconGeo.dispose();
      beaconMat.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-44 h-44 sm:w-52 sm:h-52 relative pointer-events-none select-none flex items-center justify-center drop-shadow-[0_0_25px_rgba(20,184,166,0.3)]"
    />
  );
}
