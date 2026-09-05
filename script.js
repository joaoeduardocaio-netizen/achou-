/* =========================================================
   ACHOU! — COMPARADOR PROFISSIONAL
   Mercado Livre + links afiliados manuais + painel admin

   VERSÃO:
   - Exibe produtos mesmo sem link afiliado
   - Link afiliado vinculado somente ao ITEM ID exato
   - Admin exige login em todo novo acesso
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ========================================================
     CONFIG
     ======================================================== */

  const CONFIG = {
    locale: "pt-BR",
    currency: "BRL",

    heroInterval: 5000,

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
            storageKey: "achou-user-auth"
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

  let summaryBox = null;

  let heroIndex = 0;

  let currentQuery =
    CONFIG.initialQuery;


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

  const marketSection =
    document.querySelector(
      ".market-section"
    );

  const heroCTA =
    document.querySelector(
      ".hero-cta"
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
        currency: CONFIG.currency
      }
    );
  }


  function normalizeText(text) {

    return String(text || "")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
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


      if (
        parsed.protocol !== "https:"
      ) {
        return false;
      }


      const host =
        parsed.hostname.toLowerCase();


      return (
        host === "meli.la" ||
        host === "mercadolivre.com.br" ||
        host.endsWith(
          ".mercadolivre.com.br"
        ) ||
        host === "mercadolibre.com" ||
        host.endsWith(
          ".mercadolibre.com"
        )
      );


    } catch {

      return false;
    }
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
      element.classList.add(type);
    }
  }


  /* ========================================================
     RESUMO
     ======================================================== */

  function createSummary() {

    if (
      !marketSection ||
      !dealsContainer
    ) {
      return;
    }


    summaryBox =
      document.createElement(
        "div"
      );


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
              ? "oferta encontrada"
              : "ofertas encontradas"
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
     STATUS
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
          Consultando produtos
          e preços reais.
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
          Tente novamente
          em alguns instantes.
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
          Tente pesquisar
          outro produto ou categoria.
        </span>

      </div>
    `;
  }


  /* ========================================================
     NORMALIZA PRODUTOS DA API
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
        "[ACHOU!] Links afiliados:",
        error
      );


      affiliateLinks = [];

      return [];
    }
  }


  /* ========================================================
     PROCURA LINK EXATO PELO ITEM ID

     NÃO usa mais Product ID como fallback.

     Assim o preço exibido pertence
     exatamente ao anúncio do link.
     ======================================================== */

  function findAffiliateForProduct(
    product
  ) {

    if (
      !product ||
      !product.itemId
    ) {
      return null;
    }


    const exact =
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
      );


    return exact || null;
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
     AGRUPAMENTO

     IMPORTANTE:
     Agora produtos SEM link também permanecem.
     ======================================================== */

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


    return Array
      .from(
        map.values()
      )

      .map(
        group => {

          /*
             TODAS AS OFERTAS REAIS,
             mesmo sem link afiliado.
          */

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


          /*
             OFERTAS QUE JÁ POSSUEM
             link afiliado cadastrado.
          */

          group.linkedOffers =
            group.offers.filter(
              offer =>
                validAffiliateLink(
                  offer.link
                )
            );


          /*
             Menor preço real encontrado,
             independente do link.
          */

          group.best =
            group.offers[0] ||
            null;


          /*
             Menor preço com link afiliado.
          */

          group.bestLinked =
            group.linkedOffers[0] ||
            null;


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
      .forEach(
        counter => {

          counter.textContent =
            favorites.length;
        }
      );
  }


  function bindFavorites() {

    const buttons =
      document.querySelectorAll(
        "[data-favorite]"
      );


    const favorites =
      getFavorites()
        .map(String);


    buttons.forEach(
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
      }
    );
  }


  /* ========================================================
     ABRIR / FECHAR LISTA DE OFERTAS
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


              button.textContent =
                open
                  ? "OCULTAR OFERTAS"
                  : `VER ${
                      panel.children.length
                    } ${
                      panel.children.length === 1
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


            const bestLinked =
              group.bestLinked;


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


            /*
               LISTA DAS OFERTAS.

               Com link:
               botão VER OFERTA.

               Sem link:
               botão LINK EM BREVE.
            */

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
                                <span
                                  class="achou-best-label"
                                >
                                  MENOR PREÇO
                                </span>
                              `
                              : ""
                          }

                          <strong
                            class="achou-offer-price"
                          >
                            ${money(
                              offer.price
                            )}
                          </strong>

                          <div
                            class="achou-offer-meta"
                          >

                            <span>
                              Mercado Livre
                            </span>

                            ${
                              offer.freeShipping
                                ? `
                                  <span
                                    class="achou-free"
                                  >
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
                                href="${escapeHtml(
                                  offer.link
                                )}"
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


            /*
               BOTÃO PRINCIPAL.

               Se o menor preço encontrado
               já possui link, abre ele.

               Caso contrário mostra
               LINK EM BREVE.

               Não apontamos para outro anúncio,
               evitando diferença de preço.
            */

            const mainAction =
              validAffiliateLink(
                best.link
              )
                ? `
                  <a
                    href="${escapeHtml(
                      best.link
                    )}"
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
                data-product-id="${escapeHtml(
                  group.productId
                )}"
              >

                ${
                  groupIndex === 0
                    ? `
                      <span
                        class="discount"
                      >
                        MELHOR PREÇO
                      </span>
                    `
                    : ""
                }


                <button
                  class="product-favorite"
                  type="button"
                  data-favorite="${escapeHtml(
                    favoriteId
                  )}"
                  aria-label="Favoritar produto"
                >
                  ♡
                </button>


                <div
                  class="flash-photo"
                >
                  ${image}
                </div>


                <h3>
                  ${title}
                </h3>


                <div
                  class="achou-group-info"
                >

                  <span
                    class="achou-offer-count"
                  >
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


                <span
                  class="achou-starting"
                >
                  A partir de
                </span>


                <strong
                  class="flash-price"
                >
                  ${money(
                    best.price
                  )}
                </strong>


                <div
                  class="product-bottom"
                >

                  <span>
                    Mercado Livre
                  </span>

                  <span>
                    ${
                      group.linkedOffers.length > 0
                        ? `${group.linkedOffers.length} ${
                            group.linkedOffers.length === 1
                              ? "link disponível"
                              : "links disponíveis"
                          }`
                        : "Link afiliado em breve"
                    }
                  </span>

                </div>


                <div
                  class="achou-actions"
                >

                  ${mainAction}


                  <button
                    class="achou-see-offers"
                    type="button"
                    data-toggle-offers="${escapeHtml(
                      group.productId
                    )}"
                  >
                    VER
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
                  data-offers-panel="${escapeHtml(
                    group.productId
                  )}"
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
      .forEach(
        note =>
          note.remove()
      );


    const note =
      document.createElement(
        "div"
      );


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
     BUSCA
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

      searchInput.focus();

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
          ) =>
            total +
            group.offers.length,
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
        marketSection &&
        settings.scroll
      ) {

        marketSection
          .scrollIntoView({
            behavior:
              "smooth",

            block:
              "start"
          });
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

    if (!searchInput) {
      return;
    }


    searchInput.value =
      "";


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
            .forEach(
              item => {

                item.classList.remove(
                  "active"
                );
              }
            );


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
              "celular smartphone",

            informatica:
              "notebook computador",

            tv:
              "smart tv",

            games:
              "console videogame",

            audio:
              "fone bluetooth",

            casa:
              "eletrodomesticos casa",

            moda:
              "tenis roupa",

            ferramentas:
              "furadeira ferramentas",

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
            text ===
            "todos"
          ) {

            searchInput.value =
              "";


            searchProducts(
              CONFIG.initialQuery
            );


            return;
          }


          searchInput.value =
            term;


          searchProducts();
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
        `<strong>${escapeHtml(
          slide.title
        )}</strong>`;
    }


    if (heroText) {

      heroText.textContent =
        slide.text;
    }


    heroDots.forEach(
      (
        dot,
        index
      ) => {

        dot.classList.toggle(
          "active",
          index ===
            heroIndex
        );
      }
    );
  }


  heroPrev
    ?.addEventListener(
      "click",
      () => {

        renderHero(
          heroIndex - 1
        );
      }
    );


  heroNext
    ?.addEventListener(
      "click",
      () => {

        renderHero(
          heroIndex + 1
        );
      }
    );


  heroDots.forEach(
    (
      dot,
      index
    ) => {

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


  heroCTA
    ?.addEventListener(
      "click",
      () => {

        searchInput
          ?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "center"
          });


        setTimeout(
          () => {

            searchInput
              ?.focus();

          },
          400
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


  function bodyLock() {

    document.body
      .classList.add(
        "modal-open"
      );
  }


  function bodyUnlock() {

    const open =
      document.querySelector(
        ".login-modal.active, .signup-modal.active, .admin-login-modal.active, .admin-panel-modal.active"
      );


    if (!open) {

      document.body
        .classList.remove(
          "modal-open"
        );
    }
  }


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


          const greeting =
            document.querySelector(
              ".account-greeting strong"
            );


          if (greeting) {

            greeting.textContent =
              "Minha conta";
          }


        } catch {

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


        try {

          const {
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


        } catch {

          alert(
            "Não foi possível criar a conta."
          );
        }
      }
    );


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
      email.value = "";
    }


    if (password) {
      password.value = "";
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

        email?.focus();

      },
      250
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


  /* ========================================================
     ADMIN — ACESSO SECRETO
     ======================================================== */

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


  /* ========================================================
     ADMIN — VERIFICA USUÁRIO
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
     ADMIN — SAIR
     ======================================================== */

  adminLogoutButton
    ?.addEventListener(
      "click",
      async () => {

        await closeAdminPanel();
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
                    src="${escapeHtml(
                      product.image
                    )}"
                    alt=""
                  >
                `
                : `
                  <div
                    class="admin-product-no-image"
                  >
                    sem imagem
                  </div>
                `;


            return `
              <article
                class="admin-product-card"
              >

                <div
                  class="admin-product-image"
                >
                  ${image}
                </div>


                <div
                  class="admin-product-data"
                >

                  <strong>
                    ${escapeHtml(
                      product.title
                    )}
                  </strong>

                  <span>
                    ${money(
                      product.price
                    )}
                  </span>

                  <small>
                    Item:
                    ${escapeHtml(
                      product.itemId
                    )}
                  </small>

                  ${
                    product.productId
                      ? `
                        <small>
                          Catálogo:
                          ${escapeHtml(
                            product.productId
                          )}
                        </small>
                      `
                      : ""
                  }

                  ${
                    existing
                      ? `
                        <em
                          class="admin-linked"
                        >
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
        existing?.affiliate_url ||
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
        behavior:
          "smooth",

        block:
          "center"
      });


    setTimeout(
      () => {

        adminAffiliateUrl
          ?.focus();

      },
      350
    );
  }


  adminRefreshProducts
    ?.addEventListener(
      "click",
      renderAdminProducts
    );


  /* ========================================================
     ADMIN — LIMPAR
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
     ADMIN — SALVAR
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


  /* ========================================================
     ADMIN — LISTAR LINKS
     ======================================================== */

  async function loadAdminLinks() {

    if (!adminLinksList) {
      return;
    }


    if (!adminDb) {
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
            link => {

              return `
                <article
                  class="admin-link-card"
                >

                  <div
                    class="admin-link-data"
                  >

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
                        link.affiliate_url
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


                  <div
                    class="admin-link-actions"
                  >

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
              `;
            }
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
    (
      item,
      index
    ) => {

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


          if (index === 0) {

            window.scrollTo({
              top: 0,
              behavior:
                "smooth"
            });
          }


          if (index === 1) {

            document
              .querySelector(
                ".quick-categories"
              )
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "center"
              });
          }


          if (index === 2) {

            searchInput
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "center"
              });


            setTimeout(
              () => {

                searchInput
                  ?.focus();

              },
              400
            );
          }


          if (index === 3) {

            marketSection
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start"
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
     HEADER FAVORITOS
     ======================================================== */

  const headerFavorite =
    document.querySelector(
      ".header-icon"
    );


  headerFavorite
    ?.addEventListener(
      "click",
      () => {

        marketSection
          ?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "start"
          });
      }
    );


  /* ========================================================
     VER TODAS
     ======================================================== */

  const seeAllButton =
    document.querySelector(
      ".see-all"
    );


  seeAllButton
    ?.addEventListener(
      "click",
      () => {

        dealsContainer
          ?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "center"
          });
      }
    );


  /* ========================================================
     MODAIS
     ======================================================== */

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


  document.addEventListener(
    "keydown",
    async event => {

      if (
        event.key ===
        "Escape"
      ) {

        closeLogin();

        closeSignup();

        closeAdminLogin();

        await closeAdminPanel();
      }
    }
  );


  /* ========================================================
     INICIALIZAÇÃO
     ======================================================== */

  createSummary();

  renderHero(0);

  updateFavoriteCounter();


  if (searchInput) {

    searchInput.value =
      "";
  }


  /*
     Garante que a sessão administrativa
     sempre comece encerrada.
  */

  resetAdminSession();


  loadInitialDeals();


  console.log(
    "[ACHOU!] Sistema carregado."
  );

});
