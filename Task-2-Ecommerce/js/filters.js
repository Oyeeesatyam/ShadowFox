// filters.js — filter state + query, sorting, chips, URL/sessionStorage sync
(function () {
  const SS_KEY = "nm_view_state_v1";
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  const defaultState = () => ({
    q: "",
    categories: [],
    brands: [],
    priceMin: 0,
    priceMax: 500,
    rating: 0,
    inStock: false,
    colors: [],
    sizes: [],
    sort: "featured",
    view: "grid",
    page: 1,
  });

  function loadState() {
    let s = defaultState();
    try {
      const saved = sessionStorage.getItem(SS_KEY);
      if (saved) Object.assign(s, JSON.parse(saved));
    } catch (_) {}
    // URL params override
    const p = new URLSearchParams(location.search);
    if (p.get("category")) s.categories = p.get("category").split(",").filter(Boolean);
    if (p.get("brand")) s.brands = p.get("brand").split(",").filter(Boolean);
    if (p.get("price")) {
      const [a, b] = p.get("price").split("-").map(Number);
      if (!isNaN(a)) s.priceMin = a;
      if (!isNaN(b)) s.priceMax = b;
    }
    if (p.get("rating")) s.rating = Number(p.get("rating")) || 0;
    if (p.get("stock") === "1") s.inStock = true;
    if (p.get("color")) s.colors = p.get("color").split(",").filter(Boolean);
    if (p.get("size")) s.sizes = p.get("size").split(",").filter(Boolean);
    if (p.get("sort")) s.sort = p.get("sort");
    if (p.get("q")) s.q = p.get("q");
    return s;
  }

  function saveState(s) {
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(s)); } catch (_) {}
    const p = new URLSearchParams();
    if (s.categories.length) p.set("category", s.categories.join(","));
    if (s.brands.length) p.set("brand", s.brands.join(","));
    if (s.priceMin !== 0 || s.priceMax !== 500) p.set("price", `${s.priceMin}-${s.priceMax}`);
    if (s.rating) p.set("rating", s.rating);
    if (s.inStock) p.set("stock", "1");
    if (s.colors.length) p.set("color", s.colors.join(","));
    if (s.sizes.length) p.set("size", s.sizes.join(","));
    if (s.sort !== "featured") p.set("sort", s.sort);
    if (s.q) p.set("q", s.q);
    const qs = p.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }

  function applyFilters(products, s, opts = {}) {
    return products.filter((p) => {
      if (s.q) {
        const q = s.q.toLowerCase();
        if (!(p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))) return false;
      }
      if (!opts.ignore || opts.ignore !== "category") {
        if (s.categories.length && !s.categories.includes(p.category)) return false;
      }
      if (!opts.ignore || opts.ignore !== "brand") {
        if (s.brands.length && !s.brands.includes(p.brand)) return false;
      }
      if (p.price < s.priceMin || p.price > s.priceMax) return false;
      if (s.rating && p.rating < s.rating) return false;
      if (s.inStock && !p.inStock) return false;
      if (s.colors.length && !p.colors.some((c) => s.colors.includes(c))) return false;
      if (s.sizes.length && !p.sizes.some((z) => s.sizes.includes(z))) return false;
      return true;
    });
  }

  function applySort(list, sort) {
    const arr = [...list];
    switch (sort) {
      case "price-asc": arr.sort((a, b) => a.price - b.price); break;
      case "price-desc": arr.sort((a, b) => b.price - a.price); break;
      case "rating": arr.sort((a, b) => b.rating - a.rating); break;
      case "newest": arr.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)); break;
      case "bestselling": arr.sort((a, b) => b.salesCount - a.salesCount); break;
      case "name": arr.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "featured":
      default:
        arr.sort((a, b) => (b.isFeatured - a.isFeatured) || (b.rating - a.rating));
    }
    return arr;
  }

  window.NM_FILTERS = { loadState, saveState, applyFilters, applySort, debounce };
})();
