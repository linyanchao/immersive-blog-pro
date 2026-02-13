/*
 * @Author: linyc
 * @Date: 2026-02-13 13:45:43
 * @LastEditTime: 2026-02-13 13:45:44
 * @LastEditors: linyc
 * @Description: 
 */
export function createHistoryRouter(onChange) {
  function parse() {
    const p = location.pathname.replace(/\/+$/, "") || "/";
    const params = new URLSearchParams(location.search);

    if (p === "/") return { path: "home", params };
    if (p === "/archive") return { path: "archive", params };
    if (p === "/categories") return { path: "categories", params };
    if (p === "/tags") return { path: "tags", params };
    if (p === "/about") return { path: "about", params };
    if (p === "/search") return { path: "search", params };
    if (p === "/post") return { path: "post", params };
    return { path: "home", params };
  }

  function go(path, params = {}, replace = false) {
    const url = new URL(location.origin + path);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
    const final = url.pathname + (url.search || "");
    if (replace) history.replaceState({}, "", final);
    else history.pushState({}, "", final);
    onChange();
  }

  window.addEventListener("popstate", onChange);
  return { parse, go };
}

export function setActiveNav(navEl, route) {
  if (!navEl) return;
  navEl.querySelectorAll("a[data-route]").forEach(a => a.classList.remove("active"));
  const active = navEl.querySelector(`a[data-route="${route}"]`);
  if (active) active.classList.add("active");
}