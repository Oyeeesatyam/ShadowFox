# 🛒 Shadow Mart — E-Commerce Storefront UX Enhancement

A premium, highly polished, and fully-functional e-commerce storefront demo built entirely with **plain HTML5, CSS3, and modular Vanilla JavaScript (ES6+)**. No heavy frameworks, no build tools, and no setups. It just runs.

This project is part of the **ShadowFox E-Commerce UX Enhancement Internship (Task 2)**.

---

## 🧰 Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Markup** | HTML5 | Semantic structures, ARIA accessibility features, and form elements. |
| **Styling** | CSS3 | Custom variables (Design System), CSS Grid & Flexbox, micro-animations, and light/dark theme modes. |
| **Logic** | Vanilla JS (ES6+) | Modular script organization, state management, and DOM orchestration. |
| **Browser APIs** | LocalStorage / SessionStorage | Persists the cart, wishlist, saved shipping addresses, filter state, and sorting parameters. |
| **Fonts & Icons** | Google Fonts / Lucide Icons | Bricolage Grotesque, Inter, and lightweight SVG icons via CDN. |

---

## 📁 File Structure

```
shadow-mart/
│
├── index.html          # Main storefront, modal templates, drawer screens, and checkout layouts
│
├── css/
│   └── style.css       # Custom stylesheet, colors, design tokens, light/dark themes, and responsive queries
│
└── js/
    ├── products.js     # Mock store database (40+ products, 5 categories, brands, colors, sizes)
    ├── filters.js      # Advanced logic for filters, sorting, and URL sync (search query params)
    ├── cart.js         # State storage for Shopping Cart, Wishlist, Save-For-Later, and addresses
    ├── checkout.js     # Multi-step checkout controller, input formatter, and step validations
    └── main.js         # Core orchestrator hooking up UI drawers, modals, toast alerts, and filters
```

---

## ✨ Features Breakdown

### 🔎 1. Advanced Filtering & Sorting
*   **Multi-Select Category**: Filter items with live counters for each category product count.
*   **Dual Price Range Slider**: Custom double-handle slider synced with numeric inputs (debounced).
*   **Rating Filters**: "N stars & up" ratings selections with dynamic gold SVG star render.
*   **Stock Status**: Filter products on stock availability.
*   **Color & Size Swatches**: Intersect search query, selected color circles, and size pills.
*   **State & URL Sync**: Shareable filtered URLs (using `URLSearchParams`) that save state in browser sessions.

### ↕️ 2. Grid & List Layouts
*   **Layout Toggle**: Swap between **Grid View** and **List View** layouts instantly.
*   **Smart Sorting**: Sort by Relevance, Price (Low ⇄ High), Rating, Newest Arrivals, or Best Sellers.
*   **Load-More Pagination**: Batch loads 12 products per batch with friendly empty states.

### 🛒 3. Interactive Shopping Cart Drawer
*   **State Management**: Real-time updates for cart counter badges, items, and subtotals.
*   **Wishlist & Save-for-Later**: Quickly save items from the catalog or move them from the checkout cart.
*   **Local Storage Sync**: Cart items, wishlist items, and saved addresses persist after page reloads.

### 💳 4. Streamlined 5-Step Checkout
1.  **Step 1 — Cart Review**: Edit quantities, remove items, or use promo code `SAVE10` (10% off).
2.  **Step 2 — Shipping**: Real-time form fields inline validation, US phone auto-formatter, and billing-address checkbox.
3.  **Step 3 — Payment**: Card, UPI, and Cash on Delivery (COD) options with credit card number formatter and CVV limits.
4.  **Step 4 — Review**: Final summary of the items, shipping address, and payment method with quick "Edit" jump-backs.
5.  **Step 5 — Done**: Confirmation screen with random order ID and simulated ETA.

### 💎 5. Premium UX Details
*   **Sub-300ms Micro-Animations**: Smooth slide-ins for cart drawers, fade-ins for toast notifications, and card hover effects.
*   **Light & Dark Theme Toggle**: Luxury dark gold defaults that transition smoothly to parchment light mode.
*   **Skeleton Loaders**: Initial simulated loading animations.

---

## 🎟️ Active Promos

*   Use promo code **`SAVE10`** in the checkout section to apply a **10% discount** to your cart subtotal.

---

## 🚀 Running the Project

You do not need to install node modules or run servers. You can serve the static site in the following ways:

### 1. Direct Browser Launch
Simply double-click the **`index.html`** file in your workspace to run the application directly in any browser.

### 2. VS Code Live Server (Recommended)
1. Open the project folder in **VS Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Click the **Go Live** button in the status bar at the bottom right.
4. The page will load at `http://127.0.0.1:5500/index.html` with automatic hot reloading.

### 3. Python Local Web Server
You can launch a server from your terminal:
```bash
python -m http.server 5500
# Then open: http://localhost:5500 in your browser
```

---

## 📸 Intern Report Screenshots Guidelines
Recommended capture guidelines for the final internship report:
1.  **Home Page / Hero Section**: Clean landing view showcasing layout headings.
2.  **Product List with Filters**: Sidebar filters applied showing active query chips and result counts.
3.  **Sort Options Selection**: Sorting selector menu dropdown showing low-to-high, high-to-low, ratings.
4.  **Grid vs List Mode**: Comparison views of products in list and grid arrangements.
5.  **Empty Search State**: Display when filters return 0 matching products.
6.  **Cart Drawer**: Cart drawer showing active items, quantities, and coupon `SAVE10` applied.
7.  **Checkout Wizard**: Step-by-step screens of Cart review, Shipping entry, Payment cards, Final review, and Success confirmation.
8.  **Form Input Validations**: Inline error warning prompts for bad email formats or missing phone numbers.
9.  **Parchment Light Theme**: Screenshot showing the light color theme.
10. **Responsive Screen Layout**: DevTools mobile layout view simulating an iPhone portrait screen.