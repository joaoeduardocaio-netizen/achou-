/* =========================================================
   ACHOU! — SCRIPT PRINCIPAL
   Somente produtos e preços reais.
   Nenhuma oferta fictícia é criada pelo site.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const CONFIG = {
    locale: "pt-BR",
    currency: "BRL",
    heroInterval: 5000
  };

  /*
   * ========================================================
   * PRODUTOS
   * ========================================================
   *
   * IMPORTANTE:
   * Esta lista começa VAZIA de propósito.
   *
   * Produtos só serão adicionados quando vierem de
   * uma fonte/API real.
   *
   * NÃO adicionar preços, fotos ou produtos fictícios aqui.
   */

  let products = [];


  /* ========================================================
     FUNÇÕES AUXILIARES
     ======================================================== */

  function money(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "";
    }

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


  /* ========================================================
     ELEMENTOS PRINCIPAIS
     ======================================================== */

  const searchInput =
    document.querySelector(".search-box input");

  const searchButton =
    document.querySelector(".search-box button");

  const dealsContainer =
    document.querySelector(".flash-deals");


  /* ========================================================
     PRODUTOS REAIS
     ======================================================== */

  function renderProducts(list = []) {

    if (!dealsContainer) return;

    /*
     * Se não existem produtos reais,
     * não mostramos nenhuma oferta inventada.
     */

    if (!Array.isArray(list) || list.length === 0) {

      dealsContainer.innerHTML = `
        <div style="
          width:100%;
          padding:28px 18px;
          border:1px solid #292929;
          border-radius:12px;
          background:#050505;
          text-align:center;
        ">

          <strong style="
            display:block;
            color:#fff;
            font-size:11px;
            margin-bottom:7px;
          ">
            Nenhuma oferta carregada
          </strong>

          <span style="
            display:block;
            color:#777;
            font-size:8px;
            line-height:1.5;
          ">
            As ofertas reais aparecerão aqui
            quando a integração com as lojas
            estiver disponível.
          </span>

        </div>
      `;

      return;
    }


    dealsContainer.innerHTML = list.map(product => {

      /*
       * Validação mínima.
       * Um produto precisa ter dados reais
       * antes de aparecer no ACHOU!.
       */

      if (
        !product ||
        !product.title ||
        !product.price ||
        !product.link
      ) {
        return "";
      }


      const image = product.image
        ? `
          <img
            src="${product.image}"
            alt="${product.title}"
            loading="lazy"
            style="
              width:100%;
              height:100%;
              object-fit:contain;
            "
          >
        `
        : `
          <span style="
            color:#666;
            font-size:8px;
          ">
            Imagem indisponível
          </span>
        `;


      const oldPrice =
        product.oldPrice &&
        Number(product.oldPrice) >
        Number(product.price)

          ? `
            <span class="old-price">
              ${money(product.oldPrice)}
            </span>
          `

          : "";


      const discount =
        product.discount

          ? `
            <span class="discount">
              -${product.discount}%
            </span>
          `

          : "";


      const rating =
        product.rating

          ? `
            <span class="rating">
              ★ ${product.rating}
            </span>
          `

          : "";


      return `

        <article
          class="flash-card"
          data-id="${product.id || ""}"
        >

          ${discount}

          <button
            class="product-favorite"
            type="button"
            data-favorite="${product.id || ""}"
            aria-label="Favoritar produto"
          >
            ♡
          </button>


          <div class="flash-photo">
            ${image}
          </div>


          <h3>
            ${product.title}
          </h3>


          ${oldPrice}


          <strong class="flash-price">
            ${money(product.price)}
          </strong>


          <div class="product-bottom">

            <span>
              ${product.store || "Loja parceira"}
            </span>

            ${rating}

          </div>


          <a
            href="${product.link}"
            class="offer"
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            VER OFERTA
          </a>

        </article>

      `;

    }).join("");


    bindFavorites();

  }


  /* ========================================================
     BUSCA
     ======================================================== */

  function searchProducts() {

    if (!searchInput) return;

    const term =
      normalizeText(searchInput.value);


    /*
     * Enquanto não houver API/fonte conectada,
     * não simulamos resultados.
     */

    if (!products.length) {

      if (dealsContainer) {

        dealsContainer.innerHTML = `
          <div style="
            width:100%;
            padding:28px 18px;
            border:1px solid #292929;
            border-radius:12px;
            background:#050505;
            text-align:center;
          ">

            <strong style="
              display:block;
              color:#fff;
              font-size:11px;
              margin-bottom:7px;
            ">
              Busca de ofertas reais ainda não conectada
            </strong>

            <span style="
              display:block;
              color:#777;
              font-size:8px;
              line-height:1.5;
            ">
              Nenhum produto ou preço fictício
              será exibido pelo ACHOU!.
            </span>

          </div>
        `;

      }

      return;

    }


    if (!term) {

      renderProducts(products);

      return;

    }


    const filtered =
      products.filter(product => {

        const searchable =
          normalizeText(
            `${product.title || ""}
             ${product.category || ""}
             ${product.store || ""}`
          );

        return searchable.includes(term);

      });


    renderProducts(filtered);


    const marketSection =
      document.querySelector(".market-section");

    if (marketSection) {

      marketSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

  }


  if (searchButton) {

    searchButton.addEventListener(
      "click",
      searchProducts
    );

  }


  if (searchInput) {

    searchInput.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          searchProducts();
        }

      }
    );

  }


  /* ========================================================
     FAVORITOS
     ======================================================== */

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

    const buttons =
      document.querySelectorAll(
        "[data-favorite]"
      );


    buttons.forEach(button => {

      const id =
        String(button.dataset.favorite);

      if (!id) return;


      const favorites =
        getFavorites().map(String);


      if (favorites.includes(id)) {
        button.textContent = "♥";
      }


      button.addEventListener(
        "click",
        () => {

          let current =
            getFavorites().map(String);


          if (current.includes(id)) {

            current =
              current.filter(
                item => item !== id
              );

            button.textContent = "♡";

          } else {

            current.push(id);

            button.textContent = "♥";

          }


          saveFavorites(current);

          updateFavoriteCounter();

        }
      );

    });


    updateFavoriteCounter();

  }


  function updateFavoriteCounter() {

    const favorites =
      getFavorites();


    document
      .querySelectorAll(".favorite-count")
      .forEach(counter => {

        counter.textContent =
          favorites.length;

      });

  }


  /* ========================================================
     CATEGORIAS
     ======================================================== */

  const categoryButtons =
    document.querySelectorAll(
      ".category-nav-item, .quick-category, .popular-tags button"
    );


  categoryButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const text =
          normalizeText(
            button.textContent
          );


        document
          .querySelectorAll(
            ".category-nav-item"
          )
          .forEach(item => {

            item.classList.remove(
              "active"
            );

          });


        if (
          button.classList.contains(
            "category-nav-item"
          )
        ) {

          button.classList.add(
            "active"
          );

        }


        if (!products.length) {

          renderProducts([]);

          return;

        }


        if (
          text === "todos" ||
          text === "inicio"
        ) {

          renderProducts(products);

          return;

        }


        const filtered =
          products.filter(product => {

            return (
              normalizeText(
                product.category
              ).includes(text) ||

              normalizeText(
                product.title
              ).includes(text)
            );

          });


        renderProducts(filtered);

      }
    );

  });


  /* ========================================================
     HERO
     ======================================================== */

  const heroSlides = [

    {
      label:
        "OFERTAS SELECIONADAS",

      title:
        "COMPARE ANTES DE COMPRAR",

      text:
        "A gente procura os melhores preços para você economizar."
    },

    {
      label:
        "PREÇOS EM UM SÓ LUGAR",

      title:
        "ENCONTRE A MELHOR OFERTA",

      text:
        "Compare preços entre diferentes lojas antes de comprar."
    },

    {
      label:
        "ACHOU!",

      title:
        "VOCÊ PROCURA. A GENTE COMPARA.",

      text:
        "Menos tempo procurando. Mais dinheiro economizado."
    }

  ];


  let heroIndex = 0;


  const heroLabel =
    document.querySelector(
      ".hero-small-title"
    );

  const heroTitle =
    document.querySelector(
      ".hero-banner h1"
    );

  const heroText =
    document.querySelector(
      ".hero-banner p"
    );

  const heroPrev =
    document.querySelector(
      ".hero-prev"
    );

  const heroNext =
    document.querySelector(
      ".hero-next"
    );

  const heroDots =
    document.querySelectorAll(
      ".hero-dot"
    );


  function renderHero(index) {

    heroIndex =
      (index + heroSlides.length) %
      heroSlides.length;


    const slide =
      heroSlides[heroIndex];


    if (heroLabel) {

      heroLabel.textContent =
        slide.label;

    }


    if (heroTitle) {

      heroTitle.innerHTML =
        `<strong>${slide.title}</strong>`;

    }


    if (heroText) {

      heroText.textContent =
        slide.text;

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

        renderHero(
          heroIndex - 1
        );

      }
    );

  }


  if (heroNext) {

    heroNext.addEventListener(
      "click",
      () => {

        renderHero(
          heroIndex + 1
        );

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


  if (heroTitle) {

    setInterval(
      () => {

        renderHero(
          heroIndex + 1
        );

      },
      CONFIG.heroInterval
    );

  }


  /* ========================================================
     BOTÃO DO HERO
     ======================================================== */

  const heroCTA =
    document.querySelector(
      ".hero-cta"
    );


  if (heroCTA) {

    heroCTA.addEventListener(
      "click",
      () => {

        if (!searchInput) return;


        searchInput.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });


        setTimeout(
          () => {
            searchInput.focus();
          },
          400
        );

      }
    );

  }


  /* ========================================================
     LOGIN / CADASTRO
     ======================================================== */

  const loginModal =
    document.querySelector(
      ".login-modal"
    );

  const signupModal =
    document.querySelector(
      ".signup-modal"
    );

  const accountButton =
    document.querySelector(
      ".account-button"
    );

  const loginClose =
    document.querySelector(
      ".login-close"
    );

  const signupClose =
    document.querySelector(
      ".signup-close"
    );

  const createAccount =
    document.querySelector(
      ".create-account"
    );

  const signupLogin =
    document.querySelector(
      ".signup-login"
    );


  function openLogin() {

    if (!loginModal) return;

    loginModal.classList.add(
      "active"
    );

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
          event.target ===
          loginModal
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
          event.target ===
          signupModal
        ) {

          closeSignup();

        }

      }
    );

  }


  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        closeLogin();

        closeSignup();

      }

    }
  );


  /* ========================================================
     MENU INFERIOR
     ======================================================== */

  const bottomItems =
    document.querySelectorAll(
      ".bottom-nav-item"
    );


  bottomItems.forEach(item => {

    item.addEventListener(
      "click",
      () => {

        bottomItems.forEach(
          nav => {

            nav.classList.remove(
              "active"
            );

          }
        );


        item.classList.add(
          "active"
        );

      }
    );

  });


  /* ========================================================
     INICIALIZAÇÃO
     ======================================================== */

  renderProducts([]);

  renderHero(0);

  updateFavoriteCounter();


  console.log(
    "[ACHOU!] Site carregado. Aguardando fonte de ofertas reais."
  );

});
