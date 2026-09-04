/* =========================================================
   ACHOU! — COMPARADOR PROFISSIONAL
   Produtos, preços, imagens e links reais.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const CONFIG = {
    locale: "pt-BR",
    currency: "BRL",
    heroInterval: 5000,

    api:
      "https://wulhcgkphclwgidqlvtr.supabase.co/functions/v1/mercadolivre-search",

    initialQuery:
      "iPhone 15"
  };


  /* ========================================================
     ESTADO
     ======================================================== */

  let products = [];
  let groupedProducts = [];
  let summaryBox = null;
  let heroIndex = 0;


  /* ========================================================
     ELEMENTOS PRINCIPAIS
     ======================================================== */

  const searchInput =
    document.querySelector(".search-box input");

  const searchButton =
    document.querySelector(".search-box button");

  const dealsContainer =
    document.querySelector(".flash-deals");

  const marketSection =
    document.querySelector(".market-section");

  const heroCTA =
    document.querySelector(".hero-cta");


  /* ========================================================
     UTILITÁRIOS
     ======================================================== */

  function money(value) {

    const number =
      Number(value);

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

    if (!url) {
      return false;
    }

    try {

      const parsed =
        new URL(url);

      return (
        parsed.protocol === "https:" &&
        (
          parsed.hostname === "meli.la" ||
          parsed.hostname.endsWith(".mercadolivre.com.br") ||
          parsed.hostname === "mercadolivre.com.br"
        )
      );

    } catch {

      return false;
    }
  }


  /* ========================================================
     RESUMO DA BUSCA
     ======================================================== */

  function createSummary() {

    if (
      !marketSection ||
      !dealsContainer
    ) {
      return;
    }

    summaryBox =
      document.createElement("div");

    summaryBox.className =
      "achou-search-summary";

    summaryBox.style.display =
      "none";

    marketSection.insertBefore(
      summaryBox,
      dealsContainer
    );
  }


  function updateSummary(
    productCount,
    offerCount,
    query
  ) {

    if (!summaryBox) {
      return;
    }

    summaryBox.style.display =
      "flex";

    summaryBox.innerHTML = `
      <div>

        <strong>
          ${productCount}
          ${
            productCount === 1
              ? "produto encontrado"
              : "produtos encontrados"
          }
        </strong>

        <span>
          ${offerCount}
          ${
            offerCount === 1
              ? "oferta real"
              : "ofertas reais"
          }
          para
          “${escapeHtml(query)}”
        </span>

      </div>

      <span>
        Ordenado por menor preço
      </span>
    `;
  }


  /* ========================================================
     STATUS DE BUSCA
     ======================================================== */

  function showLoading() {

    if (!dealsContainer) {
      return;
    }

    dealsContainer.innerHTML = `
      <div class="achou-search-status loading">

        <strong>
          Procurando as melhores ofertas...
        </strong>

        <span>
          Comparando produtos e preços reais
          no Mercado Livre.
        </span>

      </div>
    `;
  }


  function showError() {

    if (!dealsContainer) {
      return;
    }

    dealsContainer.innerHTML = `
      <div class="achou-search-status">

        <strong>
          Não foi possível buscar agora
        </strong>

        <span>
          Tente novamente em alguns instantes.
        </span>

      </div>
    `;
  }


  function showEmpty() {

    if (!dealsContainer) {
      return;
    }

    dealsContainer.innerHTML = `
      <div class="achou-search-status">

        <strong>
          Nenhuma oferta encontrada
        </strong>

        <span>
          Tente pesquisar outro produto.
        </span>

      </div>
    `;
  }


  /* ========================================================
     NORMALIZAÇÃO DOS PRODUTOS
     ======================================================== */

  function normalizeApiProduct(item) {

    return {

      id:
        item.item_id ||
        item.id ||
        "",

      itemId:
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
        Number(item.price),

      oldPrice:
        item.original_price != null
          ? Number(item.original_price)
          : null,

      image:
        item.thumbnail ||
        null,

      sellerId:
        item.seller_id ||
        null,

      freeShipping:
        item.free_shipping === true,

      condition:
        item.condition ||
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
     AGRUPAMENTO
     ======================================================== */

  function groupProducts(list) {

    const map =
      new Map();

    list.forEach(item => {

      const key =
        item.productId ||
        item.id;

      if (!map.has(key)) {

        map.set(
          key,
          {
            productId: key,
            title: item.title,
            image: item.image || null,
            offers: []
          }
        );
      }

      const currentGroup =
        map.get(key);

      if (
        !currentGroup.image &&
        item.image
      ) {
        currentGroup.image =
          item.image;
      }

      currentGroup.offers.push(item);
    });


    return Array.from(map.values())
      .map(group => {

        group.offers.sort(
          (a, b) =>
            a.price - b.price
        );

        group.best =
          group.offers[0];

        /*
          IMPORTANTE:
          Agora o ACHOU! libera a oferta
          sempre que houver um link válido.

          Não depende mais de can_buy === true.
        */

        group.bestBuyable =
          group.offers.find(
            offer =>
              validAffiliateLink(
                offer.link
              )
          ) || null;

        return group;
      })
      .sort(
        (a, b) =>
          a.best.price -
          b.best.price
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


  function saveFavorites(list) {

    localStorage.setItem(
      "achou_favorites",
      JSON.stringify(list)
    );
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


  function bindFavorites() {

    const buttons =
      document.querySelectorAll(
        "[data-favorite]"
      );

    const favorites =
      getFavorites()
        .map(String);

    buttons.forEach(button => {

      const id =
        String(
          button.dataset.favorite
        );

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

          saveFavorites(current);

          updateFavoriteCounter();
        }
      );
    });
  }


  /* ========================================================
     PAINÉIS DAS OFERTAS
     ======================================================== */

  function bindOfferPanels() {

    document
      .querySelectorAll(
        "[data-toggle-offers]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset.toggleOffers;

            const panel =
              document.querySelector(
                `[data-offers-panel="${CSS.escape(id)}"]`
              );

            if (!panel) {
              return;
            }

            const open =
              panel.classList.toggle(
                "open"
              );

            button.textContent =
              open
                ? "OCULTAR OFERTAS"
                : `VER ${panel.children.length} OFERTAS`;
          }
        );
      });
  }


  /* ========================================================
     RENDERIZAÇÃO DOS PRODUTOS
     ======================================================== */

  function renderGroupedProducts(groups) {

    if (!dealsContainer) {
      return;
    }

    if (
      !Array.isArray(groups) ||
      groups.length === 0
    ) {

      showEmpty();

      return;
    }


    dealsContainer.innerHTML =
      groups.map(
        (group, groupIndex) => {

          const best =
            group.best;

          const title =
            escapeHtml(
              group.title
            );

          const favoriteId =
            group.productId;


          const image =
            group.image
              ? `
                <img
                  class="achou-product-image"
                  src="${escapeHtml(group.image)}"
                  alt="${title}"
                  loading="lazy"
                  decoding="async"
                  referrerpolicy="no-referrer"
                  onerror="
                    this.style.display='none';
                    this.nextElementSibling.style.display='flex';
                  "
                >

                <div
                  class="achou-image-fallback"
                  style="display:none"
                >
                  <span>
                    Imagem indisponível
                  </span>
                </div>
              `
              : `
                <div
                  class="achou-image-fallback"
                  style="display:flex"
                >
                  <span>
                    Imagem indisponível
                  </span>
                </div>
              `;


          const bestBuyable =
            group.bestBuyable;


          const bestLink =
            bestBuyable &&
            validAffiliateLink(
              bestBuyable.link
            )
              ? bestBuyable.link
              : null;


          const mainButton =
            bestLink
              ? `
                <a
                  href="${escapeHtml(bestLink)}"
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  class="offer"
                >
                  VER MELHOR OFERTA
                </a>
              `
              : `
                <button
                  type="button"
                  class="offer"
                  disabled
                >
                  MELHOR OFERTA SEM LINK
                </button>
              `;


          const rows =
            group.offers
              .map(
                (
                  offer,
                  offerIndex
                ) => {

                  /*
                    IMPORTANTE:
                    basta existir link válido.
                  */

                  const buyable =
                    validAffiliateLink(
                      offer.link
                    );


                  const button =
                    buyable
                      ? `
                        <a
                          class="achou-mini-buy"
                          href="${escapeHtml(offer.link)}"
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                        >
                          VER OFERTA
                        </a>
                      `
                      : `
                        <span
                          class="achou-mini-buy disabled"
                        >
                          SEM LINK
                        </span>
                      `;


                  return `
                    <div
                      class="achou-offer-row ${
                        offerIndex === 0
                          ? "best"
                          : ""
                      }"
                    >

                      <div>

                        ${
                          offerIndex === 0
                            ? `
                              <span class="achou-best-label">
                                MENOR PREÇO
                              </span>
                            `
                            : ""
                        }

                        <strong class="achou-offer-price">
                          ${money(offer.price)}
                        </strong>

                        <div class="achou-offer-meta">

                          <span>
                            Mercado Livre
                          </span>

                          ${
                            offer.freeShipping
                              ? `
                                <span class="achou-free">
                                  Frete grátis
                                </span>
                              `
                              : ""
                          }

                        </div>

                      </div>

                      ${button}

                    </div>
                  `;
                }
              )
              .join("");


          return `
            <article
              class="flash-card achou-group-card"
              data-product-id="${escapeHtml(group.productId)}"
            >

              ${
                groupIndex === 0
                  ? `
                    <span class="discount">
                      MELHOR PREÇO
                    </span>
                  `
                  : ""
              }

              <button
                class="product-favorite"
                type="button"
                data-favorite="${escapeHtml(favoriteId)}"
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


              <div class="achou-group-info">

                <span class="achou-offer-count">
                  ${group.offers.length}
                  ${
                    group.offers.length === 1
                      ? "oferta"
                      : "ofertas"
                  }
                </span>

                ${
                  best.freeShipping
                    ? `
                      <span
                        class="achou-free"
                        style="font-size:8px"
                      >
                        Frete grátis
                      </span>
                    `
                    : ""
                }

              </div>


              <span class="achou-starting">
                A partir de
              </span>

              <strong class="flash-price">
                ${money(best.price)}
              </strong>


              <div class="product-bottom">

                <span>
                  Mercado Livre
                </span>

                <span>
                  ${group.offers.length}
                  preços comparados
                </span>

              </div>


              <div class="achou-actions">

                ${mainButton}

                <button
                  class="achou-see-offers"
                  type="button"
                  data-toggle-offers="${escapeHtml(group.productId)}"
                >
                  VER ${group.offers.length} OFERTAS
                </button>

              </div>


              <div
                class="achou-offers-panel"
                data-offers-panel="${escapeHtml(group.productId)}"
              >
                ${rows}
              </div>

            </article>
          `;
        }
      )
      .join("");


    document
      .querySelectorAll(
        ".achou-affiliate-note"
      )
      .forEach(note => {
        note.remove();
      });


    const note =
      document.createElement("div");

    note.className =
      "achou-affiliate-note";

    note.textContent =
      "O ACHOU! pode receber comissão por compras realizadas através dos links de parceiros.";

    dealsContainer
      .parentElement
      ?.appendChild(note);


    bindFavorites();

    bindOfferPanels();
  }


  /* ========================================================
     BUSCA PRINCIPAL
     ======================================================== */

  async function searchProducts(
    forcedTerm = null,
    options = {}
  ) {

    if (!searchInput) {
      return;
    }


    const settings = {
      scroll: true,
      ...options
    };


    const term =
      forcedTerm !== null
        ? String(forcedTerm).trim()
        : searchInput.value.trim();


    if (!term) {

      searchInput.focus();

      return;
    }


    showLoading();


    if (summaryBox) {
      summaryBox.style.display =
        "none";
    }


    if (searchButton) {

      searchButton.disabled =
        true;

      searchButton.textContent =
        "BUSCANDO...";
    }


    try {

      const response =
        await fetch(
          `${CONFIG.api}?q=${encodeURIComponent(term)}`,
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


      groupedProducts =
        groupProducts(
          products
        );


      updateSummary(
        groupedProducts.length,
        products.length,
        term
      );


      renderGroupedProducts(
        groupedProducts
      );


      if (
        marketSection &&
        settings.scroll
      ) {

        marketSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }


    } catch (error) {

      console.error(
        "[ACHOU!] Erro:",
        error
      );

      products = [];
      groupedProducts = [];

      showError();


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
     BUSCA INICIAL
     ======================================================== */

  function loadInitialDeals() {

    if (!searchInput) {
      return;
    }

    searchInput.value = "";

    searchProducts(
      CONFIG.initialQuery,
      {
        scroll: false
      }
    );
  }


  /* ========================================================
     BOTÃO BUSCAR / ENTER
     ======================================================== */

  if (searchButton) {

    searchButton.addEventListener(
      "click",
      () => {
        searchProducts();
      }
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


          const map = {

            todos:
              CONFIG.initialQuery,

            celulares:
              "celular",

            informatica:
              "notebook",

            tv:
              "smart tv",

            games:
              "console",

            audio:
              "fone bluetooth",

            casa:
              "casa",

            moda:
              "moda",

            ferramentas:
              "ferramentas",

            iphone:
              "iPhone",

            notebook:
              "notebook",

            playstation:
              "PlayStation",

            "smart tv":
              "Smart TV",

            fone:
              "fone bluetooth"
          };


          const term =
            map[text] ||
            rawText;


          if (
            text === "todos"
          ) {

            if (searchInput) {
              searchInput.value = "";
            }

            searchProducts(
              CONFIG.initialQuery
            );

            return;
          }


          if (searchInput) {

            searchInput.value =
              term;

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
        "Compare preços antes de decidir onde comprar."
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
        `<strong>${escapeHtml(slide.title)}</strong>`;
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
     CTA DO HERO
     ======================================================== */

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

  const loginForm =
    document.querySelector(
      "#loginForm"
    );

  const signupForm =
    document.querySelector(
      "#signupForm"
    );


  function lockBody() {

    document.body.classList.add(
      "modal-open"
    );
  }


  function unlockBodyIfPossible() {

    const modalOpen =
      document.querySelector(
        ".login-modal.active, .signup-modal.active"
      );

    if (!modalOpen) {

      document.body.classList.remove(
        "modal-open"
      );
    }
  }


  function openLogin() {

    if (!loginModal) {
      return;
    }

    loginModal.classList.add(
      "active"
    );

    lockBody();
  }


  function closeLogin() {

    if (!loginModal) {
      return;
    }

    loginModal.classList.remove(
      "active"
    );

    unlockBodyIfPossible();
  }


  function openSignup() {

    if (!signupModal) {
      return;
    }

    signupModal.classList.add(
      "active"
    );

    lockBody();
  }


  function closeSignup() {

    if (!signupModal) {
      return;
    }

    signupModal.classList.remove(
      "active"
    );

    unlockBodyIfPossible();
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


  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();
      }
    );
  }


  if (signupForm) {

    signupForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();
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


  bottomItems.forEach(
    (item, index) => {

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


          if (index === 1) {

            document
              .querySelector(
                ".quick-categories"
              )
              ?.scrollIntoView({
                behavior: "smooth",
                block: "center"
              });
          }


          if (index === 2) {

            searchInput
              ?.scrollIntoView({
                behavior: "smooth",
                block: "center"
              });

            setTimeout(
              () => {
                searchInput?.focus();
              },
              400
            );
          }


          if (index === 3) {

            marketSection
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });
          }


          if (index === 4) {

            openLogin();
          }
        }
      );
    }
  );


  /* ========================================================
     FAVORITO DO HEADER
     ======================================================== */

  const headerFavorite =
    document.querySelector(
      ".header-icon"
    );


  if (headerFavorite) {

    headerFavorite.addEventListener(
      "click",
      () => {

        marketSection
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }
    );
  }


  /* ========================================================
     VER TODAS
     ======================================================== */

  const seeAllButton =
    document.querySelector(
      ".see-all"
    );


  if (seeAllButton) {

    seeAllButton.addEventListener(
      "click",
      () => {

        dealsContainer
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
      }
    );
  }


  /* ========================================================
     INICIALIZAÇÃO
     ======================================================== */

  createSummary();

  renderHero(0);

  updateFavoriteCounter();


  if (searchInput) {
    searchInput.value = "";
  }


  loadInitialDeals();


  console.log(
    "[ACHOU!] Comparador profissional carregado."
  );

});
