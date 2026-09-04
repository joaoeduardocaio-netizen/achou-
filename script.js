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
      "https://wulhcgkphclwgidqlvtr.supabase.co/functions/v1/mercadolivre-search"
  };

  let products = [];
  let groupedProducts = [];


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
        parsed.hostname === "meli.la"
      );

    } catch {

      return false;

    }

  }


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

  const marketSection =
    document.querySelector(
      ".market-section"
    );


  let summaryBox = null;


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
          para “${escapeHtml(query)}”
        </span>

      </div>
    `;

  }


  function showLoading() {

    if (!dealsContainer) {
      return;
    }

    dealsContainer.innerHTML = `
      <div class="achou-search-status">
        <strong>
          Procurando as melhores ofertas...
        </strong>

        <span>
          Comparando produtos e preços reais.
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


  function normalizeApiProduct(item) {

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
        Number(item.price),

      image:
        item.thumbnail ||
        null,

      freeShipping:
        item.free_shipping === true,

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
            productId:key,
            title:item.title,
            image:item.image || null,
            offers:[]
          }
        );

      }


      const group =
        map.get(key);


      if (
        !group.image &&
        item.image
      ) {

        group.image =
          item.image;

      }


      group.offers.push(item);

    });


    return Array.from(
      map.values()
    )
      .map(group => {

        group.offers.sort(
          (a,b) =>
            a.price - b.price
        );

        group.best =
          group.offers[0];

        group.bestBuyable =
          group.offers.find(
            offer =>
              offer.canBuy &&
              validAffiliateLink(
                offer.link
              )
          ) || null;

        return group;

      })
      .sort(
        (a,b) =>
          a.best.price -
          b.best.price
      );

  }


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
      .querySelectorAll(
        ".favorite-count"
      )
      .forEach(counter => {

        counter.textContent =
          favorites.length;

      });

  }


  function bindFavorites() {

    const favorites =
      getFavorites()
        .map(String);


    document
      .querySelectorAll(
        "[data-favorite]"
      )
      .forEach(button => {

        const id =
          String(
            button.dataset.favorite
          );


        button.textContent =
          favorites.includes(id)
            ? "♥"
            : "♡";


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


  function renderGroupedProducts(groups) {

    if (!dealsContainer) {
      return;
    }


    if (
      !groups ||
      !groups.length
    ) {

      showEmpty();

      return;

    }


    dealsContainer.innerHTML =
      groups.map(
        (group,index) => {

          const best =
            group.best;

          const title =
            escapeHtml(
              group.title
            );


          const image =
            group.image
              ? `
                <img
                  class="achou-product-image"
                  src="${escapeHtml(group.image)}"
                  alt="${title}"
                  loading="lazy"
                >
              `
              : `
                <span>
                  Imagem indisponível
                </span>
              `;


          const bestBuyable =
            group.bestBuyable;


          const bestLink =
            bestBuyable
              ? bestBuyable.link
              : null;


          const button =
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
                  class="offer"
                  disabled
                >
                  MELHOR OFERTA SEM LINK
                </button>
              `;


          return `
            <article
              class="flash-card"
            >

              ${
                index === 0
                  ? `
                    <span class="discount">
                      MELHOR PREÇO
                    </span>
                  `
                  : ""
              }

              <button
                class="product-favorite"
                data-favorite="${escapeHtml(group.productId)}"
                type="button"
              >
                ♡
              </button>

              <div class="flash-photo">
                ${image}
              </div>

              <h3>
                ${title}
              </h3>

              <strong class="flash-price">
                ${money(best.price)}
              </strong>

              <div class="product-bottom">

                <span>
                  Mercado Livre
                </span>

                <span>
                  ${group.offers.length}
                  ${
                    group.offers.length === 1
                      ? "oferta"
                      : "ofertas"
                  }
                </span>

              </div>

              ${button}

            </article>
          `;

        }
      )
      .join("");


    bindFavorites();

  }


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

      const response =
        await fetch(
          `${CONFIG.api}?q=${encodeURIComponent(term)}`
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
          .filter(
            product =>
              product.id &&
              product.title &&
              Number.isFinite(
                product.price
              ) &&
              product.price > 0
          );


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


      marketSection
        ?.scrollIntoView({
          behavior:"smooth",
          block:"start"
        });


    } catch(error) {

      console.error(
        "[ACHOU!]",
        error
      );

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


  searchButton
    ?.addEventListener(
      "click",
      searchProducts
    );


  searchInput
    ?.addEventListener(
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


  const categoryButtons =
    document.querySelectorAll(
      ".category-nav-item, .quick-category, .popular-tags button"
    );


  categoryButtons
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const rawText =
            button.textContent.trim();

          const text =
            normalizeText(
              rawText
            );


          const map = {

            celulares:"celular",

            informatica:"notebook",

            tv:"smart tv",

            games:"console",

            audio:"fone bluetooth",

            casa:"casa",

            moda:"moda",

            ferramentas:"ferramentas",

            iphone:"iPhone",

            notebook:"notebook",

            playstation:"PlayStation",

            "smart tv":"Smart TV",

            fone:"fone bluetooth"

          };


          if (
            text === "todos"
          ) {

            return;

          }


          if (searchInput) {

            searchInput.value =
              map[text] ||
              rawText;

            searchProducts();

          }

        }
      );

    });


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
      (dot,index) => {

        dot.classList.toggle(
          "active",
          index === heroIndex
        );

      }
    );

  }


  document
    .querySelector(
      ".hero-prev"
    )
    ?.addEventListener(
      "click",
      () =>
        renderHero(
          heroIndex - 1
        )
    );


  document
    .querySelector(
      ".hero-next"
    )
    ?.addEventListener(
      "click",
      () =>
        renderHero(
          heroIndex + 1
        )
    );


  heroDots.forEach(
    (dot,index) => {

      dot.addEventListener(
        "click",
        () =>
          renderHero(index)
      );

    });


  setInterval(
    () => {

      renderHero(
        heroIndex + 1
      );

    },
    CONFIG.heroInterval
  );


  document
    .querySelector(
      ".hero-cta"
    )
    ?.addEventListener(
      "click",
      () => {

        searchInput
          ?.scrollIntoView({
            behavior:"smooth",
            block:"center"
          });

        setTimeout(
          () =>
            searchInput?.focus(),
          350
        );

      }
    );


  const loginModal =
    document.querySelector(
      ".login-modal"
    );

  const signupModal =
    document.querySelector(
      ".signup-modal"
    );


  document
    .querySelector(
      ".account-button"
    )
    ?.addEventListener(
      "click",
      () => {

        loginModal
          ?.classList.add(
            "active"
          );

        document.body
          .classList.add(
            "modal-open"
          );

      }
    );


  document
    .querySelector(
      ".login-close"
    )
    ?.addEventListener(
      "click",
      () => {

        loginModal
          ?.classList.remove(
            "active"
          );

        document.body
          .classList.remove(
            "modal-open"
          );

      }
    );


  document
    .querySelector(
      ".signup-close"
    )
    ?.addEventListener(
      "click",
      () => {

        signupModal
          ?.classList.remove(
            "active"
          );

        document.body
          .classList.remove(
            "modal-open"
          );

      }
    );


  document
    .querySelector(
      ".create-account"
    )
    ?.addEventListener(
      "click",
      () => {

        loginModal
          ?.classList.remove(
            "active"
          );

        signupModal
          ?.classList.add(
            "active"
          );

      }
    );


  document
    .querySelector(
      ".signup-login"
    )
    ?.addEventListener(
      "click",
      () => {

        signupModal
          ?.classList.remove(
            "active"
          );

        loginModal
          ?.classList.add(
            "active"
          );

      }
    );


  createSummary();

  showEmpty();

  renderHero(0);

  updateFavoriteCounter();


  console.log(
    "[ACHOU!] carregado."
  );

});
