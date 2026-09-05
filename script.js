document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     ACHOU! — CONFIGURAÇÃO PRINCIPAL
     ========================================================= */

  const CONFIG = {
    locale: "pt-BR",
    currency: "BRL",

    initialQuery: "PlayStation 5 console",

    featuredInterval: 60000,

    api:
      "https://wulhcgkphclwgidqlvtr.supabase.co/functions/v1/mercadolivre-search",

    supabaseUrl:
      "https://wulhcgkphclwgidqlvtr.supabase.co",

    supabaseKey:
      "sb_publishable_Wi0Kz5aB4LeLnlxQE_34Yw_1KwA8ebc"
  };


  /* =========================================================
     VITRINE AUTOMÁTICA DA HOME

     O texto "label" é o que o cliente vê.
     "query" é o termo otimizado enviado à API.
     ========================================================= */

  const HOME_FEATURED_SEARCHES = [

    {
      label: "PlayStation 5",
      query: "PlayStation 5 console"
    },

    {
      label: "Moda masculina",
      query: "camiseta masculina"
    },

    {
      label: "Moda feminina",
      query: "vestido feminino"
    },

    {
      label: "Ferramentas",
      query: "furadeira"
    },

    {
      label: "Notebooks",
      query: "notebook"
    },

    {
      label: "Celulares",
      query: "smartphone"
    },

    {
      label: "Air Fryer",
      query: "Air Fryer"
    },

    {
      label: "Fones",
      query: "headphone bluetooth"
    }

  ];


  /* =========================================================
     NOMES AMIGÁVEIS DAS BUSCAS
     ========================================================= */

  const FRIENDLY_QUERY_NAMES = {

    "playstation 5 console":
      "PlayStation 5",

    "camiseta masculina":
      "Moda masculina",

    "vestido feminino":
      "Moda feminina",

    "headphone bluetooth":
      "Fones",

    "jogo de cama casal":
      "Cama, Mesa e Banho",

    "utensílios de cozinha":
      "Cozinha",

    "decoracao para casa":
      "Decoração",

    "decoração para casa":
      "Decoração",

    "smartphone":
      "Celulares"

  };


  /* =========================================================
     SUPABASE
     ========================================================= */

  let db = null;
  let adminDb = null;


  if (window.supabase?.createClient) {

    db = window.supabase.createClient(
      CONFIG.supabaseUrl,
      CONFIG.supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "achou-user-auth"
        }
      }
    );


    adminDb = window.supabase.createClient(
      CONFIG.supabaseUrl,
      CONFIG.supabaseKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

  }


  /* =========================================================
     ESTADO
     ========================================================= */

  let products = [];

  let groupedProducts = [];

  let affiliateLinks = [];

  let currentQuery =
    CONFIG.initialQuery;

  let featuredIndex = 0;

  let featuredTimer = null;

  let automaticFeaturedEnabled = true;

  let searchRunning = false;


  /* =========================================================
     ELEMENTOS PRINCIPAIS
     ========================================================= */

  const searchInput =
    document.querySelector("#searchInput");

  const searchButton =
    document.querySelector(".search-box button");

  const dealsContainer =
    document.querySelector(".flash-deals");

  const marketSection =
    document.querySelector("#offersSection");

  const summaryBox =
    document.querySelector(".achou-search-summary");

  const categoriesSection =
    document.querySelector("#categoriesSection");


  /* =========================================================
     UTILITÁRIOS
     ========================================================= */

  const money = value =>
    Number(value).toLocaleString(
      CONFIG.locale,
      {
        style: "currency",
        currency: CONFIG.currency
      }
    );


  const escapeHtml = text =>
    String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");


  const setMessage =
    (element, text, type = "") => {

      if (!element) {
        return;
      }

      element.textContent =
        text || "";

      element.classList.remove(
        "success",
        "error"
      );

      if (type) {
        element.classList.add(type);
      }

    };


  const scrollToOffers = () =>
    marketSection?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


  const focusSearch = () => {

    searchInput?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    setTimeout(() => {
      searchInput?.focus();
    }, 300);

  };


  function getFriendlyQueryName(term) {

    const normalized =
      String(term || "")
        .trim()
        .toLowerCase();

    return (
      FRIENDLY_QUERY_NAMES[normalized] ||
      term
    );

  }


  /* =========================================================
     VITRINE AUTOMÁTICA
     ========================================================= */

  function stopFeaturedRotation() {

    automaticFeaturedEnabled =
      false;

    if (featuredTimer) {

      clearInterval(
        featuredTimer
      );

      featuredTimer =
        null;

    }

  }


  function startFeaturedRotation() {

    if (featuredTimer) {

      clearInterval(
        featuredTimer
      );

    }


    automaticFeaturedEnabled =
      true;


    featuredTimer =
      setInterval(
        async () => {

          if (
            !automaticFeaturedEnabled ||
            document.hidden ||
            searchRunning
          ) {
            return;
          }


          featuredIndex =
            (
              featuredIndex + 1
            ) %
            HOME_FEATURED_SEARCHES.length;


          const featured =
            HOME_FEATURED_SEARCHES[
              featuredIndex
            ];


          await searchProducts(
            featured.query,
            {
              scroll: false,
              automatic: true,
              displayQuery:
                featured.label
            }
          );

        },
        CONFIG.featuredInterval
      );

  }


  /* =========================================================
     LINKS DE AFILIADO
     ========================================================= */

  function validAffiliateLink(url) {

    if (!url) {
      return false;
    }


    try {

      const parsed =
        new URL(url);

      const host =
        parsed.hostname.toLowerCase();


      return (
        parsed.protocol === "https:" &&
        (
          host === "meli.la" ||
          host === "mercadolivre.com.br" ||
          host.endsWith(
            ".mercadolivre.com.br"
          ) ||
          host === "mercadolibre.com" ||
          host.endsWith(
            ".mercadolibre.com"
          )
        )
      );

    } catch {

      return false;

    }

  }


  /* =========================================================
     STATUS DA BUSCA
     ========================================================= */

  function showStatus(
    title,
    text,
    loading = false
  ) {

    if (!dealsContainer) {
      return;
    }


    dealsContainer.innerHTML =
      `
        <div class="achou-search-status ${loading ? "loading" : ""}">
          <strong>
            ${escapeHtml(title)}
          </strong>

          <span>
            ${escapeHtml(text)}
          </span>
        </div>
      `;

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


    summaryBox.innerHTML =
      `
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
                ? "oferta encontrada"
                : "ofertas encontradas"
            }
            para “${escapeHtml(query)}”
          </span>

        </div>

        <span>
          Menor preço primeiro
        </span>
      `;

  }


  /* =========================================================
     NORMALIZAÇÃO DA API
     ========================================================= */

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
        item.image ||
        null,

      sellerId:
        item.seller_id ||
        null,

      freeShipping:
        item.free_shipping === true,

      condition:
        item.condition ||
        null,

      store:
        "Mercado Livre",

      source:
        "mercadolivre",

      productUrl:
        item.permalink ||
        item.url ||
        null,

      link:
        null,

      affiliateId:
        null

    };

  }


  /* =========================================================
     CARREGA LINKS DE AFILIADO
     ========================================================= */

  async function loadAffiliateLinks() {

    if (!db) {

      affiliateLinks = [];

      return [];

    }


    try {

      const {
        data,
        error
      } =
        await db
          .from(
            "affiliate_links"
          )
          .select(
            "id, marketplace, item_id, catalog_product_id, product_title, affiliate_url, active, created_at, updated_at"
          )
          .eq(
            "active",
            true
          )
          .order(
            "updated_at",
            {
              ascending: false
            }
          );


      if (error) {
        throw error;
      }


      affiliateLinks =
        Array.isArray(data)
          ? data
          : [];


      return affiliateLinks;

    } catch (error) {

      console.error(
        "[ACHOU!] afiliados",
        error
      );

      affiliateLinks = [];

      return [];

    }

  }


  function findAffiliateForProduct(
    product
  ) {

    return (
      affiliateLinks.find(
        link =>
          link.active === true &&
          link.item_id &&
          String(
            link.item_id
          ) ===
            String(
              product.itemId
            ) &&
          validAffiliateLink(
            link.affiliate_url
          )
      ) ||
      null
    );

  }


  function applyAffiliateLinks(list) {

    return list.map(
      product => {

        const affiliate =
          findAffiliateForProduct(
            product
          );


        product.link =
          affiliate?.affiliate_url ||
          null;


        product.affiliateId =
          affiliate?.id ||
          null;


        return product;

      }
    );

  }


  /* =========================================================
     AGRUPAMENTO DOS PRODUTOS
     ========================================================= */

  function groupProducts(list) {

    const map =
      new Map();


    list.forEach(
      item => {

        const key =
          item.productId ||
          item.id;


        if (!key) {
          return;
        }


        if (!map.has(key)) {

          map.set(
            key,
            {
              productId:
                key,

              title:
                item.title,

              image:
                item.image ||
                null,

              allOffers:
                []
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


        group.allOffers.push(
          item
        );

      }
    );


    return [
      ...map.values()
    ]

      .map(
        group => {

          group.offers =
            group.allOffers

              .filter(
                offer =>
                  Number.isFinite(
                    offer.price
                  ) &&
                  offer.price > 0
              )

              .sort(
                (a, b) =>
                  a.price -
                  b.price
              );


          group.linkedOffers =
            group.offers.filter(
              offer =>
                validAffiliateLink(
                  offer.link
                )
            );


          group.best =
            group.offers[0] ||
            null;


          group.storeCount =
            new Set(
              group.offers.map(
                offer =>
                  offer.store
              )
            ).size;


          return group;

        }
      )

      .filter(
        group =>
          group.best
      )

      .sort(
        (a, b) =>
          a.best.price -
          b.best.price
      );

  }


  /* =========================================================
     FAVORITOS
     ========================================================= */

  function getFavorites() {

    try {

      return (
        JSON.parse(
          localStorage.getItem(
            "achou_favorites"
          )
        ) ||
        []
      );

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

    const count =
      getFavorites().length;


    document
      .querySelectorAll(
        ".favorite-count"
      )
      .forEach(
        element => {

          element.textContent =
            count;

        }
      );

  }


  function bindFavorites() {

    document
      .querySelectorAll(
        "[data-favorite]"
      )
      .forEach(
        button => {

          const id =
            String(
              button.dataset.favorite
            );


          const has =
            getFavorites()
              .map(String)
              .includes(id);


          button.textContent =
            has
              ? "♥"
              : "♡";


          button.onclick =
            () => {

              let current =
                getFavorites()
                  .map(String);


              current =
                current.includes(id)

                  ? current.filter(
                      item =>
                        item !== id
                    )

                  : [
                      ...current,
                      id
                    ];


              saveFavorites(
                current
              );


              button.textContent =
                current.includes(id)
                  ? "♥"
                  : "♡";


              updateFavoriteCounter();

            };

        }
      );

  }


  /* =========================================================
     ABRIR / FECHAR PAINEL DE OFERTAS
     ========================================================= */

  function bindOfferPanels() {

    document
      .querySelectorAll(
        "[data-toggle-offers]"
      )
      .forEach(
        button => {

          button.onclick =
            () => {

              const panel =
                document.querySelector(
                  `[data-offers-panel="${CSS.escape(
                    button.dataset.toggleOffers
                  )}"]`
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

                  : `COMPARAR ${panel.children.length} ${
                      panel.children.length === 1
                        ? "OFERTA"
                        : "OFERTAS"
                    }`;

            };

        }
      );

  }


  /* =========================================================
     RENDERIZA PRODUTOS
     ========================================================= */

  function renderGroupedProducts(
    groups
  ) {

    if (!dealsContainer) {
      return;
    }


    if (!groups.length) {

      showStatus(
        "Nenhum produto encontrado",
        "Tente outro produto ou categoria."
      );

      return;

    }


    dealsContainer.innerHTML =
      groups.map(
        (group, index) => {

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
                  Imagem indisponível
                </div>
              `

              : `
                <div class="achou-image-fallback">
                  Imagem indisponível
                </div>
              `;


          const rows =
            group.offers
              .map(
                (offer, offerIndex) => {

                  const has =
                    validAffiliateLink(
                      offer.link
                    );


                  return `
                    <div class="achou-offer-row">

                      <div>

                        ${
                          offerIndex === 0
                            ? '<span class="achou-best-label">MENOR PREÇO</span>'
                            : ""
                        }

                        <strong class="achou-offer-price">
                          ${money(offer.price)}
                        </strong>

                        <div class="achou-offer-meta">

                          <span>
                            ${escapeHtml(offer.store)}
                          </span>

                          ${
                            offer.freeShipping
                              ? '<span class="achou-free">Frete grátis</span>'
                              : ""
                          }

                        </div>

                      </div>

                      ${
                        has

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
                            <button
                              class="achou-mini-buy achou-link-pending"
                              disabled
                            >
                              LINK EM BREVE
                            </button>
                          `
                      }

                    </div>
                  `;

                }
              )
              .join("");


          const action =
            validAffiliateLink(
              best.link
            )

              ? `
                <a
                  class="offer"
                  href="${escapeHtml(best.link)}"
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                >
                  VER OFERTAS
                </a>
              `

              : `
                <button
                  class="offer achou-link-pending"
                  disabled
                >
                  LINK EM BREVE
                </button>
              `;


          return `
            <article class="flash-card">

              ${
                index === 0
                  ? '<span class="discount">MENOR PREÇO</span>'
                  : ""
              }

              <button
                class="product-favorite"
                data-favorite="${escapeHtml(group.productId)}"
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
                    ? '<span class="achou-free">Frete grátis</span>'
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

                  ${
                    group.storeCount === 1

                      ? "Mercado Livre integrado"

                      : `Compare em ${group.storeCount} lojas`
                  }

                </span>

              </div>


              <div class="achou-actions">

                ${action}

                <button
                  class="achou-see-offers"
                  data-toggle-offers="${escapeHtml(group.productId)}"
                >
                  COMPARAR ${group.offers.length}
                  ${
                    group.offers.length === 1
                      ? "OFERTA"
                      : "OFERTAS"
                  }
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


    bindFavorites();

    bindOfferPanels();

  }


  /* =========================================================
     BUSCA PRINCIPAL
     ========================================================= */

  async function searchProducts(
    forcedTerm = null,
    {
      scroll = true,
      automatic = false,
      displayQuery = null
    } = {}
  ) {

    if (!searchInput) {
      return;
    }


    const term =
      forcedTerm !== null

        ? String(
            forcedTerm
          ).trim()

        : searchInput.value.trim();


    if (!term) {

      focusSearch();

      return;

    }


    /*
     * Qualquer pesquisa feita pelo usuário
     * interrompe a vitrine automática.
     */

    if (!automatic) {

      stopFeaturedRotation();

    }


    currentQuery =
      term;


    searchRunning =
      true;


    showStatus(
      "Procurando as melhores ofertas...",
      "Consultando produtos e preços reais.",
      true
    );


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
        !data?.ok ||
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


      await loadAffiliateLinks();


      products =
        applyAffiliateLinks(
          products
        );


      groupedProducts =
        groupProducts(
          products
        );


      const offers =
        groupedProducts.reduce(
          (total, group) =>
            total +
            group.offers.length,
          0
        );


      const visibleQuery =
        displayQuery ||
        getFriendlyQueryName(
          term
        );


      updateSummary(
        groupedProducts.length,
        offers,
        visibleQuery
      );


      renderGroupedProducts(
        groupedProducts
      );


      renderAdminProducts();


      if (scroll) {

        scrollToOffers();

      }

    } catch (error) {

      console.error(
        "[ACHOU!] busca",
        error
      );


      products = [];

      groupedProducts = [];


      showStatus(
        "Não foi possível buscar agora",
        "Tente novamente em alguns instantes."
      );


      renderAdminProducts();

    } finally {

      searchRunning =
        false;


      if (searchButton) {

        searchButton.disabled =
          false;

        searchButton.textContent =
          "Buscar";

      }

    }

  }


  /* =========================================================
     BUSCA NORMAL
     ========================================================= */

  searchButton?.addEventListener(
    "click",
    () => {

      searchProducts();

    }
  );


  searchInput?.addEventListener(
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


  document
    .querySelectorAll(
      "[data-search]"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            searchInput.value =
              button.dataset.search;


            searchProducts(
              button.dataset.search
            );

          };

      }
    );


  /* =========================================================
     CATEGORIAS
     ========================================================= */

  const categoryModal =
    document.querySelector(
      "#categoryModal"
    );

  const categoryModalTitle =
    document.querySelector(
      "#categoryModalTitle"
    );

  const categoryModalText =
    document.querySelector(
      "#categoryModalText"
    );

  const subcategoryGrid =
    document.querySelector(
      "#subcategoryGrid"
    );


  /*
   * PRIMEIRO ITEM:
   * texto exibido para o cliente.
   *
   * SEGUNDO ITEM:
   * termo otimizado enviado ao Mercado Livre.
   */

  const CATEGORY_DATA = {


    /* CELULARES */

    celulares: {

      title:
        "Celulares",

      items: [

        [
          "Samsung Galaxy",
          "Samsung Galaxy celular"
        ],

        [
          "iPhone",
          "iPhone"
        ],

        [
          "Motorola",
          "Motorola celular"
        ],

        [
          "Xiaomi",
          "Xiaomi celular"
        ],

        [
          "Smartphones 5G",
          "smartphone 5G"
        ]

      ]

    },


    /* INFORMÁTICA */

    informatica: {

      title:
        "Informática",

      items: [

        [
          "Notebooks",
          "notebook"
        ],

        [
          "Notebook Gamer",
          "notebook gamer"
        ],

        [
          "Computadores",
          "computador desktop"
        ],

        [
          "Monitores",
          "monitor computador"
        ],

        [
          "SSD",
          "SSD"
        ]

      ]

    },


    /* TV */

    tv: {

      title:
        "TV e Vídeo",

      items: [

        [
          "Smart TV",
          "Smart TV"
        ],

        [
          "TV 4K",
          "Smart TV 4K"
        ],

        [
          "Samsung",
          "Smart TV Samsung"
        ],

        [
          "LG",
          "Smart TV LG"
        ],

        [
          "Projetores",
          "projetor"
        ]

      ]

    },


    /* GAMES */

    games: {

      title:
        "Games",

      items: [

        [
          "PlayStation 5",
          "PlayStation 5 console"
        ],

        [
          "Xbox",
          "Xbox console"
        ],

        [
          "Nintendo Switch",
          "Nintendo Switch console"
        ],

        [
          "PC Gamer",
          "PC gamer"
        ]

      ]

    },


    /* ÁUDIO */

    audio: {

      title:
        "Áudio",

      items: [

        [
          "Fone Bluetooth",
          "headphone bluetooth"
        ],

        [
          "Headset Gamer",
          "headset gamer"
        ],

        [
          "AirPods",
          "AirPods"
        ],

        [
          "Caixa Bluetooth",
          "caixa de som bluetooth"
        ],

        [
          "Soundbar",
          "soundbar"
        ]

      ]

    },


    /* CASA */

    casa: {

      title:
        "Casa",

      items: [

        [
          "Eletrodomésticos",
          "eletrodoméstico cozinha"
        ],

        [
          "Cozinha",
          "utensílios de cozinha"
        ],

        [
          "Air Fryer",
          "Air Fryer"
        ],

        [
          "Geladeira",
          "geladeira"
        ],

        [
          "Cama, Mesa e Banho",
          "jogo de cama casal"
        ],

        [
          "Decoração",
          "decoração para casa"
        ]

      ]

    },


    /* MODA */

    moda: {

      title:
        "Moda",

      items: [

        [
          "Tênis",
          "tênis masculino"
        ],

        [
          "Masculino",
          "camiseta masculina"
        ],

        [
          "Feminino",
          "vestido feminino"
        ],

        [
          "Bolsas",
          "bolsa feminina"
        ],

        [
          "Relógios",
          "relógio masculino"
        ]

      ]

    },


    /* FERRAMENTAS */

    ferramentas: {

      title:
        "Ferramentas",

      items: [

        [
          "Furadeiras",
          "furadeira"
        ],

        [
          "Parafusadeiras",
          "parafusadeira"
        ],

        [
          "Serra Circular",
          "serra circular"
        ],

        [
          "Bosch",
          "ferramenta Bosch"
        ],

        [
          "Makita",
          "ferramenta Makita"
        ]

      ]

    }

  };


  /* =========================================================
     CONTROLE DOS MODAIS
     ========================================================= */

  function bodyLock() {

    document.body.classList.add(
      "modal-open"
    );

  }


  function bodyUnlock() {

    if (
      !document.querySelector(
        ".modal.active"
      )
    ) {

      document.body.classList.remove(
        "modal-open"
      );

    }

  }


  function openCategory(key) {

    const category =
      CATEGORY_DATA[key];


    if (!category) {
      return;
    }


    categoryModalTitle.textContent =
      category.title;


    categoryModalText.textContent =
      "Escolha o que você procura.";


    subcategoryGrid.innerHTML =
      category.items

        .map(
          ([label, search]) =>
            `
              <button
                data-subcategory-search="${escapeHtml(search)}"
                data-subcategory-label="${escapeHtml(label)}"
              >
                ${escapeHtml(label)}
              </button>
            `
        )

        .join("");


    subcategoryGrid
      .querySelectorAll(
        "[data-subcategory-search]"
      )
      .forEach(
        button => {

          button.onclick =
            () => {

              const term =
                button.dataset.subcategorySearch;

              const label =
                button.dataset.subcategoryLabel;


              closeCategory();


              searchInput.value =
                term;


              searchProducts(
                term,
                {
                  displayQuery:
                    label
                }
              );

            };

        }
      );


    categoryModal.classList.add(
      "active"
    );


    bodyLock();

  }


  function closeCategory() {

    categoryModal?.classList.remove(
      "active"
    );


    bodyUnlock();

  }


  document
    .querySelectorAll(
      ".category-card[data-category]"
    )
    .forEach(
      button => {

        button.onclick =
          () =>
            openCategory(
              button.dataset.category
            );

      }
    );


  document
    .querySelector(
      "#categoryModalClose"
    )
    ?.addEventListener(
      "click",
      closeCategory
    );


  categoryModal?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        categoryModal
      ) {

        closeCategory();

      }

    }
  );


  /* =========================================================
     LOGIN / CADASTRO
     ========================================================= */

  const loginModal =
    document.querySelector(
      "#loginModal"
    );

  const signupModal =
    document.querySelector(
      "#signupModal"
    );


  function openLogin() {

    loginModal?.classList.add(
      "active"
    );

    bodyLock();

  }


  function closeLogin() {

    loginModal?.classList.remove(
      "active"
    );

    bodyUnlock();

  }


  function openSignup() {

    signupModal?.classList.add(
      "active"
    );

    bodyLock();

  }


  function closeSignup() {

    signupModal?.classList.remove(
      "active"
    );

    bodyUnlock();

  }


  document
    .querySelector(
      ".account-button"
    )
    ?.addEventListener(
      "click",
      openLogin
    );


  document
    .querySelector(
      ".login-close"
    )
    ?.addEventListener(
      "click",
      closeLogin
    );


  document
    .querySelector(
      ".signup-close"
    )
    ?.addEventListener(
      "click",
      closeSignup
    );


  document
    .querySelector(
      ".create-account"
    )
    ?.addEventListener(
      "click",
      () => {

        closeLogin();

        openSignup();

      }
    );


  document
    .querySelector(
      ".signup-login"
    )
    ?.addEventListener(
      "click",
      () => {

        closeSignup();

        openLogin();

      }
    );


  function updateAccountUI(user) {

    const hello =
      document.querySelector(
        ".account-copy small"
      );

    const nameElement =
      document.querySelector(
        ".account-copy strong"
      );

    const avatar =
      document.querySelector(
        ".account-avatar"
      );


    if (!user) {

      if (hello) {
        hello.textContent = "Olá!";
      }

      if (nameElement) {
        nameElement.textContent = "Entrar";
      }

      if (avatar) {
        avatar.textContent = "●";
      }

      return;

    }


    const name =
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Usuário";


    const firstName =
      String(name)
        .split(" ")[0];


    if (hello) {
      hello.textContent = "Olá,";
    }


    if (nameElement) {
      nameElement.textContent =
        firstName;
    }


    if (avatar) {

      avatar.textContent =
        firstName[0]
          ?.toUpperCase() ||
        "U";

    }

  }


  document
    .querySelector(
      "#loginForm"
    )
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        if (!db) {
          return;
        }


        const email =
          document
            .querySelector(
              "#loginEmail"
            )
            .value
            .trim();


        const password =
          document
            .querySelector(
              "#loginPassword"
            )
            .value;


        try {

          const {
            data,
            error
          } =
            await db.auth.signInWithPassword(
              {
                email,
                password
              }
            );


          if (error) {
            throw error;
          }


          closeLogin();


          updateAccountUI(
            data?.user ||
            null
          );

        } catch {

          alert(
            "Não foi possível entrar. Confira seu e-mail e senha."
          );

        }

      }
    );


  document
    .querySelector(
      "#signupForm"
    )
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        if (!db) {
          return;
        }


        const name =
          document
            .querySelector(
              "#signupName"
            )
            .value
            .trim();


        const email =
          document
            .querySelector(
              "#signupEmail"
            )
            .value
            .trim();


        const password =
          document
            .querySelector(
              "#signupPassword"
            )
            .value;


        const confirmPassword =
          document
            .querySelector(
              "#signupPasswordConfirm"
            )
            .value;


        if (
          password !==
          confirmPassword
        ) {

          alert(
            "As senhas não coincidem."
          );

          return;

        }


        try {

          const {
            data,
            error
          } =
            await db.auth.signUp(
              {
                email,
                password,

                options: {

                  data: {
                    full_name:
                      name
                  }

                }
              }
            );


          if (error) {
            throw error;
          }


          alert(
            "Conta criada com sucesso."
          );


          closeSignup();


          updateAccountUI(
            data?.user ||
            null
          );

        } catch {

          alert(
            "Não foi possível criar a conta."
          );

        }

      }
    );


  db?.auth
    .getUser()
    .then(
      ({ data }) =>
        updateAccountUI(
          data?.user ||
          null
        )
    )
    .catch(
      () => {}
    );


  /* =========================================================
     ADMIN
     ========================================================= */

  const adminSecretButton =
    document.querySelector(
      "#adminSecretButton"
    );

  const adminLoginModal =
    document.querySelector(
      "#adminLoginModal"
    );

  const adminPanelModal =
    document.querySelector(
      "#adminPanelModal"
    );

  const adminLoginMessage =
    document.querySelector(
      "#adminLoginMessage"
    );

  const adminProductsList =
    document.querySelector(
      "#adminProductsList"
    );

  const adminAffiliateForm =
    document.querySelector(
      "#adminAffiliateForm"
    );

  const adminAffiliateId =
    document.querySelector(
      "#adminAffiliateId"
    );

  const adminItemId =
    document.querySelector(
      "#adminItemId"
    );

  const adminProductId =
    document.querySelector(
      "#adminProductId"
    );

  const adminProductTitle =
    document.querySelector(
      "#adminProductTitle"
    );

  const adminAffiliateUrl =
    document.querySelector(
      "#adminAffiliateUrl"
    );

  const adminAffiliateActive =
    document.querySelector(
      "#adminAffiliateActive"
    );

  const adminFormMessage =
    document.querySelector(
      "#adminFormMessage"
    );

  const adminLinksList =
    document.querySelector(
      "#adminLinksList"
    );


  async function resetAdminSession() {

    try {

      await adminDb?.auth.signOut();

    } catch {}

  }


  function openAdminLogin() {

    document.querySelector(
      "#adminEmail"
    ).value = "";


    document.querySelector(
      "#adminPassword"
    ).value = "";


    setMessage(
      adminLoginMessage,
      ""
    );


    adminLoginModal.classList.add(
      "active"
    );


    bodyLock();

  }


  function closeAdminLogin() {

    adminLoginModal.classList.remove(
      "active"
    );


    bodyUnlock();

  }


  function openAdminPanel() {

    adminLoginModal.classList.remove(
      "active"
    );


    adminPanelModal.classList.add(
      "active"
    );


    bodyLock();


    renderAdminProducts();

    loadAdminLinks();

  }


  async function closeAdminPanel() {

    adminPanelModal.classList.remove(
      "active"
    );


    await resetAdminSession();


    bodyUnlock();

  }


  adminSecretButton?.addEventListener(
    "click",
    async () => {

      await resetAdminSession();

      openAdminLogin();

    }
  );


  document
    .querySelector(
      "#adminLoginClose"
    )
    ?.addEventListener(
      "click",
      async () => {

        await resetAdminSession();

        closeAdminLogin();

      }
    );


  document
    .querySelector(
      "#adminPanelClose"
    )
    ?.addEventListener(
      "click",
      closeAdminPanel
    );


  document
    .querySelector(
      "#adminLogoutButton"
    )
    ?.addEventListener(
      "click",
      closeAdminPanel
    );


  async function getCurrentAdmin() {

    if (!adminDb) {
      return null;
    }


    try {

      const {
        data: userData,
        error: userError
      } =
        await adminDb.auth.getUser();


      if (
        userError ||
        !userData?.user
      ) {

        return null;

      }


      const {
        data,
        error
      } =
        await adminDb
          .from(
            "admin_users"
          )
          .select(
            "user_id"
          )
          .eq(
            "user_id",
            userData.user.id
          )
          .maybeSingle();


      return (
        error ||
        !data
      )

        ? null

        : userData.user;

    } catch {

      return null;

    }

  }


  document
    .querySelector(
      "#adminLoginForm"
    )
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          document
            .querySelector(
              "#adminEmail"
            )
            .value
            .trim();


        const password =
          document
            .querySelector(
              "#adminPassword"
            )
            .value;


        setMessage(
          adminLoginMessage,
          "Verificando acesso..."
        );


        await resetAdminSession();


        try {

          const {
            data,
            error
          } =
            await adminDb.auth.signInWithPassword(
              {
                email,
                password
              }
            );


          if (
            error ||
            !data?.user
          ) {

            throw new Error();

          }


          const {
            data: adminData,
            error: adminError
          } =
            await adminDb
              .from(
                "admin_users"
              )
              .select(
                "user_id"
              )
              .eq(
                "user_id",
                data.user.id
              )
              .maybeSingle();


          if (
            adminError ||
            !adminData
          ) {

            await resetAdminSession();

            throw new Error();

          }


          openAdminPanel();

        } catch {

          await resetAdminSession();


          setMessage(
            adminLoginMessage,
            "E-mail ou senha incorretos, ou usuário sem permissão.",
            "error"
          );

        }

      }
    );


  /* =========================================================
     PRODUTOS NO ADMIN
     ========================================================= */

  function renderAdminProducts() {

    if (!adminProductsList) {
      return;
    }


    if (!products.length) {

      adminProductsList.innerHTML =
        `
          <div class="admin-empty">
            Faça uma busca no ACHOU! para carregar os produtos.
          </div>
        `;

      return;

    }


    adminProductsList.innerHTML =
      products.map(
        (product, index) => {

          const affiliate =
            findAffiliateForProduct(
              product
            );


          return `
            <article class="admin-product-card">

              <div class="admin-product-image">

                ${
                  product.image

                    ? `
                      <img
                        src="${escapeHtml(product.image)}"
                        alt=""
                      >
                    `

                    : "sem imagem"
                }

              </div>


              <div class="admin-product-data">

                <strong>
                  ${escapeHtml(product.title)}
                </strong>

                <small>
                  ${escapeHtml(product.itemId)}
                </small>

                <em class="${affiliate ? "admin-linked" : ""}">

                  ${
                    affiliate
                      ? "LINK CADASTRADO"
                      : "SEM LINK"
                  }

                </em>

              </div>


              <button
                class="admin-select-product"
                data-admin-product="${index}"
              >

                ${
                  affiliate
                    ? "EDITAR"
                    : "SELECIONAR"
                }

              </button>

            </article>
          `;

        }
      )
      .join("");


    adminProductsList
      .querySelectorAll(
        "[data-admin-product]"
      )
      .forEach(
        button => {

          button.onclick =
            () =>
              fillAdminFormFromProduct(
                products[
                  Number(
                    button.dataset.adminProduct
                  )
                ]
              );

        }
      );

  }


  function fillAdminFormFromProduct(
    product
  ) {

    const affiliate =
      findAffiliateForProduct(
        product
      );


    adminAffiliateId.value =
      affiliate?.id ||
      "";


    adminItemId.value =
      product.itemId ||
      "";


    adminProductId.value =
      product.productId ||
      "";


    adminProductTitle.value =
      product.title ||
      "";


    adminAffiliateUrl.value =
      affiliate?.affiliate_url ||
      "";


    adminAffiliateActive.checked =
      affiliate
        ? affiliate.active !== false
        : true;


    setMessage(
      adminFormMessage,

      affiliate
        ? "Link existente carregado para edição."
        : "Produto selecionado. Cole o link afiliado.",

      affiliate
        ? "success"
        : ""
    );

  }


  document
    .querySelector(
      "#adminRefreshProducts"
    )
    ?.addEventListener(
      "click",
      renderAdminProducts
    );


  document
    .querySelector(
      "#adminClearForm"
    )
    ?.addEventListener(
      "click",
      () => {

        adminAffiliateForm.reset();

        adminAffiliateId.value =
          "";

        adminAffiliateActive.checked =
          true;

        setMessage(
          adminFormMessage,
          ""
        );

      }
    );


  async function refreshAfterAffiliate() {

    await loadAffiliateLinks();


    products =
      applyAffiliateLinks(
        products
      );


    groupedProducts =
      groupProducts(
        products
      );


    renderGroupedProducts(
      groupedProducts
    );


    renderAdminProducts();

  }


  /* =========================================================
     SALVA LINK AFILIADO
     ========================================================= */

  adminAffiliateForm?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (
        !await getCurrentAdmin()
      ) {

        setMessage(
          adminFormMessage,
          "Sua sessão administrativa expirou.",
          "error"
        );

        return;

      }


      const id =
        adminAffiliateId.value.trim();

      const itemId =
        adminItemId.value.trim();

      const productId =
        adminProductId.value.trim();

      const title =
        adminProductTitle.value.trim();

      const url =
        adminAffiliateUrl.value.trim();

      const active =
        adminAffiliateActive.checked;


      if (
        !validAffiliateLink(url)
      ) {

        setMessage(
          adminFormMessage,
          "Cole um link válido do Mercado Livre.",
          "error"
        );

        return;

      }


      const payload = {

        marketplace:
          "mercadolivre",

        item_id:
          itemId,

        catalog_product_id:
          productId ||
          null,

        product_title:
          title,

        affiliate_url:
          url,

        active,

        updated_at:
          new Date().toISOString()

      };


      try {

        if (id) {

          const {
            error
          } =
            await adminDb
              .from(
                "affiliate_links"
              )
              .update(
                payload
              )
              .eq(
                "id",
                id
              );


          if (error) {
            throw error;
          }

        } else {

          const {
            data: existing,
            error: findError
          } =
            await adminDb
              .from(
                "affiliate_links"
              )
              .select(
                "id"
              )
              .eq(
                "item_id",
                itemId
              )
              .limit(1)
              .maybeSingle();


          if (findError) {
            throw findError;
          }


          if (
            existing?.id
          ) {

            const {
              error
            } =
              await adminDb
                .from(
                  "affiliate_links"
                )
                .update(
                  payload
                )
                .eq(
                  "id",
                  existing.id
                );


            if (error) {
              throw error;
            }

          } else {

            const {
              error
            } =
              await adminDb
                .from(
                  "affiliate_links"
                )
                .insert(
                  payload
                );


            if (error) {
              throw error;
            }

          }

        }


        setMessage(
          adminFormMessage,
          "Link salvo com sucesso.",
          "success"
        );


        await refreshAfterAffiliate();

        await loadAdminLinks();

      } catch (error) {

        console.error(
          error
        );


        setMessage(
          adminFormMessage,
          "Não foi possível salvar o link.",
          "error"
        );

      }

    }
  );


  /* =========================================================
     LINKS CADASTRADOS NO ADMIN
     ========================================================= */

  async function loadAdminLinks() {

    if (
      !adminLinksList ||
      !await getCurrentAdmin()
    ) {
      return;
    }


    const {
      data,
      error
    } =
      await adminDb
        .from(
          "affiliate_links"
        )
        .select(
          "id, item_id, product_title, affiliate_url, active"
        )
        .order(
          "updated_at",
          {
            ascending: false
          }
        );


    if (error) {

      adminLinksList.innerHTML =
        `
          <div class="admin-empty">
            Não foi possível carregar os links.
          </div>
        `;

      return;

    }


    const list =
      Array.isArray(data)
        ? data
        : [];


    adminLinksList.innerHTML =
      list.length

        ? list.map(
            link =>
              `
                <article class="admin-link-card">

                  <div class="admin-link-data">

                    <strong>
                      ${escapeHtml(
                        link.product_title ||
                        "Produto"
                      )}
                    </strong>

                    <small>
                      ${escapeHtml(
                        link.item_id ||
                        ""
                      )}
                    </small>

                    <em class="${link.active ? "active" : ""}">

                      ${
                        link.active
                          ? "ATIVO"
                          : "INATIVO"
                      }

                    </em>

                  </div>


                  <div class="admin-link-actions">

                    <button
                      data-admin-edit="${link.id}"
                    >
                      EDITAR
                    </button>

                    <button
                      data-admin-delete="${link.id}"
                    >
                      EXCLUIR
                    </button>

                  </div>

                </article>
              `
          )
          .join("")

        : `
          <div class="admin-empty">
            Nenhum link cadastrado.
          </div>
        `;


    adminLinksList
      .querySelectorAll(
        "[data-admin-delete]"
      )
      .forEach(
        button => {

          button.onclick =
            async () => {

              if (
                !confirm(
                  "Excluir este link afiliado?"
                )
              ) {
                return;
              }


              await adminDb
                .from(
                  "affiliate_links"
                )
                .delete()
                .eq(
                  "id",
                  button.dataset.adminDelete
                );


              await refreshAfterAffiliate();

              await loadAdminLinks();

            };

        }
      );


    adminLinksList
      .querySelectorAll(
        "[data-admin-edit]"
      )
      .forEach(
        button => {

          button.onclick =
            () => {

              const link =
                list.find(
                  item =>
                    String(
                      item.id
                    ) ===
                    String(
                      button.dataset.adminEdit
                    )
                );


              if (!link) {
                return;
              }


              adminAffiliateId.value =
                link.id;


              adminItemId.value =
                link.item_id ||
                "";


              adminProductTitle.value =
                link.product_title ||
                "";


              adminAffiliateUrl.value =
                link.affiliate_url ||
                "";


              adminAffiliateActive.checked =
                link.active !== false;

            };

        }
      );

  }


  document
    .querySelector(
      "#adminRefreshLinks"
    )
    ?.addEventListener(
      "click",
      loadAdminLinks
    );


  /* =========================================================
     MENU INFERIOR
     ========================================================= */

  document
    .querySelectorAll(
      ".bottom-nav-item"
    )
    .forEach(
      item => {

        item.onclick =
          () => {

            document
              .querySelectorAll(
                ".bottom-nav-item"
              )
              .forEach(
                nav =>
                  nav.classList.remove(
                    "active"
                  )
              );


            item.classList.add(
              "active"
            );


            const action =
              item.dataset.nav;


            if (
              action === "home"
            ) {

              window.scrollTo({
                top: 0,
                behavior: "smooth"
              });

            }


            if (
              action === "categories"
            ) {

              categoriesSection
                ?.scrollIntoView({
                  behavior: "smooth"
                });

            }


            if (
              action === "search"
            ) {

              focusSearch();

            }


            if (
              action === "favorites"
            ) {

              scrollToOffers();

            }


            if (
              action === "profile"
            ) {

              openLogin();

            }

          };

      }
    );


  /* =========================================================
     OUTROS BOTÕES
     ========================================================= */

  document
    .querySelector(
      ".header-heart"
    )
    ?.addEventListener(
      "click",
      scrollToOffers
    );


  document
    .querySelector(
      ".menu-button"
    )
    ?.addEventListener(
      "click",
      () =>
        categoriesSection
          ?.scrollIntoView({
            behavior: "smooth"
          })
    );


  document
    .querySelector(
      ".highlight-button"
    )
    ?.addEventListener(
      "click",
      scrollToOffers
    );


  document
    .querySelector(
      ".products-show-all"
    )
    ?.addEventListener(
      "click",
      () =>
        searchProducts(
          CONFIG.initialQuery
        )
    );


  document
    .querySelector(
      ".category-show-all"
    )
    ?.addEventListener(
      "click",
      () =>
        categoriesSection
          ?.scrollIntoView({
            behavior: "smooth"
          })
    );


  /* =========================================================
     ESC
     ========================================================= */

  document.addEventListener(
    "keydown",
    async event => {

      if (
        event.key !== "Escape"
      ) {
        return;
      }


      closeCategory();

      closeLogin();

      closeSignup();


      if (
        adminLoginModal
          ?.classList.contains(
            "active"
          )
      ) {

        await resetAdminSession();

        closeAdminLogin();

      }


      if (
        adminPanelModal
          ?.classList.contains(
            "active"
          )
      ) {

        await closeAdminPanel();

      }

    }
  );


  /* =========================================================
     INICIALIZAÇÃO DO ACHOU!
     ========================================================= */

  updateFavoriteCounter();


  searchInput.value =
    "";


  resetAdminSession();


  /*
   * A página agora NÃO começa vazia.
   *
   * Ela começa com PlayStation 5.
   */

  const firstFeatured =
    HOME_FEATURED_SEARCHES[0];


  searchProducts(
    firstFeatured.query,
    {
      scroll: false,
      automatic: true,
      displayQuery:
        firstFeatured.label
    }
  )
    .finally(
      () => {

        /*
         * Depois começa a alternância:
         *
         * PS5
         * Moda masculina
         * Moda feminina
         * Ferramentas
         * Notebook
         * Celulares
         * Air Fryer
         * Fones
         */

        startFeaturedRotation();

      }
    );

});
