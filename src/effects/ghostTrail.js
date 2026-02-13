const THREE = window.THREE;

export function createGhostTrailSystem(scene) {
  const nodes = [];
  const motionDir = new THREE.Vector3(0, 0, -1);
  const prevPos = new THREE.Vector3();
  let inited = false;

  let quality = { activeCount: 3, opacityMul: 1.0 };

  function setTier(tier = "high") {
    if (tier === "high") quality = { activeCount: 3, opacityMul: 1.0 };
    else if (tier === "medium") quality = { activeCount: 2, opacityMul: 0.9 };
    else quality = { activeCount: 1, opacityMul: 0.78 };
  }

  function clear() {
    nodes.forEach(n => scene.remove(n.obj));
    nodes.length = 0;
  }

  function setup(modelRoot) {
    clear();

    const count = 3;
    for (let i = 0; i < count; i++) {
      const clone = modelRoot.clone(true);
      const mats = [];

      clone.traverse((n) => {
        if (!n.isMesh) return;
        n.material = new THREE.MeshBasicMaterial({
          color: 0x8fe3ff,
          transparent: true,
          opacity: 0,
          depthWrite: false
        });
        mats.push(n.material);
      });

      scene.add(clone);
      nodes.push({
        obj: clone,
        mats,
        dist: 1.3 + i * 1.45,
        sideOffset: (i - 1) * 0.08,
        lagPos: 0.18 + i * 0.04,
        lagRot: 0.14 + i * 0.03
      });
    }

    inited = false;
  }

  function update({
    carPos,
    carQuat,
    carForward,
    side,
    up,
    speedNorm,
    nitroBoost,
    clickBoost
  }) {
    const powerRaw = Math.min(1.8, Math.max(0, nitroBoost * 0.95 + clickBoost * 0.4));
    const power = powerRaw * quality.opacityMul;
    if (!nodes.length) return;

    if (!inited) {
      prevPos.copy(carPos);
      inited = true;
    }

    const delta = new THREE.Vector3().subVectors(carPos, prevPos);
    prevPos.copy(carPos);

    // 优先真实位移方向
    if (delta.lengthSq() > 1e-6) motionDir.lerp(delta.normalize(), 0.35);
    else motionDir.lerp(carForward, 0.12);

    // 强制地面平行，避免“竖向漂”
    motionDir.y = 0;
    if (motionDir.lengthSq() < 1e-6) motionDir.set(carForward.x, 0, carForward.z);
    motionDir.normalize();

    const trailDir = motionDir.clone().multiplyScalar(-1);

    nodes.forEach((g, i) => {
      if (i >= quality.activeCount || power < 0.05) {
        g.obj.visible = false;
        return;
      }

      g.obj.visible = true;

      const d = g.dist * (1 + speedNorm * 1.6 + nitroBoost * 0.5);
      const target = new THREE.Vector3()
        .copy(carPos)
        .addScaledVector(trailDir, d)
        .addScaledVector(side, g.sideOffset)
        .addScaledVector(up, 0.02);

      target.y = carPos.y + 0.02;

      g.obj.position.lerp(target, g.lagPos);
      g.obj.quaternion.slerp(carQuat, g.lagRot);

      const op = (0.22 - i * 0.06) * power;
      g.mats.forEach((m) => {
        m.opacity = op;
        m.color.setRGB(0.45 + power * 0.2, 0.82, 1.0);
      });
    });
  }

  return { setup, update, clear, setTier };
}