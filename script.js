/* =========================================================
   ACHOU! — COMPARADOR PROFISSIONAL
   Produtos, preços, imagens e links reais.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const CONFIG = {
    locale: "pt-BR",
    currency: "BRL",
    heroInterval: 5000,
    initialQuery: "iPhone 15",
    api: "https://wulhcgkphclwgidqlvtr.supabase.co/functions/v1/mercadolivre-search"
  };

  let products = [];
  let groupedProducts = [];
  let heroIndex = 0;
  let heroTimer = null;

  const searchForm = document.querySelector("#searchForm");
  const searchInput = document.querySelector("#searchInput");
  const searchButton = searchForm?.querySelector("button[type='submit']");
  const dealsContainer = document.querySelector("#productList");
  const marketSection = document.querySelector("#ofertas");
  const summaryBox = document.querySelector("#searchSummary");
  const affiliateNote = document.querySelector("#affiliateNote");

  function money(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "";
    return number.toLocaleString(CONFIG.locale, {
      style: "currency",
      currency: CONFIG.currency
    });
  }

  function normalizeText(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function validAffiliateLink(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && parsed.hostname === "meli.la";
    } catch {
      return false;
    }
  }

  function showStatus(title, text, loading = false) {
    if (!dealsContainer) return;
    dealsContainer.innerHTML = `
      <div class="search-status ${loading ? "loading" : ""}">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(text)}</span>
      </div>
    `;
  }

  function showLoading() {
    showStatus(
      "Procurando as melhores ofertas...",
      "Comparando produtos e preços reais no Mercado Livre.",
      true
    );
  }

  function showError() {
    showStatus(
      "Não foi possível buscar agora",
      "Tente novamente em alguns instantes."
    );
  }

  function showEmpty() {
    showStatus(
      "Nenhuma oferta encontrada",
      "Tente pesquisar outro produto."
    );
  }

  function updateSummary(productCount, offerCount, query) {
    if (!summaryBox) return;
    summaryBox.hidden = false;
    summaryBox.innerHTML = `
      <div>
        <strong>${productCount} ${productCount === 1 ? "produto encontrado" : "produtos encontrados"}</strong>
        <span>${offerCount} ${offerCount === 1 ? "oferta real" : "ofertas reais"} para “${escapeHtml(query)}”</span>
      </div>
      <span>Ordenado por menor preço</span>
    `;
  }

  function normalizeApiProduct(item) {
    return {
      id: item.item_id || item.id || "",
      itemId: item.item_id || item.id || "",
      productId: item.product_id || "",
      title: item.title || "",
      price: Number(item.price),
      oldPrice: item.original_price != null ? Number(item.original_price) : null,
      image: item.thumbnail || null,
      sellerId: item.seller_id || null,
      freeShipping: item.free_shipping === true,
      condition: item.condition || null,
      affiliateCode: item.affiliate_code || null,
      link: item.affiliate_url || item.permalink || null,
      canBuy: item.can_buy === true
    };
  }

  function groupProducts(list) {
    const map = new Map();

    list.forEach(item => {
      const key = item.productId || item.id;
      if (!map.has(key)) {
        map.set(key, {
          productId: key,
          title: item.title,
          image: item.image || null,
          offers: []
        });
      }

      const currentGroup = map.get(key);
      if (!currentGroup.image && item.image) currentGroup.image = item.image;
      currentGroup.offers.push(item);
    });

    return Array.from(map.values())
      .map(group => {
        group.offers.sort((a, b) => a.price - b.price);
        group.best = group.offers[0];
        group.bestBuyable = group.offers.find(
          offer => offer.canBuy === true && validAffiliateLink(offer.link)
        ) || null;
        return group;
      })
      .sort((a, b) => a.best.price - b.best.price);
  }

  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem("achou_favorites")) || [];
    } catch {
      return [];
    }
  }

  function saveFavorites(list) {
    localStorage.setItem("achou_favorites", JSON.stringify(list));
  }

  function updateFavoriteCounter() {
    const total = getFavorites().length;
    document.querySelectorAll(".favorite-count").forEach(counter => {
      counter.textContent = total;
    });
  }

  function bindFavorites() {
    const favorites = getFavorites().map(String);

    document.querySelectorAll("[data-favorite]").forEach(button => {
      const id = String(button.dataset.favorite);
      button.textContent = favorites.includes(id) ? "♥" : "♡";

      button.addEventListener("click", () => {
        let current = getFavorites().map(String);

        if (current.includes(id)) {
          current = current.filter(item => item !== id);
          button.textContent = "♡";
        } else {
          current.push(id);
          button.textContent = "♥";
        }

        saveFavorites(current);
        updateFavoriteCounter();
      });
    });
  }

  function bindOfferPanels() {
    document.querySelectorAll("[data-toggle-offers]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.toggleOffers;
        const panel = document.querySelector(`[data-offers-panel="${CSS.escape(id)}"]`);
        if (!panel) return;

        const open = panel.classList.toggle("open");
        button.textContent = open
          ? "OCULTAR OFERTAS"
          : `VER ${panel.children.length} OFERTAS`;
      });
    });
  }

  function renderGroupedProducts(groups) {
    if (!dealsContainer) return;
    if (!Array.isArray(groups) || groups.length === 0) {
      showEmpty();
      if (affiliateNote) affiliateNote.hidden = true;
      return;
    }

    dealsContainer.innerHTML = groups.map((group, groupIndex) => {
      const best = group.best;
      const title = escapeHtml(group.title);
      const favoriteId = group.productId;

      const image = group.image
        ? `
          <img class="achou-product-image" src="${escapeHtml(group.image)}" alt="${title}" loading="lazy" decoding="async" referrerpolicy="no-referrer"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div class="achou-image-fallback" style="display:none"><span>Imagem indisponível</span></div>
        `
        : `<div class="achou-image-fallback" style="display:flex"><span>Imagem indisponível</span></div>`;

      const bestBuyable = group.bestBuyable;
      const bestLink = bestBuyable && validAffiliateLink(bestBuyable.link)
        ? bestBuyable.link
        : null;

      const mainButton = bestLink
        ? `<a href="${escapeHtml(bestLink)}" target="_blank" rel="noopener noreferrer sponsored" class="offer">VER MELHOR OFERTA</a>`
        : `<button type="button" class="offer" disabled>MELHOR OFERTA SEM LINK</button>`;

      const rows = group.offers.map((offer, offerIndex) => {
        const buyable = offer.canBuy === true && validAffiliateLink(offer.link);
        const button = buyable
          ? `<a class="achou-mini-buy" href="${escapeHtml(offer.link)}" target="_blank" rel="noopener noreferrer sponsored">VER OFERTA</a>`
          : `<span class="achou-mini-buy disabled">SEM LINK</span>`;

        return `
          <div class="achou-offer-row ${offerIndex === 0 ? "best" : ""}">
            <div>
              ${offerIndex === 0 ? `<span class="achou-best-label">MENOR PREÇO</span>` : ""}
              <strong class="achou-offer-price">${money(offer.price)}</strong>
              <div class="achou-offer-meta">
                <span>Mercado Livre</span>
                ${offer.freeShipping ? `<span class="achou-free">Frete grátis</span>` : ""}
              </div>
            </div>
            ${button}
          </div>
        `;
      }).join("");

      return `
        <article class="flash-card achou-group-card" data-product-id="${escapeHtml(group.productId)}">
          ${groupIndex === 0 ? `<span class="discount">MELHOR PREÇO</span>` : ""}
          <button class="product-favorite" type="button" data-favorite="${escapeHtml(favoriteId)}" aria-label="Favoritar produto">♡</button>
          <div class="flash-photo">${image}</div>
          <h3>${title}</h3>
          <div class="achou-group-info">
            <span class="achou-offer-count">${group.offers.length} ${group.offers.length === 1 ? "oferta" : "ofertas"}</span>
            ${best.freeShipping ? `<span class="achou-free" style="font-size:7px">Frete grátis</span>` : ""}
          </div>
          <span class="achou-starting">A partir de</span>
          <strong class="flash-price">${money(best.price)}</strong>
          <div class="product-bottom">
            <span>Mercado Livre</span>
            <span>${group.offers.length} preços comparados</span>
          </div>
          <div class="achou-actions">
            ${mainButton}
            <button class="achou-see-offers" type="button" data-toggle-offers="${escapeHtml(group.productId)}">VER ${group.offers.length} OFERTAS</button>
          </div>
          <div class="achou-offers-panel" data-offers-panel="${escapeHtml(group.productId)}">${rows}</div>
        </article>
      `;
    }).join("");

    if (affiliateNote) affiliateNote.hidden = false;
    bindFavorites();
    bindOfferPanels();
  }

  async function searchProducts(termOverride = null, options = {}) {
    if (!searchInput) return;

    const term = (termOverride ?? searchInput.value).trim();
    if (!term) {
      searchInput.focus();
      return;
    }

    searchInput.value = term;
    showLoading();
    if (summaryBox) summaryBox.hidden = true;
    if (affiliateNote) affiliateNote.hidden = true;

    if (searchButton) {
      searchButton.disabled = true;
      searchButton.textContent = "BUSCANDO...";
    }

    try {
      const response = await fetch(`${CONFIG.api}?q=${encodeURIComponent(term)}`, {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (!data || data.ok !== true || !Array.isArray(data.results)) {
        throw new Error("Resposta inválida");
      }

      products = data.results
        .map(normalizeApiProduct)
        .filter(product => product.id && product.title && Number.isFinite(product.price) && product.price > 0);

      groupedProducts = groupProducts(products);
      updateSummary(groupedProducts.length, products.length, term);
      renderGroupedProducts(groupedProducts);

      if (options.scroll !== false && marketSection) {
        marketSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (error) {
      console.error("[ACHOU!] Erro:", error);
      products = [];
      groupedProducts = [];
      showError();
    } finally {
      if (searchButton) {
        searchButton.disabled = false;
        searchButton.textContent = "BUSCAR";
      }
    }
  }

  searchForm?.addEventListener("submit", event => {
    event.preventDefault();
    searchProducts();
  });

  const categoryButtons = document.querySelectorAll(
    ".category-nav-item, .quick-category, .popular-tags button"
  );

  categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
      const rawText = button.textContent.trim();
      const text = normalizeText(rawText);

      document.querySelectorAll(".category-nav-item").forEach(item => item.classList.remove("active"));
      if (button.classList.contains("category-nav-item")) button.classList.add("active");

      const map = {
        todos: CONFIG.initialQuery,
        celulares: "celular",
        informatica: "notebook",
        tv: "smart tv",
        games: "console",
        audio: "fone bluetooth",
        casa: "casa",
        moda: "moda",
        ferramentas: "ferramentas",
        iphone: "iPhone",
        notebook: "notebook",
        playstation: "PlayStation",
        "smart tv": "smart tv",
        fone: "fone bluetooth"
      };

      searchProducts(map[text] || rawText);
    });
  });

  document.querySelector(".see-all")?.addEventListener("click", () => {
    searchInput?.focus();
    document.querySelector("#buscar")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  const heroSlides = [
    {
      label: "OFERTAS SELECIONADAS",
      title: "COMPARE ANTES DE COMPRAR",
      text: "A gente procura os melhores preços para você economizar."
    },
    {
      label: "PREÇOS EM UM SÓ LUGAR",
      title: "ENCONTRE A MELHOR OFERTA",
      text: "Compare preços antes de decidir onde comprar."
    },
    {
      label: "ACHOU!",
      title: "VOCÊ PROCURA. A GENTE COMPARA.",
      text: "Menos tempo procurando. Mais dinheiro economizado."
    }
  ];

  const heroLabel = document.querySelector(".hero-small-title");
  const heroTitle = document.querySelector(".hero-banner h1");
  const heroText = document.querySelector(".hero-banner p");
  const heroPrev = document.querySelector(".hero-prev");
  const heroNext = document.querySelector(".hero-next");
  const heroDots = document.querySelectorAll(".hero-dot");

  function renderHero(index) {
    heroIndex = (index + heroSlides.length) % heroSlides.length;
    const slide = heroSlides[heroIndex];

    if (heroLabel) heroLabel.textContent = slide.label;
    if (heroTitle) heroTitle.innerHTML = `<strong>${escapeHtml(slide.title)}</strong>`;
    if (heroText) heroText.textContent = slide.text;

    heroDots.forEach((dot, index) => {
      dot.classList.toggle("active", index === heroIndex);
    });
  }

  function resetHeroTimer() {
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(() => renderHero(heroIndex + 1), CONFIG.heroInterval);
  }

  heroPrev?.addEventListener("click", () => {
    renderHero(heroIndex - 1);
    resetHeroTimer();
  });

  heroNext?.addEventListener("click", () => {
    renderHero(heroIndex + 1);
    resetHeroTimer();
  });

  heroDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      renderHero(index);
      resetHeroTimer();
    });
  });

  document.querySelector(".hero-cta")?.addEventListener("click", () => {
    document.querySelector("#buscar")?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => searchInput?.focus(), 350);
  });

  const loginModal = document.querySelector("#loginModal");
  const signupModal = document.querySelector("#signupModal");

  function syncBodyModalState() {
    const open = loginModal?.classList.contains("active") || signupModal?.classList.contains("active");
    document.body.classList.toggle("modal-open", Boolean(open));
  }

  function openLogin() {
    loginModal?.classList.add("active");
    signupModal?.classList.remove("active");
    syncBodyModalState();
  }

  function closeLogin() {
    loginModal?.classList.remove("active");
    syncBodyModalState();
  }

  function openSignup() {
    signupModal?.classList.add("active");
    loginModal?.classList.remove("active");
    syncBodyModalState();
  }

  function closeSignup() {
    signupModal?.classList.remove("active");
    syncBodyModalState();
  }

  document.querySelector(".account-button")?.addEventListener("click", openLogin);
  document.querySelector(".login-close")?.addEventListener("click", closeLogin);
  document.querySelector(".signup-close")?.addEventListener("click", closeSignup);
  document.querySelector(".create-account")?.addEventListener("click", openSignup);
  document.querySelector(".signup-login")?.addEventListener("click", openLogin);

  loginModal?.addEventListener("click", event => {
    if (event.target === loginModal) closeLogin();
  });

  signupModal?.addEventListener("click", event => {
    if (event.target === signupModal) closeSignup();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeLogin();
      closeSignup();
    }
  });

  document.querySelector("#loginForm")?.addEventListener("submit", event => event.preventDefault());
  document.querySelector("#signupForm")?.addEventListener("submit", event => event.preventDefault());

  document.querySelector(".favorites-shortcut")?.addEventListener("click", () => {
    if (marketSection) marketSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const bottomItems = document.querySelectorAll(".bottom-nav-item");
  bottomItems.forEach(item => {
    item.addEventListener("click", () => {
      bottomItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");

      const target = item.dataset.target;
      const action = item.dataset.action;

      if (target === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (target) {
        document.querySelector(`#${CSS.escape(target)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        if (target === "buscar") setTimeout(() => searchInput?.focus(), 350);
      } else if (action === "favorites") {
        marketSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (action === "profile") {
        openLogin();
      }
    });
  });

  renderHero(0);
  resetHeroTimer();
  updateFavoriteCounter();
  searchProducts(CONFIG.initialQuery, { scroll: false });

  console.log("[ACHOU!] Comparador profissional carregado.");
});
