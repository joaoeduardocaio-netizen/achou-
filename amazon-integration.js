document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     ACHOU! — INTEGRAÇÃO AMAZON
     Complementa o script.js principal sem remover
     a integração atual do Mercado Livre.
     ========================================================= */

  const AMAZON_CONFIG = {
    supabaseUrl: "https://wulhcgkphclwgidqlvtr.supabase.co",
    supabaseKey: "sb_publishable_Wi0Kz5aB4LeLnlxQE_34Yw_1KwA8ebc"
  };


  /* =========================================================
     SUPABASE
     ========================================================= */

  if (!window.supabase?.createClient) {
    console.warn("[ACHOU! Amazon] Supabase não disponível.");
    return;
  }

  const amazonDb = window.supabase.createClient(
    AMAZON_CONFIG.supabaseUrl,
    AMAZON_CONFIG.supabaseKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  const amazonAdminDb = window.supabase.createClient(
    AMAZON_CONFIG.supabaseUrl,
    AMAZON_CONFIG.supabaseKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );


  /* =========================================================
     ESTADO
     ========================================================= */

  let amazonOffers = [];
  let amazonAdminReady = false;
  let renderLock = false;


  /* =========================================================
     UTILITÁRIOS
     ========================================================= */

  const escapeHtml = value =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");


  const normalize = value =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();


  const money = value =>
    Number(value).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );


  function validAmazonLink(url) {

    if (!url) {
      return false;
    }

    try {

      const parsed = new URL(url);

      const host =
        parsed.hostname.toLowerCase();

      return (
        parsed.protocol === "https:" &&
        (
          host === "link.amazon" ||
          host === "amzn.to" ||
          host === "amazon.com.br" ||
          host === "www.amazon.com.br" ||
          host.endsWith(".amazon.com.br")
        )
      );

    } catch {

      return false;

    }

  }


  /* =========================================================
     ESTILOS DA INTEGRAÇÃO
     ========================================================= */

  function injectAmazonStyles() {

    if (
      document.getElementById(
        "achouAmazonStyles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "achouAmazonStyles";

    style.textContent = `

      .amazon-manual-card{
        border-color:#4a3b10;
        background:
          linear-gradient(
            180deg,
            #12100a,
            #080808
          );
      }

      .amazon-badge{
        position:absolute;
        left:13px;
        top:126px;
        z-index:3;
        background:#FFD400;
        color:#000;
        border-radius:8px;
        padding:7px 11px;
        font-size:10px;
        font-weight:950;
      }

      .amazon-store-label{
        display:inline-flex;
        align-items:center;
        gap:6px;
        margin-top:8px;
        color:#FFD400;
        font-size:10px;
        font-weight:900;
      }

      .amazon-store-label::before{
        content:"";
        width:7px;
        height:7px;
        border-radius:50%;
        background:#FFD400;
      }

      .amazon-photo-fallback{
        width:100%;
        height:100%;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        background:#fff;
        color:#111;
        font-size:22px;
        font-weight:950;
        letter-spacing:-1px;
      }

      .amazon-photo-fallback small{
        margin-top:5px;
        color:#555;
        font-size:9px;
        font-weight:700;
        letter-spacing:0;
      }

      .amazon-check-price{
        display:block;
        margin-top:10px;
        color:#FFD400;
        font-size:15px;
        line-height:1.25;
      }

      .amazon-price-note{
        display:block;
        margin-top:5px;
        color:#777;
        font-size:9px;
        line-height:1.35;
      }

      .amazon-summary-extra{
        display:inline-block;
        margin-left:6px;
        color:#FFD400 !important;
        font-weight:800;
      }

      .amazon-admin-section{
        border-color:#4a3b10 !important;
      }

      .amazon-admin-section h3 span{
        color:#FFD400;
      }

      .amazon-admin-grid{
        display:grid;
        grid-template-columns:
          1fr 1fr;
        gap:10px;
      }

      .amazon-admin-grid .full{
        grid-column:1/-1;
      }

      .amazon-admin-section input,
      .amazon-admin-section textarea{
        width:100%;
        min-height:44px;
        padding:10px;
        border:1px solid #333;
        border-radius:10px;
        background:#0b0b0b;
        color:#fff;
        font:inherit;
        outline:none;
      }

      .amazon-admin-section textarea{
        min-height:74px;
        resize:vertical;
      }

      .amazon-admin-section input:focus,
      .amazon-admin-section textarea:focus{
        border-color:#FFD400;
      }

      .amazon-admin-hint{
        display:block;
        margin-top:5px;
        color:#777;
        font-size:10px;
        line-height:1.4;
      }

      .amazon-admin-actions{
        display:flex;
        gap:8px;
        margin-top:14px;
      }

      .amazon-admin-actions button{
        min-height:42px;
        padding:0 13px;
        border:1px solid #444;
        border-radius:9px;
        background:#111;
        color:#fff;
        font-weight:900;
      }

      .amazon-admin-actions
      .amazon-save{
        flex:1;
        border-color:#FFD400;
        background:#FFD400;
        color:#000;
      }

      .amazon-admin-message{
        min-height:20px;
        margin-top:10px;
        color:#999;
        font-size:11px;
      }

      .amazon-admin-message.success{
        color:#3bd46f;
      }

      .amazon-admin-message.error{
        color:#ff5a52;
      }

      .amazon-admin-list{
        display:grid;
        gap:8px;
        margin-top:14px;
      }

      .amazon-admin-item{
        display:flex;
        align-items:center;
        justify-content:
          space-between;
        gap:10px;
        padding:10px;
        border:1px solid #292929;
        border-radius:10px;
        background:#0a0a0a;
      }

      .amazon-admin-item strong{
        display:block;
        font-size:12px;
      }

      .amazon-admin-item small{
        display:block;
        margin-top:4px;
        color:#888;
        font-size:9px;
      }

      .amazon-admin-item em{
        display:inline-block;
        margin-top:5px;
        color:#3bd46f;
        font-size:8px;
        font-style:normal;
        font-weight:950;
      }

      .amazon-admin-item-actions{
        display:flex;
        gap:5px;
      }

      .amazon-admin-item-actions button{
        padding:7px 9px;
        border:1px solid #3b3b3b;
        border-radius:7px;
        background:#111;
        color:#ddd;
        font-size:9px;
        font-weight:900;
      }

      @media(max-width:600px){

        .amazon-admin-grid{
          grid-template-columns:1fr;
        }

      }

    `;

    document.head.appendChild(
      style
    );

  }


  /* =========================================================
     AMAZON = LOJA INTEGRADA
     ========================================================= */

  function markAmazonIntegrated() {

    const logo =
      document.querySelector(
        ".logo.amazon"
      );

    const card =
      logo?.closest(
        ".store-card"
      );

    if (!card) {
      return;
    }

    card.classList.add(
      "integrated"
    );

    const status =
      card.querySelector(
        "small"
      );

    if (status) {

      status.innerHTML =
        "<i></i> Integrada";

    }

  }


  /* =========================================================
     IDENTIFICA A BUSCA ATUAL
     ========================================================= */

  function currentVisibleQuery() {

    const input =
      document.querySelector(
        "#searchInput"
      );

    const typed =
      input?.value?.trim();

    if (typed) {
      return typed;
    }

    const summary =
      document.querySelector(
        ".achou-search-summary"
      );

    const text =
      summary?.textContent || "";

    const match =
      text.match(
        /para\s+[“"]([^”"]+)[”"]/i
      );

    return (
      match?.[1]?.trim() ||
      ""
    );

  }


  function amazonOfferMatchesQuery(
    offer,
    query
  ) {

    const q =
      normalize(query);

    if (!q) {
      return false;
    }

    const terms =
      String(
        offer.search_terms || ""
      )
        .split(/[,;|\n]+/)
        .map(normalize)
        .filter(Boolean);

    const title =
      normalize(
        offer.product_title
      );

    if (
      title &&
      (
        title.includes(q) ||
        q.includes(title)
      )
    ) {
      return true;
    }

    return terms.some(
      term =>
        term === q ||
        term.includes(q) ||
        q.includes(term)
    );

  }


  /* =========================================================
     CARREGA OFERTAS AMAZON
     ========================================================= */

  async function loadAmazonOffers() {

    try {

      const {
        data,
        error
      } =
        await amazonDb
          .from(
            "affiliate_links"
          )
          .select(
            "id, marketplace, item_id, catalog_product_id, product_title, affiliate_url, active, price, image_url, search_terms, updated_at"
          )
          .eq(
            "marketplace",
            "amazon"
          )
          .eq(
            "active",
            true
          )
          .order(
            "updated_at",
            {
              ascending:false
            }
          );

      if (error) {
        throw error;
      }

      amazonOffers =
        Array.isArray(data)
          ? data
          : [];

    } catch (error) {

      console.error(
        "[ACHOU! Amazon] Erro ao carregar ofertas.",
        error
      );

      amazonOffers = [];

    }

    renderAmazonOffers();

  }


  /* =========================================================
     CARD AMAZON
     ========================================================= */

  function makeAmazonCard(
    offer
  ) {

    const title =
      escapeHtml(
        offer.product_title ||
        "Oferta Amazon"
      );

    const image =
      offer.image_url

        ? `
          <img
            class="achou-product-image"
            src="${escapeHtml(
              offer.image_url
            )}"
            alt="${title}"
            loading="lazy"
            referrerpolicy="no-referrer"
            onerror="
              this.style.display='none';
              this.nextElementSibling.style.display='flex';
            "
          >

          <div
            class="amazon-photo-fallback"
            style="display:none"
          >
            amazon
            <small>
              Oferta parceira
            </small>
          </div>
        `

        : `
          <div
            class="amazon-photo-fallback"
          >
            amazon
            <small>
              Oferta parceira
            </small>
          </div>
        `;


    const price =
      Number(
        offer.price
      );

    const hasPrice =
      Number.isFinite(price) &&
      price > 0;


    return `
      <article
        class="flash-card amazon-manual-card"
        data-amazon-offer="${escapeHtml(
          offer.id
        )}"
      >

        <span class="amazon-badge">
          AMAZON
        </span>


        <div class="flash-photo">
          ${image}
        </div>


        <h3>
          ${title}
        </h3>


        <div class="amazon-store-label">
          Amazon
        </div>


        ${
          hasPrice

            ? `
              <span class="achou-starting">
                Preço cadastrado
              </span>

              <strong class="flash-price">
                ${money(price)}
              </strong>

              <small class="amazon-price-note">
                Confira o valor atual na Amazon antes de finalizar a compra.
              </small>
            `

            : `
              <strong class="amazon-check-price">
                VEJA O PREÇO ATUAL NA AMAZON
              </strong>

              <small class="amazon-price-note">
                O valor é confirmado diretamente na loja.
              </small>
            `
        }


        <div class="product-bottom">

          <span>
            Amazon integrada ao ACHOU!
          </span>

        </div>


        <div class="achou-actions">

          <a
            class="offer"
            href="${escapeHtml(
              offer.affiliate_url
            )}"
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            VER OFERTA NA AMAZON
          </a>

        </div>

      </article>
    `;

  }


  /* =========================================================
     MOSTRA AMAZON JUNTO DOS RESULTADOS
     ========================================================= */

  function renderAmazonOffers() {

    if (renderLock) {
      return;
    }

    const container =
      document.querySelector(
        ".flash-deals"
      );

    if (!container) {
      return;
    }

    renderLock = true;

    try {

      container
        .querySelectorAll(
          ".amazon-manual-card"
        )
        .forEach(
          card =>
            card.remove()
        );


      document
        .querySelectorAll(
          ".amazon-summary-extra"
        )
        .forEach(
          node =>
            node.remove()
        );


      const query =
        currentVisibleQuery();


      const matches =
        amazonOffers

          .filter(
            offer =>
              validAmazonLink(
                offer.affiliate_url
              )
          )

          .filter(
            offer =>
              amazonOfferMatchesQuery(
                offer,
                query
              )
          );


      if (!matches.length) {
        return;
      }


      container.insertAdjacentHTML(
        "beforeend",
        matches
          .map(
            makeAmazonCard
          )
          .join("")
      );


      const summary =
        document.querySelector(
          ".achou-search-summary div span"
        );


      if (summary) {

        const extra =
          document.createElement(
            "span"
          );

        extra.className =
          "amazon-summary-extra";

        extra.textContent =
          `+ ${matches.length} ${
            matches.length === 1
              ? "oferta Amazon"
              : "ofertas Amazon"
          }`;

        summary.appendChild(
          extra
        );

      }

    } finally {

      renderLock = false;

    }

  }


  /* =========================================================
     OBSERVA RESULTADOS DO MERCADO LIVRE
     ========================================================= */

  function watchSearchResults() {

    const container =
      document.querySelector(
        ".flash-deals"
      );

    const summary =
      document.querySelector(
        ".achou-search-summary"
      );


    const scheduleRender =
      () => {

        if (renderLock) {
          return;
        }

        clearTimeout(
          scheduleRender.timer
        );

        scheduleRender.timer =
          setTimeout(
            renderAmazonOffers,
            150
          );

      };


    if (container) {

      new MutationObserver(
        scheduleRender
      ).observe(
        container,
        {
          childList:true,
          subtree:false
        }
      );

    }


    if (summary) {

      new MutationObserver(
        scheduleRender
      ).observe(
        summary,
        {
          childList:true,
          subtree:true,
          characterData:true
        }
      );

    }


    document
      .querySelector(
        "#searchInput"
      )
      ?.addEventListener(
        "input",
        scheduleRender
      );

  }


  /* =========================================================
     PAINEL ADMIN AMAZON
     ========================================================= */

  function injectAmazonAdminSection() {

    if (
      document.getElementById(
        "amazonAdminSection"
      )
    ) {
      return;
    }


    const linksSection =
      document
        .querySelector(
          "#adminLinksList"
        )
        ?.closest(
          ".admin-section"
        );


    const panel =
      document.querySelector(
        "#adminPanelModal .admin-panel"
      );


    if (!panel) {
      return;
    }


    const section =
      document.createElement(
        "section"
      );


    section.id =
      "amazonAdminSection";

    section.className =
      "admin-section amazon-admin-section";


    section.innerHTML = `

      <div class="admin-section-title">

        <h3>
          Ofertas
          <span>Amazon</span>
        </h3>

        <button
          id="amazonAdminRefresh"
          type="button"
        >
          ATUALIZAR
        </button>

      </div>


      <form id="amazonAdminForm">

        <input
          id="amazonAffiliateId"
          type="hidden"
        >


        <div class="amazon-admin-grid">


          <div class="full">

            <label>
              Produto
            </label>

            <input
              id="amazonProductTitle"
              type="text"
              placeholder="Ex.: PlayStation 5"
              required
            >

          </div>


          <div>

            <label>
              Preço (opcional)
            </label>

            <input
              id="amazonPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex.: 3999.90"
            >

            <small class="amazon-admin-hint">
              Deixe vazio para mostrar “Ver preço na Amazon”.
            </small>

          </div>


          <div>

            <label>
              Imagem (opcional)
            </label>

            <input
              id="amazonImageUrl"
              type="url"
              placeholder="https://..."
            >

            <small class="amazon-admin-hint">
              Use apenas imagem que você tenha permissão para exibir.
            </small>

          </div>


          <div class="full">

            <label>
              Termos de busca
            </label>

            <textarea
              id="amazonSearchTerms"
              placeholder="PlayStation 5, PS5, console"
              required
            ></textarea>

            <small class="amazon-admin-hint">
              Separe os termos por vírgula.
            </small>

          </div>


          <div class="full">

            <label>
              Link afiliado Amazon
            </label>

            <input
              id="amazonAffiliateUrl"
              type="url"
              placeholder="https://link.amazon/..."
              required
            >

          </div>


        </div>


        <label class="check-row">

          <input
            id="amazonAffiliateActive"
            type="checkbox"
            checked
          >

          Oferta ativa no site

        </label>


        <div class="amazon-admin-actions">

          <button
            id="amazonAdminClear"
            type="button"
          >
            LIMPAR
          </button>

          <button
            class="amazon-save"
            type="submit"
          >
            SALVAR AMAZON
          </button>

        </div>


      </form>


      <div
        id="amazonAdminMessage"
        class="amazon-admin-message"
      ></div>


      <div
        id="amazonAdminList"
        class="amazon-admin-list"
      ></div>

    `;


    if (linksSection) {

      panel.insertBefore(
        section,
        linksSection
      );

    } else {

      panel.appendChild(
        section
      );

    }


    document
      .getElementById(
        "amazonAdminForm"
      )
      ?.addEventListener(
        "submit",
        saveAmazonOffer
      );


    document
      .getElementById(
        "amazonAdminClear"
      )
      ?.addEventListener(
        "click",
        clearAmazonAdminForm
      );


    document
      .getElementById(
        "amazonAdminRefresh"
      )
      ?.addEventListener(
        "click",
        loadAmazonAdminList
      );

  }


  function setAmazonAdminMessage(
    text,
    type = ""
  ) {

    const element =
      document.getElementById(
        "amazonAdminMessage"
      );

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


  function clearAmazonAdminForm() {

    const form =
      document.getElementById(
        "amazonAdminForm"
      );

    form?.reset();


    const id =
      document.getElementById(
        "amazonAffiliateId"
      );

    const active =
      document.getElementById(
        "amazonAffiliateActive"
      );


    if (id) {
      id.value = "";
    }

    if (active) {
      active.checked = true;
    }

  }


  /* =========================================================
     AUTENTICAÇÃO ADMIN AMAZON
     ========================================================= */

  async function isAmazonAdmin() {

    try {

      const {
        data:userData,
        error:userError
      } =
        await amazonAdminDb
          .auth
          .getUser();


      if (
        userError ||
        !userData?.user
      ) {
        return false;
      }


      const {
        data,
        error
      } =
        await amazonAdminDb
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
        !error &&
        !!data
      );

    } catch {

      return false;

    }

  }


  function captureAdminLogin() {

    const form =
      document.getElementById(
        "adminLoginForm"
      );

    if (!form) {
      return;
    }


    form.addEventListener(
      "submit",
      async () => {

        const email =
          document
            .getElementById(
              "adminEmail"
            )
            ?.value
            ?.trim();

        const password =
          document
            .getElementById(
              "adminPassword"
            )
            ?.value ||
          "";


        if (
          !email ||
          !password
        ) {
          return;
        }


        try {

          await amazonAdminDb
            .auth
            .signOut();


          const {
            data,
            error
          } =
            await amazonAdminDb
              .auth
              .signInWithPassword({
                email,
                password
              });


          if (
            error ||
            !data?.user
          ) {

            throw (
              error ||
              new Error(
                "Login inválido"
              )
            );

          }


          amazonAdminReady =
            await isAmazonAdmin();


          if (
            amazonAdminReady
          ) {

            setTimeout(
              loadAmazonAdminList,
              300
            );

          }

        } catch (error) {

          amazonAdminReady =
            false;

          console.warn(
            "[ACHOU! Amazon] Sessão administrativa não iniciada.",
            error
          );

        }

      },
      true
    );


    [
      "adminLogoutButton",
      "adminPanelClose",
      "adminLoginClose"
    ]
      .forEach(
        id => {

          document
            .getElementById(id)
            ?.addEventListener(
              "click",
              async () => {

                amazonAdminReady =
                  false;

                try {

                  await amazonAdminDb
                    .auth
                    .signOut();

                } catch {}

              }
            );

        }
      );

  }


  /* =========================================================
     SALVA OFERTA AMAZON
     ========================================================= */

  async function saveAmazonOffer(
    event
  ) {

    event.preventDefault();


    if (
      !amazonAdminReady ||
      !(await isAmazonAdmin())
    ) {

      setAmazonAdminMessage(
        "Entre novamente no painel administrativo antes de salvar.",
        "error"
      );

      return;

    }


    const id =
      document
        .getElementById(
          "amazonAffiliateId"
        )
        ?.value
        ?.trim() ||
      "";


    const title =
      document
        .getElementById(
          "amazonProductTitle"
        )
        ?.value
        ?.trim() ||
      "";


    const priceRaw =
      document
        .getElementById(
          "amazonPrice"
        )
        ?.value
        ?.trim() ||
      "";


    const imageUrl =
      document
        .getElementById(
          "amazonImageUrl"
        )
        ?.value
        ?.trim() ||
      "";


    const searchTerms =
      document
        .getElementById(
          "amazonSearchTerms"
        )
        ?.value
        ?.trim() ||
      "";


    const affiliateUrl =
      document
        .getElementById(
          "amazonAffiliateUrl"
        )
        ?.value
        ?.trim() ||
      "";


    const active =
      document
        .getElementById(
          "amazonAffiliateActive"
        )
        ?.checked !== false;


    if (
      !title ||
      !searchTerms ||
      !validAmazonLink(
        affiliateUrl
      )
    ) {

      setAmazonAdminMessage(
        "Preencha produto, termos de busca e um link Amazon válido.",
        "error"
      );

      return;

    }


    const price =
      priceRaw
        ? Number(priceRaw)
        : null;


    if (
      priceRaw &&
      (
        !Number.isFinite(price) ||
        price <= 0
      )
    ) {

      setAmazonAdminMessage(
        "Informe um preço válido ou deixe o campo vazio.",
        "error"
      );

      return;

    }


    const payload = {

      marketplace:
        "amazon",

      item_id:
        null,

      catalog_product_id:
        null,

      product_title:
        title,

      affiliate_url:
        affiliateUrl,

      active,

      price,

      image_url:
        imageUrl || null,

      search_terms:
        searchTerms,

      updated_at:
        new Date().toISOString()

    };


    try {

      if (id) {

        const {
          error
        } =
          await amazonAdminDb
            .from(
              "affiliate_links"
            )
            .update(
              payload
            )
            .eq(
              "id",
              id
            )
            .eq(
              "marketplace",
              "amazon"
            );


        if (error) {
          throw error;
        }

      } else {

        const {
          data:existing,
          error:findError
        } =
          await amazonAdminDb
            .from(
              "affiliate_links"
            )
            .select(
              "id"
            )
            .eq(
              "marketplace",
              "amazon"
            )
            .eq(
              "affiliate_url",
              affiliateUrl
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
            await amazonAdminDb
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
            await amazonAdminDb
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


      setAmazonAdminMessage(
        "Oferta Amazon salva com sucesso.",
        "success"
      );


      clearAmazonAdminForm();

      await loadAmazonOffers();

      await loadAmazonAdminList();


    } catch (error) {

      console.error(
        "[ACHOU! Amazon] Erro ao salvar.",
        error
      );


      setAmazonAdminMessage(
        "Não foi possível salvar a oferta Amazon.",
        "error"
      );

    }

  }


  /* =========================================================
     LISTA AMAZON NO ADMIN
     ========================================================= */

  async function loadAmazonAdminList() {

    const list =
      document.getElementById(
        "amazonAdminList"
      );

    if (!list) {
      return;
    }


    if (
      !amazonAdminReady ||
      !(await isAmazonAdmin())
    ) {

      list.innerHTML =
        `
          <div class="admin-empty">
            Entre no painel para gerenciar as ofertas Amazon.
          </div>
        `;

      return;

    }


    try {

      const {
        data,
        error
      } =
        await amazonAdminDb
          .from(
            "affiliate_links"
          )
          .select(
            "id, product_title, affiliate_url, active, price, image_url, search_terms, updated_at"
          )
          .eq(
            "marketplace",
            "amazon"
          )
          .order(
            "updated_at",
            {
              ascending:false
            }
          );


      if (error) {
        throw error;
      }


      const items =
        Array.isArray(data)
          ? data
          : [];


      list.innerHTML =
        items.length

          ? items.map(
              item => `
                <article class="amazon-admin-item">

                  <div>

                    <strong>
                      ${escapeHtml(
                        item.product_title ||
                        "Oferta Amazon"
                      )}
                    </strong>

                    <small>
                      ${
                        item.price
                          ? money(
                              item.price
                            )
                          : "Preço confirmado na Amazon"
                      }
                    </small>

                    <em>
                      ${
                        item.active
                          ? "ATIVA"
                          : "INATIVA"
                      }
                    </em>

                  </div>


                  <div class="amazon-admin-item-actions">

                    <button
                      type="button"
                      data-amazon-edit="${escapeHtml(
                        item.id
                      )}"
                    >
                      EDITAR
                    </button>

                    <button
                      type="button"
                      data-amazon-delete="${escapeHtml(
                        item.id
                      )}"
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
                Nenhuma oferta Amazon cadastrada.
              </div>
            `;


      list
        .querySelectorAll(
          "[data-amazon-edit]"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                const item =
                  items.find(
                    row =>
                      String(
                        row.id
                      ) ===
                      String(
                        button.dataset.amazonEdit
                      )
                  );


                if (!item) {
                  return;
                }


                document
                  .getElementById(
                    "amazonAffiliateId"
                  )
                  .value =
                    item.id || "";


                document
                  .getElementById(
                    "amazonProductTitle"
                  )
                  .value =
                    item.product_title ||
                    "";


                document
                  .getElementById(
                    "amazonPrice"
                  )
                  .value =
                    item.price ??
                    "";


                document
                  .getElementById(
                    "amazonImageUrl"
                  )
                  .value =
                    item.image_url ||
                    "";


                document
                  .getElementById(
                    "amazonSearchTerms"
                  )
                  .value =
                    item.search_terms ||
                    "";


                document
                  .getElementById(
                    "amazonAffiliateUrl"
                  )
                  .value =
                    item.affiliate_url ||
                    "";


                document
                  .getElementById(
                    "amazonAffiliateActive"
                  )
                  .checked =
                    item.active !== false;


                setAmazonAdminMessage(
                  "Oferta Amazon carregada para edição.",
                  "success"
                );


                document
                  .getElementById(
                    "amazonAdminSection"
                  )
                  ?.scrollIntoView({
                    behavior:"smooth",
                    block:"start"
                  });

              }
            );

          }
        );


      list
        .querySelectorAll(
          "[data-amazon-delete]"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              async () => {

                if (
                  !confirm(
                    "Excluir esta oferta Amazon?"
                  )
                ) {
                  return;
                }


                const {
                  error:deleteError
                } =
                  await amazonAdminDb
                    .from(
                      "affiliate_links"
                    )
                    .delete()
                    .eq(
                      "id",
                      button.dataset.amazonDelete
                    )
                    .eq(
                      "marketplace",
                      "amazon"
                    );


                if (deleteError) {

                  setAmazonAdminMessage(
                    "Não foi possível excluir a oferta.",
                    "error"
                  );

                  return;

                }


                await loadAmazonOffers();

                await loadAmazonAdminList();

              }
            );

          }
        );


    } catch (error) {

      console.error(
        "[ACHOU! Amazon] Erro ao carregar painel.",
        error
      );


      list.innerHTML =
        `
          <div class="admin-empty">
            Não foi possível carregar as ofertas Amazon.
          </div>
        `;

    }

  }


  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  injectAmazonStyles();

  markAmazonIntegrated();

  injectAmazonAdminSection();

  captureAdminLogin();

  watchSearchResults();

  loadAmazonOffers();
/* AJUSTE FINAL DO CARD AMAZON */
const amazonFinalStyle = document.createElement("style");

amazonFinalStyle.textContent = `
  .amazon-manual-card .flash-photo{
    position:relative;
    overflow:hidden;
  }

  .amazon-manual-card .flash-photo img{
    width:100%;
    height:100%;
    object-fit:contain !important;
    object-position:center !important;
    padding:8px;
    background:#fff;
  }

  .amazon-manual-card .amazon-badge{
    top:12px !important;
    left:12px !important;
    bottom:auto !important;
    z-index:5;
  }
`;

document.head.appendChild(amazonFinalStyle);
});
