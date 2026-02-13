/*
 * @Author: linyc
 * @Date: 2026-02-13 13:46:31
 * @LastEditTime: 2026-02-13 13:50:35
 * @LastEditors: linyc
 * @Description: 
 */
import { unique } from "../utils/math.js";

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

function renderHome(rootEl, posts) {
  const tags = unique(posts.flatMap(p => p.tags));
  rootEl.innerHTML = `
    <section class="page-hero">
      <h1>沉浸式内容体验博客</h1>
      <p>开场跑车交互 + 完整内容页面体系（History 路由）。</p>
    </section>

    <section class="kpi-grid">
      <article class="kpi"><b>${posts.length}</b><span>文章总数</span></article>
      <article class="kpi"><b>${unique(posts.map(p => p.category)).length}</b><span>分类数量</span></article>
      <article class="kpi"><b>${tags.length}</b><span>标签数量</span></article>
      <article class="kpi"><b>Three.js</b><span>视觉引擎</span></article>
    </section>

    <h2 class="section-title">最新文章</h2>
    <section class="layout">
      <div class="cards-grid">${posts.slice(0, 6).map(postCard).join("")}</div>
      <aside>
        <div class="panel"><h4>快速导航</h4><p class="muted">归档、分类、标签、搜索全链路打通。</p></div>
        <div class="panel"><h4>推荐阅读</h4><p class="muted">风阻、灯语、幻影加速、镜头语言。</p></div>
      </aside>
    </section>
  `;
  return {};
}

function renderArchive(rootEl, posts) {
  const grouped = posts.reduce((acc, p) => {
    const y = p.date.slice(0, 4);
    (acc[y] ||= []).push(p);
    return acc;
  }, {});
  const years = Object.keys(grouped).sort((a, b) => b - a);

  rootEl.innerHTML = `
    <section class="page-hero"><h1>归档</h1><p>按年份查看全部内容。</p></section>
    <div style="margin-top:16px;">
      ${years.map(y => `
        <section class="timeline-year">
          <h3>${y}</h3>
          <div class="archive-list">
            ${grouped[y].map(p => `
              <article class="archive-item" data-open-post="${p.id}">
                <div class="left">
                  <b>${p.title}</b>
                  <small class="muted">${p.date} · ${p.category}</small>
                </div>
                <span class="pill">${p.readTime}</span>
              </article>
            `).join("")}
          </div>
        </section>
      `).join("")}
    </div>
  `;
  return {};
}

function renderCategories(rootEl, posts) {
  const map = posts.reduce((acc, p) => ((acc[p.category] ||= []).push(p), acc), {});
  const list = Object.entries(map);

  rootEl.innerHTML = `
    <section class="page-hero"><h1>分类</h1><p>按主题维度聚合内容。</p></section>
    <section class="simple-grid" style="margin-top:16px;">
      ${list.map(([name, items]) => `
        <article class="item-card">
          <h4>${name}</h4>
          <p class="muted">共 ${items.length} 篇文章</p>
          <ul class="list">${items.slice(0, 3).map(i => `<li>${i.title}</li>`).join("")}</ul>
          <button class="btn" data-go-category="${name}">在搜索页查看</button>
        </article>
      `).join("")}
    </section>
  `;
  return {};
}

function renderTags(rootEl, posts) {
  const map = {};
  posts.forEach(p => p.tags.forEach(t => map[t] = (map[t] || 0) + 1));
  const list = Object.entries(map).sort((a, b) => b[1] - a[1]);

  rootEl.innerHTML = `
    <section class="page-hero"><h1>标签</h1><p>跨分类索引，支持多维探索。</p></section>
    <section class="panel" style="margin-top:16px;">
      <h3>标签云</h3>
      <div class="tag-cloud">
        ${list.map(([name, count]) => `<button class="tag-btn" data-go-tag="${name}">${name} · ${count}</button>`).join("")}
      </div>
    </section>
  `;
  return {};
}

function renderAbout(rootEl) {
  rootEl.innerHTML = `
    <section class="page-hero"><h1>关于</h1><p>沉浸式开场 + 内容路由体系 + 阅读体验优化。</p></section>
    <section class="about-grid" style="margin-top:16px;">
      <article class="panel">
        <h3>项目目标</h3>
        <p class="muted">将车企宣发风格交互与博客内容体系融合。</p>
        <ul class="list">
          <li>更真实的速度与风阻反馈</li>
          <li>更震撼的加速视觉（幻影/后坐/闪白）</li>
          <li>完整页面与搜索导航</li>
        </ul>
      </article>
      <article class="panel">
        <h3>技术栈</h3>
        <ul class="list">
          <li>Three.js 0.146</li>
          <li>History 路由（pushState/popstate）</li>
          <li>静态部署 + rewrite</li>
        </ul>
      </article>
    </section>
  `;
  return {};
}

function renderSearch(rootEl, posts, params) {
  const categories = unique(posts.map(p => p.category));
  const tags = unique(posts.flatMap(p => p.tags));

  const q0 = params.get("q") || "";
  const c0 = params.get("category") || "";
  const t0 = params.get("tag") || "";

  rootEl.innerHTML = `
    <section class="page-hero"><h1>搜索</h1><p>关键词 + 分类 + 标签组合筛选。</p></section>
    <section class="panel" style="margin-top:16px;">
      <div class="search-tools">
        <input id="searchInput" class="input" placeholder="输入标题 / 摘要 / 标签..." value="${q0}" />
        <select id="categorySelect" class="select">
          <option value="">全部分类</option>
          ${categories.map(c => `<option value="${c}" ${c === c0 ? "selected" : ""}>${c}</option>`).join("")}
        </select>
        <select id="tagSelect" class="select">
          <option value="">全部标签</option>
          ${tags.map(t => `<option value="${t}" ${t === t0 ? "selected" : ""}>${t}</option>`).join("")}
        </select>
        <button id="clearSearch" class="btn">清空</button>
      </div>
      <div id="searchCount" class="search-count"></div>
      <div id="searchResults" class="cards-grid"></div>
    </section>
  `;

  const input = rootEl.querySelector("#searchInput");
  const categorySelect = rootEl.querySelector("#categorySelect");
  const tagSelect = rootEl.querySelector("#tagSelect");
  const clearSearch = rootEl.querySelector("#clearSearch");
  const searchCount = rootEl.querySelector("#searchCount");
  const searchResults = rootEl.querySelector("#searchResults");

  function run() {
    const q = input.value.trim().toLowerCase();
    const c = categorySelect.value;
    const t = tagSelect.value;

    const list = posts.filter(p => {
      const text = `${p.title} ${p.excerpt} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
      return (!q || text.includes(q)) && (!c || p.category === c) && (!t || p.tags.includes(t));
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
  return {};
}

function makeArticleBody(post) {
  return `
    <p>本文以 <code>${post.title}</code> 为主题，演示详情页结构。</p>
    <h2>一、内容结构设计</h2>
    <p>导语/方法/实现/总结四段。</p>
    <h3>1.1 示例代码</h3>
    <pre><code>go('/post', { id: '${post.id}' })</code></pre>
    <h2>二、目录吸附与高亮</h2>
    <p>自动扫描 h2/h3 构建目录。</p>
  `;
}

function renderPost(rootEl, posts, params) {
  const id = params.get("id");
  const post = posts.find(p => p.id === id) || posts[0];
  const idx = posts.findIndex(p => p.id === post.id);
  const prev = idx > 0 ? posts[idx - 1] : null;
  const next = idx < posts.length - 1 ? posts[idx + 1] : null;

  rootEl.innerHTML = `
    <div class="panel" style="margin-bottom:12px;"><button class="btn" data-go-home>← 返回首页</button></div>
    <section class="post-layout">
      <article class="article">
        <div class="article-cover" style="background:${post.cover}"></div>
        <div class="article-inner">
          <h1 class="article-title">${post.title}</h1>
          <div class="article-meta">
            <span>${post.date}</span><span>·</span><span>${post.category}</span><span>·</span>
            <span>👁 ${post.views}</span><span>·</span><span>⏱ ${post.readTime}</span>
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

  const toc = rootEl.querySelector("#tocList");
  const headings = [...rootEl.querySelectorAll(".article-body h2, .article-body h3")];
  headings.forEach((h, i) => (h.id = `sec-${i + 1}`));

  toc.innerHTML = headings.map(h => `
    <li class="${h.tagName === "H3" ? "sub" : ""}">
      <a href="#${h.id}" data-toc-id="${h.id}">${h.textContent}</a>
    </li>
  `).join("");

  const links = [...toc.querySelectorAll("a")];
  links.forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById(a.dataset.tocId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  function syncToc() {
    if (!headings.length) return;
    let current = headings[0].id;
    for (const h of headings) {
      if (h.getBoundingClientRect().top <= 130) current = h.id;
      else break;
    }
    links.forEach(a => a.classList.toggle("active", a.dataset.tocId === current));
  }

  syncToc();
  return { sync: syncToc };
}

export function renderRoutePage({ path, params, rootEl, posts }) {
  if (!rootEl) return {};
  switch (path) {
    case "home": return renderHome(rootEl, posts);
    case "archive": return renderArchive(rootEl, posts);
    case "categories": return renderCategories(rootEl, posts);
    case "tags": return renderTags(rootEl, posts);
    case "about": return renderAbout(rootEl);
    case "search": return renderSearch(rootEl, posts, params);
    case "post": return renderPost(rootEl, posts, params);
    default: return renderHome(rootEl, posts);
  }
}