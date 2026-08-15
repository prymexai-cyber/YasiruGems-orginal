/* ==========================================================================
   Yasiru Gems & Jewellery — shared site behaviour
   ==========================================================================
   This file contains NO page content — no text, no image paths, no
   prices. Every heading, paragraph, image and price lives directly in
   the HTML files (index.html, about.html, what-we-do.html, shop.html,
   contact.html, checkout.html) so you can edit them straight in your
   code editor. This script only wires up interactions:
     - the click-to-zoom lightbox for product photos
     - the WhatsApp "Buy Now" and general enquiry links
     - the custom cursor, glass hover-glow and scroll-reveal animations
     - basic right-click / drag-save image protection
     - the shop page's category filter + search
     - the mobile menu toggle

   SITE-WIDE SETTINGS YOU MAY WANT TO EDIT ARE IN THE HTML, NOT HERE:
     - WhatsApp number → the data-whatsapp-number attribute on <body>
     - Watermark text  → assets/css/style.css, search "WATERMARK TEXT"
   ========================================================================== */
(function(){
  "use strict";

  const WHATSAPP_NUMBER = document.body.getAttribute("data-whatsapp-number") || "94712802569";

  /* =========================================================
     1. WHATSAPP LINKS
     Any <a> with data-whatsapp-msg="..." gets its href built
     automatically on page load — just write the message text
     straight into the HTML attribute.
  ========================================================== */
  function buildWhatsappLinks(){
    document.querySelectorAll("[data-whatsapp-msg]").forEach(el => {
      const msg = el.getAttribute("data-whatsapp-msg");
      el.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
      el.target = "_blank";
      el.rel = "noopener";
    });
  }

  /* =========================================================
     2. SHOP "BUY NOW" BUTTONS
     Each button reads the product name/SKU/price from its own
     data-* attributes (written directly in the HTML) and opens
     WhatsApp with a pre-filled enquiry — no JS edits needed to
     add a new product, just copy the HTML block.
  ========================================================== */
  function whatsappMessageFor(el){
    const name = el.getAttribute("data-product-name") || "this piece";
    const sku = el.getAttribute("data-product-sku") || "";
    const price = el.getAttribute("data-product-price") || "";
    return `Hello Yasiru, I'm interested in purchasing "${name}"${sku ? " (SKU: " + sku + ")" : ""}${price ? " — listed at " + price : ""}. Could you confirm availability and next steps?`;
  }
  function bindBuyButtons(){
    document.querySelectorAll(".buy-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const msg = whatsappMessageFor(btn);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
      });
    });
  }

  /* =========================================================
     3. LIGHTBOX — click-to-zoom
     Any element with class "lightbox-item" opens the modal when
     clicked. It reads the image + caption straight from its own
     children/data-attributes, so a new product just needs the
     same HTML block copied — nothing to register in JS.
  ========================================================== */
  function buildLightboxDom(){
    if (document.getElementById("lightbox")) return;
    const el = document.createElement("div");
    el.id = "lightbox";
    el.className = "lightbox";
    el.innerHTML = `
      <div class="lightbox-backdrop" data-lightbox-close></div>
      <button class="lightbox-close" type="button" aria-label="Close" data-lightbox-close>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
      <button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      <div class="lightbox-stage">
        <div class="lightbox-media photo-frame">
          <img class="lightbox-image" src="" alt="">
        </div>
        <div class="lightbox-panel glass-dark">
          <div class="id-tag" id="lbId"></div>
          <h3 id="lbTitle"></h3>
          <div class="overlay-meta" id="lbMeta"></div>
          <div class="buy-row" style="margin-top:22px;">
            <span class="price-tag" id="lbPrice"></span>
            <button class="buy-btn" id="lbBuyBtn" type="button" data-product-name="" data-product-sku="" data-product-price="">
              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2.05 22l5.28-1.38a9.87 9.87 0 004.71 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2z"/></svg>
              Buy Now via WhatsApp
            </button>
          </div>
        </div>
      </div>
      <button class="lightbox-nav lightbox-next" type="button" aria-label="Next">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    `;
    document.body.appendChild(el);
    el.querySelectorAll("[data-lightbox-close]").forEach(b => b.addEventListener("click", closeLightbox));
    el.querySelector(".lightbox-prev").addEventListener("click", () => stepLightbox(-1));
    el.querySelector(".lightbox-next").addEventListener("click", () => stepLightbox(1));
    document.addEventListener("keydown", (e) => {
      if (!el.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    });
  }

  let lightboxItems = [];
  let lightboxIndex = 0;

  function paintLightbox(){
    const item = lightboxItems[lightboxIndex];
    if (!item) return;
    const img = item.querySelector("img");
    const el = document.getElementById("lightbox");
    el.querySelector(".lightbox-image").src = img ? img.src : "";
    el.querySelector(".lightbox-image").alt = img ? img.alt : "";
    el.querySelector("#lbId").textContent = item.getAttribute("data-product-sku") || "";
    el.querySelector("#lbTitle").textContent = item.getAttribute("data-product-name") || "";
    el.querySelector("#lbMeta").textContent = item.getAttribute("data-product-category") || "";
    el.querySelector("#lbPrice").textContent = item.getAttribute("data-product-price") || "";
    const buyBtn = el.querySelector("#lbBuyBtn");
    buyBtn.setAttribute("data-product-name", item.getAttribute("data-product-name") || "");
    buyBtn.setAttribute("data-product-sku", item.getAttribute("data-product-sku") || "");
    buyBtn.setAttribute("data-product-price", item.getAttribute("data-product-price") || "");
    buyBtn.onclick = () => {
      const msg = whatsappMessageFor(buyBtn);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    };
  }

  function openLightbox(triggerEl){
    buildLightboxDom();
    lightboxItems = Array.from(document.querySelectorAll(".lightbox-item"));
    lightboxIndex = Math.max(0, lightboxItems.indexOf(triggerEl));
    paintLightbox();
    document.getElementById("lightbox").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox(){
    const el = document.getElementById("lightbox");
    if (el) el.classList.remove("open");
    document.body.style.overflow = "";
  }
  function stepLightbox(dir){
    if (!lightboxItems.length) return;
    lightboxIndex = (lightboxIndex + dir + lightboxItems.length) % lightboxItems.length;
    paintLightbox();
  }

  function bindLightboxTriggers(){
    document.querySelectorAll(".lightbox-item").forEach(el => {
      el.addEventListener("click", () => openLightbox(el));
    });
  }

  /* =========================================================
     4. IMAGE PROTECTION (deterrent only)
     Disables right-click and drag-to-save on photos. Honest note:
     no client-side script can truly block screenshots or screen
     recording — this raises friction for casual copying, it does
     not make the images uncopiable.
  ========================================================== */
  document.addEventListener("contextmenu", (e) => {
    if (e.target.closest(".photo-frame, .portrait-frame")) e.preventDefault();
  });
  document.addEventListener("dragstart", (e) => {
    if (e.target.tagName === "IMG") e.preventDefault();
  });
  document.addEventListener("keydown", (e) => {
    const key = e.key ? e.key.toLowerCase() : "";
    if ((e.ctrlKey || e.metaKey) && key === "s") e.preventDefault();
    if ((e.ctrlKey || e.metaKey) && key === "u") e.preventDefault();
  });

  /* =========================================================
     5. CUSTOM CURSOR
  ========================================================== */
  function initCursor(){
    const ring = document.getElementById("cursorRing");
    const dot  = document.getElementById("cursorDot");
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (!ring || !dot) return;
    if (isTouch) { ring.style.display = "none"; dot.style.display = "none"; return; }

    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
      const el = document.elementFromPoint(mx, my);
      if (el && el.closest(".hero-bg, .hero-pagehead, .glass-dark, .lightbox")) ring.classList.add("on-dark");
      else ring.classList.remove("on-dark");
    });
    (function animateRing(){
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(animateRing);
    })();

    document.querySelectorAll("a, button, .glass, .glass-dark, .photo-card, input, textarea").forEach(el => {
      el.addEventListener("mouseenter", () => ring.classList.add("hovered"));
      el.addEventListener("mouseleave", () => ring.classList.remove("hovered"));
    });
  }

  /* =========================================================
     6. GLASS GLOW FOLLOW
  ========================================================== */
  function bindGlassGlow(){
    document.querySelectorAll(".glass, .glass-dark").forEach(card => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
        card.style.setProperty("--my", (e.clientY - rect.top) + "px");
      });
    });
  }

  /* =========================================================
     7. SCROLL REVEAL
  ========================================================== */
  function initReveal(){
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("in-view"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.14 });
    document.querySelectorAll(".reveal, .photo-card").forEach(el => observer.observe(el));
  }

  /* =========================================================
     8. MOBILE MENU
  ========================================================== */
  function initNav(){
    const navToggle = document.getElementById("navToggle");
    const mobileMenu = document.getElementById("mobileMenu");
    if (navToggle && mobileMenu) {
      navToggle.addEventListener("click", () => mobileMenu.classList.toggle("open"));
      mobileMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => mobileMenu.classList.remove("open")));
    }
  }

  /* =========================================================
     9. FOOTER YEAR
  ========================================================== */
  function stampYear(){
    document.querySelectorAll(".js-year").forEach(el => el.textContent = new Date().getFullYear());
  }

  /* =========================================================
     10. SHOP FILTER + SEARCH (shop.html only)
     Reads categories straight from each card's data-product-category
     attribute in the HTML — no separate list to maintain.
  ========================================================== */
  function initShopFilters(){
    const grid = document.getElementById("shopGrid");
    const filtersWrap = document.getElementById("filters");
    const searchInput = document.getElementById("shopSearch");
    if (!grid || !filtersWrap) return;

    const cards = Array.from(grid.querySelectorAll(".photo-card"));
    const categories = ["All", ...new Set(cards.map(c => c.querySelector(".lightbox-item").getAttribute("data-product-category")))];
    let activeCategory = "All";
    let activeQuery = "";

    categories.forEach((cat, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-btn" + (i === 0 ? " active" : "");
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        activeCategory = cat;
        filtersWrap.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        applyFilters();
      });
      filtersWrap.appendChild(btn);
    });

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        activeQuery = e.target.value.trim().toLowerCase();
        applyFilters();
      });
    }

    function applyFilters(){
      let visibleCount = 0;
      cards.forEach(card => {
        const item = card.querySelector(".lightbox-item");
        const category = item.getAttribute("data-product-category") || "";
        const haystack = (item.getAttribute("data-product-name") + " " + item.getAttribute("data-product-sku") + " " + item.getAttribute("data-product-tags")).toLowerCase();
        const catOk = activeCategory === "All" || category === activeCategory;
        const searchOk = !activeQuery || haystack.includes(activeQuery);
        const show = catOk && searchOk;
        card.style.display = show ? "" : "none";
        if (show) visibleCount++;
      });
      const emptyState = document.getElementById("shopEmptyState");
      if (emptyState) emptyState.style.display = visibleCount === 0 ? "block" : "none";
    }
  }

  /* =========================================================
     BOOTSTRAP
  ========================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    buildWhatsappLinks();
    bindBuyButtons();
    bindLightboxTriggers();
    initCursor();
    bindGlassGlow();
    initReveal();
    initNav();
    stampYear();
    initShopFilters();
  });
})();
