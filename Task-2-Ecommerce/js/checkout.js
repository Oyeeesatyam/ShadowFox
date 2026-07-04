// checkout.js — multi-step checkout with validation, state preservation, review/edit
(function () {
  const Cart = window.NM_CART;
  const $ = (s, r = document) => r.querySelector(s);
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

  const co = {
    step: 1,
    data: {
      ship: { firstName: "", lastName: "", email: "", phone: "", address: "", city: "", zip: "", country: "United States", saveAddr: false, sameBilling: true },
      payment: { method: "card", cardNumber: "", expiry: "", cvv: "", nameOnCard: "" },
      promo: { code: "", discount: 0, msg: "" },
      terms: false,
    },
    submitted: false,
  };

  function money(n) { return "$" + n.toFixed(2); }

  function computeTotals() {
    const sub = Cart.subtotal();
    const discount = co.data.promo.discount ? sub * co.data.promo.discount : 0;
    const shipping = sub > 0 ? (sub > 75 ? 0 : 7.99) : 0;
    const tax = (sub - discount) * 0.08;
    const total = Math.max(0, sub - discount + shipping + tax);
    return { sub, discount, shipping, tax, total };
  }

  function renderSummary() {
    const body = $("#summaryBody"); if (!body) return;
    const t = computeTotals();
    body.innerHTML = "";
    const lines = el("div", { class: "summary-lines" });
    Cart.state.cart.forEach((l) => {
      const p = window.PRODUCTS.find((x) => x.id === l.id); if (!p) return;
      lines.append(el("div", { class: "cart-line" },
        el("img", { src: p.image, alt: "" }),
        el("div", { class: "info" },
          el("div", { class: "n" }, p.name),
          el("div", { class: "v" }, `Qty ${l.qty}${l.color ? " · " + colorName(l.color) : ""}${l.size ? " · " + l.size : ""}`),
        ),
        el("div", { class: "p" }, money(p.price * l.qty))
      ));
    });
    body.append(lines);

    if (co.step <= 1) {
      const promo = el("div", { class: "promo" },
        el("input", { placeholder: "Promo code", id: "promoInput", value: co.data.promo.code }),
        el("button", { onclick: applyPromo }, "Apply")
      );
      body.append(promo);
      if (co.data.promo.msg) body.append(el("div", { class: "promo-msg " + (co.data.promo.discount ? "ok" : "err") }, co.data.promo.msg));
    }

    body.append(row("Subtotal", money(t.sub)));
    if (t.discount) body.append(row("Discount", "−" + money(t.discount)));
    body.append(row("Shipping", t.shipping === 0 ? "Free" : money(t.shipping)));
    body.append(row("Tax (est.)", money(t.tax)));
    body.append(el("div", { class: "line total" }, el("span", {}, "Total"), el("span", {}, money(t.total))));
  }
  function row(a, b) { return el("div", { class: "line" }, el("span", {}, a), el("span", {}, b)); }
  function colorName(hex) { return hex; }

  function applyPromo() {
    const v = $("#promoInput").value.trim().toUpperCase();
    co.data.promo.code = v;
    if (v === "SAVE10") { co.data.promo.discount = 0.1; co.data.promo.msg = "Code applied — 10% off"; window.toast("Promo code applied!", "success"); }
    else if (!v) { co.data.promo.discount = 0; co.data.promo.msg = ""; }
    else { co.data.promo.discount = 0; co.data.promo.msg = "Invalid promo code"; }
    renderSummary();
  }

  function setStep(n) {
    if (n < 1 || n > 5) return;
    co.step = n;
    const body = $("#stepBody"); body.innerHTML = "";
    body.append(el("div", { class: "step-loading" }, el("span", { class: "spinner" })));
    updateStepper();
    setTimeout(() => renderStep(), 220);
  }

  function updateStepper() {
    const items = document.querySelectorAll("#stepper li");
    items.forEach((li) => {
      const n = Number(li.dataset.step);
      li.classList.toggle("active", n === co.step);
      li.classList.toggle("done", n < co.step);
    });
  }

  function renderStep() {
    const body = $("#stepBody"); body.innerHTML = "";
    if (co.step === 1) renderCartStep(body);
    else if (co.step === 2) renderShippingStep(body);
    else if (co.step === 3) renderPaymentStep(body);
    else if (co.step === 4) renderReviewStep(body);
    else if (co.step === 5) renderDoneStep(body);
    renderSummary();
    window.lucide?.createIcons();
    body.scrollTop = 0;
  }

  // ============ STEP 1: Cart Review ============
  function renderCartStep(body) {
    body.append(el("h2", { class: "step-title" }, "Your cart"),
      el("p", { class: "step-sub" }, "Review your items and apply a promo code."));

    if (!Cart.state.cart.length) {
      body.append(el("div", { class: "empty", style: "margin: 20px 0;" },
        el("h3", {}, "Your cart is empty"),
        el("p", {}, "Add something delightful before checking out.")
      ));
    } else {
      Cart.state.cart.forEach((l, i) => {
        const p = window.PRODUCTS.find((x) => x.id === l.id); if (!p) return;
        const line = el("div", { class: "cart-line" },
          el("img", { src: p.image, alt: p.name }),
          el("div", { class: "info" },
            el("div", { class: "n" }, p.name),
            el("div", { class: "v" }, `${p.brand}${l.color ? " · " + l.color : ""}${l.size ? " · " + l.size : ""}`),
            (function () {
              const qty = el("div", { class: "qty" },
                el("button", { onclick: () => { Cart.setQty(i, l.qty - 1); renderStep(); } }, "−"),
                el("span", {}, String(l.qty)),
                el("button", { onclick: () => { Cart.setQty(i, l.qty + 1); renderStep(); } }, "+")
              );
              const row = el("div", { class: "row" }, qty,
                el("button", { class: "rm", onclick: () => { Cart.saveForLater(i); renderStep(); window.toast("Saved for later"); } }, "Save for later"),
                el("button", { class: "rm", onclick: () => { Cart.remove(i); renderStep(); } }, "Remove")
              );
              return row;
            })()
          ),
          el("div", { class: "p" }, money(p.price * l.qty))
        );
        body.append(line);
      });
    }

    if (Cart.state.saved.length) {
      body.append(el("h3", { style: "margin-top: 32px; font-size: 16px;" }, "Saved for later"));
      Cart.state.saved.forEach((l, i) => {
        const p = window.PRODUCTS.find((x) => x.id === l.id); if (!p) return;
        body.append(el("div", { class: "cart-line" },
          el("img", { src: p.image, alt: "" }),
          el("div", { class: "info" }, el("div", { class: "n" }, p.name), el("div", { class: "v" }, `Qty ${l.qty}`)),
          el("button", { class: "link", onclick: () => { Cart.moveToCart(i); renderStep(); } }, "Move to cart")
        ));
      });
    }

    body.append(el("div", { class: "step-actions" },
      el("button", { class: "btn btn-ghost", onclick: () => window.closeCheckout() }, "Continue shopping"),
      el("button", { class: "btn btn-primary", onclick: () => { if (!Cart.state.cart.length) return window.toast("Cart is empty", "error"); setStep(2); } }, "Continue to shipping")
    ));
  }

  // ============ STEP 2: Shipping ============
  function validators() {
    return {
      firstName: (v) => v.trim().length >= 2 || "Enter your first name",
      lastName: (v) => v.trim().length >= 2 || "Enter your last name",
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Enter a valid email",
      phone: (v) => v.replace(/\D/g, "").length >= 10 || "Enter a 10-digit phone number",
      address: (v) => v.trim().length >= 5 || "Enter your street address",
      city: (v) => v.trim().length >= 2 || "Enter your city",
      zip: (v) => /^[A-Za-z0-9\- ]{3,10}$/.test(v.trim()) || "Enter a valid ZIP / postcode",
      country: (v) => v.trim().length >= 2 || "Select a country",
    };
  }
  function formatPhone(v) {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  }
  function makeField(name, label, opts = {}) {
    const wrap = el("div", { class: "field" + (opts.full ? " full" : "") });
    const input = el("input", { id: `f_${name}`, type: opts.type || "text", placeholder: opts.placeholder || "", value: co.data.ship[name] || "" });
    const err = el("div", { class: "err" });
    const icon = el("span", { class: "status-icon", html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' });
    const run = () => {
      let val = input.value;
      if (name === "phone") { val = formatPhone(val); input.value = val; }
      co.data.ship[name] = val;
      const v = validators()[name](val);
      wrap.classList.remove("valid", "invalid");
      if (val.length === 0) { err.textContent = ""; return true; }
      if (v === true) { wrap.classList.add("valid"); err.textContent = ""; return true; }
      wrap.classList.add("invalid"); err.textContent = v; return false;
    };
    input.addEventListener("input", run);
    input.addEventListener("blur", run);
    wrap.append(el("label", { for: `f_${name}` }, label), input, icon, err);
    if (co.data.ship[name]) run();
    return wrap;
  }

  function renderShippingStep(body) {
    body.append(el("h2", { class: "step-title" }, "Shipping information"),
      el("p", { class: "step-sub" }, "Where should we send your order?"));

    if (Cart.state.addresses.length) {
      const sel = el("select", { class: "field", onchange: (e) => {
        const idx = Number(e.target.value); if (isNaN(idx)) return;
        Object.assign(co.data.ship, Cart.state.addresses[idx]);
        renderStep();
      }},
        el("option", { value: "" }, "— Select a saved address —"),
        ...Cart.state.addresses.map((a, i) => el("option", { value: i }, `${a.firstName} ${a.lastName} · ${a.address}, ${a.city}`))
      );
      const wrap = el("div", { class: "field", style: "margin-bottom: 16px;" }, el("label", {}, "Use a saved address"), sel);
      body.append(wrap);
    }

    const grid = el("div", { class: "form-grid" },
      makeField("firstName", "First name"),
      makeField("lastName", "Last name"),
      makeField("email", "Email", { type: "email" }),
      makeField("phone", "Phone", { placeholder: "(555) 123-4567" }),
      (() => { const f = makeField("address", "Street address", { full: true }); f.classList.add("full"); return f; })(),
      makeField("city", "City"),
      makeField("zip", "ZIP / Postcode"),
      (() => {
        const wrap = el("div", { class: "field full" });
        wrap.append(el("label", { for: "f_country" }, "Country"));
        const sel = el("select", { id: "f_country", onchange: (e) => { co.data.ship.country = e.target.value; } });
        ["United States","Canada","United Kingdom","Australia","India","Germany","France","Japan"].forEach((c) => {
          const opt = el("option", { value: c }, c);
          if (c === co.data.ship.country) opt.selected = true;
          sel.append(opt);
        });
        wrap.append(sel, el("div", { class: "err" }));
        return wrap;
      })()
    );
    body.append(grid);

    body.append(el("label", { class: "save-addr-row", style: "margin-top: 14px;" },
      el("input", { type: "checkbox", checked: co.data.ship.sameBilling, onchange: (e) => co.data.ship.sameBilling = e.target.checked }),
      el("span", {}, "Billing address is the same as shipping")
    ));
    body.append(el("label", { class: "save-addr-row", style: "margin-top: 8px;" },
      el("input", { type: "checkbox", checked: co.data.ship.saveAddr, onchange: (e) => co.data.ship.saveAddr = e.target.checked }),
      el("span", {}, "Save this address for next time")
    ));

    body.append(el("div", { class: "step-actions" },
      el("button", { class: "btn btn-ghost", onclick: () => setStep(1) }, "← Back to cart"),
      el("button", { class: "btn btn-primary", onclick: () => {
        const V = validators();
        let ok = true;
        Object.keys(V).forEach((k) => {
          const val = co.data.ship[k] || "";
          const res = V[k](val);
          if (res !== true) ok = false;
        });
        if (!ok) { renderStep(); return window.toast("Please fix the highlighted fields", "error"); }
        if (co.data.ship.saveAddr) Cart.addAddress({ ...co.data.ship });
        setStep(3);
      }}, "Continue to payment")
    ));
  }

  // ============ STEP 3: Payment ============
  function renderPaymentStep(body) {
    body.append(el("h2", { class: "step-title" }, "Payment"),
      el("p", { class: "step-sub" }, "This is a demo checkout — do not enter real card details."));

    const methods = [
      { id: "card", label: "Credit / Debit Card", icon: "credit-card" },
      { id: "upi", label: "UPI", icon: "smartphone" },
      { id: "cod", label: "Cash on Delivery", icon: "banknote" },
    ];
    const wrap = el("div", { class: "pay-methods" });
    methods.forEach((m) => {
      const card = el("label", { class: "pay-card" + (co.data.payment.method === m.id ? " active" : "") },
        el("input", { type: "radio", name: "pm", value: m.id, checked: co.data.payment.method === m.id, onchange: () => { co.data.payment.method = m.id; renderStep(); } }),
        el("i", { "data-lucide": m.icon }),
        el("span", {}, m.label)
      );
      wrap.append(card);
    });
    body.append(wrap);

    if (co.data.payment.method === "card") {
      const grid = el("div", { class: "form-grid", style: "margin-top: 20px;" });
      grid.append(
        cardField("nameOnCard", "Name on card", { full: true }),
        cardField("cardNumber", "Card number (demo)", { full: true, mask: "card" }),
        cardField("expiry", "Expiry (MM/YY)", { mask: "expiry" }),
        cardField("cvv", "CVV", { mask: "cvv" })
      );
      body.append(grid);
    }

    body.append(el("div", { class: "trust" },
      el("i", { "data-lucide": "lock-keyhole" }),
      el("span", {}, "Secure checkout · Your info is encrypted in transit (demo)")
    ));

    body.append(el("div", { class: "step-actions" },
      el("button", { class: "btn btn-ghost", onclick: () => setStep(2) }, "← Back"),
      el("button", { class: "btn btn-primary", onclick: () => {
        if (co.data.payment.method === "card") {
          const c = co.data.payment;
          if (c.nameOnCard.trim().length < 2 || c.cardNumber.replace(/\s/g, "").length < 13 || !/^\d{2}\/\d{2}$/.test(c.expiry) || !/^\d{3,4}$/.test(c.cvv)) {
            return window.toast("Please complete demo card fields", "error");
          }
        }
        setStep(4);
      }}, "Review order")
    ));
  }
  function cardField(name, label, opts = {}) {
    const wrap = el("div", { class: "field" + (opts.full ? " full" : "") });
    const input = el("input", { id: `pf_${name}`, value: co.data.payment[name] || "", placeholder: label });
    input.addEventListener("input", () => {
      let v = input.value;
      if (opts.mask === "card") v = v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
      if (opts.mask === "expiry") { v = v.replace(/\D/g, "").slice(0, 4); if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2); }
      if (opts.mask === "cvv") v = v.replace(/\D/g, "").slice(0, 4);
      input.value = v; co.data.payment[name] = v;
    });
    wrap.append(el("label", { for: `pf_${name}` }, label), input, el("div", { class: "err" }));
    return wrap;
  }

  // ============ STEP 4: Review ============
  function renderReviewStep(body) {
    body.append(el("h2", { class: "step-title" }, "Review your order"),
      el("p", { class: "step-sub" }, "Double-check everything before placing your order."));

    const s = co.data.ship;
    const sec = (title, editStep, content) => {
      const box = el("div", { class: "review-section" },
        el("div", { class: "head" },
          el("h4", {}, title),
          el("button", { class: "link", onclick: () => setStep(editStep) }, "Edit")
        ),
        content
      );
      return box;
    };
    body.append(sec("Shipping to", 2,
      el("div", {}, `${s.firstName} ${s.lastName}`, el("br"), s.address, el("br"), `${s.city}, ${s.zip}`, el("br"), s.country, el("br"), s.email, " · ", s.phone)
    ));

    let payText = "Cash on Delivery";
    if (co.data.payment.method === "card") payText = "Card ending in " + (co.data.payment.cardNumber.replace(/\s/g, "").slice(-4) || "••••");
    if (co.data.payment.method === "upi") payText = "UPI";
    body.append(sec("Payment method", 3, el("div", {}, payText)));

    const items = el("div", {});
    Cart.state.cart.forEach((l) => {
      const p = window.PRODUCTS.find((x) => x.id === l.id); if (!p) return;
      items.append(el("div", { class: "cart-line" },
        el("img", { src: p.image, alt: "" }),
        el("div", { class: "info" }, el("div", { class: "n" }, p.name), el("div", { class: "v" }, `Qty ${l.qty}`)),
        el("div", { class: "p" }, money(p.price * l.qty))
      ));
    });
    body.append(sec("Items", 1, items));

    const terms = el("label", { class: "terms" },
      el("input", { type: "checkbox", id: "termsChk", checked: co.data.terms, onchange: (e) => { co.data.terms = e.target.checked; $("#placeBtn").disabled = !e.target.checked || co.submitted; } }),
      el("span", {}, "I agree to the Terms of Service, Privacy Policy, and Return Policy.")
    );
    body.append(terms);

    body.append(el("div", { class: "step-actions" },
      el("button", { class: "btn btn-ghost", onclick: () => setStep(3) }, "← Back"),
      el("button", { class: "btn btn-primary", id: "placeBtn", disabled: !co.data.terms, onclick: placeOrder }, "Place order")
    ));
  }

  function placeOrder() {
    const btn = $("#placeBtn"); if (!btn || co.submitted) return;
    co.submitted = true;
    btn.disabled = true; btn.innerHTML = ''; btn.append(el("span", { class: "spinner" }), " Processing...");
    setTimeout(() => {
      co.orderNo = "NM-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const eta = new Date(Date.now() + 4 * 86400000);
      co.eta = eta.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
      Cart.clear();
      setStep(5);
      co.submitted = false;
    }, 1200);
  }

  // ============ STEP 5: Done ============
  function renderDoneStep(body) {
    body.append(el("div", { class: "confirmation" },
      el("div", { class: "check-anim", html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' }),
      el("h2", {}, "Order confirmed!"),
      el("p", { class: "muted" }, "Thanks — a confirmation has been sent to " + (co.data.ship.email || "your email") + "."),
      el("div", { class: "order-no" }, "Order " + co.orderNo),
      el("p", {}, "Estimated delivery: ", el("b", {}, co.eta)),
      el("div", { style: "margin-top: 24px;" },
        el("button", { class: "btn btn-primary", onclick: () => { window.closeCheckout(); } }, "Back to shop")
      )
    ));
  }

  function open() {
    if (!Cart.state.cart.length) return window.toast("Your cart is empty", "error");
    document.body.style.overflow = "hidden";
    $("#checkout").hidden = false;
    setStep(1);
  }
  function close() {
    document.body.style.overflow = "";
    $("#checkout").hidden = true;
  }

  window.NM_CHECKOUT = { open, close, setStep, renderSummary };
  window.closeCheckout = close;

  // summary toggle (mobile)
  document.addEventListener("click", (e) => {
    if (e.target.closest("#summaryToggle")) {
      const t = $("#summaryToggle"); const b = $("#summaryBody");
      const open = t.getAttribute("aria-expanded") === "true";
      t.setAttribute("aria-expanded", String(!open));
      b.classList.toggle("open", !open);
    }
  });
  $("#checkoutBack")?.addEventListener("click", close);
})();
