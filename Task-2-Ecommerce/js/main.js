// main.js — PLP orchestration, header, drawers, product modal, toasts, theme
(function () {
  const { loadState, saveState, applyFilters, applySort, debounce } = window.NM_FILTERS;
  const Cart = window.NM_CART;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k, "");
      else if (v !== false && v != null) n.setAttribute(k, v);
    });
    kids.flat().forEach((k) => n.append(k?.nodeType ? k : document.createTextNode(k ?? "")));
    return n;
  };

  const PAGE_SIZE = 12;
  let state = loadState();

  // ---------- TOASTS ----------
  window.toast = (msg, type = "") => {
    const t = el("div", { class: "toast " + type }, msg);
    $("#toasts").append(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateX(120%)"; }, 2400);
    setTimeout(() => t.remove(), 2800);
  };

  // ---------- THEME ----------
  const savedTheme = localStorage.getItem("nm_theme");
  if (savedTheme === "dark") document.documentElement.setAttribute("data-theme", "dark");
  $("#themeToggle").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "" : "dark";
    if (next) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("nm_theme", next);
  });

  // ---------- STAR SVG ----------
  const starIcon = '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  const starRow = (r) => {
    const full = Math.round(r);
    return `<span class="stars">${starIcon.repeat(full)}</span>`;
  };

  // ---------- CATEGORY STRIP ----------
  function buildCatStrip() {
    const strip = $("#catStrip"); strip.innerHTML = "";
    const all = el("button", { onclick: () => { state.categories = []; state.page = 1; render(); } }, "All");
    if (!state.categories.length) all.classList.add("active");
    strip.append(all);
    window.CATEGORIES.forEach((c) => {
      const b = el("button", { onclick: () => {
        state.categories = state.categories.includes(c) ? state.categories.filter((x) => x !== c) : [...state.categories, c];
        state.page = 1; render();
      } }, c);
      if (state.categories.includes(c)) b.classList.add("active");
      strip.append(b);
    });
  }

  // ---------- FILTERS UI ----------
  let brandExpanded = false;
  function buildFilters() {
    // Category (with live counts)
    const cat = $("#fCategory"); cat.innerHTML = "";
    window.CATEGORIES.forEach((c) => {
      const count = applyFilters(window.PRODUCTS, { ...state, categories: [] }, {}).filter((p) => p.category === c).length;
      const id = "cat_" + c.replace(/\s+/g, "");
      cat.append(el("label", {},
        el("input", { type: "checkbox", id, checked: state.categories.includes(c), onchange: (e) => {
          state.categories = e.target.checked ? [...state.categories, c] : state.categories.filter((x) => x !== c);
          state.page = 1; render();
        }}),
        el("span", {}, c),
        el("span", { class: "count" }, `(${count})`)
      ));
    });

    // Price
    const min = $("#priceMin"), max = $("#priceMax"), minN = $("#priceMinNum"), maxN = $("#priceMaxNum"), fill = $("#rangeFill");
    min.value = state.priceMin; max.value = state.priceMax; minN.value = state.priceMin; maxN.value = state.priceMax;
    const updateFill = () => {
      const lo = Number(min.value), hi = Number(max.value);
      fill.style.left = (lo / 500 * 100) + "%";
      fill.style.right = (100 - hi / 500 * 100) + "%";
    };
    updateFill();
    const debouncedRender = debounce(render, 200);
    [min, max].forEach((inp) => inp.oninput = () => {
      let lo = Number(min.value), hi = Number(max.value);
      if (lo > hi - 5) { if (inp === min) lo = hi - 5, min.value = lo; else hi = lo + 5, max.value = hi; }
      state.priceMin = lo; state.priceMax = hi;
      minN.value = lo; maxN.value = hi;
      updateFill(); debouncedRender();
    });
    [minN, maxN].forEach((inp) => inp.onchange = () => {
      state.priceMin = Math.max(0, Math.min(500, Number(minN.value)));
      state.priceMax = Math.max(state.priceMin + 5, Math.min(500, Number(maxN.value)));
      min.value = state.priceMin; max.value = state.priceMax;
      updateFill(); render();
    });

    // Rating
    const rr = $("#fRating"); rr.innerHTML = "";
    [4, 3, 2].forEach((n) => {
      rr.append(el("label", {},
        el("input", { type: "radio", name: "rating", checked: state.rating === n, onchange: () => { state.rating = n; state.page = 1; render(); } }),
        el("span", { html: starRow(n) }),
        el("span", {}, `${n} & up`)
      ));
    });
    rr.append(el("label", {},
      el("input", { type: "radio", name: "rating", checked: state.rating === 0, onchange: () => { state.rating = 0; state.page = 1; render(); } }),
      el("span", {}, "Any rating")
    ));

    // Brand (with counts + show more)
    const br = $("#fBrand"); br.innerHTML = "";
    const brandsWithCount = window.BRANDS.map((b) => ({
      b, c: applyFilters(window.PRODUCTS, { ...state, brands: [] }, {}).filter((p) => p.brand === b).length
    })).filter((x) => x.c > 0).sort((a, b) => b.c - a.c);
    const shown = brandExpanded ? brandsWithCount : brandsWithCount.slice(0, 6);
    shown.forEach(({ b, c }) => {
      br.append(el("label", {},
        el("input", { type: "checkbox", checked: state.brands.includes(b), onchange: (e) => {
          state.brands = e.target.checked ? [...state.brands, b] : state.brands.filter((x) => x !== b);
          state.page = 1; render();
        }}),
        el("span", {}, b),
        el("span", { class: "count" }, `(${c})`)
      ));
    });
    const btn = $("#brandMore");
    btn.hidden = brandsWithCount.length <= 6;
    btn.textContent = brandExpanded ? "Show less" : `Show ${brandsWithCount.length - 6} more`;
    btn.onclick = () => { brandExpanded = !brandExpanded; buildFilters(); };

    // Colors
    const cs = $("#fColor"); cs.innerHTML = "";
    window.ALL_COLORS.forEach((c) => {
      const sw = el("button", { class: "swatch" + (state.colors.includes(c) ? " active" : ""), style: `background:${c}`, "aria-label": `Color ${c}`, onclick: () => {
        state.colors = state.colors.includes(c) ? state.colors.filter((x) => x !== c) : [...state.colors, c];
        state.page = 1; render();
      }});
      cs.append(sw);
    });

    // Sizes
    const sz = $("#fSize"); sz.innerHTML = "";
    window.ALL_SIZES.forEach((s) => {
      const p = el("button", { class: "pill" + (state.sizes.includes(s) ? " active" : ""), onclick: () => {
        state.sizes = state.sizes.includes(s) ? state.sizes.filter((x) => x !== s) : [...state.sizes, s];
        state.page = 1; render();
      }}, s);
      sz.append(p);
    });

    // Stock
    const stock = $("#fStock");
    stock.checked = state.inStock;
    stock.onchange = () => { state.inStock = stock.checked; state.page = 1; render(); };
  }

  // ---------- CHIPS ----------
  function buildChips() {
    const wrap = $("#activeChips"); wrap.innerHTML = "";
    const add = (label, onRm) => wrap.append(el("div", { class: "chip" }, label, el("button", { onclick: onRm, "aria-label": `Remove ${label}` }, el("i", { "data-lucide": "x" }))));
    state.categories.forEach((c) => add(`Category: ${c}`, () => { state.categories = state.categories.filter((x) => x !== c); render(); }));
    state.brands.forEach((b) => add(`Brand: ${b}`, () => { state.brands = state.brands.filter((x) => x !== b); render(); }));
    if (state.priceMin !== 0 || state.priceMax !== 500) add(`Price: $${state.priceMin}–$${state.priceMax}`, () => { state.priceMin = 0; state.priceMax = 500; render(); });
    if (state.rating) add(`${state.rating}★ & up`, () => { state.rating = 0; render(); });
    if (state.inStock) add("In stock", () => { state.inStock = false; render(); });
    state.colors.forEach((c) => add(`Color`, () => { state.colors = state.colors.filter((x) => x !== c); render(); }));
    state.sizes.forEach((s) => add(`Size: ${s}`, () => { state.sizes = state.sizes.filter((x) => x !== s); render(); }));
    if (state.q) add(`Search: "${state.q}"`, () => { state.q = ""; $("#searchInput").value = ""; render(); });
    window.lucide?.createIcons();
  }

  // ---------- GRID ----------
  function productCard(p) {
    const off = p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    const card = el("div", { class: "card", onclick: (e) => { if (e.target.closest("button")) return; openProduct(p); }, "data-id": p.id });
    const media = el("div", { class: "card-media" });
    media.append(el("img", { src: p.image, alt: p.name, loading: "lazy" }));
    const badges = el("div", { class: "card-badges" });
    if (p.isNew) badges.append(el("span", { class: "bd bd-new" }, "New"));
    if (off) badges.append(el("span", { class: "bd bd-sale" }, "-" + off + "%"));
    if (p.isFeatured) badges.append(el("span", { class: "bd bd-feat" }, "Featured"));
    media.append(badges);
    const wish = el("button", { class: "wish-btn" + (Cart.inWish(p.id) ? " active" : ""), "aria-label": "Toggle wishlist", onclick: (e) => {
      e.stopPropagation();
      const added = Cart.toggleWish(p.id);
      wish.classList.toggle("active", added);
      window.toast(added ? "Added to wishlist" : "Removed from wishlist");
    }}, el("i", { "data-lucide": "heart" }));
    media.append(wish);
    card.append(media);

    const body = el("div", { class: "card-body" });
    body.append(el("div", { class: "card-brand" }, p.brand));
    body.append(el("div", { class: "card-name" }, p.name));
    body.append(el("div", { class: "card-desc" }, p.description));
    body.append(el("div", { class: "card-rating", html: starRow(p.rating) + `<span>${p.rating.toFixed(1)} · ${p.reviewCount.toLocaleString()}</span>` }));
    const price = el("div", { class: "card-price" }, el("span", { class: "now" }, "$" + p.price));
    if (p.originalPrice > p.price) price.append(el("span", { class: "was" }, "$" + p.originalPrice), el("span", { class: "off" }, off + "% off"));
    body.append(price);
    const add = el("button", { class: "card-add", onclick: (e) => {
      e.stopPropagation();
      if (!p.inStock) return window.toast("Out of stock", "error");
      Cart.add(p.id);
      add.classList.add("pulse"); setTimeout(() => add.classList.remove("pulse"), 500);
      window.toast("Added to cart", "success");
    }}, p.inStock ? "Add to cart" : "Out of stock");
    body.append(add);
    card.append(body);
    return card;
  }

  function render() {
    saveState(state);
    buildCatStrip();
    buildFilters();
    buildChips();
    const filtered = applyFilters(window.PRODUCTS, state);
    const sorted = applySort(filtered, state.sort);
    $("#resultCount").textContent = `Showing ${Math.min(state.page * PAGE_SIZE, sorted.length)} of ${sorted.length} product${sorted.length === 1 ? "" : "s"}`;
    const grid = $("#productGrid"); grid.innerHTML = "";
    grid.classList.toggle("list-view", state.view === "list");
    const visible = sorted.slice(0, state.page * PAGE_SIZE);
    visible.forEach((p) => grid.append(productCard(p)));
    $("#emptyState").hidden = sorted.length > 0;
    $("#loadMore").hidden = visible.length >= sorted.length;
    $("#cartCount").textContent = Cart.count();
    $("#wishlistCount").textContent = Cart.state.wish.length;
    $("#sortSelect").value = state.sort;
    $$(".view-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.view === state.view));
    window.lucide?.createIcons();
  }

  // ---------- SKELETON ----------
  function renderSkeletons() {
    const grid = $("#productGrid"); grid.innerHTML = "";
    for (let i = 0; i < 8; i++) grid.append(el("div", { class: "skeleton skel-card" }));
  }

  // ---------- SEARCH ----------
  $("#searchInput").addEventListener("input", debounce((e) => {
    state.q = e.target.value; state.page = 1; render();
    const sug = $("#searchSuggest");
    if (!state.q) { sug.hidden = true; return; }
    const matches = window.PRODUCTS.filter((p) => p.name.toLowerCase().includes(state.q.toLowerCase())).slice(0, 5);
    sug.innerHTML = "";
    matches.forEach((p) => sug.append(el("button", { onclick: () => { sug.hidden = true; openProduct(p); } },
      el("img", { src: p.image, alt: "" }),
      el("div", {}, el("div", { style: "font-weight:600;font-size:14px;" }, p.name), el("div", { style: "font-size:12px;color:var(--muted);" }, p.brand + " · $" + p.price))
    )));
    sug.hidden = matches.length === 0;
  }, 150));
  document.addEventListener("click", (e) => { if (!e.target.closest(".search-wrap")) $("#searchSuggest").hidden = true; });

  // ---------- SORT / VIEW ----------
  $("#sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $$(".view-toggle button").forEach((b) => b.addEventListener("click", () => { state.view = b.dataset.view; render(); }));

  // ---------- CLEAR / EMPTY ----------
  const clear = () => { state = { ...state, categories: [], brands: [], priceMin: 0, priceMax: 500, rating: 0, inStock: false, colors: [], sizes: [], q: "", page: 1 }; $("#searchInput").value = ""; render(); };
  $("#clearAll").addEventListener("click", clear);
  $("#emptyClear").addEventListener("click", clear);
  $("#loadMore").addEventListener("click", () => { state.page++; render(); });

  // ---------- FILTER TOGGLE (MOBILE) ----------
  $("#filterToggle").addEventListener("click", () => $("#filtersPanel").classList.toggle("open"));

  // ---------- PRODUCT MODAL ----------
  function openProduct(p) {
    const body = $("#productModalBody"); body.innerHTML = "";
    let selColor = p.colors[0] || null, selSize = p.sizes[0] || null, qty = 1;
    const pd = el("div", { class: "pd" });
    pd.append(el("div", { class: "pd-media" }, el("img", { src: p.image, alt: p.name })));

    const info = el("div", { class: "pd-body" });
    info.append(el("div", { class: "pd-brand" }, p.brand));
    info.append(el("h2", { class: "pd-name" }, p.name));
    info.append(el("div", { class: "card-rating", html: starRow(p.rating) + `<span>${p.rating.toFixed(1)} · ${p.reviewCount.toLocaleString()} reviews</span>` }));
    const price = el("div", { class: "pd-price" }, el("span", { class: "now" }, "$" + p.price));
    if (p.originalPrice > p.price) price.append(el("span", { class: "was" }, "$" + p.originalPrice));
    info.append(price);
    info.append(el("p", { class: "muted" }, p.description));

    if (p.colors.length) {
      const sec = el("div", { class: "pd-section" }, el("h4", {}, "Color"));
      const sw = el("div", { class: "swatches" });
      p.colors.forEach((c) => {
        const b = el("button", { class: "swatch" + (c === selColor ? " active" : ""), style: `background:${c}`, "aria-label": c, onclick: () => { selColor = c; sw.querySelectorAll(".swatch").forEach((x, i) => x.classList.toggle("active", p.colors[i] === c)); } });
        sw.append(b);
      });
      sec.append(sw); info.append(sec);
    }
    if (p.sizes.length) {
      const sec = el("div", { class: "pd-section" }, el("h4", {}, "Size"));
      const pl = el("div", { class: "pills" });
      p.sizes.forEach((s) => {
        const b = el("button", { class: "pill" + (s === selSize ? " active" : ""), onclick: () => { selSize = s; pl.querySelectorAll(".pill").forEach((x, i) => x.classList.toggle("active", p.sizes[i] === s)); } }, s);
        pl.append(b);
      });
      sec.append(pl); info.append(sec);
    }

    const qtyRow = el("div", { class: "pd-section" }, el("h4", {}, "Quantity"));
    const qtyCtl = el("div", { class: "qty" },
      el("button", { onclick: () => { if (qty > 1) { qty--; qLabel.textContent = qty; } } }, "−"),
      (function () { const s = el("span", {}, String(qty)); window.__q = s; return s; })(),
      el("button", { onclick: () => { qty++; qLabel.textContent = qty; } }, "+")
    );
    const qLabel = qtyCtl.querySelector("span");
    qtyRow.append(qtyCtl); info.append(qtyRow);

    const actions = el("div", { class: "pd-actions" },
      el("button", { class: "btn btn-primary", onclick: () => {
        if (!p.inStock) return window.toast("Out of stock", "error");
        Cart.add(p.id, { qty, color: selColor, size: selSize });
        window.toast("Added to cart", "success");
        closeModal();
      }}, p.inStock ? "Add to cart" : "Out of stock"),
      el("button", { class: "btn btn-ghost", onclick: () => {
        const added = Cart.toggleWish(p.id);
        window.toast(added ? "Added to wishlist" : "Removed from wishlist");
      }}, "♡ Wishlist")
    );
    info.append(actions);
    pd.append(info); body.append(pd);

    // Related
    const related = window.PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 6);
    if (related.length) {
      const rel = el("div", { class: "related" }, el("h4", {}, "You may also like"));
      const scroll = el("div", { class: "related-scroll" });
      related.forEach((r) => scroll.append(productCard(r)));
      rel.append(scroll); body.append(rel);
    }

    $("#productModal").hidden = false;
    document.body.style.overflow = "hidden";
    window.lucide?.createIcons();
  }
  function closeModal() { $("#productModal").hidden = true; document.body.style.overflow = ""; }
  $("#productModal").addEventListener("click", (e) => { if (e.target.matches("[data-close]") || e.target.closest("[data-close]")) closeModal(); });

  // ---------- DRAWERS ----------
  function openDrawer(id) { $(id).hidden = false; document.body.style.overflow = "hidden"; renderDrawers(); }
  function closeDrawer(id) { $(id).hidden = true; document.body.style.overflow = ""; }
  $("#cartBtn").addEventListener("click", () => openDrawer("#cartDrawer"));
  $("#wishlistBtn").addEventListener("click", () => openDrawer("#wishDrawer"));
  document.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]") || e.target.closest("[data-close]")) {
      const d = e.target.closest(".drawer"); if (d) closeDrawer("#" + d.id);
    }
  });

  function renderDrawers() {
    // cart
    const c = $("#cartLines"); c.innerHTML = "";
    if (!Cart.state.cart.length) {
      c.append(el("div", { class: "drawer-empty", html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><div>Your cart is empty</div>' }));
    } else {
      Cart.state.cart.forEach((l, i) => {
        const p = window.PRODUCTS.find((x) => x.id === l.id); if (!p) return;
        c.append(el("div", { class: "cart-line" },
          el("img", { src: p.image, alt: "" }),
          el("div", { class: "info" },
            el("div", { class: "n" }, p.name),
            el("div", { class: "v" }, `${p.brand}${l.size ? " · " + l.size : ""}`),
            el("div", { class: "row" },
              el("div", { class: "qty" },
                el("button", { onclick: () => { Cart.setQty(i, l.qty - 1); } }, "−"),
                el("span", {}, String(l.qty)),
                el("button", { onclick: () => { Cart.setQty(i, l.qty + 1); } }, "+")
              ),
              el("button", { class: "rm", onclick: () => Cart.remove(i) }, "Remove")
            )
          ),
          el("div", { class: "p" }, "$" + (p.price * l.qty).toFixed(2))
        ));
      });
    }
    $("#cartSubtotal").textContent = "$" + Cart.subtotal().toFixed(2);
    $("#goCheckout").disabled = !Cart.state.cart.length;

    // wishlist
    const w = $("#wishLines"); w.innerHTML = "";
    if (!Cart.state.wish.length) {
      w.append(el("div", { class: "drawer-empty", html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><div>Your wishlist is empty</div>' }));
    } else {
      Cart.state.wish.forEach((id) => {
        const p = window.PRODUCTS.find((x) => x.id === id); if (!p) return;
        w.append(el("div", { class: "cart-line" },
          el("img", { src: p.image, alt: "" }),
          el("div", { class: "info" }, el("div", { class: "n" }, p.name), el("div", { class: "v" }, "$" + p.price),
            el("div", { class: "row" },
              el("button", { class: "link", onclick: () => { Cart.add(id); window.toast("Added to cart", "success"); } }, "Add to cart"),
              el("button", { class: "rm", onclick: () => { Cart.toggleWish(id); } }, "Remove")
            )
          )
        ));
      });
    }
    window.lucide?.createIcons();
  }

  $("#goCheckout").addEventListener("click", () => { closeDrawer("#cartDrawer"); window.NM_CHECKOUT.open(); });

  Cart.on(() => {
    render();
    if (!$("#cartDrawer").hidden || !$("#wishDrawer").hidden) renderDrawers();
    if (!$("#checkout").hidden) window.NM_CHECKOUT.renderSummary();
  });

  // ---------- INIT ----------
  document.addEventListener("DOMContentLoaded", () => {
    window.lucide?.createIcons();
    renderSkeletons();
    // simulated fetch delay so skeletons are visible
    setTimeout(() => { render(); }, 500);
  });
})();
