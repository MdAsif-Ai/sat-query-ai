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
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.2);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // -------------------------------------------------------------
    // 1. Deep Space Twinkling Starfield Particle System
    // -------------------------------------------------------------
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starTwinkles = new Float32Array(starCount);

    const starColorPalette = [
      new THREE.Color('#ffffff'), // Diamond white
      new THREE.Color('#f8fafc'), // Soft white
      new THREE.Color('#7dd3fc'), // Electric cyan
      new THREE.Color('#38bdf8'), // Deep cyan
      new THREE.Color('#fde68a'), // Warm amber
    ];

    for (let i = 0; i < starCount; i++) {
      // Scatter stars across deep field background
      starPositions[i * 3] = (Math.random() - 0.5) * 45;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      starPositions[i * 3 + 2] = -3 - Math.random() * 30;

      // Color assignment
      const col = starColorPalette[Math.floor(Math.random() * starColorPalette.length)];
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;

      // Varied star brightness and twinkle seeds
      starSizes[i] = Math.random() * 2.8 + 1.2;
      starTwinkles[i] = Math.random() * 100.0;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    starGeometry.setAttribute('aTwinkle', new THREE.BufferAttribute(starTwinkles, 1));

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aSize;
        attribute float aTwinkle;
        uniform float uTime;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          float twinkle = sin(uTime * 2.2 + aTwinkle) * 0.35 + 0.65;
          vAlpha = twinkle;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (50.0 / -mvPosition.z) * twinkle;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float intensity = pow(1.0 - (dist * 2.0), 1.8);
          gl_FragColor = vec4(vColor, intensity * vAlpha * 0.9);
        }
      `
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // -------------------------------------------------------------
    // 2. Earth Sphere Setup (Lowered Horizon Arc)
    // -------------------------------------------------------------
    const textureLoader = new THREE.TextureLoader();
    const dayTexture = textureLoader.load('/earth_day.jpg');
    const nightTexture = textureLoader.load('/earth_night.jpg');

    dayTexture.wrapS = THREE.RepeatWrapping;
    nightTexture.wrapS = THREE.RepeatWrapping;

    // Sun light direction vector: Sunlight from the left and front
    const sunDirection = new THREE.Vector3(-1.1, 0.3, 0.8).normalize();

    // Earth Sphere Geometry (Radius 2.65, Positioned lower at Y = -2.85)
    // This places the top apex of the curved horizon at the lower 30% of the screen
    const earthRadius = 2.65;
    const earthY = -2.95;

    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
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
          float dayMix = smoothstep(-0.16, 0.22, sunDot);

          // Blend day surface with night city lights
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
    earthMesh.position.set(0, earthY, 0);
    earthMesh.rotation.z = -0.38;
    scene.add(earthMesh);

    // -------------------------------------------------------------
    // 3. Atmospheric Outer Blue Halo
    // -------------------------------------------------------------
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.025, 64, 64);
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
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(0.2, 0.65, 1.0, 1.0) * intensity * 0.95;
        }
      `
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphereMesh.position.set(0, earthY, 0);
    scene.add(atmosphereMesh);

    // -------------------------------------------------------------
    // 4. Animation Loop
    // -------------------------------------------------------------
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Update star twinkle uniform
      starMaterial.uniforms.uTime.value = elapsedTime;

      // Slow planetary rotation
      earthMesh.rotation.y += 0.0008;

      // Very subtle starfield slow drift
      starField.rotation.y = elapsedTime * 0.003;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize handling
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
      starGeometry.dispose();
      starMaterial.dispose();
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
      className="fixed inset-0 w-full h-full pointer-events-none select-none"
    />
  );
}
