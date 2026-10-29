'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WaterGauge3DProps {
  levelPct: number; // 0 to 100
}

export const WaterGauge3D: React.FC<WaterGauge3DProps> = ({ levelPct }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef<number>(levelPct / 100);

  useEffect(() => {
    levelRef.current = Math.max(0, Math.min(1, levelPct / 100));
  }, [levelPct]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    if (!renderer.getContext()) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x000000, 0);
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    camera.position.set(0, 0.5, 8.5);
    camera.lookAt(0, 0.05, 0);

    const key = new THREE.DirectionalLight(0xfff4ea, 1.6);
    key.position.set(3, 4, 5);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xffd9c2, 0.9);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));

    const rig = new THREE.Group();
    scene.add(rig);

    const R = 0.62, H = 2.5, Y0 = -H / 2, Y1 = H / 2;
    const WATER_R = R - 0.035;
    const GATE_Y = Y1 - 0.16;
    const FLOOR_Y = Y0 + 0.12;
    const levelToY = (p: number) => FLOOR_Y + (GATE_Y - FLOOR_Y) * p;

    // Glass
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.04,
      transmission: 0.95,
      thickness: 0.18,
      ior: 1.46,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide,
    });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 64, 1, true), glassMat);
    glass.renderOrder = 3;
    rig.add(glass);

    // Caps
    const steel = new THREE.MeshStandardMaterial({ color: 0x8e887d, metalness: 1, roughness: 0.32 });
    const darkSteel = new THREE.MeshStandardMaterial({ color: 0x3a3d36, metalness: 0.9, roughness: 0.4 });
    for (const [y, s] of [[Y1 + 0.07, 1], [Y0 - 0.07, -1]]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.09, R + 0.09, 0.14, 64), steel);
      cap.position.y = y;
      rig.add(cap);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(R + 0.09, 0.022, 16, 64), steel);
      lip.rotation.x = Math.PI / 2;
      lip.position.y = y + s * 0.07;
      rig.add(lip);
      const bolt = new THREE.SphereGeometry(0.026, 12, 8);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const b = new THREE.Mesh(bolt, darkSteel);
        b.position.set(Math.cos(a) * (R + 0.095), y, Math.sin(a) * (R + 0.095));
        rig.add(b);
      }
    }

    // Base plinth
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(R + 0.2, R + 0.24, 0.12, 64),
      new THREE.MeshStandardMaterial({ color: 0x0d1213, metalness: 0.3, roughness: 0.55 })
    );
    plinth.position.y = Y0 - 0.2;
    rig.add(plinth);

    // Pipe
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.38, 24), steel);
    pipe.position.set(0.22, Y1 + 0.33, 0);
    rig.add(pipe);

    // Water
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0xfc6423,
      roughness: 0.22,
      metalness: 0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
      emissive: 0xd63b10,
      emissiveIntensity: 0.25,
    });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(WATER_R, WATER_R, 1, 64, 1, true), waterMat);
    water.renderOrder = 1;
    rig.add(water);

    const bottom = new THREE.Mesh(new THREE.CircleGeometry(WATER_R, 64), waterMat);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = Y0 + 0.002;
    rig.add(bottom);

    const surfGeo = new THREE.CircleGeometry(WATER_R, 64, 0, Math.PI * 2);
    surfGeo.rotateX(-Math.PI / 2);
    const surfBase = surfGeo.attributes.position.array.slice();
    const surfMat = new THREE.MeshPhysicalMaterial({
      color: 0xf79561,
      roughness: 0.08,
      clearcoat: 1,
      emissive: 0xfc6423,
      emissiveIntensity: 0.2,
    });
    const surface = new THREE.Mesh(surfGeo, surfMat);
    surface.renderOrder = 2;
    rig.add(surface);

    // Gate ring at 0.60
    const gateRing = new THREE.Mesh(
      new THREE.TorusGeometry(R + 0.008, 0.012, 12, 96),
      new THREE.MeshStandardMaterial({ color: 0xfc6423, emissive: 0xfc6423, emissiveIntensity: 0.55, roughness: 0.3 })
    );
    gateRing.rotation.x = Math.PI / 2;
    gateRing.position.y = GATE_Y;
    rig.add(gateRing);

    // Staff board
    const cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 1600;
    const g = cv.getContext('2d');
    const boardH = H - 0.1;
    const boardW = boardH * (cv.width / cv.height) * 1.25;

    if (g) {
      g.fillStyle = '#FFFCF6';
      g.fillRect(0, 0, cv.width, cv.height);
      g.strokeStyle = 'rgba(14,28,26,.18)';
      g.lineWidth = 6;
      g.strokeRect(3, 3, cv.width - 6, cv.height - 6);
      const toPx = (y: number) => cv.height * (1 - (y - (Y0 + 0.05)) / boardH);
      const yTop = toPx(GATE_Y), yBot = toPx(FLOOR_Y);
      for (let i = 0; i <= 20; i++) {
        const y = yBot + (yTop - yBot) * (i / 20);
        const major = i % 5 === 0;
        g.fillStyle = i === 20 ? '#B83A0E' : '#0D1213';
        g.fillRect(cv.width - (major ? 150 : 80), y - (major ? 4 : 2), major ? 150 : 80, major ? 8 : 4);
        if (major) {
          g.font = `${i === 20 ? 'bold 54px' : '500 54px'} monospace`;
          g.textAlign = 'left';
          g.textBaseline = 'middle';
          g.fillText((0.5 + i * 0.005).toFixed(3).slice(1), 14, y - 30);
        }
      }
      g.fillStyle = '#B83A0E';
      g.font = 'bold 30px monospace';
      g.fillText('GATE', 14, yTop + 40);
      g.fillStyle = 'rgba(14,28,26,.55)';
      g.font = '500 26px monospace';
      g.fillText('WEIR', cv.width / 2 - 30, cv.height - 60);
    }

    const boardTex = new THREE.CanvasTexture(cv);
    boardTex.colorSpace = THREE.SRGBColorSpace;
    const boardGeo = new THREE.CylinderGeometry(R + 0.012, R + 0.012, boardH, 32, 1, true, -boardW / (2 * R), boardW / R);
    const board = new THREE.Mesh(boardGeo, new THREE.MeshBasicMaterial({ map: boardTex, side: THREE.FrontSide, toneMapped: false }));
    board.position.y = Y0 + 0.05 + boardH / 2;
    board.rotation.y = -0.42;
    board.renderOrder = 4;
    rig.add(board);

    // Interaction
    let drag: { x: number; y: number; yaw: number; pitch: number } | null = null;
    let yaw = 0, yawVel = 0, pitch = 0;

    const onPointerDown = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY, yaw, pitch };
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag) return;
      yaw = drag.yaw + (e.clientX - drag.x) * 0.012;
      pitch = Math.max(-0.25, Math.min(0.25, drag.pitch + (e.clientY - drag.y) * 0.004));
    };
    const onPointerUp = () => { drag = null; };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);

    function resize() {
      if (!mount) return;
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let curLevel = 0;
    let raf = 0;
    let last = performance.now();

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      const target = levelRef.current;
      curLevel += (target - curLevel) * (reduceMotion ? 1 : Math.min(1, dt * 3));

      if (!drag) {
        const idle = reduceMotion ? 0 : Math.sin(t * 0.45) * 0.28;
        yawVel += (idle - yaw) * dt * 3;
        yawVel *= 0.9;
        yaw += yawVel * dt * 4;
        pitch += (0 - pitch) * dt * 3;
      }

      rig.rotation.y = yaw;
      rig.rotation.x = pitch * 0.6;

      const y = levelToY(curLevel);
      const h = Math.max(0.0001, y - Y0);
      water.scale.y = h;
      water.position.y = Y0 + h / 2;
      water.visible = curLevel > 0.002;
      surface.visible = water.visible;
      bottom.visible = water.visible;
      surface.position.y = y;

      const pos = surfGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = surfBase[i * 3], z = surfBase[i * 3 + 2];
        pos.array[i * 3 + 1] = reduceMotion ? 0 : 0.012 * Math.sin(x * 9 + t * 2.1) * Math.cos(z * 7 + t * 1.6);
      }
      pos.needsUpdate = true;

      const full = curLevel >= 0.999;
      (gateRing.material as THREE.MeshStandardMaterial).emissive.setHex(full ? 0x2e5e4e : 0xfc6423);
      (gateRing.material as THREE.MeshStandardMaterial).color.setHex(full ? 0x2e5e4e : 0xfc6423);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.dispose();
      mount.innerHTML = '';
    };
  }, []);

  return <div ref={mountRef} className="g3d" style={{ width: '100%', height: '100%' }} />;
};
