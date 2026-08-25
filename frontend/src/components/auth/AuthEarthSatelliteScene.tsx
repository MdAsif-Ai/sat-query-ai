'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface AuthEarthSatelliteSceneProps {
  mode?: 'login' | 'register';
}

export function AuthEarthSatelliteScene({ mode = 'login' }: AuthEarthSatelliteSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.2, 5.8);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.4);
    sunLight.position.set(-5, 3.5, 4);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(4, -2, -3);
    scene.add(rimLight);

    // -------------------------------------------------------------
    // 1. Deep Space Twinkling Starfield
    // -------------------------------------------------------------
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starTwinkles = new Float32Array(starCount);

    const starColorPalette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#e0f2fe'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#fde68a'),
    ];

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 85;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 55;
      starPositions[i * 3 + 2] = -3 - Math.random() * 32;

      const col = starColorPalette[Math.floor(Math.random() * starColorPalette.length)];
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;

      starSizes[i] = Math.random() * 2.5 + 1.1;
      starTwinkles[i] = Math.random() * 100.0;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    starGeometry.setAttribute('aTwinkle', new THREE.BufferAttribute(starTwinkles, 1));

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
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
          float twinkle = sin(uTime * 2.5 + aTwinkle) * 0.35 + 0.65;
          vAlpha = twinkle;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (45.0 / -mvPosition.z) * twinkle;
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
          gl_FragColor = vec4(vColor, intensity * vAlpha);
        }
      `
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // -------------------------------------------------------------
    // 2. 3D Spinning Earth (Calibrated Size)
    // -------------------------------------------------------------
    const textureLoader = new THREE.TextureLoader();
    const dayTexture = textureLoader.load('/earth_day.jpg');
    const nightTexture = textureLoader.load('/earth_night.jpg');

    dayTexture.wrapS = THREE.RepeatWrapping;
    nightTexture.wrapS = THREE.RepeatWrapping;

    const sunDirection = new THREE.Vector3(-1.2, 0.4, 0.9).normalize();
    const earthRadius = 1.30; // Reduced, elegant size

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
          vec3 nightColor = texture2D(nightTexture, vUv).rgb * 2.9;

          float sunDot = dot(vNormal, normalize(sunDirection));
          float dayMix = smoothstep(-0.16, 0.22, sunDot);

          vec3 surfaceColor = mix(nightColor, dayColor, dayMix);

          vec3 viewDir = normalize(-vPosition);
          float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
          fresnel = pow(fresnel, 3.2);

          vec3 atmosphereGlow = vec3(0.25, 0.7, 1.0) * fresnel * (dayMix * 0.9 + 0.35);

          gl_FragColor = vec4(surfaceColor + atmosphereGlow, 1.0);
        }
      `
    });

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthMesh.position.set(0, 0, 0);
    earthMesh.rotation.z = -0.38; // Axial tilt
    scene.add(earthMesh);

    // Outer Atmospheric Halo
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.028, 64, 64);
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
          gl_FragColor = vec4(0.2, 0.7, 1.0, 1.0) * intensity * 0.9;
        }
      `
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphereMesh.position.copy(earthMesh.position);
    scene.add(atmosphereMesh);

    // -------------------------------------------------------------
    // 3. Realistic 3D Earth Observation Satellite Model
    // -------------------------------------------------------------
    const satelliteMaster = new THREE.Group();
    scene.add(satelliteMaster);

    // Satellite Bus Chassis (Gold Thermal Foil)
    const satBodyGeo = new THREE.BoxGeometry(0.28, 0.38, 0.28);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x78350f,
      emissiveIntensity: 0.2
    });
    const satBody = new THREE.Mesh(satBodyGeo, goldMat);
    satelliteMaster.add(satBody);

    // Equipment Bus Panels (Dark Slate/Titanium)
    const titanMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.3
    });
    const frontPlateGeo = new THREE.BoxGeometry(0.24, 0.32, 0.02);
    const frontPlate = new THREE.Mesh(frontPlateGeo, titanMat);
    frontPlate.position.set(0, 0, 0.15);
    satelliteMaster.add(frontPlate);

    // Solar Wings Array (Left & Right)
    const solarWingGeo = new THREE.BoxGeometry(0.6, 0.28, 0.015);
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x075985,
      emissiveIntensity: 0.3
    });

    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });

    // Left Solar Wing
    const leftWingGroup = new THREE.Group();
    const leftWing = new THREE.Mesh(solarWingGeo, solarMat);
    const leftGrid = new THREE.Mesh(solarWingGeo, gridMat);
    leftWingGroup.add(leftWing);
    leftWingGroup.add(leftGrid);
    leftWingGroup.position.set(-0.48, 0, 0);
    satelliteMaster.add(leftWingGroup);

    // Right Solar Wing
    const rightWingGroup = new THREE.Group();
    const rightWing = new THREE.Mesh(solarWingGeo, solarMat);
    const rightGrid = new THREE.Mesh(solarWingGeo, gridMat);
    rightWingGroup.add(rightWing);
    rightWingGroup.add(rightGrid);
    rightWingGroup.position.set(0.48, 0, 0);
    satelliteMaster.add(rightWingGroup);

    // Parabolic High-Gain Dish Antenna
    const dishGeo = new THREE.SphereGeometry(0.16, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.2,
      side: THREE.DoubleSide
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(0, 0.26, 0);
    dish.rotation.x = -Math.PI * 0.35;
    satelliteMaster.add(dish);

    // Dish Feed Horn
    const hornGeo = new THREE.CylinderGeometry(0.01, 0.02, 0.1, 12);
    const horn = new THREE.Mesh(hornGeo, goldMat);
    horn.position.set(0, 0.33, 0.07);
    horn.rotation.x = -Math.PI * 0.35;
    satelliteMaster.add(horn);

    // Multispectral Camera & SAR Sensor Lenses
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.1
    });
    const lensGlassMat = new THREE.MeshBasicMaterial({ color: 0x14b8a6 });

    const lensGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.07, 16);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, -0.21, 0.05);
    lens.rotation.x = Math.PI * 0.5;

    const lensGlass = new THREE.Mesh(new THREE.CircleGeometry(0.034, 16), lensGlassMat);
    lensGlass.position.set(0, -0.25, 0.05);
    lensGlass.rotation.x = Math.PI * 0.5;

    satelliteMaster.add(lens);
    satelliteMaster.add(lensGlass);

    // Pulsing Telemetry LED Beacon
    const ledGeo = new THREE.SphereGeometry(0.022, 12, 12);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.1, 0.19, 0.15);
    satelliteMaster.add(led);

    // Scale satellite appropriately
    satelliteMaster.scale.set(0.55, 0.55, 0.55);

    // -------------------------------------------------------------
    // 4. Animation Loop
    // -------------------------------------------------------------
    let animationFrameId: number;
    let orbitAngle = 0;
    let currentX = modeRef.current === 'login' ? -1.65 : 1.65;
    const startTime = performance.now();

    const animate = () => {
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Smooth Earth horizontal positioning (left for login, right for register on desktop)
      const isDesktop = width >= 1024;
      const targetX = isDesktop ? (modeRef.current === 'login' ? -1.65 : 1.65) : 0;
      currentX += (targetX - currentX) * 0.06;
      earthMesh.position.x = currentX;
      atmosphereMesh.position.x = currentX;

      // Twinkle Starfield
      starMaterial.uniforms.uTime.value = elapsedTime;

      // 1. Earth Planetary Spin
      earthMesh.rotation.y += 0.0022;

      // 2. Satellite Orbit Mechanics (Clean, smooth ellipse)
      orbitAngle += 0.008;
      const rx = 2.45;
      const rz = 1.85;
      const ox = Math.cos(orbitAngle) * rx;
      const oz = Math.sin(orbitAngle) * rz;

      // Inclination transform
      const incX = ox * Math.cos(-0.35) - oz * Math.sin(-0.35);
      const incZ = ox * Math.sin(-0.35) + oz * Math.cos(-0.35);
      const incY = Math.sin(orbitAngle) * 0.65;

      satelliteMaster.position.set(
        earthMesh.position.x + incX,
        earthMesh.position.y + incY,
        earthMesh.position.z + incZ
      );

      // Aim satellite at Earth Center
      satelliteMaster.lookAt(earthMesh.position);
      satelliteMaster.rotateX(-Math.PI * 0.5);

      // Pulsing LED Beacon
      const ledPulse = Math.sin(elapsedTime * 6.0);
      ledMat.color.setHex(ledPulse > 0.3 ? 0x14b8a6 : 0x059669);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Observer for dynamic container changes
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
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
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
    />
  );
}
