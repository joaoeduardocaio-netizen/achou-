document.addEventListener("DOMContentLoaded", () => {
  const CONFIG = {
    locale: "pt-BR",
    currency: "BRL",
    initialQuery: "tênis",
    heroInterval: 5000,
    api: "https://wulhcgkphclwgidqlvtr.supabase.co/functions/v1/mercadolivre-search",
    supabaseUrl: "https://wulhcgkphclwgidqlvtr.supabase.co",
    supabaseKey: "sb_publishable_Wi0Kz5aB4LeLnlxQE_34Yw_1KwA8ebc"
  };

  const CATEGORY_GROUPS = {
    moda: [
      "moda feminina",
      "moda masculina",
      "moda infantil",
      "moletom",
      "camiseta",
      "calça jeans",
      "tênis"
    ],
    eletronicos: [
      "celular",
      "fone bluetooth",
      "caixa de som bluetooth",
      "carregador celular",
      "smartwatch",
      "acessórios para celular"
    ]
  };

  let db = null;

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

  function updateFavoriteCounters() {
    const total = getFavorites().length;

    document.querySelectorAll(".favorite-count").forEach(el => {
      el.textContent = total;
    });
  }

  function normalizeProduct(item) {
    return {
      id: String(item.item_id || item.id || ""),
      productId: String(item.product_id || item.item_id || item.id || ""),
      title: item.title || "Produto",
      price: Number(item.price || 0),
      image: item.thumbnail || item.image || "",
      freeShipping: item.free_shipping === true,
      affiliateUrl: item.affiliate_url || item.permalink || item.url || ""
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

  function resolveSearchTerm(term) {
    const value = String(term || "").trim().toLowerCase();

    if (value === "moda") return "tênis";
    if (value === "eletrônicos" || value === "eletronicos") return "celular";

    return term;
  }

  function renderStatus(title, text) {
    productList.innerHTML = `
      <div class="search-status">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(text)}</span>
        </div>
      </div>`;
  }

  function renderProducts(products, query) {
    if (!products.length) {
      summaryBox.hidden = true;
      renderStatus("Nenhum produto encontrado", "Tente outro produto.");
      return;
    }

    summaryBox.hidden = false;

    summaryBox.innerHTML = `
      <div>
        <strong>${products.length} ${products.length === 1 ? "produto encontrado" : "produtos encontrados"}</strong>
        <span>Resultados para “${escapeHtml(query)}”</span>
      </div>
      <span>Menor preço primeiro</span>`;

    const favorites = getFavorites().map(String);

    productList.innerHTML = products.map((product, index) => {
      const isFavorite = favorites.includes(product.productId);
      const hasUrl = validUrl(product.affiliateUrl);

      return `
        <article class="product-card">
          <div class="product-image-wrap">
            <button
              class="favorite-button"
              type="button"
              data-favorite="${escapeHtml(product.productId)}"
              aria-label="Favoritar produto">
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
            <h3 class="product-title">${escapeHtml(product.title)}</h3>

            <div class="stars">
              ★★★★★ <small>(${40 + index * 23})</small>
            </div>

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
    }).join("");

    bindFavorites();
  }

  function bindFavorites() {
    document.querySelectorAll("[data-favorite]").forEach(button => {
      button.onclick = () => {
        const id = String(button.dataset.favorite);
        let favorites = getFavorites().map(String);

        if (favorites.includes(id)) {
          favorites = favorites.filter(item => item !== id);
          button.textContent = "♡";
        } else {
          favorites.push(id);
          button.textContent = "♥";
        }

        saveFavorites(favorites);
        updateFavoriteCounters();
      };
    });
  }

  async function searchProducts(term = null, scroll = true) {
    const query = String(resolveSearchTerm(term ?? searchInput?.value ?? "")).trim();

    if (!query) {
      searchInput?.focus();
      return;
    }

    summaryBox.hidden = true;
    renderStatus("Buscando ofertas...", "Consultando produtos e preços reais.");

    try {
      const response = await fetch(
        `${CONFIG.api}?q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data?.ok || !Array.isArray(data.results)) {
        throw new Error("Resposta inválida");
      }

      const products = data.results
        .map(normalizeProduct)
        .filter(product => product.id && product.price > 0)
        .sort((a, b) => a.price - b.price);

      renderProducts(products, query);

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

  searchForm?.addEventListener("submit", event => {
    event.preventDefault();
    searchProducts();
  });

  document.querySelectorAll("[data-search]").forEach(button => {
    button.addEventListener("click", () => {
      const term = button.dataset.search;

      if (searchInput) {
        searchInput.value = term;
      }

      searchProducts(term);
    });
  });

  document.querySelector("#showAllProducts")?.addEventListener("click", () => {
    searchProducts(CONFIG.initialQuery);
  });

  document.querySelector(".favorites-shortcut")?.addEventListener("click", () => {
    offersSection?.scrollIntoView({ behavior: "smooth" });
  });

  document.querySelector(".cart-button")?.addEventListener("click", () => {
    openPartnerInfo();
  });

  document.querySelector(".menu-button")?.addEventListener("click", () => {
    categoriesSection?.scrollIntoView({ behavior: "smooth" });
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
        categoriesSection?.scrollIntoView({ behavior: "smooth" });
      }

      if (action === "search") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => searchInput?.focus(), 350);
      }

      if (action === "favorites") {
        offersSection?.scrollIntoView({ behavior: "smooth" });
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

    if (!document.querySelector(".modal.active")) {
      document.body.classList.remove("modal-open");
    }
  }

  function openModal(modal) {
    modal?.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function closeModal(modal) {
    modal?.classList.remove("active");

    if (!document.querySelector(".modal.active")) {
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
    closePartnerInfo();
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
  });


  /* =========================================================
     HERO — CARROSSEL AUTOMÁTICO + BOLINHAS + ARRASTAR
     ========================================================= */
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
      if (!animate) requestAnimationFrame(() => { track.style.transition = ""; });
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
      if (Math.abs(dx) > 45) goTo(index + (dx < 0 ? 1 : -1));
      else render(true);
      hero.releasePointerCapture?.(event.pointerId);
      start();
    };

    hero.addEventListener("pointerdown", pointerDown);
    hero.addEventListener("pointermove", pointerMove);
    hero.addEventListener("pointerup", pointerUp);
    hero.addEventListener("pointercancel", pointerUp);
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());

    render(false);
    start();
  }

  initHeroCarousel();

  updateFavoriteCounters();
  searchProducts(CONFIG.initialQuery, false);
});
