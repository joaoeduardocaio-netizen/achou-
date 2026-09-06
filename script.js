document.addEventListener("DOMContentLoaded", () => {
  const CONFIG = {
    locale: "pt-BR",
    currency: "BRL",
    initialQuery: "camiseta",
    heroInterval: 5000,
    api: "https://wulhcgkphclwgidqlvtr.supabase.co/functions/v1/mercadolivre-search",
    supabaseUrl: "https://wulhcgkphclwgidqlvtr.supabase.co",
    supabaseKey: "sb_publishable_Wi0Kz5aB4LeLnlxQE_34Yw_1KwA8ebc",
    favoritesKey: "achou_favorite_products",
    legacyFavoritesKey: "achou_favorites"
  };

  let db = null;
  let currentProducts = [];

  if (window.supabase?.createClient) {
    db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "achou-user-auth"
      }
    });
  }

  const searchForm = document.querySelector("#searchForm");
  const searchInput = document.querySelector("#searchInput");
  const productList = document.querySelector("#productList");
  const summaryBox = document.querySelector(".achou-search-summary");
  const offersSection = document.querySelector("#offersSection");
  const categoriesSection = document.querySelector("#categoriesSection");

  const money = value =>
    Number(value).toLocaleString(CONFIG.locale, {
      style: "currency",
      currency: CONFIG.currency
    });

  const escapeHtml = value =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  function injectEnhancementStyles() {
    if (document.querySelector("#achouEnhancementStyles")) return;

    const style = document.createElement("style");
    style.id = "achouEnhancementStyles";
    style.textContent = `
      .achou-source{
        display:inline-flex;align-items:center;gap:5px;width:max-content;
        margin:0 0 7px;padding:4px 7px;border:1px solid #292929;border-radius:999px;
        background:#121212;color:#bbb;font-size:8px;font-weight:800
      }
      .achou-source-dot{width:6px;height:6px;border-radius:50%;background:#FFD400}
      .achou-drawer-backdrop{
        position:fixed;inset:0;z-index:360;background:rgba(0,0,0,.72);
        opacity:0;pointer-events:none;transition:opacity .2s ease
      }
      .achou-drawer-backdrop.active{opacity:1;pointer-events:auto}
      .achou-drawer{
        position:fixed;left:0;top:0;bottom:0;z-index:370;width:min(340px,88vw);
        background:#0a0a0a;border-right:1px solid #292929;
        transform:translateX(-102%);transition:transform .23s ease;
        padding:18px 16px calc(20px + env(safe-area-inset-bottom));overflow:auto
      }
      .achou-drawer.active{transform:translateX(0)}
      .achou-drawer-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
      .achou-drawer-logo{font-size:29px;font-weight:950;font-style:italic;letter-spacing:-1px}
      .achou-drawer-logo span{color:#FFD400}
      .achou-drawer-close{
        width:38px;height:38px;border:1px solid #333;border-radius:9px;background:#111;font-size:24px
      }
      .achou-drawer-search{display:flex;height:43px;margin-bottom:17px;background:#f5f5f5;border-radius:9px;overflow:hidden}
      .achou-drawer-search input{flex:1;min-width:0;border:0;outline:0;padding:0 12px;color:#111;background:transparent}
      .achou-drawer-search button{width:50px;border:0;background:#FFD400;color:#000;font-weight:950}
      .achou-drawer-title{display:block;margin:17px 4px 8px;color:#777;font-size:10px;text-transform:uppercase;letter-spacing:.8px}
      .achou-drawer-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .achou-drawer-grid button{
        min-height:48px;border:1px solid #282828;border-radius:9px;background:#111;text-align:left;padding:10px;
        font-size:11px;font-weight:800
      }
      .achou-drawer-grid button:active{border-color:#FFD400}
      .achou-drawer-actions{display:grid;gap:8px;margin-top:15px}
      .achou-drawer-actions button{
        height:46px;border:1px solid #292929;border-radius:9px;background:#111;text-align:left;padding:0 13px;font-weight:800
      }
      .favorites-modal-box{width:min(650px,100%);max-height:min(82vh,720px);overflow:auto}
      .favorites-header{padding-right:44px}
      .favorites-header p{margin:5px 0 15px;color:#999;font-size:11px;line-height:1.5}
      .favorites-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .favorite-saved-card{
        border:1px solid #292929;border-radius:10px;background:#101010;overflow:hidden;
        display:grid;grid-template-columns:92px 1fr;min-height:116px
      }
      .favorite-saved-image{background:#fff;display:grid;place-items:center;overflow:hidden}
      .favorite-saved-image img{width:100%;height:100%;object-fit:contain;padding:5px}
      .favorite-saved-info{padding:10px;display:flex;flex-direction:column;min-width:0}
      .favorite-saved-info strong{
        font-size:10px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;
        -webkit-box-orient:vertical;overflow:hidden
      }
      .favorite-saved-price{font-size:16px!important;margin-top:7px}
      .favorite-saved-actions{display:flex;gap:6px;margin-top:auto}
      .favorite-saved-actions a,.favorite-saved-actions button{
        height:29px;border-radius:6px;font-size:8px;font-weight:950;display:grid;place-items:center
      }
      .favorite-saved-actions a{flex:1;background:#FFD400;color:#000}
      .favorite-saved-actions button{width:34px;border:1px solid #333;background:#181818;color:#fff}
      .favorites-empty{padding:34px 15px;text-align:center;border:1px solid #292929;border-radius:10px;color:#999}
      .favorites-empty strong{display:block;color:#fff;margin-bottom:5px}
      @media(max-width:820px){
        .favorites-grid{grid-template-columns:1fr}
        .favorites-modal-box{max-height:78vh}
      }
    `;
    document.head.appendChild(style);
  }

  function getLegacyFavoriteIds() {
    try {
      const data = JSON.parse(localStorage.getItem(CONFIG.legacyFavoritesKey)) || [];
      return Array.isArray(data) ? data.map(String) : [];
    } catch {
      return [];
    }
  }

  function getFavoriteProducts() {
    try {
      const data = JSON.parse(localStorage.getItem(CONFIG.favoritesKey)) || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveFavoriteProducts(list) {
    localStorage.setItem(CONFIG.favoritesKey, JSON.stringify(list));
    localStorage.setItem(
      CONFIG.legacyFavoritesKey,
      JSON.stringify(list.map(item => String(item.productId)))
    );
  }

  function getFavoriteIds() {
    const products = getFavoriteProducts().map(item => String(item.productId));
    return [...new Set([...products, ...getLegacyFavoriteIds()])];
  }

  function updateFavoriteCounters() {
    const total = getFavoriteIds().length;
    document.querySelectorAll(".favorite-count").forEach(el => {
      el.textContent = total;
    });
  }

  function normalizeSource(item) {
    const raw = String(item.source || item.store || item.marketplace || "").toLowerCase();
    if (raw.includes("amazon")) return "amazon";
    if (raw.includes("mercado") || raw.includes("meli")) return "mercadolivre";
    return raw || "mercadolivre";
  }

  function sourceLabel(source) {
    if (source === "amazon") return "Amazon";
    if (source === "mercadolivre") return "Mercado Livre";
    return "Loja parceira";
  }

  function normalizeProduct(item) {
    return {
      id: String(item.item_id || item.id || ""),
      productId: String(item.product_id || item.item_id || item.id || ""),
      title: String(item.title || "Produto"),
      price: Number(item.price || 0),
      image: item.thumbnail || item.image || "",
      freeShipping: item.free_shipping === true,
      affiliateUrl: item.affiliate_url || item.permalink || item.url || "",
      source: normalizeSource(item)
    };
  }

  function validUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  function removeAccents(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  const CATEGORY_RULES = [
    {
      search: /(camiseta|camisa|t shirt)/,
      include: /(camiseta|camisa|t shirt|blusa)/,
      exclude: /(capa|caneca|adesivo|boneco|quadro|poster|chaveiro|fone|carregador)/
    },
    {
      search: /(moletom|hoodie)/,
      include: /(moletom|hoodie|blusao|casaco)/,
      exclude: /(adesivo|caneca|boneco|capa|fone|carregador)/
    },
    {
      search: /(calca|jeans|legging)/,
      include: /(calca|jeans|legging|jogger)/,
      exclude: /(capa|caneca|boneco|camiseta|fone|carregador)/
    },
    {
      search: /(vestido)/,
      include: /(vestido)/,
      exclude: /(boneca|capa|caneca|fantasia para boneca)/
    },
    {
      search: /(tenis|sapatenis|calcado)/,
      include: /(tenis|sapatenis|sneaker|calcado)/,
      exclude: /(capa|miniatura|chaveiro|boneco|adesivo)/
    },
    {
      search: /(infantil|crianca|kids|menino|menina)/,
      include: /(infantil|crianca|kids|menino|menina|juvenil|camiseta|moletom|vestido|tenis)/,
      exclude: /(capa para celular|carregador|fone bluetooth)/
    },
    {
      search: /(celular|smartphone|iphone|galaxy|motorola|redmi|xiaomi)/,
      include: /(celular|smartphone|iphone|galaxy|motorola|redmi|xiaomi|poco)/,
      exclude: /(capa|pelicula|carregador|suporte|fone|cabo|display|tela|bateria|placa)/
    },
    {
      search: /(fone|headphone|headset|earbuds)/,
      include: /(fone|headphone|headset|earbuds|auricular)/,
      exclude: /(capa|estojo|case|almofada reposicao|adaptador apenas)/
    },
    {
      search: /(caixa de som|speaker|jbl)/,
      include: /(caixa de som|speaker|jbl|soundbar)/,
      exclude: /(capa|case|bolsa|suporte|bateria reposicao)/
    },
    {
      search: /(carregador|charger|fonte usb)/,
      include: /(carregador|charger|fonte|usb c|tipo c|magsafe)/,
      exclude: /(capa|pelicula|fone|celular completo)/
    },
    {
      search: /(smartwatch|relogio inteligente|watch)/,
      include: /(smartwatch|relogio inteligente|apple watch|galaxy watch|watch)/,
      exclude: /(pulseira|pelicula|capa|carregador|case)/
    }
  ];

  function relevantProduct(product, query) {
    const text = removeAccents(product.title);
    const q = removeAccents(query);
    const rule = CATEGORY_RULES.find(item => item.search.test(q));

    if (!rule) {
      const meaningfulWords = q
        .split(/\s+/)
        .filter(word => word.length >= 3)
        .filter(word => !["roupa", "feminino", "masculino", "oferta", "ofertas"].includes(word));

      return meaningfulWords.length === 0 ||
        meaningfulWords.some(word => text.includes(word));
    }

    return rule.include.test(text) && !rule.exclude.test(text);
  }

  function searchPlan(term) {
    const value = removeAccents(term).trim();

    if (!value || value === "ofertas" || value === "oferta") {
      return {
        label: "ofertas",
        queries: ["camiseta", "tenis", "celular smartphone", "fone bluetooth"]
      };
    }

    if (value === "moda" || value === "moda feminina" || value === "moda masculina") {
      return {
        label: "moda",
        queries: ["camiseta", "moletom", "calca jeans", "tenis"]
      };
    }

    if (value === "eletronicos" || value === "eletronico") {
      return {
        label: "eletrônicos",
        queries: ["celular smartphone", "fone bluetooth", "caixa de som bluetooth", "carregador celular"]
      };
    }

    return {
      label: String(term).trim(),
      queries: [String(term).trim()]
    };
  }

  function renderStatus(title, text) {
    if (!productList) return;
    productList.innerHTML = `
      <div class="search-status">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(text)}</span>
        </div>
      </div>`;
  }

  function migrateLegacyFavorites(products) {
    const legacy = getLegacyFavoriteIds();
    if (!legacy.length) return;

    const saved = getFavoriteProducts();
    const savedIds = saved.map(item => String(item.productId));
    let changed = false;

    products.forEach(product => {
      if (
        legacy.includes(String(product.productId)) &&
        !savedIds.includes(String(product.productId))
      ) {
        saved.push(product);
        savedIds.push(String(product.productId));
        changed = true;
      }
    });

    if (changed) saveFavoriteProducts(saved);
  }

  function productCardMarkup(product, index, favoriteIds) {
    const isFavorite = favoriteIds.includes(String(product.productId));
    const hasUrl = validUrl(product.affiliateUrl);

    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <button
            class="favorite-button"
            type="button"
            data-favorite="${escapeHtml(product.productId)}"
            aria-label="${isFavorite ? "Remover dos favoritos" : "Favoritar produto"}">
            ${isFavorite ? "♥" : "♡"}
          </button>

          ${
            product.image
              ? `<img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" loading="lazy" referrerpolicy="no-referrer">`
              : `<span style="color:#777;font-size:11px">Sem imagem</span>`
          }

          <span class="product-badge">
            ${index === 0 ? "MENOR PREÇO" : product.freeShipping ? "FRETE GRÁTIS" : "OFERTA"}
          </span>
        </div>

        <div class="product-info">
          <span class="achou-source">
            <i class="achou-source-dot"></i>${escapeHtml(sourceLabel(product.source))}
          </span>

          <h3 class="product-title">${escapeHtml(product.title)}</h3>

          <span class="from">A partir de</span>
          <strong class="price">${money(product.price)}</strong>

          <span class="installment">
            ${product.freeShipping ? "Frete grátis disponível" : "Consulte frete e condições"}
          </span>

          ${
            hasUrl
              ? `<a class="offer-button" href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="noopener noreferrer sponsored">VER OFERTA</a>`
              : `<span class="offer-button disabled">LINK EM BREVE</span>`
          }
        </div>
      </article>`;
  }

  function renderProducts(products, query) {
    currentProducts = products;
    migrateLegacyFavorites(products);

    if (!products.length) {
      if (summaryBox) summaryBox.hidden = true;
      renderStatus("Nenhum produto encontrado", "Tente outro produto ou uma busca mais específica.");
      return;
    }

    if (summaryBox) {
      summaryBox.hidden = false;
      summaryBox.innerHTML = `
        <div>
          <strong>${products.length} ${products.length === 1 ? "produto encontrado" : "produtos encontrados"}</strong>
          <span>Resultados para “${escapeHtml(query)}”</span>
        </div>
        <span>Menor preço primeiro</span>`;
    }

    const favoriteIds = getFavoriteIds();

    productList.innerHTML = products
      .map((product, index) => productCardMarkup(product, index, favoriteIds))
      .join("");

    bindFavorites();
    updateFavoriteCounters();
  }

  function toggleFavorite(productId) {
    const id = String(productId);
    let saved = getFavoriteProducts();
    const exists = saved.some(item => String(item.productId) === id);

    if (exists) {
      saved = saved.filter(item => String(item.productId) !== id);
    } else {
      const product = currentProducts.find(item => String(item.productId) === id);
      if (product) saved.push(product);
    }

    saveFavoriteProducts(saved);
    updateFavoriteCounters();

    document.querySelectorAll(`[data-favorite="${CSS.escape(id)}"]`).forEach(button => {
      const active = saved.some(item => String(item.productId) === id);
      button.textContent = active ? "♥" : "♡";
      button.setAttribute(
        "aria-label",
        active ? "Remover dos favoritos" : "Favoritar produto"
      );
    });

    renderFavoritesModal();
  }

  function bindFavorites() {
    document.querySelectorAll("[data-favorite]").forEach(button => {
      button.onclick = () => toggleFavorite(button.dataset.favorite);
    });
  }

  function dedupeProducts(products) {
    const map = new Map();

    products.forEach(product => {
      const key = product.productId || product.id || `${product.title}-${product.price}`;
      const old = map.get(key);

      if (!old || product.price < old.price) {
        map.set(key, product);
      }
    });

    return [...map.values()];
  }

  async function fetchOneQuery(query) {
    const response = await fetch(
      `${CONFIG.api}?q=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (!data?.ok || !Array.isArray(data.results)) {
      throw new Error("Resposta inválida");
    }

    return data.results
      .map(normalizeProduct)
      .filter(product => product.id && product.price > 0)
      .filter(product => relevantProduct(product, query));
  }

  async function searchProducts(term = null, scroll = true) {
    const rawTerm = String(term ?? searchInput?.value ?? "").trim();
    const plan = searchPlan(rawTerm);

    if (!plan.queries.length) {
      searchInput?.focus();
      return;
    }

    if (summaryBox) summaryBox.hidden = true;
    renderStatus("Buscando ofertas...", "Consultando produtos e preços reais.");

    try {
      const results = await Promise.allSettled(plan.queries.map(fetchOneQuery));

      const products = dedupeProducts(
        results
          .filter(result => result.status === "fulfilled")
          .flatMap(result => result.value)
      )
        .sort((a, b) => a.price - b.price)
        .slice(0, 24);

      if (!products.length) {
        throw new Error("Nenhum resultado válido");
      }

      renderProducts(products, plan.label);

      if (scroll) {
        offersSection?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    } catch (error) {
      console.error("[ACHOU!] Erro na busca:", error);
      renderStatus(
        "Não foi possível buscar agora",
        "Tente novamente em alguns instantes."
      );
    }
  }

  function createFavoritesModal() {
    if (document.querySelector("#favoritesModal")) return;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "favoritesModal";
    modal.innerHTML = `
      <div class="modal-box favorites-modal-box">
        <button class="modal-close favorites-close" type="button" aria-label="Fechar">×</button>
        <div class="favorites-header">
          <div class="modal-logo">ACHOU<span>!</span></div>
          <h2>Seus favoritos</h2>
          <p>Produtos salvos neste aparelho para você encontrar novamente com facilidade.</p>
        </div>
        <div id="favoritesModalContent"></div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".favorites-close")?.addEventListener("click", closeFavorites);
    modal.addEventListener("click", event => {
      if (event.target === modal) closeFavorites();
    });
  }

  function renderFavoritesModal() {
    const container = document.querySelector("#favoritesModalContent");
    if (!container) return;

    const favorites = getFavoriteProducts();

    if (!favorites.length) {
      container.innerHTML = `
        <div class="favorites-empty">
          <strong>Nenhum favorito ainda</strong>
          Toque no coração de um produto para salvá-lo aqui.
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="favorites-grid">
        ${favorites.map(product => `
          <article class="favorite-saved-card">
            <div class="favorite-saved-image">
              ${
                product.image
                  ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" loading="lazy" referrerpolicy="no-referrer">`
                  : `<span style="color:#777;font-size:10px">Sem imagem</span>`
              }
            </div>
            <div class="favorite-saved-info">
              <span class="achou-source"><i class="achou-source-dot"></i>${escapeHtml(sourceLabel(product.source))}</span>
              <strong>${escapeHtml(product.title)}</strong>
              <strong class="favorite-saved-price">${money(product.price)}</strong>
              <div class="favorite-saved-actions">
                ${
                  validUrl(product.affiliateUrl)
                    ? `<a href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="noopener noreferrer sponsored">VER OFERTA</a>`
                    : `<a style="pointer-events:none;opacity:.5">SEM LINK</a>`
                }
                <button type="button" data-remove-favorite="${escapeHtml(product.productId)}" aria-label="Remover favorito">×</button>
              </div>
            </div>
          </article>
        `).join("")}
      </div>`;

    container.querySelectorAll("[data-remove-favorite]").forEach(button => {
      button.addEventListener("click", () => toggleFavorite(button.dataset.removeFavorite));
    });
  }

  function openFavorites() {
    const modal = document.querySelector("#favoritesModal");
    if (!modal) return;
    renderFavoritesModal();
    modal.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function closeFavorites() {
    const modal = document.querySelector("#favoritesModal");
    modal?.classList.remove("active");
    if (!document.querySelector(".modal.active") && !document.querySelector(".achou-drawer.active")) {
      document.body.classList.remove("modal-open");
    }
  }

  function createDrawer() {
    if (document.querySelector("#achouDrawer")) return;

    const backdrop = document.createElement("div");
    backdrop.className = "achou-drawer-backdrop";
    backdrop.id = "achouDrawerBackdrop";

    const drawer = document.createElement("aside");
    drawer.className = "achou-drawer";
    drawer.id = "achouDrawer";
    drawer.setAttribute("aria-hidden", "true");

    drawer.innerHTML = `
      <div class="achou-drawer-head">
        <div class="achou-drawer-logo">ACHOU<span>!</span></div>
        <button class="achou-drawer-close" type="button" aria-label="Fechar">×</button>
      </div>

      <form class="achou-drawer-search" id="drawerSearchForm">
        <input id="drawerSearchInput" type="search" placeholder="O que você procura?" autocomplete="off">
        <button type="submit">⌕</button>
      </form>

      <span class="achou-drawer-title">Moda</span>
      <div class="achou-drawer-grid">
        <button type="button" data-drawer-search="camiseta">Camisetas</button>
        <button type="button" data-drawer-search="moletom">Moletons</button>
        <button type="button" data-drawer-search="calça jeans">Calças</button>
        <button type="button" data-drawer-search="vestido feminino">Vestidos</button>
        <button type="button" data-drawer-search="tênis">Tênis</button>
        <button type="button" data-drawer-search="infantil criança roupa">Infantil</button>
      </div>

      <span class="achou-drawer-title">Eletrônicos</span>
      <div class="achou-drawer-grid">
        <button type="button" data-drawer-search="celular smartphone">Celulares</button>
        <button type="button" data-drawer-search="fone bluetooth">Fones</button>
        <button type="button" data-drawer-search="caixa de som bluetooth">Caixas de som</button>
        <button type="button" data-drawer-search="carregador celular">Carregadores</button>
        <button type="button" data-drawer-search="smartwatch relógio inteligente">Smartwatches</button>
        <button type="button" data-drawer-search="ofertas">Ofertas</button>
      </div>

      <div class="achou-drawer-actions">
        <button type="button" data-drawer-action="favorites">♡ &nbsp; Meus favoritos</button>
        <button type="button" data-drawer-action="cart">🛒 &nbsp; Como comprar</button>
      </div>
    `;

    document.body.append(backdrop, drawer);

    drawer.querySelector(".achou-drawer-close")?.addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);

    drawer.querySelector("#drawerSearchForm")?.addEventListener("submit", event => {
      event.preventDefault();
      const value = drawer.querySelector("#drawerSearchInput")?.value.trim();
      if (!value) return;
      if (searchInput) searchInput.value = value;
      closeDrawer();
      searchProducts(value);
    });

    drawer.querySelectorAll("[data-drawer-search]").forEach(button => {
      button.addEventListener("click", () => {
        const term = button.dataset.drawerSearch;
        if (searchInput) searchInput.value = term;
        closeDrawer();
        searchProducts(term);
      });
    });

    drawer.querySelector('[data-drawer-action="favorites"]')?.addEventListener("click", () => {
      closeDrawer();
      openFavorites();
    });

    drawer.querySelector('[data-drawer-action="cart"]')?.addEventListener("click", () => {
      closeDrawer();
      openPartnerInfo();
    });
  }

  function openDrawer(focusSearch = false) {
    const drawer = document.querySelector("#achouDrawer");
    const backdrop = document.querySelector("#achouDrawerBackdrop");
    if (!drawer || !backdrop) return;

    drawer.classList.add("active");
    backdrop.classList.add("active");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    if (focusSearch) {
      setTimeout(() => drawer.querySelector("#drawerSearchInput")?.focus(), 250);
    }
  }

  function closeDrawer() {
    const drawer = document.querySelector("#achouDrawer");
    const backdrop = document.querySelector("#achouDrawerBackdrop");

    drawer?.classList.remove("active");
    backdrop?.classList.remove("active");
    drawer?.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".modal.active")) {
      document.body.classList.remove("modal-open");
    }
  }

  searchForm?.addEventListener("submit", event => {
    event.preventDefault();
    searchProducts();
  });

  document.querySelectorAll("[data-search]").forEach(button => {
    button.addEventListener("click", () => {
      const term = button.dataset.search;
      if (searchInput) searchInput.value = term;
      searchProducts(term);
    });
  });

  document.querySelector("#showAllProducts")?.addEventListener("click", () => {
    searchProducts("ofertas");
  });

  document.querySelector(".favorites-shortcut")?.addEventListener("click", openFavorites);

  document.querySelector(".cart-button")?.addEventListener("click", () => {
    openPartnerInfo();
  });

  document.querySelector(".menu-button")?.addEventListener("click", () => {
    openDrawer(false);
  });

  document.querySelectorAll(".bottom-nav button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".bottom-nav button")
        .forEach(item => item.classList.remove("active"));

      button.classList.add("active");
      const action = button.dataset.nav;

      if (action === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (action === "categories") {
        openDrawer(false);
      }

      if (action === "search") {
        openDrawer(true);
      }

      if (action === "favorites") {
        openFavorites();
      }

      if (action === "cart") {
        openPartnerInfo();
      }
    });
  });

  const loginModal = document.querySelector("#loginModal");
  const signupModal = document.querySelector("#signupModal");
  const partnerInfoModal = document.querySelector("#partnerInfoModal");

  function openPartnerInfo() {
    if (!partnerInfoModal) return;
    partnerInfoModal.classList.add("active");
    partnerInfoModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closePartnerInfo() {
    if (!partnerInfoModal) return;
    partnerInfoModal.classList.remove("active");
    partnerInfoModal.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".modal.active") && !document.querySelector(".achou-drawer.active")) {
      document.body.classList.remove("modal-open");
    }
  }

  function openModal(modal) {
    modal?.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function closeModal(modal) {
    modal?.classList.remove("active");

    if (!document.querySelector(".modal.active") && !document.querySelector(".achou-drawer.active")) {
      document.body.classList.remove("modal-open");
    }
  }

  document.querySelector(".account-button")?.addEventListener("click", () => {
    openModal(loginModal);
  });

  document.querySelector(".login-close")?.addEventListener("click", () => {
    closeModal(loginModal);
  });

  document.querySelector(".signup-close")?.addEventListener("click", () => {
    closeModal(signupModal);
  });

  document.querySelector(".create-account")?.addEventListener("click", () => {
    closeModal(loginModal);
    openModal(signupModal);
  });

  document.querySelector(".signup-login")?.addEventListener("click", () => {
    closeModal(signupModal);
    openModal(loginModal);
  });

  loginModal?.addEventListener("click", event => {
    if (event.target === loginModal) closeModal(loginModal);
  });

  signupModal?.addEventListener("click", event => {
    if (event.target === signupModal) closeModal(signupModal);
  });

  function updateAccountUI(user) {
    const copy = document.querySelector(".account-button>span:last-child");
    if (!copy) return;

    if (!user) {
      copy.innerHTML = "<strong>Entrar</strong><small>ou cadastrar</small>";
      return;
    }

    const fullName =
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Usuário";

    const firstName = String(fullName).trim().split(/\s+/)[0];

    copy.innerHTML = `
      <strong>${escapeHtml(firstName)}</strong>
      <small>minha conta</small>`;
  }

  document.querySelector("#loginForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!db) {
      alert("Login indisponível no momento.");
      return;
    }

    const email = document.querySelector("#loginEmail").value.trim();
    const password = document.querySelector("#loginPassword").value;

    try {
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      updateAccountUI(data?.user || null);
      closeModal(loginModal);
    } catch {
      alert("Não foi possível entrar. Confira seu e-mail e senha.");
    }
  });

  document.querySelector("#signupForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!db) {
      alert("Cadastro indisponível no momento.");
      return;
    }

    const full_name = document.querySelector("#signupName").value.trim();
    const email = document.querySelector("#signupEmail").value.trim();
    const password = document.querySelector("#signupPassword").value;

    try {
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: { full_name }
        }
      });

      if (error) throw error;

      alert("Conta criada com sucesso.");
      updateAccountUI(data?.user || null);
      closeModal(signupModal);
    } catch {
      alert("Não foi possível criar sua conta.");
    }
  });

  db?.auth.getUser()
    .then(({ data }) => {
      updateAccountUI(data?.user || null);
    })
    .catch(() => {
      updateAccountUI(null);
    });

  document.querySelector(".partner-info-close")?.addEventListener("click", closePartnerInfo);
  document.querySelector(".partner-info-ok")?.addEventListener("click", closePartnerInfo);

  partnerInfoModal?.addEventListener("click", event => {
    if (event.target === partnerInfoModal) closePartnerInfo();
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    closeModal(loginModal);
    closeModal(signupModal);
    closePartnerInfo();
    closeFavorites();
    closeDrawer();
  });


  function updatePartnerCopy() {
    const partnersSection = document.querySelector(".partners-section");
    if (partnersSection) {
      const title = partnersSection.querySelector(".section-heading h2");
      const action = partnersSection.querySelector(".section-heading span");

      if (title) {
        title.textContent = "Lojas e marcas que você encontra no ACHOU!";
      }

      if (action) {
        action.textContent = "Conheça algumas ›";
      }
    }

    const infoText = document.querySelector(".achou-info-text");
    if (infoText) {
      infoText.textContent =
        "O ACHOU! compara ofertas de moda e eletrônicos e direciona você para a loja onde a oferta está disponível, como Mercado Livre, Amazon e outras.";
    }

    document.querySelectorAll(".hero-benefits small").forEach(item => {
      if (item.textContent.trim().toLowerCase() === "na loja parceira") {
        item.textContent = "na loja da oferta";
      }
    });
  }

  function initHeroCarousel() {
    const hero = document.querySelector("#heroCarousel");
    const track = hero?.querySelector(".hero-track");
    const slides = hero ? [...hero.querySelectorAll(".hero-slide")] : [];
    const dots = hero ? [...hero.querySelectorAll("[data-hero-dot]")] : [];

    if (!hero || !track || slides.length < 2) return;

    let index = 0;
    let timer = null;
    let startX = 0;
    let currentX = 0;
    let dragging = false;

    const render = (animate = true) => {
      track.style.transition = animate ? "" : "none";
      track.style.transform = `translate3d(-${index * 100}%,0,0)`;

      slides.forEach((slide, i) => slide.classList.toggle("active", i === index));

      dots.forEach((dot, i) => {
        const active = i === index;
        dot.classList.toggle("active", active);
        dot.setAttribute("aria-selected", String(active));
      });

      if (!animate) {
        requestAnimationFrame(() => {
          track.style.transition = "";
        });
      }
    };

    const goTo = next => {
      index = (next + slides.length) % slides.length;
      render(true);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      timer = setInterval(() => goTo(index + 1), CONFIG.heroInterval);
    };

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        goTo(i);
        start();
      });
    });

    const pointerDown = event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true;
      startX = event.clientX;
      currentX = startX;
      hero.classList.add("is-dragging");
      stop();
      hero.setPointerCapture?.(event.pointerId);
    };

    const pointerMove = event => {
      if (!dragging) return;
      currentX = event.clientX;
      const dx = currentX - startX;
      const width = hero.clientWidth || 1;
      const percent = (dx / width) * 100;
      track.style.transform = `translate3d(calc(-${index * 100}% + ${percent}%),0,0)`;
    };

    const pointerUp = event => {
      if (!dragging) return;
      dragging = false;
      hero.classList.remove("is-dragging");

      const dx = currentX - startX;

      if (Math.abs(dx) > 45) {
        goTo(index + (dx < 0 ? 1 : -1));
      } else {
        render(true);
      }

      hero.releasePointerCapture?.(event.pointerId);
      start();
    };

    hero.addEventListener("pointerdown", pointerDown);
    hero.addEventListener("pointermove", pointerMove);
    hero.addEventListener("pointerup", pointerUp);
    hero.addEventListener("pointercancel", pointerUp);
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);

    document.addEventListener("visibilitychange", () => {
      document.hidden ? stop() : start();
    });

    render(false);
    start();
  }

  injectEnhancementStyles();
  updatePartnerCopy();
  createFavoritesModal();
  createDrawer();
  initHeroCarousel();
  updateFavoriteCounters();
  searchProducts(CONFIG.initialQuery, false);
});
