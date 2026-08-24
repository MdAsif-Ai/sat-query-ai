'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export function RealisticSatelliteWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    const width = container.clientWidth || 220;
    const height = container.clientHeight || 180;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 4.4);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x7dd3fc, 2.5);
    sunLight.position.set(3, 4, 3);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x14b8a6, 2.0);
    rimLight.position.set(-3, -2, -2);
    scene.add(rimLight);

    // Satellite Master Group
    const satelliteGroup = new THREE.Group();
    scene.add(satelliteGroup);

    // Initial slight isometric angle
    satelliteGroup.rotation.x = 0.28;
    satelliteGroup.rotation.y = -0.45;

    // 1. Satellite Main Body (Chassis with Gold Foil Material)
    const bodyGeometry = new THREE.BoxGeometry(0.7, 0.9, 0.7);
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x78350f,
      emissiveIntensity: 0.25
    });
    const mainBody = new THREE.Mesh(bodyGeometry, goldMaterial);
    satelliteGroup.add(mainBody);

    // Equipment bus panels (Silver/Titanium accents)
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.3
    });

    const frontPanelGeo = new THREE.BoxGeometry(0.55, 0.75, 0.04);
    const frontPanel = new THREE.Mesh(frontPanelGeo, panelMaterial);
    frontPanel.position.set(0, 0, 0.36);
    satelliteGroup.add(frontPanel);

    // 2. Solar Panel Array Wings (Left & Right)
    const solarWingGeo = new THREE.BoxGeometry(1.2, 0.65, 0.02);
    const solarMaterial = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      metalness: 0.75,
      roughness: 0.2,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.3
    });

    const solarGridMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });

    // Left Solar Wing
    const leftWingGroup = new THREE.Group();
    const leftWing = new THREE.Mesh(solarWingGeo, solarMaterial);
    const leftGrid = new THREE.Mesh(solarWingGeo, solarGridMat);
    leftWingGroup.add(leftWing);
    leftWingGroup.add(leftGrid);

    const leftBoomGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
    const leftBoom = new THREE.Mesh(leftBoomGeo, panelMaterial);
    leftBoom.rotation.z = Math.PI / 2;
    leftBoom.position.set(-0.52, 0, 0);
    satelliteGroup.add(leftBoom);

    leftWingGroup.position.set(-1.25, 0, 0);
    satelliteGroup.add(leftWingGroup);

    // Right Solar Wing
    const rightWingGroup = new THREE.Group();
    const rightWing = new THREE.Mesh(solarWingGeo, solarMaterial);
    const rightGrid = new THREE.Mesh(solarWingGeo, solarGridMat);
    rightWingGroup.add(rightWing);
    rightWingGroup.add(rightGrid);

    const rightBoomGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
    const rightBoom = new THREE.Mesh(rightBoomGeo, panelMaterial);
    rightBoom.rotation.z = Math.PI / 2;
    rightBoom.position.set(0.52, 0, 0);
    satelliteGroup.add(rightBoom);

    rightWingGroup.position.set(1.25, 0, 0);
    satelliteGroup.add(rightWingGroup);

    // 3. Parabolic Communications Antenna Dish
    const dishGroup = new THREE.Group();
    dishGroup.position.set(0.25, 0.65, -0.1);
    dishGroup.rotation.x = -0.4;
    dishGroup.rotation.z = 0.3;

    // Dish boom mast
    const dishBoomGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const dishBoom = new THREE.Mesh(dishBoomGeo, panelMaterial);
    dishGroup.add(dishBoom);

    // Dish mesh
    const dishGeo = new THREE.SphereGeometry(0.32, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.15,
      side: THREE.DoubleSide
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(0, 0.18, 0);
    dish.rotation.x = Math.PI;
    dishGroup.add(dish);

    // Feed horn
    const feedGeo = new THREE.ConeGeometry(0.05, 0.12, 8);
    const feedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const feed = new THREE.Mesh(feedGeo, feedMat);
    feed.position.set(0, 0.18, 0.12);
    feed.rotation.x = -Math.PI / 2;
    dishGroup.add(feed);

    satelliteGroup.add(dishGroup);

    // 4. Optical Camera & SAR Sensor Array (Bottom Earth-Facing)
    const cameraBarrelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.28, 16);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.4
    });
    const cameraBarrel = new THREE.Mesh(cameraBarrelGeo, lensMat);
    cameraBarrel.position.set(-0.15, -0.55, 0.1);
    satelliteGroup.add(cameraBarrel);

    const sarAntennaGeo = new THREE.BoxGeometry(0.35, 0.04, 0.35);
    const sarMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const sarAntenna = new THREE.Mesh(sarAntennaGeo, sarMat);
    sarAntenna.position.set(0.12, -0.48, 0.1);
    satelliteGroup.add(sarAntenna);

    // 5. Telemetry Status LEDs (Green, Cyan, Amber)
    const ledMatGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ledMatCyan = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ledMatAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    const ledGeo = new THREE.SphereGeometry(0.035, 8, 8);

    const led1 = new THREE.Mesh(ledGeo, ledMatGreen);
    led1.position.set(-0.25, 0.38, 0.37);
    satelliteGroup.add(led1);

    const led2 = new THREE.Mesh(ledGeo, ledMatCyan);
    led2.position.set(-0.25, 0.26, 0.37);
    satelliteGroup.add(led2);

    const led3 = new THREE.Mesh(ledGeo, ledMatAmber);
    led3.position.set(-0.25, 0.14, 0.37);
    satelliteGroup.add(led3);

    // 6. Orbital Scanning Radar Rings in Background
    const ringGeo1 = new THREE.RingGeometry(1.9, 1.92, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const orbitRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    orbitRing1.rotation.x = Math.PI / 2.4;
    scene.add(orbitRing1);

    const ringGeo2 = new THREE.RingGeometry(2.2, 2.22, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const orbitRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    orbitRing2.rotation.x = Math.PI / 2.1;
    scene.add(orbitRing2);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating / hovering motion
      satelliteGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;
      satelliteGroup.rotation.y = -0.45 + Math.sin(elapsedTime * 0.8) * 0.12;
      satelliteGroup.rotation.x = 0.28 + Math.cos(elapsedTime * 0.6) * 0.05;

      // Rotate orbital radar rings slowly
      orbitRing1.rotation.z = elapsedTime * 0.15;
      orbitRing2.rotation.z = -elapsedTime * 0.1;

      // Pulse telemetry LED
      led1.scale.setScalar(0.9 + Math.sin(elapsedTime * 6) * 0.3);

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
      bodyGeometry.dispose();
      goldMaterial.dispose();
      panelMaterial.dispose();
      solarWingGeo.dispose();
      solarMaterial.dispose();
      solarGridMat.dispose();
      dishGeo.dispose();
      dishMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-52 h-44 sm:w-64 sm:h-48 relative pointer-events-none select-none flex items-center justify-center drop-shadow-[0_0_30px_rgba(20,184,166,0.35)]"
    />
  );
}
