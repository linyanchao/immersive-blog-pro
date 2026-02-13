const THREE = window.THREE;

export function createAeroFlowSystem(scene, isMobile, softTex) {
  const particleCount = isMobile ? 2400 : 5200;
  const fogCount = isMobile ? 14 : 24;

  let tierScale = 1.0;
  let fogScale = 1.0;
  let sizeMul = 1.0;

  function setTier(tier = "high") {
    if (tier === "high") { tierScale = 1.0; fogScale = 1.0; sizeMul = 1.0; }
    else if (tier === "medium") { tierScale = 0.72; fogScale = 0.7; sizeMul = 1.08; }
    else { tierScale = 0.45; fogScale = 0.35; sizeMul = 1.2; }
    pMat.size = (isMobile ? 0.18 : 0.14) * sizeMul;
  }

  // 粒子尾流
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  const pCol = new Float32Array(particleCount * 3);
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));

  const pMat = new THREE.PointsMaterial({
    map: softTex,
    size: isMobile ? 0.18 : 0.14,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
    sizeAttenuation: true
  });

  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  const points = Array.from({ length: particleCount }, () => ({
    back: 0, lat: 0, h: 0, life: 0, mul: 1
  }));

  function resetPoint(p, speedNorm = 0) {
    p.back = Math.random() * 2.2;
    p.lat = (Math.random() - 0.5) * (2.6 + speedNorm * 1.5);
    p.h = -0.5 + Math.random() * 2.1;
    p.life = 0.6 + Math.random() * 1.2;
    p.mul = 0.6 + Math.random() * 1.8;
  }
  points.forEach(resetPoint);

  // 体积雾
  const fogSprites = Array.from({ length: fogCount }, () => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: softTex,
      color: 0x8adfff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    sp.scale.set(2.5, 1.2, 1);
    scene.add(sp);
    return { sp, back: 0, lat: 0, h: 0, life: 0, mul: 1, s0: 1 };
  });

  function resetFog(f, speedNorm = 0) {
    f.back = 1 + Math.random() * 3.0;
    f.lat = (Math.random() - 0.5) * (2.2 + speedNorm * 1.0);
    f.h = -0.55 + Math.random() * 1.7;
    f.life = 0.8 + Math.random() * 1.1;
    f.mul = 0.7 + Math.random() * 1.3;
    f.s0 = 1.4 + Math.random() * 1.8;
  }
  fogSprites.forEach(resetFog);

  let density = 1.0;
  let fpsSmooth = 60;
  let tick = 0;

  function update({ dt, t, speedNorm, boost, brake, slip, carPos, forward, side, up }) {
    const fps = 1 / Math.max(0.001, dt);
    fpsSmooth = fpsSmooth * 0.9 + fps * 0.1;
    tick += dt;
    if (tick > 0.8) {
      tick = 0;
      if (fpsSmooth < 40) density = Math.max(0.5, density - 0.1);
      else if (fpsSmooth > 54) density = Math.min(1.0, density + 0.08);
    }

    const back = new THREE.Vector3().copy(forward).multiplyScalar(-1);
    const flowSpeed = 14 + speedNorm * 90 + boost * 42;
    const turbulence = 0.03 + Math.abs(slip) * 0.16;
    const brakeCompress = 1 - Math.min(0.45, brake * 0.22);

    const active = Math.floor(points.length * density * tierScale);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const bi = i * 3;

      if (i >= active) {
        pPos[bi + 0] = pPos[bi + 1] = pPos[bi + 2] = 1e6;
        pCol[bi + 0] = pCol[bi + 1] = pCol[bi + 2] = 0;
        continue;
      }

      p.life -= dt * (1.2 + speedNorm * 1.6);
      p.back += flowSpeed * dt * p.mul;
      p.lat += (Math.random() - 0.5) * turbulence;
      p.h += (Math.random() - 0.5) * turbulence * 0.6;

      if (p.life <= 0 || p.back > 80) resetPoint(p, speedNorm);

      const x = carPos.x + back.x * p.back + side.x * p.lat + up.x * p.h;
      const y = carPos.y + back.y * p.back + side.y * p.lat + up.y * p.h;
      const z = carPos.z + back.z * p.back + side.z * p.lat + up.z * p.h;

      pPos[bi + 0] = x;
      pPos[bi + 1] = y;
      pPos[bi + 2] = z;

      const glow = (0.22 + speedNorm * 0.9 + boost * 0.7) * brakeCompress;
      pCol[bi + 0] = (0.35 + boost * 0.2) * glow;
      pCol[bi + 1] = (0.75 + speedNorm * 0.2) * glow;
      pCol[bi + 2] = 1.0 * glow;
    }

    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;

    const fogActive = Math.floor(fogSprites.length * fogScale);
    fogSprites.forEach((f, i) => {
      if (i >= fogActive) {
        f.sp.material.opacity = 0;
        return;
      }

      f.life -= dt * (0.85 + speedNorm * 1.05);
      f.back += (8 + speedNorm * 40 + boost * 18) * dt * f.mul;

      if (f.life <= 0 || f.back > 45) resetFog(f, speedNorm);

      const x = carPos.x + back.x * f.back + side.x * f.lat + up.x * f.h;
      const y = carPos.y + back.y * f.back + side.y * f.lat + up.y * f.h;
      const z = carPos.z + back.z * f.back + side.z * f.lat + up.z * f.h;

      f.sp.position.set(x, y, z);

      const alpha = Math.min(0.45, Math.max(0, (0.1 + speedNorm * 0.28 + boost * 0.22) * f.life));
      f.sp.material.opacity = alpha;
      const s = f.s0 * (1.0 + (1 - f.life) * (1.6 + speedNorm));
      f.sp.scale.set(s * 2.0, s * 0.9, 1);
    });
  }

  return { update, setTier };
}