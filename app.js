(() => {
  const posts = Array.isArray(window.BLOG_POSTS) ? [...window.BLOG_POSTS] : [];

  const dom = {
    app: document.getElementById("app"),
    landing: document.getElementById("landing"),
    canvas: document.getElementById("landingCanvas"),
    enterBtn: document.getElementById("enterBtn"),
    musicToggle: document.getElementById("musicToggle"),
    musicBadge: document.getElementById("musicBadge"),
    stageEyebrow: document.getElementById("stageEyebrow"),
    stageTitle: document.getElementById("stageTitle"),
    stageSub: document.getElementById("stageSub"),
    stageDots: document.getElementById("stageDots"),
    bgm: document.getElementById("bgm"),
    themeBtn: document.getElementById("themeBtn"),
    logo: document.getElementById("logo"),
    nav: document.getElementById("mainNav"),
    pageView: document.getElementById("pageView"),
    progress: document.getElementById("progress"),
    backTop: document.getElementById("backTop"),
  };

  const state = {
    entered: false,
    audioStarted: false,
    route: "home",
    tocHeadings: [],
    tocLinks: [],
    stageIndex: 0,
    wheelBuffer: 0,
    lastStageSwitch: 0,
    analyser: null,
    freqData: null,
    audioCtx: null,
    beat: 0,
    throttleTarget: 0,
    velocity: 4.2, // m/s 近似
  };

  const LANDING_STAGES = [
    {
      eyebrow: "ELECTRIC · PERFORMANCE · FUTURE",
      title: "01 电子脉冲点火",
      sub: "滚轮推进镜头，点击触发能量脉冲，音乐与动画实时联动。",
    },
    {
      eyebrow: "AERODYNAMIC · MOTION · POWER",
      title: "02 高速流线推进",
      sub: "滚轮切换分镜段落，镜头推拉配合速度感构建。",
    },
    {
      eyebrow: "LIGHT · SPACE · CONTROL",
      title: "03 光场与姿态控制",
      sub: "鼠标移动改变观察角度，感受三维空间深度。",
    },
    {
      eyebrow: "READY · ENTER · EXPERIENCE",
      title: "04 进入沉浸博客",
      sub: "点击进入，查看完整首页、归档、分类、标签、关于与搜索。",
    },
  ];

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const unique = (arr) => [...new Set(arr)];

  /* ================= Theme ================= */
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    if (dom.themeBtn) dom.themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  if (dom.themeBtn) {
    dom.themeBtn.addEventListener("click", () => {
      const now = document.documentElement.getAttribute("data-theme");
      setTheme(now === "dark" ? "light" : "dark");
    });
  }
  setTheme(localStorage.getItem("theme") || "light");

  /* ================= Audio ================= */
  function setMusicBadge(text) {
    if (!dom.musicBadge) return;
    dom.musicBadge.textContent = `音乐状态：${text}`;
  }

  function initAudioAnalyser() {
    if (state.audioCtx || !dom.bgm) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    state.audioCtx = new Ctx();
    const source = state.audioCtx.createMediaElementSource(dom.bgm);
    const analyser = state.audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(state.audioCtx.destination);
    state.analyser = analyser;
    state.freqData = new Uint8Array(analyser.frequencyBinCount);
  }

  async function ensureMusicPlay() {
    if (!dom.bgm) return;
    if (!state.audioCtx) initAudioAnalyser();

    if (state.audioCtx && state.audioCtx.state === "suspended") {
      try {
        await state.audioCtx.resume();
      } catch {}
    }

    dom.bgm.volume = 0.45;
    if (dom.bgm.paused) {
      try {
        await dom.bgm.play();
        state.audioStarted = true;
        if (dom.musicToggle) dom.musicToggle.textContent = "⏸ BGM";
        setMusicBadge("播放中");
      } catch {
        setMusicBadge("浏览器阻止自动播放，请点击 🎵 BGM");
      }
    }
  }

  async function toggleMusic() {
    if (!dom.bgm) return;
    if (!state.audioStarted) return ensureMusicPlay();

    if (dom.bgm.paused) {
      try {
        await dom.bgm.play();
        dom.musicToggle.textContent = "⏸ BGM";
        setMusicBadge("播放中");
      } catch {}
    } else {
      dom.bgm.pause();
      dom.musicToggle.textContent = "🎵 BGM";
      setMusicBadge("已暂停");
    }
  }

  if (dom.musicToggle) dom.musicToggle.addEventListener("click", toggleMusic);

  function readBeat() {
    if (!state.analyser || !state.freqData) return 0;
    state.analyser.getByteFrequencyData(state.freqData);
    let sum = 0;
    const bins = 24;
    for (let i = 0; i < bins; i++) sum += state.freqData[i];
    return sum / bins / 255;
  }

  /* ================= Stage UI ================= */
  function renderStageDots() {
    if (!dom.stageDots) return;
    dom.stageDots.innerHTML = LANDING_STAGES.map(
      (_, i) => `<span class="stage-dot ${i === 0 ? "active" : ""}"></span>`,
    ).join("");
  }

  function setStage(index) {
    const len = LANDING_STAGES.length;
    state.stageIndex = (index + len) % len;
    const s = LANDING_STAGES[state.stageIndex];

    if (dom.stageEyebrow) dom.stageEyebrow.textContent = s.eyebrow;
    if (dom.stageTitle) dom.stageTitle.textContent = s.title;
    if (dom.stageSub) dom.stageSub.textContent = s.sub;
    if (dom.landing)
      dom.landing.setAttribute("data-stage", String(state.stageIndex));

    if (dom.stageDots) {
      [...dom.stageDots.children].forEach((el, i) =>
        el.classList.toggle("active", i === state.stageIndex),
      );
    }

    state.lastStageSwitch = performance.now();
  }

  function stepStage(step) {
    setStage(state.stageIndex + step);
  }

  /* ================= Router ================= */
  function parseHash() {
    const raw = (location.hash || "#home").slice(1);
    const [path, query = ""] = raw.split("?");
    return { path: path || "home", params: new URLSearchParams(query) };
  }

  function setHash(path, params = {}) {
    const q = new URLSearchParams(params);
    location.hash = q.toString() ? `${path}?${q.toString()}` : path;
  }

  function setActiveNav(path) {
    if (!dom.nav) return;
    [...dom.nav.querySelectorAll("a")].forEach((a) =>
      a.classList.remove("active"),
    );
    const routeForNav = path === "post" ? "home" : path;
    const active = dom.nav.querySelector(`[data-route="${routeForNav}"]`);
    if (active) active.classList.add("active");
  }

  function postCard(post) {
    return `
      <article class="post-card" data-open-post="${post.id}">
        <div class="post-cover" style="background:${post.cover}">
          <span>${post.category}</span>
        </div>
        <div class="post-body">
          <div class="post-meta">
            <span>${post.date}</span><span>·</span><span>👁 ${post.views}</span><span>·</span><span>⏱ ${post.readTime}</span>
          </div>
          <h3 class="post-title">${post.title}</h3>
          <p class="post-excerpt">${post.excerpt}</p>
        </div>
      </article>
    `;
  }

  function renderHome() {
    const tags = unique(posts.flatMap((p) => p.tags));
    dom.pageView.innerHTML = `
      <section class="page-hero">
        <h1>沉浸式内容体验博客</h1>
        <p>开场分镜动画 + 跑车风阻交互 + 博客完整信息架构。</p>
      </section>

      <section class="kpi-grid">
        <article class="kpi"><b>${posts.length}</b><span>文章总数</span></article>
        <article class="kpi"><b>${unique(posts.map((p) => p.category)).length}</b><span>分类数量</span></article>
        <article class="kpi"><b>${tags.length}</b><span>标签数量</span></article>
        <article class="kpi"><b>Three.js</b><span>视觉引擎</span></article>
      </section>

      <h2 class="section-title">最新文章</h2>
      <section class="layout">
        <div class="cards-grid">${posts.slice(0, 6).map(postCard).join("")}</div>
        <aside>
          <div class="panel"><h4>快速导航</h4><p class="muted">归档、分类、标签、搜索全链路打通。</p></div>
          <div class="panel"><h4>推荐阅读</h4><p class="muted">首屏动画、目录高亮、搜索体验优化。</p></div>
        </aside>
      </section>
    `;
  }

  function renderArchive() {
    const grouped = posts.reduce((acc, p) => {
      const y = p.date.slice(0, 4);
      if (!acc[y]) acc[y] = [];
      acc[y].push(p);
      return acc;
    }, {});
    const years = Object.keys(grouped).sort((a, b) => b - a);

    dom.pageView.innerHTML = `
      <section class="page-hero"><h1>归档</h1><p>按年份查看全部内容。</p></section>
      <div style="margin-top:16px;">
        ${years
          .map(
            (y) => `
          <section class="timeline-year">
            <h3>${y}</h3>
            <div class="archive-list">
              ${grouped[y]
                .map(
                  (p) => `
                <article class="archive-item" data-open-post="${p.id}">
                  <div class="left">
                    <b>${p.title}</b>
                    <small class="muted">${p.date} · ${p.category}</small>
                  </div>
                  <span class="pill">${p.readTime}</span>
                </article>
              `,
                )
                .join("")}
            </div>
          </section>
        `,
          )
          .join("")}
      </div>
    `;
  }

  function renderCategories() {
    const map = posts.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {});
    const list = Object.entries(map);

    dom.pageView.innerHTML = `
      <section class="page-hero"><h1>分类</h1><p>按主题维度聚合内容。</p></section>
      <section class="simple-grid" style="margin-top:16px;">
        ${list
          .map(
            ([name, items]) => `
          <article class="item-card">
            <h4>${name}</h4>
            <p class="muted">共 ${items.length} 篇文章</p>
            <ul class="list">${items
              .slice(0, 3)
              .map((i) => `<li>${i.title}</li>`)
              .join("")}</ul>
            <button class="btn" data-go-category="${name}">在搜索页查看</button>
          </article>
        `,
          )
          .join("")}
      </section>
    `;
  }

  function renderTags() {
    const map = {};
    posts.forEach((p) => p.tags.forEach((t) => (map[t] = (map[t] || 0) + 1)));
    const list = Object.entries(map).sort((a, b) => b[1] - a[1]);

    dom.pageView.innerHTML = `
      <section class="page-hero"><h1>标签</h1><p>跨分类索引，支持多维探索。</p></section>
      <section class="panel" style="margin-top:16px;">
        <h3>标签云</h3>
        <div class="tag-cloud">
          ${list.map(([name, count]) => `<button class="tag-btn" data-go-tag="${name}">${name} · ${count}</button>`).join("")}
        </div>
      </section>
    `;
  }

  function renderAbout() {
    dom.pageView.innerHTML = `
      <section class="page-hero"><h1>关于</h1><p>技术 + 设计 + 内容产品化的演示项目。</p></section>
      <section class="about-grid" style="margin-top:16px;">
        <article class="panel">
          <h3>我在做什么</h3>
          <p class="muted">前端工程、视觉交互、内容体验的融合实践。</p>
          <ul class="list">
            <li>沉浸式开场视觉叙事</li>
            <li>博客信息架构设计</li>
            <li>详情页阅读体验优化</li>
          </ul>
        </article>
        <article class="panel">
          <h3>技术栈</h3>
          <ul class="list">
            <li>Three.js（WebGL 开场）</li>
            <li>原生 JS（路由/渲染/搜索）</li>
            <li>CSS（主题系统与响应式）</li>
          </ul>
        </article>
      </section>
    `;
  }

  function renderSearch(params) {
    const categories = unique(posts.map((p) => p.category));
    const tags = unique(posts.flatMap((p) => p.tags));

    const q0 = params.get("q") || "";
    const c0 = params.get("category") || "";
    const t0 = params.get("tag") || "";

    dom.pageView.innerHTML = `
      <section class="page-hero"><h1>搜索</h1><p>关键词 + 分类 + 标签组合筛选。</p></section>
      <section class="panel" style="margin-top:16px;">
        <div class="search-tools">
          <input id="searchInput" class="input" placeholder="输入标题 / 摘要 / 标签..." value="${q0}" />
          <select id="categorySelect" class="select">
            <option value="">全部分类</option>
            ${categories.map((c) => `<option value="${c}" ${c === c0 ? "selected" : ""}>${c}</option>`).join("")}
          </select>
          <select id="tagSelect" class="select">
            <option value="">全部标签</option>
            ${tags.map((t) => `<option value="${t}" ${t === t0 ? "selected" : ""}>${t}</option>`).join("")}
          </select>
          <button id="clearSearch" class="btn">清空</button>
        </div>
        <div id="searchCount" class="search-count"></div>
        <div id="searchResults" class="cards-grid"></div>
      </section>
    `;

    const input = document.getElementById("searchInput");
    const categorySelect = document.getElementById("categorySelect");
    const tagSelect = document.getElementById("tagSelect");
    const clearSearch = document.getElementById("clearSearch");
    const searchCount = document.getElementById("searchCount");
    const searchResults = document.getElementById("searchResults");

    function run() {
      const q = input.value.trim().toLowerCase();
      const c = categorySelect.value;
      const t = tagSelect.value;
      const list = posts.filter((p) => {
        const text =
          `${p.title} ${p.excerpt} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
        return (
          (!q || text.includes(q)) &&
          (!c || p.category === c) &&
          (!t || p.tags.includes(t))
        );
      });
      searchCount.textContent = `共找到 ${list.length} 条结果`;
      searchResults.innerHTML = list.length
        ? list.map(postCard).join("")
        : `<div class="panel"><p class="muted">未找到匹配内容。</p></div>`;
    }

    input.addEventListener("input", run);
    categorySelect.addEventListener("change", run);
    tagSelect.addEventListener("change", run);
    clearSearch.addEventListener("click", () => {
      input.value = "";
      categorySelect.value = "";
      tagSelect.value = "";
      run();
    });

    run();
  }

  function makeArticleBody(post) {
    return `
      <p>本文以 <code>${post.title}</code> 为主题，演示高完整度博客详情页结构。</p>
      <h2>一、内容结构设计</h2>
      <p>建议拆为导语、方法、实现、总结四层，提高阅读连贯性。</p>
      <h3>1.1 头部信息区</h3>
      <p>展示日期、分类、阅读时长与浏览量。</p>
      <h3>1.2 正文排版</h3>
      <p>标题层级明确、段落留白合理、代码块视觉突出。</p>
      <pre><code>const route = '#post?id=${post.id}';
location.hash = route;</code></pre>
      <h2>二、目录吸附与高亮</h2>
      <p>扫描 <code>h2/h3</code> 自动生成目录，并根据滚动高亮当前章节。</p>
      <h3>2.1 锚点生成</h3>
      <ul><li>遍历标题生成 id</li><li>渲染目录链接</li></ul>
      <h3>2.2 滚动高亮</h3>
      <p>根据标题相对视口位置确定当前激活项。</p>
      <h2>三、体验增强</h2>
      <ul><li>顶部进度条</li><li>回到顶部</li><li>上一篇 / 下一篇</li></ul>
      <h2>四、总结</h2>
      <p>视觉叙事 + 信息架构 + 阅读体验统一后，博客会更像完整产品。</p>
    `;
  }

  function renderPost(params) {
    const id = params.get("id");
    const post = posts.find((p) => p.id === id) || posts[0];
    const idx = posts.findIndex((p) => p.id === post.id);
    const prev = idx > 0 ? posts[idx - 1] : null;
    const next = idx < posts.length - 1 ? posts[idx + 1] : null;

    dom.pageView.innerHTML = `
      <div class="panel" style="margin-bottom:12px;"><button class="btn" data-go-home>← 返回首页</button></div>
      <section class="post-layout">
        <article class="article">
          <div class="article-cover" style="background:${post.cover}"></div>
          <div class="article-inner">
            <h1 class="article-title">${post.title}</h1>
            <div class="article-meta">
              <span>${post.date}</span><span>·</span><span>${post.category}</span><span>·</span><span>👁 ${post.views}</span><span>·</span><span>⏱ ${post.readTime}</span>
            </div>
            <div class="article-body">${makeArticleBody(post)}</div>
            <div class="post-nav">
              <button class="post-link" ${prev ? `data-open-post="${prev.id}"` : "disabled"}>
                <small>上一篇</small><div>${prev ? prev.title : "已经是第一篇了"}</div>
              </button>
              <button class="post-link" ${next ? `data-open-post="${next.id}"` : "disabled"}>
                <small>下一篇</small><div>${next ? next.title : "已经是最后一篇了"}</div>
              </button>
            </div>
          </div>
        </article>
        <aside>
          <div class="panel toc-panel">
            <h4 style="margin:0 0 8px;">目录</h4>
            <ul id="tocList" class="toc-list"></ul>
          </div>
        </aside>
      </section>
    `;
    initTOC();
  }

  function initTOC() {
    const toc = document.getElementById("tocList");
    if (!toc) return;
    state.tocHeadings = [
      ...dom.pageView.querySelectorAll(".article-body h2, .article-body h3"),
    ];
    state.tocHeadings.forEach((h, i) => (h.id = `sec-${i + 1}`));

    toc.innerHTML = state.tocHeadings
      .map(
        (h) => `
      <li class="${h.tagName === "H3" ? "sub" : ""}">
        <a href="#${h.id}" data-toc-id="${h.id}">${h.textContent}</a>
      </li>
    `,
      )
      .join("");

    state.tocLinks = [...toc.querySelectorAll("a")];
    state.tocLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .getElementById(link.dataset.tocId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    syncTOCActive();
  }

  function syncTOCActive() {
    if (state.route !== "post" || !state.tocHeadings.length) return;
    let current = state.tocHeadings[0].id;
    for (const h of state.tocHeadings) {
      if (h.getBoundingClientRect().top <= 130) current = h.id;
      else break;
    }
    state.tocLinks.forEach((a) =>
      a.classList.toggle("active", a.dataset.tocId === current),
    );
  }

  function renderRoute() {
    const { path, params } = parseHash();
    state.route = path;
    setActiveNav(path);

    if (path !== "post") {
      state.tocHeadings = [];
      state.tocLinks = [];
    }

    switch (path) {
      case "home":
        renderHome();
        break;
      case "archive":
        renderArchive();
        break;
      case "categories":
        renderCategories();
        break;
      case "tags":
        renderTags();
        break;
      case "about":
        renderAbout();
        break;
      case "search":
        renderSearch(params);
        break;
      case "post":
        renderPost(params);
        break;
      default:
        renderHome();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    onScroll();
  }

  if (dom.pageView) {
    dom.pageView.addEventListener("click", (e) => {
      const openPost = e.target.closest("[data-open-post]");
      if (openPost) return setHash("post", { id: openPost.dataset.openPost });

      const goCategory = e.target.closest("[data-go-category]");
      if (goCategory)
        return setHash("search", { category: goCategory.dataset.goCategory });

      const goTag = e.target.closest("[data-go-tag]");
      if (goTag) return setHash("search", { tag: goTag.dataset.goTag });

      const goHome = e.target.closest("[data-go-home]");
      if (goHome) return setHash("home");
    });
  }

  if (dom.logo) dom.logo.addEventListener("click", () => setHash("home"));

  function onScroll() {
    if (!state.entered) {
      if (dom.progress) dom.progress.style.width = "0%";
      if (dom.backTop) dom.backTop.classList.remove("show");
      return;
    }
    const doc = document.documentElement;
    const h = doc.scrollHeight - doc.clientHeight;
    if (dom.progress)
      dom.progress.style.width = (h > 0 ? (doc.scrollTop / h) * 100 : 0) + "%";
    if (dom.backTop) dom.backTop.classList.toggle("show", doc.scrollTop > 420);
    syncTOCActive();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  if (dom.backTop)
    dom.backTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );

  /* ================= Landing helpers ================= */
  function createRadialTexture() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    g.addColorStop(0, "rgba(160,220,255,0.95)");
    g.addColorStop(0.35, "rgba(110,190,255,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  function createDirectionalWindSystem(scene, isMobile) {
    const count = isMobile ? 700 : 1400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 2 * 3);
    const col = new Float32Array(count * 2 * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

    const core = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );

    const glow = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.set(1, 1.035, 1);

    scene.add(glow);
    scene.add(core);

    const lanes = [
      -1.75, -1.35, -1.0, -0.62, -0.25, 0.1, 0.45, 0.85, 1.3, 1.8, 2.25,
    ];
    const items = [];

    function reset(it, first = false) {
      it.side = Math.random() < 0.5 ? -1 : 1;
      it.lat = it.side * (2.9 + Math.random() * 10.5);
      it.h =
        lanes[(Math.random() * lanes.length) | 0] +
        (Math.random() - 0.5) * 0.06;
      it.along = first ? -40 + Math.random() * 95 : 55 + Math.random() * 35;
      it.len = 1.2 + Math.random() * 5.2;
      it.layer = 0.55 + Math.random() * 1.95;
      it.seed = Math.random() * 100;
      it.rearLimit = 58 + Math.random() * 18;

      const c =
        Math.random() < 0.9
          ? new THREE.Color(0x8fe3ff)
          : new THREE.Color(0xff9dcd);
      it.r = c.r;
      it.g = c.g;
      it.b = c.b;
      return it;
    }

    for (let i = 0; i < count; i++) items.push(reset({}, true));

    return {
      update({
        dt,
        t,
        speedNorm,
        boost,
        pointerX,
        pointerY,
        carPos,
        forward,
        side,
        up,
      }) {
        const fx = forward.x,
          fy = forward.y,
          fz = forward.z;
        const sx = side.x,
          sy = side.y,
          sz = side.z;
        const ux = up.x,
          uy = up.y,
          uz = up.z;
        const bx = -fx,
          by = -fy,
          bz = -fz;

        const flowSpeed = 28 + speedNorm * 110 + boost * 42;
        const px = carPos.x,
          py = carPos.y,
          pz = carPos.z;

        for (let i = 0; i < count; i++) {
          const it = items[i];
          it.along -= flowSpeed * dt * it.layer;
          if (it.along < -it.rearLimit) reset(it, false);

          const lat =
            it.lat + pointerX * (0.95 + it.layer * 0.16) * Math.sign(it.lat);
          const h =
            it.h + pointerY * 0.22 + Math.sin(t * 0.85 + it.seed) * 0.015;
          const along = it.along;

          const x = px + sx * lat + ux * h + fx * along;
          const y = py + sy * lat + uy * h + fy * along;
          const z = pz + sz * lat + uz * h + fz * along;

          const seg = it.len * (1 + speedNorm * 2.35 + boost * 0.95);

          const clearZone =
            Math.abs(lat) < 2.15 &&
            h > -1.5 &&
            h < 1.8 &&
            along > -4 &&
            along < 8;
          const vis = clearZone ? 0.14 : 1.0;

          const bi = i * 6;
          pos[bi + 0] = x + bx * seg * 0.65;
          pos[bi + 1] = y + by * seg * 0.65;
          pos[bi + 2] = z + bz * seg * 0.65;

          pos[bi + 3] = x - bx * seg * 0.35;
          pos[bi + 4] = y - by * seg * 0.35;
          pos[bi + 5] = z - bz * seg * 0.35;

          const g = (0.35 + speedNorm * 1.1 + boost * 0.75) * vis;
          col[bi + 0] = it.r * g;
          col[bi + 1] = it.g * g;
          col[bi + 2] = it.b * g;
          col[bi + 3] = it.r * g;
          col[bi + 4] = it.g * g;
          col[bi + 5] = it.b * g;
        }

        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
      },
    };
  }

  /* ================= Landing Three ================= */
  function initLandingThree() {
    if (!window.THREE || !dom.canvas || !dom.landing) return;

    renderStageDots();
    setStage(0);

    const isMobile = window.innerWidth < 980;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050913, 0.05);

    const camera = new THREE.PerspectiveCamera(
      62,
      window.innerWidth / window.innerHeight,
      0.1,
      260,
    );
    camera.position.set(2.2, 0.45, 10.5);

    const renderer = new THREE.WebGLRenderer({
      canvas: dom.canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.23;

    scene.add(new THREE.HemisphereLight(0xc3d8ff, 0x091020, 0.78));
    const key = new THREE.DirectionalLight(0xe0efff, 1.42);
    key.position.set(6, 7, 7);
    scene.add(key);

    const rim = new THREE.PointLight(0x2fd5ff, 1.95, 95);
    rim.position.set(-8, 1.2, 5);
    scene.add(rim);

    const topSpot = new THREE.SpotLight(0xcfe4ff, 2.1, 80, 0.55, 0.6, 1.1);
    topSpot.position.set(2, 8.2, 10.8);
    scene.add(topSpot);
    scene.add(topSpot.target);

    const floorY = -2.35;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 220),
      new THREE.MeshStandardMaterial({
        color: 0x08142d,
        roughness: 0.74,
        metalness: 0.22,
        transparent: true,
        opacity: 0.72,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = floorY;
    scene.add(floor);

    const floorGrid = new THREE.GridHelper(180, 100, 0x2546ff, 0x10203a);
    floorGrid.position.y = floorY + 0.02;
    floorGrid.material.transparent = true;
    floorGrid.material.opacity = 0.16;
    scene.add(floorGrid);

    const carRoot = new THREE.Group();
    const carBaseX = 1.9;
    carRoot.position.set(carBaseX, -1.95, 0.5);
    scene.add(carRoot);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialTexture(),
        color: 0x82dcff,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    halo.scale.set(8.5, 4.4, 1);
    halo.position.set(0, 0.38, -0.9);
    carRoot.add(halo);

    const underGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialTexture(),
        color: 0x3bb8ff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    underGlow.scale.set(6.2, 2.0, 1);
    underGlow.position.set(0, -0.4, 0.8);
    carRoot.add(underGlow);

    let wheelInfos = [];
    let semanticFx = null;
    let lightFx = null;
    let lightPulseBoost = 0;
    let lightTime = 0;
    let lightMode = "park";
    let lightModeBlend = 0;
    let lightStillTimer = 0;

    let carMeshList = [];
    let carLoaded = false;

    function axisByIndex(i) {
      if (i === 0) return new THREE.Vector3(1, 0, 0);
      if (i === 1) return new THREE.Vector3(0, 1, 0);
      return new THREE.Vector3(0, 0, 1);
    }

    function removeLegacyWingMeshes(root) {
      const wingReg =
        /spoiler|rear[\s_-]?wing|tail[\s_-]?wing|尾翼|扰流|ducktail/i;
      const mirrorReg = /mirror|后视镜/i;
      root.traverse((n) => {
        if (!n.isMesh) return;
        const name = (n.name || "").toLowerCase();
        if (mirrorReg.test(name)) return;
        if (wingReg.test(name)) n.visible = false;
      });
    }

    function fallbackCar() {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: 0x102b7a,
        metalness: 0.84,
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        emissive: 0x081946,
        emissiveIntensity: 0.8,
      });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x79d8ff,
        transparent: true,
        opacity: 0.76,
        transmission: 0.5,
        roughness: 0.03,
      });

      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(2.2, 1.5, 10, 24),
        bodyMat,
      );
      body.rotation.z = Math.PI / 2;
      body.scale.set(1, 0.42, 0.68);

      const lower = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.62, 1.95),
        bodyMat,
      );
      lower.position.set(0, -0.14, 0.12);

      const cabin = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 24, 24),
        glassMat,
      );
      cabin.scale.set(1.55, 0.62, 0.95);
      cabin.position.set(-0.28, 0.48, 0.12);

      g.add(body, lower, cabin);

      const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x0b0f16,
        roughness: 0.86,
        metalness: 0.2,
      });
      const wheelPos = [
        [-1.55, -0.55, -1.35],
        [1.55, -0.55, -1.35],
        [-1.55, -0.55, 1.35],
        [1.55, -0.55, 1.35],
      ];

      wheelInfos = [];
      wheelPos.forEach((p) => {
        const w = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 0.34, 24),
          wheelMat,
        );
        w.position.set(p[0], p[1], p[2]);
        w.rotation.z = Math.PI / 2;
        g.add(w);
        wheelInfos.push({ mesh: w, axisLocal: new THREE.Vector3(1, 0, 0) });
      });

      carMeshList = [body, lower, cabin];
      return g;
    }

    function orientScaleCenterModel(model) {
      model.updateMatrixWorld(true);
      let box = new THREE.Box3().setFromObject(model);
      const s0 = new THREE.Vector3();
      box.getSize(s0);

      if (s0.x > s0.z) {
        model.rotation.y = Math.PI / 2;
        model.updateMatrixWorld(true);
        box = new THREE.Box3().setFromObject(model);
      }

      const size = new THREE.Vector3();
      box.getSize(size);
      const targetLen = 6.2;
      const scale = targetLen / Math.max(size.x, size.z, 0.001);
      model.scale.multiplyScalar(scale);
      model.updateMatrixWorld(true);

      box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);

      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= box.min.y + 0.28;
      model.updateMatrixWorld(true);

      return new THREE.Box3().setFromObject(model);
    }

    function boostMaterials(root) {
      root.traverse((n) => {
        if (!n.isMesh || !n.material) return;
        carMeshList.push(n);

        const mats = Array.isArray(n.material) ? n.material : [n.material];
        mats.forEach((m) => {
          if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
            m.metalness = Math.max(0.45, m.metalness ?? 0.7);
            m.roughness = Math.min(0.34, m.roughness ?? 0.26);
            if ("clearcoat" in m)
              m.clearcoat = Math.max(0.78, m.clearcoat ?? 0.9);
            m.envMapIntensity = 1.35;
            if (m.color) m.color.offsetHSL(0, 0, 0.06);
            if (m.emissive) {
              m.emissive = new THREE.Color(0x081432);
              m.emissiveIntensity = 0.45;
            }
          }
        });
      });
    }

    function detectWheelInfos(root, bounds) {
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bounds.getSize(size);
      bounds.getCenter(center);

      const WHEEL_NAME = /wheel|tyre|tire|rim|轮毂|轮胎/i;
      const EXCLUDE_NAME =
        /door|门|hood|bonnet|trunk|tailgate|spoiler|wing|mirror|window|glass|seat|bumper|body|fender|handle/i;

      const cands = [];
      const wp = new THREE.Vector3();

      root.traverse((n) => {
        if (!n.isMesh || !n.geometry) return;

        const nm = (n.name || "").toLowerCase();
        if (EXCLUDE_NAME.test(nm)) return;

        n.geometry.computeBoundingBox();
        const bb = n.geometry.boundingBox;
        if (!bb) return;

        const d = new THREE.Vector3().subVectors(bb.max, bb.min);
        const dims = [Math.abs(d.x), Math.abs(d.y), Math.abs(d.z)];
        const sorted = [...dims].sort((a, b) => b - a);

        // 太小跳过
        if (sorted[0] < 0.08) return;

        // 轮胎应“近似圆盘”：两长边接近 + 一条明显短边
        const discLike =
          1 - Math.abs(sorted[0] - sorted[1]) / (sorted[0] + 1e-6);
        const thinRatio = sorted[2] / (sorted[0] + 1e-6);

        if (discLike < 0.55 || thinRatio > 0.55) return;

        n.getWorldPosition(wp);

        const ny = (wp.y - bounds.min.y) / (size.y + 1e-6);
        const nx = Math.abs((wp.x - center.x) / (size.x + 1e-6));
        const nz = Math.abs((wp.z - center.z) / (size.z + 1e-6));

        // 轮胎应靠近地面 + 靠近左右两侧 + 不是车体中心
        if (ny < -0.05 || ny > 0.38) return;
        if (nx < 0.18) return;
        if (nz < 0.1) return;

        const minIdx = dims.indexOf(Math.min(...dims));
        const axisLocal =
          minIdx === 0
            ? new THREE.Vector3(1, 0, 0)
            : minIdx === 1
              ? new THREE.Vector3(0, 1, 0)
              : new THREE.Vector3(0, 0, 1);

        let score =
          discLike * 1.2 + (1 - thinRatio) * 1.2 + nx * 0.6 + nz * 0.4;

        if (WHEEL_NAME.test(nm)) score += 2.0; // 名称命中大加分

        cands.push({
          mesh: n,
          axisLocal: axisLocal.normalize(),
          score,
          wp: wp.clone(),
          name: n.name || "(unnamed)",
        });
      });

      if (!cands.length) return [];

      // 分象限选 4 个（左前/右前/左后/右后）
      const q = { LF: null, RF: null, LB: null, RB: null };
      cands.forEach((c) => {
        const side = c.wp.x < center.x ? "L" : "R";
        const fb = c.wp.z < center.z ? "F" : "B";
        const key = side + fb;
        if (!q[key] || c.score > q[key].score) q[key] = c;
      });

      let out = Object.values(q).filter(Boolean);

      // 不足 4 个则按分数补齐
      if (out.length < 4) {
        const used = new Set(out.map((i) => i.mesh.uuid));
        const rest = cands
          .filter((i) => !used.has(i.mesh.uuid))
          .sort((a, b) => b.score - a.score);
        while (out.length < 4 && rest.length) out.push(rest.shift());
      }

      out = out.slice(0, 4).map((w) => ({
        mesh: w.mesh,
        axisLocal: w.axisLocal,
        name: w.name,
      }));

      console.table(out.map((w, i) => ({ idx: i, name: w.name })));
      return out;
    }

    function createSemanticFx(bounds) {
      const fx = new THREE.Group();
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bounds.getSize(size);
      bounds.getCenter(center);

      const frontZ = bounds.min.z + size.z * 0.05;
      const rearZ = bounds.max.z - size.z * 0.04;
      const yHead = bounds.min.y + size.y * 0.42;
      const halfW = size.x * 0.33;

      const frontMatL = new THREE.MeshBasicMaterial({
        color: 0x8fe8ff,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      });
      const frontMatR = new THREE.MeshBasicMaterial({
        color: 0x8fe8ff,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      });

      const frontL = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.19, 0.024, 0.02),
        frontMatL,
      );
      const frontR = new THREE.Mesh(
        new THREE.BoxGeometry(size.x * 0.19, 0.024, 0.02),
        frontMatR,
      );
      frontL.position.set(-halfW, yHead, frontZ + 0.08);
      frontR.position.set(halfW, yHead, frontZ + 0.08);

      const rearGroup = new THREE.Group();
      const rearSegs = [];
      const rearCount = 18;
      const rearTotalW = size.x * 0.64;
      const segW = rearTotalW / rearCount;

      for (let i = 0; i < rearCount; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: 0xff5d78,
          transparent: true,
          opacity: 0.52,
          depthWrite: false,
        });
        const seg = new THREE.Mesh(
          new THREE.BoxGeometry(segW * 0.88, 0.02, 0.02),
          mat,
        );
        const x = -rearTotalW * 0.5 + segW * (i + 0.5);
        seg.position.set(x, yHead - 0.03, rearZ);
        rearGroup.add(seg);
        rearSegs.push(seg);
      }

      fx.add(frontL, frontR, rearGroup);

      fx.userData = {
        front: [frontL, frontR],
        rearSegs,
        mats: [frontMatL, frontMatR, ...rearSegs.map((s) => s.material)],
      };

      return fx;
    }

    function mountCarModel(rootObj) {
      carMeshList = [];
      removeLegacyWingMeshes(rootObj);
      boostMaterials(rootObj);

      const bounds = orientScaleCenterModel(rootObj);
      wheelInfos = detectWheelInfos(rootObj, bounds);

      semanticFx = createSemanticFx(bounds);
      lightFx = semanticFx;

      carRoot.add(rootObj);
      carRoot.add(semanticFx);
      topSpot.target = carRoot;
      carLoaded = true;
    }

    function loadCarModel() {
      const MODEL_URL = "./assets/su7-xiaomini.glb?v=2";
      if (!THREE.GLTFLoader) return mountCarModel(fallbackCar());

      const loader = new THREE.GLTFLoader();
      if (THREE.DRACOLoader) {
        const draco = new THREE.DRACOLoader();
        draco.setDecoderPath(
          "https://cdn.jsdelivr.net/npm/three@0.146.0/examples/js/libs/draco/",
        );
        loader.setDRACOLoader(draco);
      }

      loader.load(
        MODEL_URL,
        (gltf) => mountCarModel(gltf.scene),
        undefined,
        () => mountCarModel(fallbackCar()),
      );
    }

    loadCarModel();

    const nitroLight = new THREE.PointLight(0x66dcff, 0.1, 18);
    nitroLight.position.set(0, -0.1, 2.4);
    carRoot.add(nitroLight);

    const windSystem = createDirectionalWindSystem(scene, isMobile);

    function updateSU7LightFx(dt, speedNorm, beat, boost, brake) {
      if (!lightFx || !lightFx.userData) return;

      lightTime += dt * (1.0 + speedNorm * 1.8);
      lightPulseBoost = Math.max(0, lightPulseBoost - dt * 1.35);

      const frontArr = lightFx.userData.front || [];
      const rearSegs = lightFx.userData.rearSegs || [];
      const N = rearSegs.length;

      const wantDrive =
        speedNorm > 0.16 ||
        boost > 0.18 ||
        brake > 0.12 ||
        state.throttleTarget > 0.35;
      const wantPark =
        speedNorm < 0.08 &&
        boost < 0.06 &&
        brake < 0.05 &&
        Math.abs(state.throttleTarget) < 0.12;

      if (wantDrive) {
        lightMode = "drive";
        lightStillTimer = 0;
      } else if (wantPark) {
        lightStillTimer += dt;
        if (lightStillTimer > 0.9) lightMode = "park";
      } else {
        lightStillTimer = 0;
      }

      const targetBlend = lightMode === "drive" ? 1 : 0;
      lightModeBlend += (targetBlend - lightModeBlend) * Math.min(1, dt * 4.2);

      const parkBreath = 0.48 + 0.18 * Math.sin(lightTime * 1.8);
      const drivePulse = 0.62 + 0.24 * Math.sin(lightTime * 3.6 + beat * 2.5);

      const frontPark = clamp(parkBreath + beat * 0.15, 0.25, 1.0);
      const frontDrive = clamp(
        drivePulse +
          beat * 0.35 +
          lightPulseBoost * 0.55 +
          speedNorm * 0.25 -
          brake * 0.12,
        0.3,
        1.9,
      );
      const frontI = THREE.MathUtils.lerp(
        frontPark,
        frontDrive,
        lightModeBlend,
      );

      frontArr.forEach((m) => {
        const mat = m.material || m;
        if (!mat) return;
        mat.opacity = clamp(0.28 + frontI * 0.42, 0.2, 1);

        const r = THREE.MathUtils.lerp(0.76, 0.56, lightModeBlend);
        const g = THREE.MathUtils.lerp(0.86, 0.88, lightModeBlend);
        mat.color.setRGB(r + frontI * 0.08, g + frontI * 0.04, 1.0);
      });

      for (let i = 0; i < N; i++) {
        const seg = rearSegs[i];
        const mat = seg.material;
        if (!mat) continue;

        const u = i / Math.max(1, N - 1);
        const center = 1 - Math.abs(u - 0.5) * 2;

        const parkI =
          0.2 + center * 0.25 + 0.06 * Math.sin(lightTime * 1.5 + u * 5);

        const p = (lightTime * (0.85 + speedNorm * 1.25)) % 1;
        const wave = Math.exp(-Math.pow(u - p, 2) / 0.012);
        const driveI =
          0.24 +
          wave * 1.35 +
          beat * 0.28 +
          lightPulseBoost * 0.45 +
          speedNorm * 0.24;

        const edgeFactor = 0.86 + Math.abs(u - 0.5) * 0.35;
        const brakeI = brake * 1.25 * edgeFactor;

        const I = clamp(
          THREE.MathUtils.lerp(parkI, driveI, lightModeBlend) + brakeI,
          0.12,
          2.4,
        );

        mat.opacity = clamp(0.18 + I * 0.38, 0.16, 1);
        mat.color.setRGB(
          1.0,
          clamp(0.22 + I * 0.09 - brake * 0.1, 0.06, 1),
          clamp(0.34 + I * 0.07 - brake * 0.18, 0.04, 1),
        );
      }
    }

    const ripples = [];
    function spawnRipple(power = 1) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.54, 64),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        }),
      );
      ring.position.set(carRoot.position.x, floorY + 0.02, 1.1);
      ring.rotation.x = -Math.PI / 2;
      ring.scale.setScalar(0.9 + power * 0.35);
      scene.add(ring);
      ripples.push({ mesh: ring, life: 1, power });
    }

    const CAM_VIEWS = [
      {
        name: "前45°英雄镜头",
        offset: { x: 4.2, y: 1.2, back: -4.8 },
        look: { x: 0, y: 0.25, forward: 0.9 },
        fov: 58,
      },
      {
        name: "低机位贴地追拍",
        offset: { x: 0.5, y: 0.28, back: 8.8 },
        look: { x: 0, y: -0.14, forward: 2.2 },
        fov: 66,
      },
      {
        name: "侧后方极速拉镜",
        offset: { x: -5.8, y: 1.0, back: 7.2 },
        look: { x: 0.2, y: 0.08, forward: 1.2 },
        fov: 62,
      },
    ];

    let viewIndex = 0;
    let windBoost = 0;
    let clickBoost = 0;
    let brakeBoost = 0;
    let nitroBoost = 0;
    let accelJolt = 0;
    let speedDisplayKmh = 0;
    let camKick = 0;
    let manualViewTime = performance.now();
    let autoViewTime = performance.now();

    const caption = document.createElement("div");
    caption.className = "cam-caption";
    caption.innerHTML = `<small>CAMERA MODE</small><span>${CAM_VIEWS[0].name}</span>`;
    dom.landing.appendChild(caption);
    let captionTimer = null;

    function showCamCaption(name) {
      caption.innerHTML = `<small>CAMERA MODE</small><span>${name}</span>`;
      caption.classList.add("show");
      if (captionTimer) clearTimeout(captionTimer);
      captionTimer = setTimeout(() => caption.classList.remove("show"), 1200);
    }

    function setView(i, manual = true) {
      viewIndex = (i + CAM_VIEWS.length) % CAM_VIEWS.length;
      if (manual) manualViewTime = performance.now();
      lightPulseBoost = Math.min(2.0, lightPulseBoost + 0.75);
      showCamCaption(CAM_VIEWS[viewIndex].name);
    }

    function nextView(manual = true) {
      setView(viewIndex + 1, manual);
    }

    const actions = dom.landing.querySelector(".landing-actions");
    if (actions && !document.getElementById("viewSwitchBtn")) {
      const btn = document.createElement("button");
      btn.id = "viewSwitchBtn";
      btn.className = "ghost-btn";
      btn.textContent = "🎥 切换视角";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        nextView(true);
      });
      actions.appendChild(btn);
    }

    const hud = document.createElement("aside");
    hud.className = "landing-hud active";
    hud.innerHTML = `
      <div class="hud-head">
        <div class="left"><span class="dot"></span><span>DRIVE HUD</span></div>
        <button class="hud-mini" data-hud-pin>H 常驻</button>
      </div>

      <div class="hud-metrics">
        <div class="metric">
          <small>速度</small>
          <b data-hud-speed>0 km/h</b>
        </div>
        <div class="metric">
          <small>镜头</small>
          <b data-hud-view>${CAM_VIEWS[0].name}</b>
        </div>
      </div>

      <div class="boost">
        <div class="boost-label">
          <span>风阻强度</span>
          <span data-hud-boost-text>0%</span>
        </div>
        <div class="boost-track"><div class="boost-fill" data-hud-boost-fill></div></div>
      </div>

      <p class="hud-tip">左键点车加速 · 滚轮调速 · <kbd>V</kbd>切镜头 · 右键切镜头 · <kbd>1/2/3</kbd>快速镜头</p>
    `;
    dom.landing.appendChild(hud);

    const hudSpeed = hud.querySelector("[data-hud-speed]");
    const hudView = hud.querySelector("[data-hud-view]");
    const hudBoostText = hud.querySelector("[data-hud-boost-text]");
    const hudBoostFill = hud.querySelector("[data-hud-boost-fill]");
    const hudPinBtn = hud.querySelector("[data-hud-pin]");

    let hudPinned = false;
    let hudActiveUntil = performance.now() + 9000;
    const nudgeHUD = (ms = 2200) => {
      hudActiveUntil = performance.now() + ms;
    };

    hudPinBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hudPinned = !hudPinned;
      hud.classList.toggle("pinned", hudPinned);
      hudPinBtn.textContent = hudPinned ? "H 取消常驻" : "H 常驻";
      nudgeHUD(2400);
    });

    const pointer = { x: 0, y: 0 };
    const ndc = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();

    function updatePointer(e) {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      pointer.x = x * 2 - 1;
      pointer.y = y * 2 - 1;
      ndc.set(pointer.x, -pointer.y);
    }

    async function boostCar(power = 1.0) {
      state.throttleTarget += 1.15 * power;
      state.throttleTarget = clamp(state.throttleTarget, -1.6, 4.8);

      windBoost = Math.min(2.2, windBoost + 0.95 * power);
      clickBoost = Math.min(1.8, clickBoost + 1.2 * power);
      nitroBoost = Math.min(2.4, nitroBoost + 1.25 * power);
      accelJolt = Math.min(1.2, accelJolt + 0.95 * power);
      camKick = Math.min(1.2, camKick + 0.9 * power);

      lightPulseBoost = Math.min(2.6, lightPulseBoost + 1.05 * power);

      spawnRipple(power);
      setTimeout(() => spawnRipple(power * 0.7), 120);

      dom.landing.classList.add("pulse");
      setTimeout(() => dom.landing.classList.remove("pulse"), 220);

      nudgeHUD(2600);
      await ensureMusicPlay();
    }

    async function onWheel(e) {
      state.throttleTarget += e.deltaY * 0.0011;
      state.throttleTarget = clamp(state.throttleTarget, -1.6, 4.8);

      if (e.deltaY > 0) {
        windBoost = Math.min(
          1.3,
          windBoost + Math.min(0.24, Math.abs(e.deltaY) * 0.00075),
        );
      } else if (e.deltaY < 0) {
        brakeBoost = Math.min(
          2.4,
          brakeBoost + Math.min(1.2, Math.abs(e.deltaY) * 0.0022),
        );
        camKick = Math.min(1.0, camKick + 0.2);
      }

      state.wheelBuffer += e.deltaY;
      if (Math.abs(state.wheelBuffer) > 130) {
        stepStage(state.wheelBuffer > 0 ? 1 : -1);
        state.wheelBuffer = 0;
      }

      nudgeHUD(1800);
      await ensureMusicPlay();
      if (state.audioStarted && dom.bgm && !dom.bgm.paused)
        setMusicBadge("播放中（风阻联动）");
    }

    async function onPointerDown(e) {
      if (e.button !== 0) return;
      if (e.target.closest("button,a,input,select,textarea,.landing-hud"))
        return;

      updatePointer(e);

      if (carLoaded && carMeshList.length) {
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(carMeshList, true);
        if (hits.length) return boostCar(1.2);
      }

      await boostCar(0.55);
      stepStage(1);
    }

    function onContextMenu(e) {
      e.preventDefault();
      nextView(true);
      nudgeHUD(2200);
    }

    function onKeyDown(e) {
      if (e.key === "v" || e.key === "V") nextView(true);
      if (e.key === "1") setView(0, true);
      if (e.key === "2") setView(1, true);
      if (e.key === "3") setView(2, true);
      if (e.key === "h" || e.key === "H") {
        hudPinned = !hudPinned;
        hud.classList.toggle("pinned", hudPinned);
        hudPinBtn.textContent = hudPinned ? "H 取消常驻" : "H 常驻";
      }
      nudgeHUD(2200);
    }

    window.addEventListener("mousemove", updatePointer);
    window.addEventListener("keydown", onKeyDown);
    dom.landing.addEventListener("wheel", onWheel, { passive: true });
    dom.landing.addEventListener("pointerdown", onPointerDown);
    dom.landing.addEventListener("contextmenu", onContextMenu);

    showCamCaption(CAM_VIEWS[0].name);

    const clock = new THREE.Clock();
    const forward = new THREE.Vector3();
    const side = new THREE.Vector3();
    const up = new THREE.Vector3();
    const back = new THREE.Vector3();
    const tmpPos = new THREE.Vector3();
    const tmpLook = new THREE.Vector3();

    function animate() {
      requestAnimationFrame(animate);

      const dt = Math.min(0.033, clock.getDelta());
      const t = clock.elapsedTime;
      const now = performance.now();

      if (
        !state.entered &&
        now - manualViewTime > 12000 &&
        now - autoViewTime > 6500
      ) {
        nextView(false);
        autoViewTime = now;
      }

      if (!state.entered && now - state.lastStageSwitch > 6400) stepStage(1);

      const beatRaw = readBeat();
      state.beat += (beatRaw - state.beat) * 0.12;

      // === 真实速度物理（260+）===
      const throttle01 = clamp((state.throttleTarget + 1.6) / 6.4, 0, 1);
      const engineForce = 20 + throttle01 * 74;
      const nitroForce = nitroBoost * 46;
      const aeroDrag = 0.15 * state.velocity * state.velocity;
      const rollingDrag = 1.9 + state.velocity * 0.06;
      const brakeForce = brakeBoost * (10 + state.velocity * 1.8);

      const accel =
        engineForce + nitroForce - aeroDrag - rollingDrag - brakeForce;
      state.velocity += accel * dt;
      state.velocity = clamp(state.velocity, 0, 92);

      state.throttleTarget *= Math.exp(-1.75 * dt);
      clickBoost = Math.max(0, clickBoost - dt * 2.4);
      windBoost = Math.max(0, windBoost - dt * 1.4);
      brakeBoost = Math.max(0, brakeBoost - dt * 2.7);
      nitroBoost = Math.max(0, nitroBoost - dt * 1.9);
      accelJolt = Math.max(0, accelJolt - dt * 3.1);
      camKick = Math.max(0, camKick - dt * 2.8);

      const speedKmhRaw = state.velocity * 3.6;
      speedDisplayKmh +=
        (speedKmhRaw - speedDisplayKmh) * Math.min(1, dt * 6.2);
      const speedNorm = clamp(speedDisplayKmh / 320, 0, 1);

      const view = CAM_VIEWS[viewIndex];

      // 车姿态
      carRoot.position.x +=
        (carBaseX + pointer.x * 0.95 - carRoot.position.x) * 0.07;
      carRoot.position.y =
        -1.95 +
        Math.sin(t * (3.8 + speedNorm * 8.5)) * (0.01 + speedNorm * 0.015);
      carRoot.rotation.y +=
        (pointer.x * 0.16 + speedNorm * 0.08 - carRoot.rotation.y) * 0.08;
      carRoot.rotation.z += (-pointer.x * 0.05 - carRoot.rotation.z) * 0.08;
      carRoot.rotation.x +=
        (pointer.y * 0.025 +
          nitroBoost * 0.018 -
          brakeBoost * 0.035 -
          carRoot.rotation.x) *
        0.06;

      // 局部基向量（风阻方向跟车头）
      forward.set(0, 0, -1).applyQuaternion(carRoot.quaternion).normalize();
      side.set(1, 0, 0).applyQuaternion(carRoot.quaternion).normalize();
      up.set(0, 1, 0).applyQuaternion(carRoot.quaternion).normalize();
      back.copy(forward).multiplyScalar(-1);
      if (wheelInfos.length === 4) {
        const spin = state.velocity * dt * 3.5;
        wheelInfos.forEach((w) => {
          if (!w?.mesh || !w.mesh.visible) return;
          if (!w.axisLocal) w.axisLocal = new THREE.Vector3(1, 0, 0);
          w.mesh.rotateOnAxis(w.axisLocal, -spin);
        });
      }

      updateSU7LightFx(
        dt,
        speedNorm,
        state.beat,
        windBoost + clickBoost + nitroBoost,
        brakeBoost,
      );

      // 镜头
      tmpPos
        .copy(carRoot.position)
        .addScaledVector(side, view.offset.x + pointer.x * 0.65)
        .addScaledVector(up, view.offset.y - pointer.y * 0.25)
        .addScaledVector(
          back,
          view.offset.back - speedNorm * 2.3 - clickBoost * 0.45,
        );

      tmpPos.z += accelJolt * 1.25; // 爆发后坐

      tmpPos.x += (Math.random() - 0.5) * camKick * 0.08;
      tmpPos.y += (Math.random() - 0.5) * camKick * 0.05;

      camera.position.lerp(tmpPos, 0.075);

      tmpLook
        .copy(carRoot.position)
        .addScaledVector(side, view.look.x)
        .addScaledVector(up, view.look.y)
        .addScaledVector(forward, view.look.forward);

      camera.lookAt(tmpLook);

      const targetFov =
        view.fov + speedNorm * 10.8 + clickBoost * 2.3 + nitroBoost * 2.8;
      camera.fov += (targetFov - camera.fov) * 0.06;
      camera.updateProjectionMatrix();

      halo.material.opacity = 0.25 + speedNorm * 0.38 + state.beat * 0.22;
      halo.scale.x = 7.8 + speedNorm * 3.1;
      halo.scale.y = 4.0 + speedNorm * 1.2;

      underGlow.material.opacity = 0.2 + speedNorm * 0.28 + clickBoost * 0.22;
      underGlow.scale.x = 5.6 + speedNorm * 2.3;
      underGlow.scale.y = 1.8 + speedNorm * 0.7;

      nitroLight.intensity =
        0.2 +
        speedNorm * 1.05 +
        clickBoost * 2.0 +
        nitroBoost * 2.6 +
        state.beat * 0.5;
      nitroLight.position.z = 2.15 + speedNorm * 0.4;

      windSystem.update({
        dt,
        t,
        speedNorm,
        boost: windBoost + clickBoost + nitroBoost,
        pointerX: pointer.x,
        pointerY: pointer.y,
        carPos: carRoot.position,
        forward,
        side,
        up,
      });

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.life -= dt * 0.95;
        r.mesh.scale.multiplyScalar(1 + dt * (2.2 + speedNorm * 2.2 + r.power));
        r.mesh.material.opacity = Math.max(0, r.life);
        if (r.life <= 0) {
          scene.remove(r.mesh);
          r.mesh.geometry.dispose();
          r.mesh.material.dispose();
          ripples.splice(i, 1);
        }
      }

      // HUD
      const hudActive = hudPinned || performance.now() < hudActiveUntil;
      hud.classList.toggle("active", hudActive);

      const speedKmh = Math.round(speedDisplayKmh);
      hudSpeed.textContent = `${speedKmh} km/h`;
      hudView.textContent = CAM_VIEWS[viewIndex].name;

      const boostPct = clamp(
        (windBoost + clickBoost + nitroBoost) * 55,
        0,
        100,
      );
      hudBoostText.textContent = `${boostPct.toFixed(0)}%`;
      hudBoostFill.style.width = `${boostPct.toFixed(0)}%`;

      if (state.audioStarted && dom.bgm && !dom.bgm.paused) {
        dom.bgm.playbackRate = clamp(
          0.94 + speedNorm * 0.36 + nitroBoost * 0.06,
          0.9,
          1.32,
        );
      }

      renderer.toneMappingExposure =
        1.18 + speedNorm * 0.18 + nitroBoost * 0.08;
      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /* ================= Enter ================= */
  function enterSite() {
    if (state.entered) return;
    state.entered = true;
    document.body.classList.add("entered");
    if (dom.app) dom.app.setAttribute("aria-hidden", "false");
    onScroll();
  }

  if (dom.enterBtn) {
    dom.enterBtn.addEventListener("click", async () => {
      await ensureMusicPlay();
      enterSite();
    });
  }

  /* ================= Boot ================= */
  window.addEventListener("hashchange", renderRoute);
  if (!location.hash) setHash("home");
  renderRoute();
  initLandingThree();
  onScroll();
})();
