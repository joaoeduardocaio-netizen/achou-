/* =========================================================
   ACHOU! — SCRIPT PRINCIPAL
   Produtos, preços e imagens reais.
   Nenhuma oferta fictícia é criada pelo site.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const CONFIG = {
    locale: "pt-BR",
    currency: "BRL",
    heroInterval: 5000,

    api:
      "https://wulhcgkphclwgidqlvtr.supabase.co/functions/v1/mercadolivre-search"
  };


  /* ========================================================
     PRODUTOS
     ======================================================== */

  let products = [];


  /* ========================================================
     FUNÇÕES AUXILIARES
     ======================================================== */

  function money(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "";
    }

    return number.toLocaleString(
      CONFIG.locale,
      {
        style: "currency",
        currency: CONFIG.currency
      }
    );

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

      const parsed =
        new URL(url);

      return (
        parsed.protocol === "https:" &&
        parsed.hostname === "meli.la"
      );

    } catch {

      return false;

    }

  }


  function calculateDiscount(
    oldPrice,
    currentPrice
  ) {

    const oldValue =
      Number(oldPrice);

    const currentValue =
      Number(currentPrice);

    if (
      !Number.isFinite(oldValue) ||
      !Number.isFinite(currentValue) ||
      oldValue <= currentValue ||
      currentValue <= 0
    ) {
      return null;
    }

    return Math.round(
      ((oldValue - currentValue) /
        oldValue) * 100
    );

  }


  /* ========================================================
     ELEMENTOS PRINCIPAIS
     ======================================================== */

  const searchInput =
    document.querySelector(
      ".search-box input"
    );

  const searchButton =
    document.querySelector(
      ".search-box button"
    );

  const dealsContainer =
    document.querySelector(
      ".flash-deals"
    );


  /* ========================================================
     ESTADOS DA BUSCA
     ======================================================== */

  function showLoading() {

    if (!dealsContainer) return;

    dealsContainer.innerHTML = `
      <div style="
        width:100%;
        padding:30px 18px;
        border:1px solid #292929;
        border-radius:12px;
        background:#050505;
        text-align:center;
      ">

        <strong style="
          display:block;
          color:#FFD400;
          font-size:12px;
          margin-bottom:8px;
        ">
          Procurando ofertas...
        </strong>

        <span style="
          display:block;
          color:#888;
          font-size:9px;
          line-height:1.5;
        ">
          Consultando produtos e preços reais.
        </span>

      </div>
    `;

  }


  function showSearchError() {

    if (!dealsContainer) return;

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
          Não foi possível buscar agora
        </strong>

        <span style="
          display:block;
          color:#777;
          font-size:8px;
          line-height:1.5;
        ">
          Tente novamente em alguns instantes.
        </span>

      </div>
    `;

  }


  /* ========================================================
     PRODUTOS REAIS
     ======================================================== */

  function renderProducts(
    list = []
  ) {

    if (!dealsContainer) {
      return;
    }


    if (
      !Array.isArray(list) ||
      list.length === 0
    ) {

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
            Nenhuma oferta encontrada
          </strong>

          <span style="
            display:block;
            color:#777;
            font-size:8px;
            line-height:1.5;
          ">
            Tente buscar outro produto.
          </span>

        </div>
      `;

      return;

    }


    dealsContainer.innerHTML =
      list.map(product => {

        if (
          !product ||
          !product.title ||
          product.price == null
        ) {
          return "";
        }


        const title =
          escapeHtml(
            product.title
          );


        const image =
          product.image
            ? `
              <img
                src="${escapeHtml(product.image)}"
                alt="${title}"
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
          calculateDiscount(
            product.oldPrice,
            product.price
          );


        const discountBadge =
          discount
            ? `
              <span class="discount">
                -${discount}%
              </span>
            `
            : "";


        const shipping =
          product.freeShipping === true
            ? `
              <span style="
                color:#00c853;
                font-size:8px;
                font-weight:700;
              ">
                Frete grátis
              </span>
            `
            : "";


        const seller =
          product.sellerId
            ? `
              <span>
                Mercado Livre
              </span>
            `
            : `
              <span>
                Mercado Livre
              </span>
            `;


        const canBuy =
          product.canBuy === true &&
          validAffiliateLink(
            product.link
          );


        const offerButton =
          canBuy
            ? `
              <a
                href="${escapeHtml(product.link)}"
                class="offer"
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                VER OFERTA
              </a>

              <small style="
                display:block;
                margin-top:6px;
                color:#666;
                font-size:7px;
                text-align:center;
              ">
                Link de afiliado
              </small>
            `
            : `
              <button
                type="button"
                class="offer"
                disabled
                style="
                  opacity:.42;
                  cursor:not-allowed;
                "
              >
                LINK INDISPONÍVEL
              </button>
            `;


        return `

          <article
            class="flash-card"
            data-id="${escapeHtml(product.id || "")}"
          >

            ${discountBadge}

            <button
              class="product-favorite"
              type="button"
              data-favorite="${escapeHtml(product.id || "")}"
              aria-label="Favoritar produto"
            >
              ♡
            </button>


            <div class="flash-photo">
              ${image}
            </div>


            <h3>
              ${title}
            </h3>


            ${oldPrice}


            <strong class="flash-price">
              ${money(product.price)}
            </strong>


            <div class="product-bottom">

              ${seller}

              ${shipping}

            </div>


            ${offerButton}

          </article>

        `;

      }).join("");


    bindFavorites();

  }


  /* ========================================================
     NORMALIZAÇÃO DOS DADOS DA API
     ======================================================== */

  function normalizeApiProduct(
    item
  ) {

    return {

      id:
        item.item_id ||
        item.id ||
        "",

      productId:
        item.product_id ||
        "",

      title:
        item.title ||
        "",

      price:
        Number(
          item.price
        ),

      oldPrice:
        item.original_price != null
          ? Number(
              item.original_price
            )
          : null,

      image:
        item.thumbnail ||
        null,

      store:
        "Mercado Livre",

      sellerId:
        item.seller_id ||
        null,

      freeShipping:
        item.free_shipping === true,

      condition:
        item.condition ||
        null,

      domainId:
        item.domain_id ||
        null,

      affiliateCode:
        item.affiliate_code ||
        null,

      link:
        item.affiliate_url ||
        item.permalink ||
        null,

      canBuy:
        item.can_buy === true

    };

  }


  /* ========================================================
     BUSCA REAL — MERCADO LIVRE
     ======================================================== */

  async function searchProducts() {

    if (!searchInput) {
      return;
    }


    const term =
      searchInput.value.trim();


    if (!term) {

      searchInput.focus();

      return;

    }


    showLoading();


    if (searchButton) {

      searchButton.disabled =
        true;

      searchButton.textContent =
        "BUSCANDO...";

    }


    try {

      const url =
        `${CONFIG.api}?q=${
          encodeURIComponent(term)
        }`;


      const response =
        await fetch(
          url,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json"
            }
          }
        );


      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );

      }


      const data =
        await response.json();


      if (
        !data ||
        data.ok !== true ||
        !Array.isArray(
          data.results
        )
      ) {

        throw new Error(
          "Resposta inválida"
        );

      }


      products =
        data.results
          .map(
            normalizeApiProduct
          )
          .filter(product => {

            return (
              product.id &&
              product.title &&
              Number.isFinite(
                product.price
              ) &&
              product.price > 0
            );

          });


      products.sort(
        (a, b) =>
          a.price - b.price
      );


      renderProducts(
        products
      );


      const marketSection =
        document.querySelector(
          ".market-section"
        );


      if (marketSection) {

        marketSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }


      console.log(
        `[ACHOU!] ${products.length} ofertas reais encontradas para "${term}".`
      );


    } catch (error) {

      console.error(
        "[ACHOU!] Erro na busca:",
        error
      );

      products = [];

      showSearchError();

    } finally {

      if (searchButton) {

        searchButton.disabled =
          false;

        searchButton.textContent =
          "BUSCAR";

      }

    }

  }


  /* ========================================================
     EVENTOS DA BUSCA
     ======================================================== */

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

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

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
        localStorage.getItem(
          "achou_favorites"
        )
      ) || [];

    } catch {

      return [];

    }

  }


  function saveFavorites(
    favorites
  ) {

    localStorage.setItem(
      "achou_favorites",
      JSON.stringify(
        favorites
      )
    );

  }


  function bindFavorites() {

    const buttons =
      document.querySelectorAll(
        "[data-favorite]"
      );


    buttons.forEach(button => {

      const id =
        String(
          button.dataset.favorite
        );


      if (!id) {
        return;
      }


      const favorites =
        getFavorites()
          .map(String);


      if (
        favorites.includes(id)
      ) {

        button.textContent =
          "♥";

      }


      button.addEventListener(
        "click",
        () => {

          let current =
            getFavorites()
              .map(String);


          if (
            current.includes(id)
          ) {

            current =
              current.filter(
                item =>
                  item !== id
              );

            button.textContent =
              "♡";

          } else {

            current.push(id);

            button.textContent =
              "♥";

          }


          saveFavorites(
            current
          );

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
      .querySelectorAll(
        ".favorite-count"
      )
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


  categoryButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const rawText =
            button.textContent
              .trim();


          const text =
            normalizeText(
              rawText
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


          if (
            text === "todos" ||
            text === "inicio"
          ) {

            if (products.length) {

              renderProducts(
                products
              );

            }

            return;

          }


          const quickSearchMap = {

            celulares:
              "celular",

            informatica:
              "notebook",

            tv:
              "smart tv",

            games:
              "console",

            audio:
              "fone bluetooth"

          };


          const searchTerm =
            quickSearchMap[text] ||
            rawText;


          if (searchInput) {

            searchInput.value =
              searchTerm;

            searchProducts();

          }

        }
      );

    }
  );


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
      (
        index +
        heroSlides.length
      ) %
      heroSlides.length;


    const slide =
      heroSlides[
        heroIndex
      ];


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

        if (!searchInput) {
          return;
        }


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

    if (!loginModal) {
      return;
    }

    loginModal.classList.add(
      "active"
    );

    document.body.classList.add(
      "modal-open"
    );

  }


  function closeLogin() {

    if (!loginModal) {
      return;
    }

    loginModal.classList.remove(
      "active"
    );

    document.body.classList.remove(
      "modal-open"
    );

  }


  function openSignup() {

    if (!signupModal) {
      return;
    }

    signupModal.classList.add(
      "active"
    );

    document.body.classList.add(
      "modal-open"
    );

  }


  function closeSignup() {

    if (!signupModal) {
      return;
    }

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

      if (
        event.key === "Escape"
      ) {

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
    "[ACHOU!] Site carregado. Busca real conectada."
  );

});
