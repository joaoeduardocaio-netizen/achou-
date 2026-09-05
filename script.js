document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     ACHOU! — LOJA
     ========================================================= */

  const CONFIG = {

    locale: "pt-BR",

    currency: "BRL",

    initialQuery:
      "ofertas tecnologia moda",

    api:
      "https://wulhcgkphclwgidqlvtr.supabase.co/functions/v1/mercadolivre-search",

    supabaseUrl:
      "https://wulhcgkphclwgidqlvtr.supabase.co",

    supabaseKey:
      "sb_publishable_Wi0Kz5aB4LeLnlxQE_34Yw_1KwA8ebc"

  };


  /* =========================================================
     SUPABASE
     ========================================================= */

  let db = null;

  let adminDb = null;


  if (window.supabase?.createClient) {

    db =
      window.supabase.createClient(
        CONFIG.supabaseUrl,
        CONFIG.supabaseKey,
        {
          auth: {
            persistSession:true,
            autoRefreshToken:true,
            detectSessionInUrl:true,
            storageKey:"achou-user-auth"
          }
        }
      );


    adminDb =
      window.supabase.createClient(
        CONFIG.supabaseUrl,
        CONFIG.supabaseKey,
        {
          auth: {
            persistSession:false,
            autoRefreshToken:false,
            detectSessionInUrl:false
          }
        }
      );

  }


  /* =========================================================
     ESTADO
     ========================================================= */

  let products = [];

  let affiliateLinks = [];

  let searchRunning = false;


  /* =========================================================
     ELEMENTOS
     ========================================================= */

  const searchInput =
    document.querySelector("#searchInput");

  const searchButton =
    document.querySelector(".search-submit");

  const desktopSearchInput =
    document.querySelector("#desktopSearchInput");

  const desktopSearchButton =
    document.querySelector("#desktopSearchButton");

  const dealsContainer =
    document.querySelector(".flash-deals");

  const offersSection =
    document.querySelector("#offersSection");

  const categoriesSection =
    document.querySelector("#categoriesSection");

  const summaryBox =
    document.querySelector(".achou-search-summary");

  const cartModal =
    document.querySelector("#cartModal");

  const cartItems =
    document.querySelector("#cartItems");

  const cartTotal =
    document.querySelector("#cartTotal");


  /* =========================================================
     UTILS
     ========================================================= */

  const money = value =>

    Number(value || 0)
      .toLocaleString(
        CONFIG.locale,
        {
          style:"currency",
          currency:CONFIG.currency
        }
      );


  const escapeHtml = value =>

    String(value || "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");


  function setMessage(
    element,
    text,
    type = ""
  ){

    if (!element) return;

    element.textContent =
      text || "";

    element.classList.remove(
      "success",
      "error"
    );

    if (type){

      element.classList.add(type);

    }

  }


  function bodyLock(){

    document.body.classList.add(
      "modal-open"
    );

  }


  function bodyUnlock(){

    if (
      !document.querySelector(
        ".modal.active"
      )
    ){

      document.body.classList.remove(
        "modal-open"
      );

    }

  }


  function scrollToOffers(){

    offersSection
      ?.scrollIntoView({
        behavior:"smooth",
        block:"start"
      });

  }


  function focusSearch(){

    searchInput
      ?.scrollIntoView({
        behavior:"smooth",
        block:"center"
      });


    setTimeout(() => {

      searchInput?.focus();

    },300);

  }


  /* =========================================================
     LINKS PARCEIROS
     ========================================================= */

  function validPartnerLink(url){

    if (!url) return false;


    try{

      const parsed =
        new URL(url);


      return (
        parsed.protocol === "https:"
      );

    }catch{

      return false;

    }

  }


  async function loadAffiliateLinks(){

    if (!db){

      affiliateLinks = [];

      return [];

    }


    try{

      const {
        data,
        error
      } =
        await db
          .from("affiliate_links")
          .select(
            "id, marketplace, item_id, catalog_product_id, product_title, affiliate_url, active, created_at, updated_at"
          )
          .eq("active",true)
          .order(
            "updated_at",
            {
              ascending:false
            }
          );


      if (error){

        throw error;

      }


      affiliateLinks =
        Array.isArray(data)
          ? data
          : [];


      return affiliateLinks;

    }catch(error){

      console.error(
        "[ACHOU!] parceiros",
        error
      );


      affiliateLinks = [];

      return [];

    }

  }


  function findAffiliateForProduct(
    product
  ){

    return (
      affiliateLinks.find(
        link =>
          link.active === true &&
          String(link.item_id) ===
          String(product.itemId) &&
          validPartnerLink(
            link.affiliate_url
          )
      ) ||
      null
    );

  }


  /* =========================================================
     NORMALIZA PRODUTOS
     ========================================================= */

  function normalizeApiProduct(item){

    const price =
      Number(item.price || 0);


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
        item.item_id ||
        item.id ||
        "",

      title:
        item.title ||
        "Produto ACHOU!",

      price,

      oldPrice:
        item.original_price != null
          ? Number(item.original_price)
          : null,

      image:
        item.thumbnail ||
        item.image ||
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

      link:null

    };

  }


  /* =========================================================
     FAVORITOS
     ========================================================= */

  function getFavorites(){

    try{

      return (
        JSON.parse(
          localStorage.getItem(
            "achou_favorites"
          )
        ) ||
        []
      );

    }catch{

      return [];

    }

  }


  function saveFavorites(list){

    localStorage.setItem(
      "achou_favorites",
      JSON.stringify(list)
    );

  }


  function updateFavoriteCounter(){

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


  function bindFavorites(){

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


          const current =
            getFavorites()
              .map(String);


          button.textContent =
            current.includes(id)
              ? "♥"
              : "♡";


          button.onclick = () => {

            let favorites =
              getFavorites()
                .map(String);


            if (
              favorites.includes(id)
            ){

              favorites =
                favorites.filter(
                  value =>
                    value !== id
                );

            }else{

              favorites.push(id);

            }


            saveFavorites(
              favorites
            );


            button.textContent =
              favorites.includes(id)
                ? "♥"
                : "♡";


            updateFavoriteCounter();

          };

        }
      );

  }


  /* =========================================================
     CARRINHO
     ========================================================= */

  function getCart(){

    try{

      return (
        JSON.parse(
          localStorage.getItem(
            "achou_cart"
          )
        ) ||
        []
      );

    }catch{

      return [];

    }

  }


  function saveCart(cart){

    localStorage.setItem(
      "achou_cart",
      JSON.stringify(cart)
    );

    updateCartCounter();

  }


  function updateCartCounter(){

    const count =
      getCart().length;


    document
      .querySelectorAll(
        ".cart-count"
      )
      .forEach(
        element => {

          element.textContent =
            count;

        }
      );

  }


  function addToCart(product){

    let cart =
      getCart();


    const exists =
      cart.some(
        item =>
          String(item.id) ===
          String(product.id)
      );


    if (!exists){

      cart.push({

        id:
          product.id,

        title:
          product.title,

        price:
          product.price,

        image:
          product.image,

        link:
          product.link || null

      });


      saveCart(cart);

    }


    renderCart();

    openCart();

  }


  function removeFromCart(id){

    const cart =
      getCart().filter(
        item =>
          String(item.id) !==
          String(id)
      );


    saveCart(cart);

    renderCart();

  }


  function renderCart(){

    if (
      !cartItems ||
      !cartTotal
    ){

      return;

    }


    const cart =
      getCart();


    if (!cart.length){

      cartItems.innerHTML =
        `
          <div class="cart-empty">
            Seu carrinho está vazio.
          </div>
        `;


      cartTotal.textContent =
        money(0);


      return;

    }


    cartItems.innerHTML =
      cart.map(
        item =>
          `
            <article class="cart-item">

              <div class="cart-item-image">

                ${
                  item.image

                    ? `
                      <img
                        src="${escapeHtml(item.image)}"
                        alt=""
                      >
                    `

                    : ""
                }

              </div>


              <div class="cart-item-data">

                <strong>
                  ${escapeHtml(item.title)}
                </strong>

                <span>
                  ${money(item.price)}
                </span>

              </div>


              <button
                class="cart-item-remove"
                data-cart-remove="${escapeHtml(item.id)}"
                type="button"
              >
                ×
              </button>

            </article>
          `
      )
      .join("");


    const total =
      cart.reduce(
        (sum,item) =>
          sum +
          Number(item.price || 0),
        0
      );


    cartTotal.textContent =
      money(total);


    cartItems
      .querySelectorAll(
        "[data-cart-remove]"
      )
      .forEach(
        button => {

          button.onclick = () => {

            removeFromCart(
              button.dataset.cartRemove
            );

          };

        }
      );

  }


  function openCart(){

    renderCart();

    cartModal
      ?.classList.add(
        "active"
      );

    bodyLock();

  }


  function closeCart(){

    cartModal
      ?.classList.remove(
        "active"
      );

    bodyUnlock();

  }


  document
    .querySelector(".cart-button")
    ?.addEventListener(
      "click",
      openCart
    );


  document
    .querySelector("#cartModalClose")
    ?.addEventListener(
      "click",
      closeCart
    );


  document
    .querySelector("#checkoutButton")
    ?.addEventListener(
      "click",
      () => {

        alert(
          "O checkout próprio do ACHOU! será conectado na próxima etapa."
        );

      }
    );


  cartModal
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          cartModal
        ){

          closeCart();

        }

      }
    );


  /* =========================================================
     STATUS
     ========================================================= */

  function showStatus(
    title,
    text,
    loading = false
  ){

    if (!dealsContainer){

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
    count,
    query
  ){

    if (!summaryBox){

      return;

    }


    summaryBox.style.display =
      "flex";


    summaryBox.innerHTML =
      `
        <div>

          <strong>
            ${count}
            ${
              count === 1
                ? "produto encontrado"
                : "produtos encontrados"
            }
          </strong>

          <span>
            Resultados para
            “${escapeHtml(query)}”
          </span>

        </div>

        <span>
          Produtos selecionados
        </span>
      `;

  }


  /* =========================================================
     RENDERIZA PRODUTOS
     ========================================================= */

  function renderProducts(list){

    if (!dealsContainer){

      return;

    }


    if (!list.length){

      showStatus(
        "Nenhum produto encontrado",
        "Tente outra busca ou categoria."
      );

      return;

    }


    const visible =
      list.slice(0,12);


    dealsContainer.innerHTML =
      visible.map(
        (product,index) => {

          const affiliate =
            findAffiliateForProduct(
              product
            );


          const link =
            affiliate?.affiliate_url ||
            product.productUrl ||
            null;


          product.link =
            link;


          const installment =
            Number(product.price) / 12;


          const rating =
            index % 3 === 0
              ? "★★★★★"
              : index % 3 === 1
                ? "★★★★☆"
                : "★★★★★";


          const reviewCount =
            24 +
            (
              index * 37
            );


          let oldPrice =
            product.oldPrice;


          if (
            !oldPrice ||
            oldPrice <= product.price
          ){

            oldPrice =
              product.price * 1.12;

          }


          return `
            <article class="flash-card">

              ${
                index === 0

                  ? `
                    <span class="discount">
                      MAIS VENDIDO
                    </span>
                  `

                  : index === 2

                    ? `
                      <span class="discount">
                        OFERTA
                      </span>
                    `

                    : ""
              }


              <button
                class="product-favorite"
                data-favorite="${escapeHtml(product.id)}"
                type="button"
              >
                ♡
              </button>


              <div class="flash-photo">

                ${
                  product.image

                    ? `
                      <img
                        class="achou-product-image"
                        src="${escapeHtml(product.image)}"
                        alt="${escapeHtml(product.title)}"
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
                    `
                }

              </div>


              <div class="product-info">

                <h3>
                  ${escapeHtml(product.title)}
                </h3>


                <div class="product-rating">

                  <strong>
                    ${rating}
                  </strong>

                  <span>
                    (${reviewCount})
                  </span>

                </div>


                <div class="achou-store-label">
                  Produto parceiro ACHOU!
                </div>


                <span class="old-price">
                  ${money(oldPrice)}
                </span>


                <strong class="flash-price">
                  ${money(product.price)}
                </strong>


                <span class="installments">
                  em até 12x de
                  ${money(installment)}
                </span>


                <div class="shipping-label">

                  ${
                    product.freeShipping
                      ? "Frete grátis"
                      : "Consulte o frete"
                  }

                </div>


                <div class="achou-actions">

                  ${
                    validPartnerLink(link)

                      ? `
                        <a
                          class="offer partner-link"
                          href="${escapeHtml(link)}"
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                        >
                          Comprar
                        </a>
                      `

                      : `
                        <button
                          class="offer achou-link-pending"
                          type="button"
                          disabled
                        >
                          Comprar
                        </button>
                      `
                  }


                  <button
                    class="add-cart"
                    data-add-cart="${escapeHtml(product.id)}"
                    type="button"
                  >
                    ADICIONAR AO CARRINHO
                  </button>

                </div>

              </div>

            </article>
          `;

        }
      )
      .join("");


    bindFavorites();


    document
      .querySelectorAll(
        "[data-add-cart]"
      )
      .forEach(
        button => {

          button.onclick = () => {

            const product =
              products.find(
                item =>
                  String(item.id) ===
                  String(
                    button.dataset.addCart
                  )
              );


            if (product){

              addToCart(product);

            }

          };

        }
      );

  }


  /* =========================================================
     BUSCA
     ========================================================= */

  async function searchProducts(
    forcedTerm = null,
    {
      scroll = true
    } = {}
  ){

    if (searchRunning){

      return;

    }


    const term =

      forcedTerm !== null

        ? String(
            forcedTerm
          ).trim()

        : (
            searchInput?.value ||
            desktopSearchInput?.value ||
            ""
          ).trim();


    if (!term){

      focusSearch();

      return;

    }


    searchRunning =
      true;


    if (searchInput){

      searchInput.value =
        term;

    }


    if (desktopSearchInput){

      desktopSearchInput.value =
        term;

    }


    showStatus(
      "Buscando produtos...",
      "Selecionando ofertas para você.",
      true
    );


    if (summaryBox){

      summaryBox.style.display =
        "none";

    }


    if (searchButton){

      searchButton.disabled =
        true;

      searchButton.textContent =
        "...";

    }


    try{

      const response =
        await fetch(
          `${CONFIG.api}?q=${encodeURIComponent(term)}`,
          {
            headers:{
              Accept:"application/json"
            }
          }
        );


      if (!response.ok){

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
      ){

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


      products.forEach(
        product => {

          const affiliate =
            findAffiliateForProduct(
              product
            );


          product.link =
            affiliate?.affiliate_url ||
            product.productUrl ||
            null;

        }
      );


      updateSummary(
        products.length,
        term
      );


      renderProducts(
        products
      );


      renderAdminProducts();


      if (scroll){

        scrollToOffers();

      }

    }catch(error){

      console.error(
        "[ACHOU!] busca",
        error
      );


      products = [];


      showStatus(
        "Não foi possível carregar agora",
        "Tente novamente em alguns instantes."
      );


      renderAdminProducts();

    }finally{

      searchRunning =
        false;


      if (searchButton){

        searchButton.disabled =
          false;

        searchButton.textContent =
          "Buscar";

      }

    }

  }


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
          event.key === "Enter"
        ){

          event.preventDefault();

          searchProducts();

        }

      }
    );


  desktopSearchButton
    ?.addEventListener(
      "click",
      () => {

        searchProducts(
          desktopSearchInput.value
        );

      }
    );


  desktopSearchInput
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ){

          event.preventDefault();

          searchProducts(
            desktopSearchInput.value
          );

        }

      }
    );


  document
    .querySelectorAll(
      "[data-search]"
    )
    .forEach(
      button => {

        button.onclick = () => {

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

  const subcategoryGrid =
    document.querySelector(
      "#subcategoryGrid"
    );


  const CATEGORY_DATA = {

    "todos":{
      title:"Todas as categorias",
      items:[
        ["Moda Feminina","roupa feminina"],
        ["Moda Masculina","roupa masculina"],
        ["Tênis","tênis"],
        ["Eletrônicos","eletrônicos"],
        ["Celulares","smartphone"],
        ["Notebooks","notebook"],
        ["Games","games"],
        ["Acessórios","acessórios"]
      ]
    },

    "moda-feminina":{
      title:"Moda Feminina",
      items:[
        ["Vestidos","vestido feminino"],
        ["Blusas","blusa feminina"],
        ["Calças","calça feminina"],
        ["Jaquetas","jaqueta feminina"],
        ["Bolsas","bolsa feminina"],
        ["Tênis","tênis feminino"]
      ]
    },

    "moda-masculina":{
      title:"Moda Masculina",
      items:[
        ["Camisetas","camiseta masculina"],
        ["Calças","calça masculina"],
        ["Jaquetas","jaqueta masculina"],
        ["Bermudas","bermuda masculina"],
        ["Tênis","tênis masculino"],
        ["Relógios","relógio masculino"]
      ]
    },

    "infantil":{
      title:"Infantil",
      items:[
        ["Meninos","roupa menino infantil"],
        ["Meninas","roupa menina infantil"],
        ["Tênis","tênis infantil"],
        ["Bebês","roupa bebê"]
      ]
    },

    "tenis":{
      title:"Tênis e Calçados",
      items:[
        ["Nike","tênis Nike"],
        ["Adidas","tênis Adidas"],
        ["Masculino","tênis masculino"],
        ["Feminino","tênis feminino"],
        ["Infantil","tênis infantil"]
      ]
    },

    "eletronicos":{
      title:"Eletrônicos",
      items:[
        ["Celulares","smartphone"],
        ["Fones","fone bluetooth"],
        ["Smart TV","Smart TV"],
        ["Smartwatch","smartwatch"],
        ["Caixas de som","caixa de som bluetooth"]
      ]
    },

    "informatica":{
      title:"Informática",
      items:[
        ["Notebooks","notebook"],
        ["Notebook Gamer","notebook gamer"],
        ["Monitores","monitor computador"],
        ["SSD","SSD"],
        ["Teclados","teclado gamer"]
      ]
    },

    "games":{
      title:"Gamer",
      items:[
        ["PlayStation 5","PlayStation 5 console"],
        ["Xbox","Xbox console"],
        ["Nintendo Switch","Nintendo Switch"],
        ["PC Gamer","PC gamer"],
        ["Acessórios","acessórios gamer"]
      ]
    },

    "smartwatch":{
      title:"Smartwatches",
      items:[
        ["Apple Watch","Apple Watch"],
        ["Samsung","Samsung smartwatch"],
        ["Xiaomi","Xiaomi smartwatch"],
        ["Redmi","Redmi Watch"]
      ]
    },

    "acessorios":{
      title:"Acessórios",
      items:[
        ["Bolsas","bolsa"],
        ["Bonés","boné"],
        ["Relógios","relógio"],
        ["Óculos","óculos de sol"],
        ["Mochilas","mochila"]
      ]
    }

  };


  function openCategory(key){

    const category =
      CATEGORY_DATA[key];


    if (!category){

      return;

    }


    categoryModalTitle.textContent =
      category.title;


    subcategoryGrid.innerHTML =
      category.items

        .map(
          ([label,search]) =>
            `
              <button
                type="button"
                data-subcategory-search="${escapeHtml(search)}"
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

          button.onclick = () => {

            closeCategory();


            searchProducts(
              button.dataset.subcategorySearch
            );

          };

        }
      );


    categoryModal.classList.add(
      "active"
    );


    bodyLock();

  }


  function closeCategory(){

    categoryModal
      ?.classList.remove(
        "active"
      );

    bodyUnlock();

  }


  document
    .querySelectorAll(
      "[data-category]"
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


  document
    .querySelector("#categoryModalClose")
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
        ){

          closeCategory();

        }

      }
    );


  document
    .querySelector(".menu-button")
    ?.addEventListener(
      "click",
      () => {

        openCategory("todos");

      }
    );


  /* =========================================================
     HERO
     ========================================================= */

  document
    .querySelector(".hero-cta")
    ?.addEventListener(
      "click",
      () => {

        offersSection
          ?.scrollIntoView({
            behavior:"smooth"
          });

      }
    );


  document
    .querySelector(".products-show-all")
    ?.addEventListener(
      "click",
      () => {

        searchProducts(
          "ofertas"
        );

      }
    );


  /* =========================================================
     LOGIN
     ========================================================= */

  const loginModal =
    document.querySelector("#loginModal");

  const signupModal =
    document.querySelector("#signupModal");


  function openLogin(){

    loginModal
      ?.classList.add(
        "active"
      );

    bodyLock();

  }


  function closeLogin(){

    loginModal
      ?.classList.remove(
        "active"
      );

    bodyUnlock();

  }


  function openSignup(){

    signupModal
      ?.classList.add(
        "active"
      );

    bodyLock();

  }


  function closeSignup(){

    signupModal
      ?.classList.remove(
        "active"
      );

    bodyUnlock();

  }


  document
    .querySelector(".account-button")
    ?.addEventListener(
      "click",
      openLogin
    );


  document
    .querySelector(".login-close")
    ?.addEventListener(
      "click",
      closeLogin
    );


  document
    .querySelector(".signup-close")
    ?.addEventListener(
      "click",
      closeSignup
    );


  document
    .querySelector(".create-account")
    ?.addEventListener(
      "click",
      () => {

        closeLogin();

        openSignup();

      }
    );


  document
    .querySelector(".signup-login")
    ?.addEventListener(
      "click",
      () => {

        closeSignup();

        openLogin();

      }
    );


  function updateAccountUI(user){

    const hello =
      document.querySelector(
        ".account-copy small"
      );

    const nameElement =
      document.querySelector(
        ".account-copy strong"
      );


    if (!user){

      if (hello){

        hello.textContent =
          "Olá!";

      }


      if (nameElement){

        nameElement.textContent =
          "Entrar";

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


    if (hello){

      hello.textContent =
        "Olá,";

    }


    if (nameElement){

      nameElement.textContent =
        firstName;

    }

  }


  document
    .querySelector("#loginForm")
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        if (!db){

          return;

        }


        const email =
          document
            .querySelector("#loginEmail")
            .value
            .trim();


        const password =
          document
            .querySelector("#loginPassword")
            .value;


        try{

          const {
            data,
            error
          } =
            await db.auth
              .signInWithPassword({
                email,
                password
              });


          if (error){

            throw error;

          }


          closeLogin();


          updateAccountUI(
            data?.user ||
            null
          );

        }catch{

          alert(
            "Não foi possível entrar. Confira seu e-mail e senha."
          );

        }

      }
    );


  document
    .querySelector("#signupForm")
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        if (!db){

          return;

        }


        const name =
          document
            .querySelector("#signupName")
            .value
            .trim();


        const email =
          document
            .querySelector("#signupEmail")
            .value
            .trim();


        const password =
          document
            .querySelector("#signupPassword")
            .value;


        const confirmPassword =
          document
            .querySelector("#signupPasswordConfirm")
            .value;


        if (
          password !==
          confirmPassword
        ){

          alert(
            "As senhas não coincidem."
          );

          return;

        }


        try{

          const {
            data,
            error
          } =
            await db.auth.signUp({
              email,
              password,
              options:{
                data:{
                  full_name:name
                }
              }
            });


          if (error){

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

        }catch{

          alert(
            "Não foi possível criar a conta."
          );

        }

      }
    );


  db?.auth
    .getUser()
    .then(
      ({data}) => {

        updateAccountUI(
          data?.user ||
          null
        );

      }
    )
    .catch(() => {});


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


  async function resetAdminSession(){

    try{

      await adminDb?.auth.signOut();

    }catch{}

  }


  function openAdminLogin(){

    const email =
      document.querySelector(
        "#adminEmail"
      );

    const password =
      document.querySelector(
        "#adminPassword"
      );


    if (email){

      email.value = "";

    }


    if (password){

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

  }


  function closeAdminLogin(){

    adminLoginModal
      ?.classList.remove(
        "active"
      );

    bodyUnlock();

  }


  function openAdminPanel(){

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


  async function closeAdminPanel(){

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


  document
    .querySelector("#adminLoginClose")
    ?.addEventListener(
      "click",
      async () => {

        await resetAdminSession();

        closeAdminLogin();

      }
    );


  document
    .querySelector("#adminPanelClose")
    ?.addEventListener(
      "click",
      closeAdminPanel
    );


  document
    .querySelector("#adminLogoutButton")
    ?.addEventListener(
      "click",
      closeAdminPanel
    );


  async function getCurrentAdmin(){

    if (!adminDb){

      return null;

    }


    try{

      const {
        data:userData,
        error:userError
      } =
        await adminDb.auth.getUser();


      if (
        userError ||
        !userData?.user
      ){

        return null;

      }


      const {
        data,
        error
      } =
        await adminDb
          .from("admin_users")
          .select("user_id")
          .eq(
            "user_id",
            userData.user.id
          )
          .maybeSingle();


      if (
        error ||
        !data
      ){

        return null;

      }


      return userData.user;

    }catch{

      return null;

    }

  }


  document
    .querySelector("#adminLoginForm")
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          document
            .querySelector("#adminEmail")
            .value
            .trim();


        const password =
          document
            .querySelector("#adminPassword")
            .value;


        setMessage(
          adminLoginMessage,
          "Verificando acesso..."
        );


        await resetAdminSession();


        try{

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
          ){

            throw new Error();

          }


          const {
            data:adminData,
            error:adminError
          } =
            await adminDb
              .from("admin_users")
              .select("user_id")
              .eq(
                "user_id",
                data.user.id
              )
              .maybeSingle();


          if (
            adminError ||
            !adminData
          ){

            await resetAdminSession();

            throw new Error();

          }


          openAdminPanel();

        }catch{

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
     ADMIN PRODUTOS
     ========================================================= */

  function renderAdminProducts(){

    if (!adminProductsList){

      return;

    }


    if (!products.length){

      adminProductsList.innerHTML =
        `
          <div class="admin-empty">
            Faça uma busca para carregar produtos.
          </div>
        `;

      return;

    }


    adminProductsList.innerHTML =
      products.map(
        (product,index) => {

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

                    : ""
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
                type="button"
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

          button.onclick = () => {

            fillAdminFormFromProduct(
              products[
                Number(
                  button.dataset.adminProduct
                )
              ]
            );

          };

        }
      );

  }


  function fillAdminFormFromProduct(
    product
  ){

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
        ? "Produto carregado para edição."
        : "Produto selecionado. Cole o link parceiro.",
      affiliate
        ? "success"
        : ""
    );

  }


  document
    .querySelector("#adminRefreshProducts")
    ?.addEventListener(
      "click",
      renderAdminProducts
    );


  document
    .querySelector("#adminClearForm")
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


  async function refreshAfterAffiliate(){

    await loadAffiliateLinks();

    renderProducts(products);

    renderAdminProducts();

  }


  /* =========================================================
     SALVAR LINK
     ========================================================= */

  adminAffiliateForm
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        if (
          !await getCurrentAdmin()
        ){

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
          !validPartnerLink(url)
        ){

          setMessage(
            adminFormMessage,
            "Cole um link HTTPS válido.",
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


        try{

          if (id){

            const {
              error
            } =
              await adminDb
                .from("affiliate_links")
                .update(payload)
                .eq("id",id);


            if (error){

              throw error;

            }

          }else{

            const {
              data:existing,
              error:findError
            } =
              await adminDb
                .from("affiliate_links")
                .select("id")
                .eq(
                  "item_id",
                  itemId
                )
                .limit(1)
                .maybeSingle();


            if (findError){

              throw findError;

            }


            if (existing?.id){

              const {
                error
              } =
                await adminDb
                  .from("affiliate_links")
                  .update(payload)
                  .eq(
                    "id",
                    existing.id
                  );


              if (error){

                throw error;

              }

            }else{

              const {
                error
              } =
                await adminDb
                  .from("affiliate_links")
                  .insert(payload);


              if (error){

                throw error;

              }

            }

          }


          setMessage(
            adminFormMessage,
            "Produto salvo com sucesso.",
            "success"
          );


          await refreshAfterAffiliate();

          await loadAdminLinks();

        }catch(error){

          console.error(error);


          setMessage(
            adminFormMessage,
            "Não foi possível salvar.",
            "error"
          );

        }

      }
    );


  /* =========================================================
     ADMIN LINKS
     ========================================================= */

  async function loadAdminLinks(){

    if (
      !adminLinksList ||
      !await getCurrentAdmin()
    ){

      return;

    }


    const {
      data,
      error
    } =
      await adminDb
        .from("affiliate_links")
        .select(
          "id, item_id, catalog_product_id, product_title, affiliate_url, active"
        )
        .order(
          "updated_at",
          {
            ascending:false
          }
        );


    if (error){

      adminLinksList.innerHTML =
        `
          <div class="admin-empty">
            Não foi possível carregar.
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
                      type="button"
                    >
                      EDITAR
                    </button>


                    <button
                      data-admin-delete="${link.id}"
                      type="button"
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
            Nenhum produto cadastrado.
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
                  "Excluir este produto?"
                )
              ){

                return;

              }


              await adminDb
                .from("affiliate_links")
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

          button.onclick = () => {

            const link =
              list.find(
                item =>
                  String(item.id) ===
                  String(
                    button.dataset.adminEdit
                  )
              );


            if (!link){

              return;

            }


            adminAffiliateId.value =
              link.id ||
              "";


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

          };

        }
      );

  }


  document
    .querySelector("#adminRefreshLinks")
    ?.addEventListener(
      "click",
      loadAdminLinks
    );


  /* =========================================================
     MENU MOBILE
     ========================================================= */

  document
    .querySelectorAll(
      ".bottom-nav-item"
    )
    .forEach(
      item => {

        item.onclick = () => {

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
          ){

            window.scrollTo({
              top:0,
              behavior:"smooth"
            });

          }


          if (
            action === "categories"
          ){

            categoriesSection
              ?.scrollIntoView({
                behavior:"smooth"
              });

          }


          if (
            action === "search"
          ){

            focusSearch();

          }


          if (
            action === "favorites"
          ){

            scrollToOffers();

          }


          if (
            action === "cart"
          ){

            openCart();

          }

        };

      }
    );


  document
    .querySelector(".header-heart")
    ?.addEventListener(
      "click",
      scrollToOffers
    );


  /* =========================================================
     ESC
     ========================================================= */

  document.addEventListener(
    "keydown",
    async event => {

      if (
        event.key !== "Escape"
      ){

        return;

      }


      closeCategory();

      closeLogin();

      closeSignup();

      closeCart();


      if (
        adminLoginModal
          ?.classList.contains(
            "active"
          )
      ){

        await resetAdminSession();

        closeAdminLogin();

      }


      if (
        adminPanelModal
          ?.classList.contains(
            "active"
          )
      ){

        await closeAdminPanel();

      }

    }
  );


  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  updateFavoriteCounter();

  updateCartCounter();

  renderCart();

  resetAdminSession();


  searchProducts(
    "ofertas eletrônicos moda",
    {
      scroll:false
    }
  );

});
