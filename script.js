/* =========================================================
   ACHOU! — SCRIPT FINAL
   Comparador profissional de preços

   FUNCIONALIDADES:
   - Busca real Mercado Livre
   - Produtos e preços reais
   - Agrupamento de ofertas
   - Menor preço
   - Links afiliados manuais
   - Favoritos
   - Categorias e subcategorias
   - Login / cadastro Supabase
   - Painel administrativo secreto
   - Mercado Livre integrado
   - Estrutura preparada para múltiplas lojas
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {


  /* ========================================================
     CONFIGURAÇÃO
     ======================================================== */

  const CONFIG = {

    locale: "pt-BR",

    currency: "BRL",

    initialQuery: "iPhone 15",

    api:
      "https://wulhcgkphclwgidqlvtr.supabase.co/functions/v1/mercadolivre-search",

    supabaseUrl:
      "https://wulhcgkphclwgidqlvtr.supabase.co",

    supabaseKey:
      "sb_publishable_Wi0Kz5aB4LeLnlxQE_34Yw_1KwA8ebc"

  };


  /* ========================================================
     SUPABASE
     ======================================================== */

  let db = null;

  let adminDb = null;


  if (
    window.supabase &&
    window.supabase.createClient
  ) {

    db =
      window.supabase.createClient(
        CONFIG.supabaseUrl,
        CONFIG.supabaseKey,
        {

          auth: {

            persistSession: true,

            autoRefreshToken: true,

            detectSessionInUrl: true,

            storageKey:
              "achou-user-auth"

          }

        }
      );


    adminDb =
      window.supabase.createClient(
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

  } else {

    console.error(
      "[ACHOU!] Supabase não carregado."
    );

  }


  /* ========================================================
     ESTADO
     ======================================================== */

  let products = [];

  let groupedProducts = [];

  let affiliateLinks = [];

  let currentQuery =
    CONFIG.initialQuery;


  /* ========================================================
     ELEMENTOS PRINCIPAIS
     ======================================================== */

  const searchInput =
    document.querySelector(
      "#searchInput"
    ) ||
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
      "#offersSection"
    );


  const summaryBox =
    document.querySelector(
      ".achou-search-summary"
    );


  const categoriesSection =
    document.querySelector(
      "#categoriesSection"
    );


  /* ========================================================
     UTILITÁRIOS
     ======================================================== */

  function money(value) {

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {

      return "";

    }

    return number.toLocaleString(
      CONFIG.locale,
      {

        style: "currency",

        currency:
          CONFIG.currency

      }
    );

  }


  function escapeHtml(text) {

    return String(text || "")

      .replace(
        /&/g,
        "&amp;"
      )

      .replace(
        /</g,
        "&lt;"
      )

      .replace(
        />/g,
        "&gt;"
      )

      .replace(
        /"/g,
        "&quot;"
      )

      .replace(
        /'/g,
        "&#039;"
      );

  }


  function setMessage(
    element,
    text,
    type = ""
  ) {

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

      element.classList.add(
        type
      );

    }

  }


  function validAffiliateLink(
    url
  ) {

    if (!url) {

      return false;

    }

    try {

      const parsed =
        new URL(url);

      if (
        parsed.protocol !==
        "https:"
      ) {

        return false;

      }

      const host =
        parsed.hostname
          .toLowerCase();

      return (

        host === "meli.la" ||

        host ===
          "mercadolivre.com.br" ||

        host.endsWith(
          ".mercadolivre.com.br"
        ) ||

        host ===
          "mercadolibre.com" ||

        host.endsWith(
          ".mercadolibre.com"
        )

      );

    } catch {

      return false;

    }

  }


  function scrollToOffers() {

    marketSection
      ?.scrollIntoView({

        behavior: "smooth",

        block: "start"

      });

  }


  function focusSearch() {

    searchInput
      ?.scrollIntoView({

        behavior: "smooth",

        block: "center"

      });


    setTimeout(
      () => {

        searchInput
          ?.focus();

      },
      350
    );

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
          Consultando produtos e preços reais.
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
          Nenhum produto encontrado
        </strong>

        <span>
          Tente outro produto ou escolha uma subcategoria.
        </span>

      </div>

    `;

  }


  /* ========================================================
     RESUMO DA BUSCA
     ======================================================== */

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


  /* ========================================================
     NORMALIZA PRODUTO
     ======================================================== */

  function normalizeApiProduct(
    item
  ) {

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


  /* ========================================================
     LINKS AFILIADOS
     ======================================================== */

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

              ascending:
                false

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
        "[ACHOU!] Links afiliados:",
        error
      );

      affiliateLinks = [];

      return [];

    }

  }


  function findAffiliateForProduct(
    product
  ) {

    if (
      !product ||
      !product.itemId
    ) {

      return null;

    }


    return (
      affiliateLinks.find(
        link => {

          return (

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

          );

        }
      ) || null
    );

  }


  function applyAffiliateLinks(
    list
  ) {

    return list.map(
      product => {

        const affiliate =
          findAffiliateForProduct(
            product
          );


        if (affiliate) {

          product.link =
            affiliate.affiliate_url;

          product.affiliateId =
            affiliate.id;

        } else {

          product.link =
            null;

          product.affiliateId =
            null;

        }


        return product;

      }
    );

  }


  /* ========================================================
     AGRUPAMENTO DE PRODUTOS
     ======================================================== */

  function groupProducts(
    list
  ) {

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


    return Array

      .from(
        map.values()
      )

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


          group.bestLinked =
            group.linkedOffers[0] ||
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
          group.best &&
          group.offers.length > 0
      )

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

      return (
        JSON.parse(
          localStorage.getItem(
            "achou_favorites"
          )
        ) || []
      );

    } catch {

      return [];

    }

  }


  function saveFavorites(
    list
  ) {

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
      .forEach(
        counter => {

          counter.textContent =
            favorites.length;

        }
      );

  }


  function bindFavorites() {

    const favorites =
      getFavorites()
        .map(String);


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


          if (
            favorites.includes(id)
          ) {

            button.textContent =
              "♥";

          } else {

            button.textContent =
              "♡";

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

        }
      );

  }


  /* ========================================================
     PAINEL DE OFERTAS DO PRODUTO
     ======================================================== */

  function bindOfferPanels() {

    document
      .querySelectorAll(
        "[data-toggle-offers]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const id =
                button.dataset
                  .toggleOffers;


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


              const count =
                panel.children.length;


              button.textContent =
                open
                  ? "OCULTAR OFERTAS"
                  : `COMPARAR ${count} ${
                      count === 1
                        ? "OFERTA"
                        : "OFERTAS"
                    }`;

            }
          );

        }
      );

  }


  /* ========================================================
     RENDERIZA PRODUTOS
     ======================================================== */

  function renderGroupedProducts(
    groups
  ) {

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
      groups

        .map(
          (
            group,
            groupIndex
          ) => {

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


            const rows =
              group.offers

                .map(
                  (
                    offer,
                    offerIndex
                  ) => {

                    const hasLink =
                      validAffiliateLink(
                        offer.link
                      );


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
                              ${escapeHtml(offer.store)}
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


                        ${
                          hasLink

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
                                type="button"
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


            const mainAction =
              validAffiliateLink(
                best.link
              )

                ? `

                  <a
                    href="${escapeHtml(best.link)}"
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
                    class="offer achou-link-pending"
                    disabled
                  >
                    LINK EM BREVE
                  </button>

                `;


            return `

              <article
                class="flash-card achou-group-card"
                data-product-id="${escapeHtml(group.productId)}"
              >


                ${
                  groupIndex === 0

                    ? `

                      <span class="discount">
                        MENOR PREÇO
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

                        <span class="achou-free">
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
                    Compare no ACHOU!
                  </span>

                  <span>

                    ${
                      group.storeCount === 1

                        ? "Mercado Livre integrado"

                        : `Compare em ${group.storeCount} lojas`
                    }

                  </span>

                </div>


                <div class="achou-actions">

                  ${mainAction}


                  <button
                    class="achou-see-offers"
                    type="button"
                    data-toggle-offers="${escapeHtml(group.productId)}"
                  >

                    COMPARAR

                    ${group.offers.length}

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

        ? String(
            forcedTerm
          ).trim()

        : searchInput
            .value
            .trim();


    if (!term) {

      focusSearch();

      return;

    }


    currentQuery =
      term;


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

          .filter(
            product => {

              return (

                product.id &&

                product.title &&

                Number.isFinite(
                  product.price
                ) &&

                product.price > 0

              );

            }
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


      const availableOffers =
        groupedProducts.reduce(
          (
            total,
            group
          ) => {

            return (
              total +
              group.offers.length
            );

          },
          0
        );


      updateSummary(
        groupedProducts.length,
        availableOffers,
        term
      );


      renderGroupedProducts(
        groupedProducts
      );


      renderAdminProducts();


      if (
        settings.scroll &&
        marketSection
      ) {

        scrollToOffers();

      }

    } catch (error) {

      console.error(
        "[ACHOU!] Busca:",
        error
      );


      products = [];

      groupedProducts = [];


      showError();

      renderAdminProducts();

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

    if (searchInput) {

      searchInput.value =
        "";

    }


    searchProducts(
      CONFIG.initialQuery,
      {

        scroll:
          false

      }
    );

  }


  /* ========================================================
     EVENTOS DA BUSCA
     ======================================================== */

  searchButton
    ?.addEventListener(
      "click",
      () => {

        searchProducts();

      }
    );


  searchInput
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          searchProducts();

        }

      }
    );


  /* ========================================================
     CHIPS DE PESQUISA
     ======================================================== */

  document
    .querySelectorAll(
      "[data-search]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const term =
              button.dataset.search;


            if (!term) {

              return;

            }


            searchInput.value =
              term;


            searchProducts(
              term
            );

          }
        );

      }
    );


  /* ========================================================
     CATEGORIAS / SUBCATEGORIAS
     ======================================================== */

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


  const categoryModalClose =
    document.querySelector(
      "#categoryModalClose"
    );


  const subcategoryGrid =
    document.querySelector(
      "#subcategoryGrid"
    );


  const CATEGORY_DATA = {


    celulares: {

      title:
        "Celulares",

      text:
        "Escolha uma marca ou tipo de celular.",

      items: [

        {
          label:
            "Samsung Galaxy",
          search:
            "Samsung Galaxy celular"
        },

        {
          label:
            "iPhone",
          search:
            "iPhone"
        },

        {
          label:
            "Motorola",
          search:
            "Motorola celular"
        },

        {
          label:
            "Xiaomi",
          search:
            "Xiaomi celular"
        },

        {
          label:
            "Realme",
          search:
            "Realme celular"
        },

        {
          label:
            "Smartphones 5G",
          search:
            "celular 5G"
        }

      ]

    },


    informatica: {

      title:
        "Informática",

      text:
        "Escolha o produto de informática que você procura.",

      items: [

        {
          label:
            "Notebooks",
          search:
            "notebook"
        },

        {
          label:
            "Notebook Gamer",
          search:
            "notebook gamer"
        },

        {
          label:
            "Computadores",
          search:
            "computador desktop"
        },

        {
          label:
            "Monitores",
          search:
            "monitor"
        },

        {
          label:
            "Teclados",
          search:
            "teclado"
        },

        {
          label:
            "Mouse",
          search:
            "mouse"
        },

        {
          label:
            "SSD",
          search:
            "SSD"
        },

        {
          label:
            "Impressoras",
          search:
            "impressora"
        }

      ]

    },


    tv: {

      title:
        "TV e Vídeo",

      text:
        "Escolha o tipo de TV ou equipamento.",

      items: [

        {
          label:
            "Smart TV",
          search:
            "Smart TV"
        },

        {
          label:
            "TV 4K",
          search:
            "Smart TV 4K"
        },

        {
          label:
            "Samsung",
          search:
            "Smart TV Samsung"
        },

        {
          label:
            "LG",
          search:
            "Smart TV LG"
        },

        {
          label:
            "TCL",
          search:
            "Smart TV TCL"
        },

        {
          label:
            "Projetores",
          search:
            "projetor"
        }

      ]

    },


    games: {

      title:
        "Games",

      text:
        "Escolha seu console ou categoria gamer.",

      items: [

        {
          label:
            "PlayStation 5",
          search:
            "PlayStation 5 console"
        },

        {
          label:
            "Xbox",
          search:
            "Xbox console"
        },

        {
          label:
            "Nintendo Switch",
          search:
            "Nintendo Switch console"
        },

        {
          label:
            "Consoles",
          search:
            "console videogame"
        },

        {
          label:
            "PC Gamer",
          search:
            "PC gamer"
        },

        {
          label:
            "Cadeira Gamer",
          search:
            "cadeira gamer"
        }

      ]

    },


    audio: {

      title:
        "Áudio",

      text:
        "Escolha o produto de áudio.",

      items: [

        {
          label:
            "Fone Bluetooth",
          search:
            "fone bluetooth"
        },

        {
          label:
            "Headset Gamer",
          search:
            "headset gamer"
        },

        {
          label:
            "AirPods",
          search:
            "AirPods"
        },

        {
          label:
            "Caixa Bluetooth",
          search:
            "caixa de som bluetooth"
        },

        {
          label:
            "JBL",
          search:
            "JBL caixa de som"
        },

        {
          label:
            "Soundbar",
          search:
            "soundbar"
        }

      ]

    },


    casa: {

      title:
        "Casa",

      text:
        "Encontre produtos para todos os ambientes da casa.",

      items: [

        {
          label:
            "Eletrodomésticos",
          search:
            "eletrodomésticos"
        },

        {
          label:
            "Cozinha",
          search:
            "utensílios cozinha"
        },

        {
          label:
            "Air Fryer",
          search:
            "Air Fryer"
        },

        {
          label:
            "Geladeira",
          search:
            "geladeira"
        },

        {
          label:
            "Micro-ondas",
          search:
            "micro-ondas"
        },

        {
          label:
            "Cama, Mesa e Banho",
          search:
            "cama mesa banho"
        },

        {
          label:
            "Organização",
          search:
            "organizador casa"
        },

        {
          label:
            "Decoração",
          search:
            "decoração casa"
        },

        {
          label:
            "Copos e Taças",
          search:
            "copos taças"
        },

        {
          label:
            "Limpeza",
          search:
            "produtos limpeza casa"
        }

      ]

    },


    moda: {

      title:
        "Moda",

      text:
        "Escolha a categoria de moda que você procura.",

      items: [

        {
          label:
            "Tênis",
          search:
            "tênis masculino"
        },

        {
          label:
            "Moda Masculina",
          search:
            "roupa masculina"
        },

        {
          label:
            "Moda Feminina",
          search:
            "roupa feminina"
        },

        {
          label:
            "Bolsas",
          search:
            "bolsa feminina"
        },

        {
          label:
            "Relógios",
          search:
            "relógio"
        },

        {
          label:
            "Acessórios",
          search:
            "acessórios moda"
        }

      ]

    },


    ferramentas: {

      title:
        "Ferramentas",

      text:
        "Escolha a ferramenta que você procura.",

      items: [

        {
          label:
            "Furadeiras",
          search:
            "furadeira"
        },

        {
          label:
            "Parafusadeiras",
          search:
            "parafusadeira"
        },

        {
          label:
            "Serra Circular",
          search:
            "serra circular"
        },

        {
          label:
            "Esmerilhadeira",
          search:
            "esmerilhadeira"
        },

        {
          label:
            "Ferramentas Manuais",
          search:
            "kit ferramentas manuais"
        },

        {
          label:
            "Bosch",
          search:
            "ferramenta Bosch"
        },

        {
          label:
            "Makita",
          search:
            "ferramenta Makita"
        },

        {
          label:
            "DeWalt",
          search:
            "ferramenta DeWalt"
        }

      ]

    }

  };


  function bodyLock() {

    document.body
      .classList.add(
        "modal-open"
      );

  }


  function bodyUnlock() {

    const open =
      document.querySelector(
        ".category-modal.active, .login-modal.active, .signup-modal.active, .admin-login-modal.active, .admin-panel-modal.active"
      );


    if (!open) {

      document.body
        .classList.remove(
          "modal-open"
        );

    }

  }


  function openCategory(
    key
  ) {

    const category =
      CATEGORY_DATA[key];


    if (
      !category ||
      !categoryModal ||
      !subcategoryGrid
    ) {

      return;

    }


    if (categoryModalTitle) {

      categoryModalTitle.textContent =
        category.title;

    }


    if (categoryModalText) {

      categoryModalText.textContent =
        category.text;

    }


    subcategoryGrid.innerHTML =
      category.items

        .map(
          item => `

            <button
              type="button"
              data-subcategory-search="${escapeHtml(item.search)}"
            >
              ${escapeHtml(item.label)}
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

          button.addEventListener(
            "click",
            () => {

              const term =
                button.dataset
                  .subcategorySearch;


              closeCategory();


              if (searchInput) {

                searchInput.value =
                  term;

              }


              searchProducts(
                term
              );

            }
          );

        }
      );


    categoryModal.classList.add(
      "active"
    );


    bodyLock();

  }


  function closeCategory() {

    categoryModal
      ?.classList.remove(
        "active"
      );


    bodyUnlock();

  }


  document
    .querySelectorAll(
      ".quick-category[data-category]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openCategory(
              button.dataset.category
            );

          }
        );

      }
    );


  categoryModalClose
    ?.addEventListener(
      "click",
      closeCategory
    );


  categoryModal
    ?.addEventListener(
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


  document
    .querySelector(
      ".category-show-all"
    )
    ?.addEventListener(
      "click",
      () => {

        categoriesSection
          ?.scrollIntoView({

            behavior:
              "smooth",

            block:
              "start"

          });

      }
    );


  /* ========================================================
     BANNER VER OFERTAS
     ======================================================== */

  document
    .querySelector(
      ".offer-banner .see-all"
    )
    ?.addEventListener(
      "click",
      scrollToOffers
    );


  /* ========================================================
     VER TODOS PRODUTOS
     ======================================================== */

  marketSection
    ?.querySelector(
      ".see-all"
    )
    ?.addEventListener(
      "click",
      () => {

        searchInput.value =
          "";

        searchProducts(
          CONFIG.initialQuery
        );

      }
    );


  /* ========================================================
     LOGIN NORMAL
     ======================================================== */

  const loginModal =
    document.querySelector(
      "#loginModal"
    );


  const signupModal =
    document.querySelector(
      "#signupModal"
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


  function openLogin() {

    loginModal
      ?.classList.add(
        "active"
      );

    bodyLock();

  }


  function closeLogin() {

    loginModal
      ?.classList.remove(
        "active"
      );

    bodyUnlock();

  }


  function openSignup() {

    signupModal
      ?.classList.add(
        "active"
      );

    bodyLock();

  }


  function closeSignup() {

    signupModal
      ?.classList.remove(
        "active"
      );

    bodyUnlock();

  }


  accountButton
    ?.addEventListener(
      "click",
      openLogin
    );


  loginClose
    ?.addEventListener(
      "click",
      closeLogin
    );


  signupClose
    ?.addEventListener(
      "click",
      closeSignup
    );


  createAccount
    ?.addEventListener(
      "click",
      () => {

        closeLogin();

        openSignup();

      }
    );


  signupLogin
    ?.addEventListener(
      "click",
      () => {

        closeSignup();

        openLogin();

      }
    );


  loginModal
    ?.addEventListener(
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


  signupModal
    ?.addEventListener(
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


  loginForm
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
            ?.value
            .trim();


        const password =
          document
            .querySelector(
              "#loginPassword"
            )
            ?.value;


        if (
          !email ||
          !password
        ) {

          return;

        }


        try {

          const {
            data,
            error
          } =
            await db.auth
              .signInWithPassword({

                email,

                password

              });


          if (error) {

            throw error;

          }


          closeLogin();


          updateAccountUI(
            data?.user ||
            null
          );

        } catch (error) {

          console.error(
            "[ACHOU!] Login:",
            error
          );


          alert(
            "Não foi possível entrar. Confira seu e-mail e senha."
          );

        }

      }
    );


  signupForm
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
            ?.value
            .trim();


        const email =
          document
            .querySelector(
              "#signupEmail"
            )
            ?.value
            .trim();


        const password =
          document
            .querySelector(
              "#signupPassword"
            )
            ?.value;


        const confirm =
          document
            .querySelector(
              "#signupPasswordConfirm"
            )
            ?.value;


        if (
          !name ||
          !email ||
          !password
        ) {

          return;

        }


        if (
          password !==
          confirm
        ) {

          alert(
            "As senhas não coincidem."
          );

          return;

        }


        if (
          password.length < 6
        ) {

          alert(
            "A senha precisa ter pelo menos 6 caracteres."
          );

          return;

        }


        try {

          const {
            data,
            error
          } =
            await db.auth
              .signUp({

                email,

                password,

                options: {

                  data: {

                    full_name:
                      name

                  }

                }

              });


          if (error) {

            throw error;

          }


          alert(
            "Conta criada com sucesso."
          );


          closeSignup();


          if (data?.user) {

            updateAccountUI(
              data.user
            );

          }

        } catch (error) {

          console.error(
            "[ACHOU!] Cadastro:",
            error
          );


          alert(
            "Não foi possível criar a conta."
          );

        }

      }
    );


  function updateAccountUI(
    user
  ) {

    const greeting =
      document.querySelector(
        ".account-greeting strong"
      );


    const hello =
      document.querySelector(
        ".account-greeting small"
      );


    const avatar =
      document.querySelector(
        ".account-avatar"
      );


    if (!user) {

      if (greeting) {

        greeting.textContent =
          "Entrar";

      }


      if (hello) {

        hello.textContent =
          "Olá!";

      }


      if (avatar) {

        avatar.textContent =
          "●";

      }


      return;

    }


    const name =
      user.user_metadata
        ?.full_name ||
      user.email
        ?.split("@")[0] ||
      "Usuário";


    const firstName =
      String(name)
        .trim()
        .split(" ")[0];


    if (hello) {

      hello.textContent =
        "Olá,";

    }


    if (greeting) {

      greeting.textContent =
        firstName;

    }


    if (avatar) {

      avatar.textContent =
        firstName
          .charAt(0)
          .toUpperCase();

    }

  }


  async function loadCurrentUser() {

    if (!db) {

      return;

    }


    try {

      const {
        data
      } =
        await db.auth
          .getUser();


      updateAccountUI(
        data?.user ||
        null
      );

    } catch {

      updateAccountUI(
        null
      );

    }

  }


  /* ========================================================
     ADMIN — ELEMENTOS
     ======================================================== */

  const adminSecretButton =
    document.querySelector(
      "#adminSecretButton"
    );


  const adminLoginModal =
    document.querySelector(
      "#adminLoginModal"
    );


  const adminLoginForm =
    document.querySelector(
      "#adminLoginForm"
    );


  const adminLoginClose =
    document.querySelector(
      "#adminLoginClose"
    );


  const adminLoginMessage =
    document.querySelector(
      "#adminLoginMessage"
    );


  const adminPanelModal =
    document.querySelector(
      "#adminPanelModal"
    );


  const adminPanelClose =
    document.querySelector(
      "#adminPanelClose"
    );


  const adminLogoutButton =
    document.querySelector(
      "#adminLogoutButton"
    );


  const adminProductsList =
    document.querySelector(
      "#adminProductsList"
    );


  const adminRefreshProducts =
    document.querySelector(
      "#adminRefreshProducts"
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


  const adminClearForm =
    document.querySelector(
      "#adminClearForm"
    );


  const adminFormMessage =
    document.querySelector(
      "#adminFormMessage"
    );


  const adminLinksList =
    document.querySelector(
      "#adminLinksList"
    );


  const adminRefreshLinks =
    document.querySelector(
      "#adminRefreshLinks"
    );


  /* ========================================================
     ADMIN — SESSÃO
     ======================================================== */

  async function resetAdminSession() {

    if (!adminDb) {

      return;

    }


    try {

      await adminDb.auth
        .signOut();

    } catch {

      /* ignora */

    }

  }


  function openAdminLogin() {

    const email =
      document.querySelector(
        "#adminEmail"
      );


    const password =
      document.querySelector(
        "#adminPassword"
      );


    if (email) {

      email.value =
        "";

    }


    if (password) {

      password.value =
        "";

    }


    setMessage(
      adminLoginMessage,
      ""
    );


    adminLoginModal
      ?.classList.add(
        "active"
      );


    bodyLock();


    setTimeout(
      () => {

        email
          ?.focus();

      },
      200
    );

  }


  function closeAdminLogin() {

    adminLoginModal
      ?.classList.remove(
        "active"
      );


    setMessage(
      adminLoginMessage,
      ""
    );


    bodyUnlock();

  }


  function openAdminPanel() {

    adminLoginModal
      ?.classList.remove(
        "active"
      );


    adminPanelModal
      ?.classList.add(
        "active"
      );


    bodyLock();


    renderAdminProducts();

    loadAdminLinks();

  }


  async function closeAdminPanel() {

    adminPanelModal
      ?.classList.remove(
        "active"
      );


    await resetAdminSession();


    bodyUnlock();

  }


  adminSecretButton
    ?.addEventListener(
      "click",
      async () => {

        await resetAdminSession();

        openAdminLogin();

      }
    );


  adminLoginClose
    ?.addEventListener(
      "click",
      async () => {

        await resetAdminSession();

        closeAdminLogin();

      }
    );


  adminPanelClose
    ?.addEventListener(
      "click",
      closeAdminPanel
    );


  adminLogoutButton
    ?.addEventListener(
      "click",
      closeAdminPanel
    );


  /* ========================================================
     ADMIN — VERIFICA ACESSO
     ======================================================== */

  async function getCurrentAdmin() {

    if (!adminDb) {

      return null;

    }


    try {

      const {
        data:
          userData,
        error:
          userError
      } =
        await adminDb.auth
          .getUser();


      if (
        userError ||
        !userData?.user
      ) {

        return null;

      }


      const user =
        userData.user;


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
            user.id
          )

          .maybeSingle();


      if (
        error ||
        !data
      ) {

        return null;

      }


      return user;

    } catch {

      return null;

    }

  }


  /* ========================================================
     ADMIN — LOGIN
     ======================================================== */

  adminLoginForm
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        if (!adminDb) {

          setMessage(
            adminLoginMessage,
            "Supabase indisponível.",
            "error"
          );

          return;

        }


        const email =
          document
            .querySelector(
              "#adminEmail"
            )
            ?.value
            .trim();


        const password =
          document
            .querySelector(
              "#adminPassword"
            )
            ?.value;


        if (
          !email ||
          !password
        ) {

          setMessage(
            adminLoginMessage,
            "Digite e-mail e senha.",
            "error"
          );

          return;

        }


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
            await adminDb.auth
              .signInWithPassword({

                email,

                password

              });


          if (
            error ||
            !data?.user
          ) {

            throw new Error(
              "Login inválido."
            );

          }


          const {
            data:
              adminData,
            error:
              adminError
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


            throw new Error(
              "Usuário não autorizado."
            );

          }


          setMessage(
            adminLoginMessage,
            ""
          );


          openAdminPanel();

        } catch (error) {

          console.error(
            "[ACHOU!] Admin:",
            error
          );


          await resetAdminSession();


          setMessage(
            adminLoginMessage,
            "E-mail ou senha incorretos, ou usuário sem permissão.",
            "error"
          );

        }

      }
    );


  /* ========================================================
     ADMIN — PRODUTOS
     ======================================================== */

  function renderAdminProducts() {

    if (!adminProductsList) {

      return;

    }


    if (
      !Array.isArray(products) ||
      products.length === 0
    ) {

      adminProductsList.innerHTML = `

        <div class="admin-empty">

          Faça uma busca no ACHOU!
          para carregar os produtos.

        </div>

      `;

      return;

    }


    adminProductsList.innerHTML =
      products

        .map(
          (
            product,
            index
          ) => {

            const existing =
              findAffiliateForProduct(
                product
              );


            const image =
              product.image

                ? `

                  <img
                    src="${escapeHtml(product.image)}"
                    alt=""
                  >

                `

                : `

                  <div class="admin-product-no-image">
                    sem imagem
                  </div>

                `;


            return `

              <article class="admin-product-card">

                <div class="admin-product-image">

                  ${image}

                </div>


                <div class="admin-product-data">

                  <strong>
                    ${escapeHtml(product.title)}
                  </strong>

                  <span>
                    ${money(product.price)}
                  </span>

                  <small>
                    Item:
                    ${escapeHtml(product.itemId)}
                  </small>

                  ${
                    product.productId

                      ? `

                        <small>
                          Catálogo:
                          ${escapeHtml(product.productId)}
                        </small>

                      `

                      : ""
                  }

                  ${
                    existing

                      ? `

                        <em class="admin-linked">
                          LINK CADASTRADO
                        </em>

                      `

                      : `

                        <em>
                          SEM LINK
                        </em>

                      `
                  }

                </div>


                <button
                  type="button"
                  class="admin-select-product"
                  data-admin-product="${index}"
                >

                  ${
                    existing
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

          button.addEventListener(
            "click",
            () => {

              const index =
                Number(
                  button.dataset
                    .adminProduct
                );


              const product =
                products[index];


              if (!product) {

                return;

              }


              fillAdminFormFromProduct(
                product
              );

            }
          );

        }
      );

  }


  function fillAdminFormFromProduct(
    product
  ) {

    const existing =
      findAffiliateForProduct(
        product
      );


    if (adminAffiliateId) {

      adminAffiliateId.value =
        existing?.id ||
        "";

    }


    if (adminItemId) {

      adminItemId.value =
        product.itemId ||
        "";

    }


    if (adminProductId) {

      adminProductId.value =
        product.productId ||
        "";

    }


    if (adminProductTitle) {

      adminProductTitle.value =
        product.title ||
        "";

    }


    if (adminAffiliateUrl) {

      adminAffiliateUrl.value =
        existing
          ?.affiliate_url ||
        "";

    }


    if (adminAffiliateActive) {

      adminAffiliateActive.checked =
        existing
          ? existing.active !== false
          : true;

    }


    setMessage(
      adminFormMessage,

      existing
        ? "Link existente carregado para edição."
        : "Produto selecionado. Cole o link afiliado.",

      existing
        ? "success"
        : ""
    );


    adminAffiliateUrl
      ?.scrollIntoView({

        behavior: "smooth",

        block: "center"

      });


    setTimeout(
      () => {

        adminAffiliateUrl
          ?.focus();

      },
      300
    );

  }


  adminRefreshProducts
    ?.addEventListener(
      "click",
      renderAdminProducts
    );


  /* ========================================================
     ADMIN — LIMPAR FORMULÁRIO
     ======================================================== */

  function clearAdminForm() {

    adminAffiliateForm
      ?.reset();


    if (adminAffiliateId) {

      adminAffiliateId.value =
        "";

    }


    if (adminAffiliateActive) {

      adminAffiliateActive.checked =
        true;

    }


    setMessage(
      adminFormMessage,
      ""
    );

  }


  adminClearForm
    ?.addEventListener(
      "click",
      clearAdminForm
    );


  /* ========================================================
     ADMIN — SALVAR LINK
     ======================================================== */

  adminAffiliateForm
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        if (!adminDb) {

          return;

        }


        const admin =
          await getCurrentAdmin();


        if (!admin) {

          setMessage(
            adminFormMessage,
            "Sua sessão administrativa expirou. Entre novamente.",
            "error"
          );

          return;

        }


        const id =
          adminAffiliateId
            ?.value
            .trim();


        const itemId =
          adminItemId
            ?.value
            .trim();


        const productId =
          adminProductId
            ?.value
            .trim();


        const title =
          adminProductTitle
            ?.value
            .trim();


        const url =
          adminAffiliateUrl
            ?.value
            .trim();


        const active =
          adminAffiliateActive
            ?.checked === true;


        if (
          !itemId ||
          !title ||
          !url
        ) {

          setMessage(
            adminFormMessage,
            "Preencha Item ID, produto e link.",
            "error"
          );

          return;

        }


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


        setMessage(
          adminFormMessage,
          "Salvando..."
        );


        try {

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
              new Date()
                .toISOString()

          };


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
              data:
                existing,
              error:
                findError
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


            if (existing?.id) {

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


          await refreshProductsAfterAffiliateChange();


          await loadAdminLinks();

        } catch (error) {

          console.error(
            "[ACHOU!] Salvar link:",
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


  async function refreshProductsAfterAffiliateChange() {

    await loadAffiliateLinks();


    products =
      applyAffiliateLinks(
        products
      );


    groupedProducts =
      groupProducts(
        products
      );


    const availableOffers =
      groupedProducts.reduce(
        (
          total,
          group
        ) =>
          total +
          group.offers.length,
        0
      );


    updateSummary(
      groupedProducts.length,
      availableOffers,
      currentQuery
    );


    renderGroupedProducts(
      groupedProducts
    );


    renderAdminProducts();

  }


  /* ========================================================
     ADMIN — LISTAR LINKS
     ======================================================== */

  async function loadAdminLinks() {

    if (
      !adminLinksList ||
      !adminDb
    ) {

      return;

    }


    const admin =
      await getCurrentAdmin();


    if (!admin) {

      adminLinksList.innerHTML = `

        <div class="admin-empty">
          Sessão administrativa inválida.
        </div>

      `;

      return;

    }


    adminLinksList.innerHTML = `

      <div class="admin-empty">
        Carregando...
      </div>

    `;


    try {

      const {
        data,
        error
      } =
        await adminDb

          .from(
            "affiliate_links"
          )

          .select(
            "id, marketplace, item_id, catalog_product_id, product_title, affiliate_url, active, created_at, updated_at"
          )

          .order(
            "updated_at",
            {

              ascending:
                false

            }
          );


      if (error) {

        throw error;

      }


      const list =
        Array.isArray(data)
          ? data
          : [];


      if (
        list.length === 0
      ) {

        adminLinksList.innerHTML = `

          <div class="admin-empty">
            Nenhum link cadastrado.
          </div>

        `;

        return;

      }


      adminLinksList.innerHTML =
        list

          .map(
            link => `

              <article class="admin-link-card">

                <div class="admin-link-data">

                  <strong>
                    ${escapeHtml(
                      link.product_title ||
                      "Produto"
                    )}
                  </strong>

                  <span>
                    ${escapeHtml(
                      link.item_id ||
                      ""
                    )}
                  </span>

                  <small>
                    ${escapeHtml(
                      link.affiliate_url ||
                      ""
                    )}
                  </small>

                  <em
                    class="${
                      link.active
                        ? "active"
                        : ""
                    }"
                  >

                    ${
                      link.active
                        ? "ATIVO"
                        : "INATIVO"
                    }

                  </em>

                </div>


                <div class="admin-link-actions">

                  <button
                    type="button"
                    data-admin-edit="${link.id}"
                  >
                    EDITAR
                  </button>

                  <button
                    type="button"
                    class="delete"
                    data-admin-delete="${link.id}"
                  >
                    EXCLUIR
                  </button>

                </div>

              </article>

            `
          )

          .join("");


      adminLinksList
        .querySelectorAll(
          "[data-admin-edit]"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                const id =
                  String(
                    button.dataset
                      .adminEdit
                  );


                const link =
                  list.find(
                    item =>
                      String(
                        item.id
                      ) === id
                  );


                if (!link) {

                  return;

                }


                adminAffiliateId.value =
                  link.id;


                adminItemId.value =
                  link.item_id ||
                  "";


                adminProductId.value =
                  link.catalog_product_id ||
                  "";


                adminProductTitle.value =
                  link.product_title ||
                  "";


                adminAffiliateUrl.value =
                  link.affiliate_url ||
                  "";


                adminAffiliateActive.checked =
                  link.active !== false;


                setMessage(
                  adminFormMessage,
                  "Link carregado para edição.",
                  "success"
                );


                adminAffiliateUrl
                  ?.scrollIntoView({

                    behavior:
                      "smooth",

                    block:
                      "center"

                  });

              }
            );

          }
        );


      adminLinksList
        .querySelectorAll(
          "[data-admin-delete]"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              async () => {

                const admin =
                  await getCurrentAdmin();


                if (!admin) {

                  alert(
                    "Sessão administrativa expirada."
                  );

                  return;

                }


                const id =
                  button.dataset
                    .adminDelete;


                const confirmed =
                  window.confirm(
                    "Excluir este link afiliado?"
                  );


                if (!confirmed) {

                  return;

                }


                try {

                  const {
                    error
                  } =
                    await adminDb

                      .from(
                        "affiliate_links"
                      )

                      .delete()

                      .eq(
                        "id",
                        id
                      );


                  if (error) {

                    throw error;

                  }


                  await refreshProductsAfterAffiliateChange();


                  await loadAdminLinks();

                } catch (error) {

                  console.error(
                    "[ACHOU!] Excluir:",
                    error
                  );


                  alert(
                    "Não foi possível excluir o link."
                  );

                }

              }
            );

          }
        );

    } catch (error) {

      console.error(
        "[ACHOU!] Listar links:",
        error
      );


      adminLinksList.innerHTML = `

        <div class="admin-empty">
          Não foi possível carregar os links.
        </div>

      `;

    }

  }


  adminRefreshLinks
    ?.addEventListener(
      "click",
      loadAdminLinks
    );


  /* ========================================================
     MENU INFERIOR
     ======================================================== */

  const bottomItems =
    document.querySelectorAll(
      ".bottom-nav-item"
    );


  bottomItems.forEach(
    item => {

      item.addEventListener(
        "click",
        () => {

          bottomItems
            .forEach(
              nav => {

                nav.classList.remove(
                  "active"
                );

              }
            );


          item.classList.add(
            "active"
          );


          const action =
            item.dataset.nav;


          if (
            action ===
            "home"
          ) {

            window.scrollTo({

              top: 0,

              behavior:
                "smooth"

            });

          }


          if (
            action ===
            "categories"
          ) {

            categoriesSection
              ?.scrollIntoView({

                behavior:
                  "smooth",

                block:
                  "start"

              });

          }


          if (
            action ===
            "search"
          ) {

            focusSearch();

          }


          if (
            action ===
            "favorites"
          ) {

            scrollToOffers();

          }


          if (
            action ===
            "profile"
          ) {

            openLogin();

          }

        }
      );

    }
  );


  /* ========================================================
     FAVORITOS DO HEADER
     ======================================================== */

  document
    .querySelector(
      ".header-icon"
    )
    ?.addEventListener(
      "click",
      scrollToOffers
    );


  /* ========================================================
     MENU HAMBÚRGUER
     ======================================================== */

  document
    .querySelector(
      ".menu-button"
    )
    ?.addEventListener(
      "click",
      () => {

        categoriesSection
          ?.scrollIntoView({

            behavior:
              "smooth",

            block:
              "start"

          });

      }
    );


  /* ========================================================
     MODAIS ADMIN
     ======================================================== */

  adminLoginModal
    ?.addEventListener(
      "click",
      async event => {

        if (
          event.target ===
          adminLoginModal
        ) {

          await resetAdminSession();

          closeAdminLogin();

        }

      }
    );


  adminPanelModal
    ?.addEventListener(
      "click",
      async event => {

        if (
          event.target ===
          adminPanelModal
        ) {

          await closeAdminPanel();

        }

      }
    );


  /* ========================================================
     ESC
     ======================================================== */

  document.addEventListener(
    "keydown",
    async event => {

      if (
        event.key !==
        "Escape"
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


  /* ========================================================
     INICIALIZAÇÃO
     ======================================================== */

  updateFavoriteCounter();


  if (searchInput) {

    searchInput.value =
      "";

  }


  loadCurrentUser();


  resetAdminSession();


  loadInitialDeals();


  console.log(
    "[ACHOU!] Comparador carregado."
  );


});
