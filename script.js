/* =========================================================
   ACHOU! - SCRIPT PRINCIPAL
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     CONFIGURAÇÕES
     ======================================================= */

  const CONFIG = {
    currency: "BRL",
    locale: "pt-BR",
    heroInterval: 5000
  };

  /* =======================================================
     PRODUTOS TEMPORÁRIOS
     Depois estes dados serão substituídos pela API real.
     ======================================================= */

  const products = [
    {
      id: 1,
      title: "Smartphone Samsung Galaxy",
      category: "Celulares",
      price: 1299.90,
      oldPrice: 1599.90,
      discount: 19,
      rating: 4.8,
      store: "Mercado Livre",
      image: "📱",
      link: "#"
    },
    {
      id: 2,
      title: "Notebook Lenovo IdeaPad",
      category: "Informática",
      price: 2499.90,
      oldPrice: 2999.90,
      discount: 17,
      rating: 4.7,
      store: "Amazon",
      image: "💻",
      link: "#"
    },
    {
      id: 3,
      title: "Fone Bluetooth Sem Fio",
      category: "Áudio",
      price: 149.90,
      oldPrice: 219.90,
      discount: 32,
      rating: 4.6,
      store: "Shopee",
      image: "🎧",
      link: "#"
    },
    {
      id: 4,
      title: "Smart TV 50 Polegadas 4K",
      category: "TV",
      price: 1999.90,
      oldPrice: 2499.90,
      discount: 20,
      rating: 4.9,
      store: "Magalu",
      image: "📺",
      link: "#"
    },
    {
      id: 5,
      title: "Console PlayStation 5",
      category: "Games",
      price: 3499.90,
      oldPrice: 3999.90,
      discount: 13,
      rating: 4.9,
      store: "KaBuM!",
      image: "🎮",
      link: "#"
    }
  ];

  /* =======================================================
     FUNÇÕES ÚTEIS
     ======================================================= */

  function money(value) {
    return Number(value).toLocaleString(CONFIG.locale, {
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

  function showMessage(message) {
    console.log("[ACHOU!]", message);
  }

  /* =======================================================
     BUSCA
     ======================================================= */

  const searchInput = document.querySelector(".search-box input");
  const searchButton = document.querySelector(".search-box button");

  function searchProducts() {

    if (!searchInput) return;

    const term = normalizeText(searchInput.value);

    if (!term) {
      renderProducts(products);
      return;
    }

    const filtered = products.filter(product => {

      const searchable = normalizeText(
        `${product.title} ${product.category} ${product.store}`
      );

      return searchable.includes(term);
    });

    renderProducts(filtered);

    const marketSection = document.querySelector(".market-section");

    if (marketSection) {
      marketSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  if (searchButton) {
    searchButton.addEventListener("click", searchProducts);
  }

  if (searchInput) {

    searchInput.addEventListener("keydown", event => {

      if (event.key === "Enter") {
        searchProducts();
      }

    });

  }

  /* =======================================================
     RENDERIZAÇÃO DE PRODUTOS
     ======================================================= */

  const dealsContainer = document.querySelector(".flash-deals");

  function renderProducts(list) {

    if (!dealsContainer) return;

    if (!list.length) {

      dealsContainer.innerHTML = `
        <div style="
          padding:30px 20px;
          border:1px solid #292929;
          border-radius:12px;
          color:#999;
          width:100%;
          text-align:center;
          font-size:11px;
        ">
          Nenhum produto encontrado.
        </div>
      `;

      return;
    }

    dealsContainer.innerHTML = list.map(product => `

      <article class="flash-card" data-id="${product.id}">

        <span class="discount">
          -${product.discount}%
        </span>

        <button
          class="product-favorite"
          type="button"
          data-favorite="${product.id}"
          aria-label="Favoritar produto"
        >
          ♡
        </button>

        <div class="flash-photo">
          ${product.image}
        </div>

        <h3>${product.title}</h3>

        <span class="old-price">
          ${money(product.oldPrice)}
        </span>

        <strong class="flash-price">
          ${money(product.price)}
        </strong>

        <div class="product-bottom">

          <span>
            ${product.store}
          </span>

          <span class="rating">
            ★ ${product.rating}
          </span>

        </div>

        <a
          href="${product.link}"
          class="offer"
          data-product="${product.id}"
        >
          VER OFERTA
        </a>

      </article>

    `).join("");

    bindFavorites();
    bindOfferLinks();
  }

  /* =======================================================
     FAVORITOS
     ======================================================= */

  function getFavorites() {

    try {
      return JSON.parse(
        localStorage.getItem("achou_favorites")
      ) || [];
    } catch {
      return [];
    }

  }

  function saveFavorites(favorites) {

    localStorage.setItem(
      "achou_favorites",
      JSON.stringify(favorites)
    );

  }

  function bindFavorites() {

    const buttons = document.querySelectorAll(
      "[data-favorite]"
    );

    const favorites = getFavorites();

    buttons.forEach(button => {

      const id = Number(button.dataset.favorite);

      if (favorites.includes(id)) {
        button.textContent = "♥";
      }

      button.addEventListener("click", () => {

        let current = getFavorites();

        if (current.includes(id)) {

          current = current.filter(
            item => item !== id
          );

          button.textContent = "♡";

        } else {

          current.push(id);

          button.textContent = "♥";

        }

        saveFavorites(current);

        updateFavoriteCounter();

      });

    });

    updateFavoriteCounter();
  }

  function updateFavoriteCounter() {

    const favorites = getFavorites();

    const counters = document.querySelectorAll(
      ".favorite-count"
    );

    counters.forEach(counter => {
      counter.textContent = favorites.length;
    });

  }

  /* =======================================================
     LINKS DAS OFERTAS
     ======================================================= */

  function bindOfferLinks() {

    document
      .querySelectorAll("[data-product]")
      .forEach(link => {

        link.addEventListener("click", event => {

          const id = Number(
            link.dataset.product
          );

          const product = products.find(
            item => item.id === id
          );

          if (!product) return;

          if (
            !product.link ||
            product.link === "#"
          ) {

            event.preventDefault();

            alert(
              "Essa oferta ainda está aguardando a integração com a loja."
            );

          }

        });

      });

  }

  /* =======================================================
     CATEGORIAS
     ======================================================= */

  const categoryButtons = document.querySelectorAll(
    ".category-nav-item, .quick-category, .popular-tags button"
  );

  categoryButtons.forEach(button => {

    button.addEventListener("click", () => {

      const text = normalizeText(
        button.textContent
      );

      document
        .querySelectorAll(".category-nav-item")
        .forEach(item => {
          item.classList.remove("active");
        });

      if (
        button.classList.contains(
          "category-nav-item"
        )
      ) {
        button.classList.add("active");
      }

      if (
        text === "todos" ||
        text === "inicio" ||
        text === "ofertas"
      ) {

        renderProducts(products);
        return;

      }

      const filtered = products.filter(
        product =>
          normalizeText(product.category)
            .includes(text) ||
          normalizeText(product.title)
            .includes(text)
      );

      if (filtered.length) {
        renderProducts(filtered);
      }

    });

  });

  /* =======================================================
     BANNER / HERO
     ======================================================= */

  const heroSlides = [
    {
      label: "OFERTAS SELECIONADAS",
      title: "COMPARE ANTES DE COMPRAR",
      text: "A gente procura os melhores preços para você economizar."
    },
    {
      label: "PREÇOS EM UM SÓ LUGAR",
      title: "ENCONTRE A MELHOR OFERTA",
      text: "Compare preços entre diferentes lojas antes de comprar."
    },
    {
      label: "ACHOU!",
      title: "VOCÊ PROCURA. A GENTE COMPARA.",
      text: "Menos tempo procurando. Mais dinheiro economizado."
    }
  ];

  let heroIndex = 0;

  const heroLabel = document.querySelector(
    ".hero-small-title"
  );

  const heroTitle = document.querySelector(
    ".hero-banner h1"
  );

  const heroText = document.querySelector(
    ".hero-banner p"
  );

  const heroPrev = document.querySelector(
    ".hero-prev"
  );

  const heroNext = document.querySelector(
    ".hero-next"
  );

  const heroDots = document.querySelectorAll(
    ".hero-dot"
  );

  function renderHero(index) {

    if (!heroSlides.length) return;

    heroIndex =
      (index + heroSlides.length) %
      heroSlides.length;

    const slide = heroSlides[heroIndex];

    if (heroLabel) {
      heroLabel.textContent = slide.label;
    }

    if (heroTitle) {
      heroTitle.innerHTML =
        `<strong>${slide.title}</strong>`;
    }

    if (heroText) {
      heroText.textContent = slide.text;
    }

    heroDots.forEach(
      (dot, index) => {

        dot.classList.toggle(
          "active",
          index === heroIndex
        );

      }
    );

  }

  if (heroPrev) {

    heroPrev.addEventListener(
      "click",
      () => {
        renderHero(heroIndex - 1);
      }
    );

  }

  if (heroNext) {

    heroNext.addEventListener(
      "click",
      () => {
        renderHero(heroIndex + 1);
      }
    );

  }

  heroDots.forEach(
    (dot, index) => {

      dot.addEventListener(
        "click",
        () => {
          renderHero(index);
        }
      );

    }
  );

  if (
    heroSlides.length > 1 &&
    heroTitle
  ) {

    setInterval(() => {

      renderHero(heroIndex + 1);

    }, CONFIG.heroInterval);

  }

  /* =======================================================
     CONTADOR DE OFERTA
     ======================================================= */

  const timer = document.querySelector(
    ".deal-timer strong"
  );

  let secondsRemaining =
    (2 * 60 * 60) +
    (47 * 60) +
    32;

  function updateTimer() {

    if (!timer) return;

    if (secondsRemaining <= 0) {

      secondsRemaining =
        (2 * 60 * 60) +
        (47 * 60) +
        32;

    }

    const hours =
      Math.floor(
        secondsRemaining / 3600
      );

    const minutes =
      Math.floor(
        (secondsRemaining % 3600) / 60
      );

    const seconds =
      secondsRemaining % 60;

    timer.textContent =
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;

    secondsRemaining--;

  }

  updateTimer();

  setInterval(
    updateTimer,
    1000
  );

  /* =======================================================
     LOGIN
     ======================================================= */

  const loginModal =
    document.querySelector(".login-modal");

  const signupModal =
    document.querySelector(".signup-modal");

  const accountButton =
    document.querySelector(".account-button");

  const loginClose =
    document.querySelector(".login-close");

  const signupClose =
    document.querySelector(".signup-close");

  const createAccount =
    document.querySelector(".create-account");

  const signupLogin =
    document.querySelector(".signup-login");

  function openLogin() {

    if (!loginModal) return;

    loginModal.classList.add("active");

    document.body.classList.add(
      "modal-open"
    );

  }

  function closeLogin() {

    if (!loginModal) return;

    loginModal.classList.remove(
      "active"
    );

    document.body.classList.remove(
      "modal-open"
    );

  }

  function openSignup() {

    if (!signupModal) return;

    signupModal.classList.add(
      "active"
    );

    document.body.classList.add(
      "modal-open"
    );

  }

  function closeSignup() {

    if (!signupModal) return;

    signupModal.classList.remove(
      "active"
    );

    document.body.classList.remove(
      "modal-open"
    );

  }

  if (accountButton) {
    accountButton.addEventListener(
      "click",
      openLogin
    );
  }

  if (loginClose) {
    loginClose.addEventListener(
      "click",
      closeLogin
    );
  }

  if (signupClose) {
    signupClose.addEventListener(
      "click",
      closeSignup
    );
  }

  if (createAccount) {

    createAccount.addEventListener(
      "click",
      () => {

        closeLogin();
        openSignup();

      }
    );

  }

  if (signupLogin) {

    signupLogin.addEventListener(
      "click",
      () => {

        closeSignup();
        openLogin();

      }
    );

  }

  if (loginModal) {

    loginModal.addEventListener(
      "click",
      event => {

        if (
          event.target === loginModal
        ) {
          closeLogin();
        }

      }
    );

  }

  if (signupModal) {

    signupModal.addEventListener(
      "click",
      event => {

        if (
          event.target === signupModal
        ) {
          closeSignup();
        }

      }
    );

  }

  /* =======================================================
     ESC PARA FECHAR MODAIS
     ======================================================= */

  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        closeLogin();
        closeSignup();

      }

    }
  );

  /* =======================================================
     NAVEGAÇÃO INFERIOR
     ======================================================= */

  const bottomItems =
    document.querySelectorAll(
      ".bottom-nav-item"
    );

  bottomItems.forEach(item => {

    item.addEventListener(
      "click",
      () => {

        bottomItems.forEach(nav => {
          nav.classList.remove("active");
        });

        item.classList.add("active");

      }
    );

  });

  /* =======================================================
     HERO CTA
     ======================================================= */

  const heroCTA =
    document.querySelector(".hero-cta");

  if (heroCTA) {

    heroCTA.addEventListener(
      "click",
      () => {

        if (searchInput) {

          searchInput.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

          setTimeout(() => {
            searchInput.focus();
          }, 500);

        }

      }
    );

  }

  /* =======================================================
     INICIALIZAÇÃO
     ======================================================= */

  renderProducts(products);
  renderHero(0);
  updateFavoriteCounter();

  showMessage(
    "Site ACHOU! carregado com sucesso."
  );

});
