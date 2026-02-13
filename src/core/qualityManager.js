/*
 * @Author: linyc
 * @Date: 2026-02-13 14:11:53
 * @LastEditTime: 2026-02-13 14:11:55
 * @LastEditors: linyc
 * @Description: 
 */
export function createQualityManager({ mountEl = document.body, onChange, initialTier = "high" } = {}) {
  const tiers = ["high", "medium", "low"];
  const labels = { high: "高", medium: "中", low: "低" };

  let tier = tiers.includes(initialTier) ? initialTier : "high";

  const wrap = document.createElement("div");
  wrap.className = "quality-panel";
  wrap.innerHTML = `
    <span class="q-title">画质</span>
    <button data-tier="high">高</button>
    <button data-tier="medium">中</button>
    <button data-tier="low">低</button>
  `;
  mountEl.appendChild(wrap);

  const btns = [...wrap.querySelectorAll("button[data-tier]")];

  function paint() {
    btns.forEach((b) => b.classList.toggle("active", b.dataset.tier === tier));
  }

  function setTier(next, emit = true) {
    if (!tiers.includes(next)) return;
    tier = next;
    localStorage.setItem("quality-tier", tier);
    paint();
    if (emit && typeof onChange === "function") onChange(tier);
  }

  function cycle() {
    const i = tiers.indexOf(tier);
    setTier(tiers[(i + 1) % tiers.length], true);
  }

  wrap.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tier]");
    if (!b) return;
    setTier(b.dataset.tier, true);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "q" || e.key === "Q") cycle();
  });

  paint();
  setTier(tier, true);

  return {
    getTier: () => tier,
    setTier,
    cycle,
    destroy: () => wrap.remove(),
    labels
  };
}