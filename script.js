/* =========================================================
   ACHOU! — SCRIPT PRINCIPAL
   Busca + Supabase + Conta do cliente + Mensagens
   ========================================================= */

const SUPABASE_URL = "https://wulhcgkphclwgidqlvtr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Wi0Kz5aB4LeLnlxQE_34Yw_1KwA8ebc";
const SITE_URL = "https://joaoeduardocaio-netizen.github.io/achou-/";

let supabaseClient = null;

if (window.supabase && window.supabase.createClient) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
} else {
  console.error("Supabase não foi carregado.");
}

/* =========================================================
   ELEMENTOS PRINCIPAIS
   ========================================================= */

const searchForm =
  document.querySelector(".search-box") ||
  document.querySelector(".search-form");

const searchInput =
  document.getElementById("searchInput") ||
  document.querySelector(".search-box input") ||
  document.querySelector(".search-form input");

const productCards = document.querySelectorAll(".product-card");

const popularButtons = document.querySelectorAll(".popular button");

const categoryButtons = document.querySelectorAll(".categories button");

const loginButton = document.getElementById("loginButton");

const loginModal = document.getElementById("loginModal");
const loginClose = document.getElementById("loginClose");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const createAccount = document.getElementById("createAccount");

const signupModal = document.getElementById("signupModal");
const signupClose = document.getElementById("signupClose");
const signupForm = document.getElementById("signupForm");
const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupPasswordConfirm =
  document.getElementById("signupPasswordConfirm");
const signupLogin = document.getElementById("signupLogin");

/* =========================================================
   HISTÓRICO DE PESQUISAS
   ========================================================= */

function saveSearchHistory(query) {
  const value = String(query || "").trim();

  if (!value) return;

  let history = [];

  try {
    history = JSON.parse(
      localStorage.getItem("achou_search_history") || "[]"
    );
  } catch (_) {
    history = [];
  }

  history = history.filter(
    item => item.toLowerCase() !== value.toLowerCase()
  );

  history.unshift(value);

  localStorage.setItem(
    "achou_search_history",
    JSON.stringify(history.slice(0, 10))
  );
}

/* =========================================================
   BUSCA
   ========================================================= */

function searchProducts(query, shouldScroll = true) {
  const text = String(query || "").trim().toLowerCase();

  productCards.forEach(card => {
    const name = String(card.dataset.name || "").toLowerCase();
    const content = String(card.textContent || "").toLowerCase();

    const match =
      !text ||
      name.includes(text) ||
      content.includes(text);

    card.style.display = match ? "" : "none";
  });

  if (text) {
    saveSearchHistory(query);
  }

  if (text && shouldScroll) {
    const list = document.getElementById("productList");

    if (list) {
      list.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }
}

if (searchForm) {
  searchForm.addEventListener("submit", event => {
    event.preventDefault();

    searchProducts(
      searchInput ? searchInput.value : ""
    );
  });
}

/* =========================================================
   BOTÕES POPULARES
   ========================================================= */

popularButtons.forEach(button => {
  button.addEventListener("click", event => {
    event.preventDefault();

    const text = button.textContent.trim();

    if (searchInput) {
      searchInput.value = text;
    }

    searchProducts(text);
  });
});

/* =========================================================
   CATEGORIAS
   ========================================================= */

categoryButtons.forEach(button => {
  button.addEventListener("click", event => {
    event.preventDefault();

    const text =
      button.querySelector("b")?.textContent?.trim() ||
      button.textContent.trim();

    if (searchInput) {
      searchInput.value = text;
    }

    searchProducts(text);
  });
});

/* =========================================================
   MENU MOBILE
   ========================================================= */

const menuButton = document.querySelector(".menu-button");

if (menuButton) {
  menuButton.addEventListener("click", event => {
    event.preventDefault();

    const expanded =
      menuButton.getAttribute("aria-expanded") === "true";

    menuButton.setAttribute(
      "aria-expanded",
      String(!expanded)
    );

    menuButton.classList.toggle(
      "open",
      !expanded
    );
  });
}

/* =========================================================
   LINKS DE OFERTA
   ========================================================= */

document
  .querySelectorAll(".deal, .offer, .offer-link")
  .forEach(element => {
    element.addEventListener("click", event => {
      const href = element.getAttribute("href");

      if (!href || href === "#") {
        event.preventDefault();
      }
    });
  });

/* =========================================================
   MODAL DE MENSAGENS ACHOU!
   ========================================================= */

let messageModal = null;
let messageTitle = null;
let messageText = null;
let messageButton = null;
let messageIcon = null;

function createMessageModal() {
  if (messageModal) return;

  const style = document.createElement("style");

  style.id = "achouMessageStyles";

  style.textContent = `
    #achouMessageModal {
      position: fixed;
      inset: 0;
      z-index: 20000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(0,0,0,.84);
      backdrop-filter: blur(9px);
      -webkit-backdrop-filter: blur(9px);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: .2s ease;
    }

    #achouMessageModal.active {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .achou-message-box {
      width: 100%;
      max-width: 370px;
      padding: 30px 24px 24px;
      background: #050505;
      border: 1px solid #292929;
      border-radius: 16px;
      box-shadow:
        0 20px 70px rgba(0,0,0,.85),
        0 0 35px rgba(255,212,0,.05);
      text-align: center;
      transform: translateY(15px) scale(.98);
      transition: .2s ease;
    }

    #achouMessageModal.active .achou-message-box {
      transform: none;
    }

    .achou-message-logo {
      font-size: 25px;
      font-weight: 950;
      letter-spacing: -1.5px;
      color: #fff;
      margin-bottom: 18px;
    }

    .achou-message-logo span {
      color: #FFD400;
    }

    .achou-message-icon {
      width: 54px;
      height: 54px;
      margin: 0 auto 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #FFD400;
      color: #FFD400;
      font-size: 27px;
      font-weight: 900;
    }

    .achou-message-title {
      margin: 0 0 10px;
      color: #fff;
      font-size: 18px;
      font-weight: 900;
    }

    .achou-message-text {
      margin: 0 auto 22px;
      max-width: 290px;
      color: #999;
      font-size: 10px;
      line-height: 1.55;
      white-space: pre-line;
    }

    .achou-message-button {
      width: 100%;
      height: 44px;
      border: 0;
      border-radius: 9px;
      background: #FFD400;
      color: #000;
      font-size: 9px;
      font-weight: 950;
      cursor: pointer;
    }

    .achou-confirm-buttons {
      display: flex;
      gap: 10px;
      width: 100%;
    }

    .achou-confirm-button {
      flex: 1;
      height: 44px;
      border-radius: 9px;
      font-size: 9px;
      font-weight: 950;
      cursor: pointer;
    }

    .achou-confirm-cancel {
      background: transparent;
      color: #fff;
      border: 1px solid #444;
    }

    .achou-confirm-logout {
      background: #FFD400;
      color: #000;
      border: 1px solid #FFD400;
    }

    @media(max-width:420px) {

      #achouMessageModal {
        padding: 16px;
      }

      .achou-message-box {
        padding: 28px 20px 21px;
        border-radius: 15px;
      }
    }
  `;

  document.head.appendChild(style);

  messageModal = document.createElement("div");

  messageModal.id = "achouMessageModal";
  messageModal.setAttribute("aria-hidden", "true");

  messageModal.innerHTML = `
    <div
      class="achou-message-box"
      role="dialog"
      aria-modal="true"
    >

      <div class="achou-message-logo">
        ACHOU<span>!</span>
      </div>

      <div class="achou-message-icon">
        ✓
      </div>

      <h3 class="achou-message-title">
        Tudo certo!
      </h3>

      <p class="achou-message-text">
        Mensagem
      </p>

      <button
        type="button"
        class="achou-message-button"
      >
        OK, ENTENDI
      </button>

    </div>
  `;

  document.body.appendChild(messageModal);

  messageTitle =
    messageModal.querySelector(
      ".achou-message-title"
    );

  messageText =
    messageModal.querySelector(
      ".achou-message-text"
    );

  messageButton =
    messageModal.querySelector(
      ".achou-message-button"
    );

  messageIcon =
    messageModal.querySelector(
      ".achou-message-icon"
    );

  messageButton.addEventListener(
    "click",
    closeMessage
  );

  messageModal.addEventListener(
    "click",
    event => {
      if (event.target === messageModal) {
        closeMessage();
      }
    }
  );
}

function showMessage(
  title,
  text,
  type = "success",
  buttonText = "OK, ENTENDI"
) {
  createMessageModal();

  messageTitle.textContent = title;
  messageText.textContent = text;

  messageIcon.textContent =
    type === "error" ? "!" : "✓";

  messageButton.textContent =
    buttonText;

  messageButton.style.display =
    "block";

  const old =
    messageModal.querySelector(
      ".achou-confirm-buttons"
    );

  if (old) {
    old.remove();
  }

  messageModal.classList.add("active");

  messageModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "login-open"
  );
}

function closeMessage() {
  if (!messageModal) return;

  messageModal.classList.remove(
    "active"
  );

  messageModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "login-open"
  );
}

/* =========================================================
   LOGIN
   ========================================================= */

function openLogin() {
  closeMessage();

  if (signupModal) {
    signupModal.classList.remove(
      "active"
    );

    signupModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  if (loginModal) {
    loginModal.classList.add(
      "active"
    );

    loginModal.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  document.body.classList.add(
    "login-open"
  );

  setTimeout(() => {
    loginEmail?.focus();
  }, 150);
}

function closeLogin() {
  if (loginModal) {
    loginModal.classList.remove(
      "active"
    );

    loginModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  document.body.classList.remove(
    "login-open"
  );
}

/* =========================================================
   CADASTRO
   ========================================================= */

function openSignup() {
  closeMessage();

  if (loginModal) {
    loginModal.classList.remove(
      "active"
    );

    loginModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  if (signupModal) {
    signupModal.classList.add(
      "active"
    );

    signupModal.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  document.body.classList.add(
    "login-open"
  );

  setTimeout(() => {
    signupName?.focus();
  }, 150);
}

function closeSignup() {
  if (signupModal) {
    signupModal.classList.remove(
      "active"
    );

    signupModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  document.body.classList.remove(
    "login-open"
  );
}

if (loginClose) {
  loginClose.addEventListener(
    "click",
    closeLogin
  );
}

if (createAccount) {
  createAccount.addEventListener(
    "click",
    openSignup
  );
}

if (signupClose) {
  signupClose.addEventListener(
    "click",
    closeSignup
  );
}

if (signupLogin) {
  signupLogin.addEventListener(
    "click",
    openLogin
  );
}

if (loginModal) {
  loginModal.addEventListener(
    "click",
    event => {
      if (event.target === loginModal) {
        closeLogin();
      }
    }
  );
}

if (signupModal) {
  signupModal.addEventListener(
    "click",
    event => {
      if (event.target === signupModal) {
        closeSignup();
      }
    }
  );
}

/* =========================================================
   MINHA CONTA
   ========================================================= */

let accountModal = null;
let currentUser = null;

function createAccountPanel() {
  if (accountModal) return;

  const style =
    document.createElement("style");

  style.id =
    "achouAccountStyles";

  style.textContent = `
    #achouAccountModal {
      position: fixed;
      inset: 0;
      z-index: 19000;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      padding: 82px 18px 18px;
      background: rgba(0,0,0,.68);
      backdrop-filter: blur(7px);
      -webkit-backdrop-filter: blur(7px);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: .2s ease;
    }

    #achouAccountModal.active {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .achou-account-box {
      width: 100%;
      max-width: 360px;
      background: #050505;
      border: 1px solid #383838;
      border-radius: 16px;
      box-shadow: 0 25px 80px rgba(0,0,0,.8);
      overflow: hidden;
      transform: translateY(-10px);
      transition: .2s ease;
    }

    #achouAccountModal.active
    .achou-account-box {
      transform: none;
    }

    .achou-account-head {
      padding: 24px 22px 20px;
      border-bottom: 1px solid #202020;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .achou-account-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 1px solid #FFD400;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFD400;
      font-weight: 900;
      font-size: 19px;
      flex: none;
    }

    .achou-account-name {
      margin: 0;
      color: #fff;
      font-size: 17px;
      font-weight: 900;
    }

    .achou-account-email {
      display: block;
      margin-top: 4px;
      color: #777;
      font-size: 9px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 245px;
    }

    .achou-account-close {
      margin-left: auto;
      background: transparent;
      border: 0;
      color: #777;
      font-size: 25px;
      cursor: pointer;
      padding: 4px;
    }

    .achou-account-list {
      padding: 8px;
    }

    .achou-account-item {
      width: 100%;
      min-height: 54px;
      background: transparent;
      border: 0;
      border-bottom: 1px solid #171717;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 13px;
      padding: 12px 14px;
      text-align: left;
      cursor: pointer;
    }

    .achou-account-item:last-child {
      border-bottom: 0;
    }

    .achou-account-item:hover {
      background: #0d0d0d;
    }

    .achou-account-item-icon {
      width: 29px;
      color: #FFD400;
      text-align: center;
      font-size: 17px;
    }

    .achou-account-item strong {
      display: block;
      font-size: 11px;
    }

    .achou-account-item span {
      display: block;
      color: #666;
      font-size: 8px;
      margin-top: 3px;
    }

    .achou-account-footer {
      padding: 14px 18px;
      border-top: 1px solid #202020;
      color: #555;
      font-size: 8px;
      text-align: center;
    }

    @media(max-width:600px) {

      #achouAccountModal {
        align-items: flex-start;
        justify-content: center;
        padding: 76px 12px 12px;
      }

      .achou-account-box {
        max-width: 390px;
      }
    }
  `;

  document.head.appendChild(style);

  accountModal =
    document.createElement("div");

  accountModal.id =
    "achouAccountModal";

  accountModal.setAttribute(
    "aria-hidden",
    "true"
  );

  accountModal.innerHTML = `
    <div
      class="achou-account-box"
      role="dialog"
      aria-modal="true"
      aria-label="Minha conta"
    >

      <div class="achou-account-head">

        <div
          class="achou-account-avatar"
          id="accountAvatar"
        >
          J
        </div>

        <div>

          <h3
            class="achou-account-name"
            id="accountName"
          >
            Olá!
          </h3>

          <span
            class="achou-account-email"
            id="accountEmail"
          ></span>

        </div>

        <button
          class="achou-account-close"
          id="accountClose"
          type="button"
          aria-label="Fechar"
        >
          ×
        </button>

      </div>

      <div class="achou-account-list">

        <button
          class="achou-account-item"
          type="button"
          data-account-action="profile"
        >
          <div class="achou-account-item-icon">
            ◉
          </div>

          <div>
            <strong>
              Minha conta
            </strong>

            <span>
              Dados e informações da sua conta
            </span>
          </div>
        </button>

        <button
          class="achou-account-item"
          type="button"
          data-account-action="favorites"
        >
          <div class="achou-account-item-icon">
            ♥
          </div>

          <div>
            <strong>
              Meus favoritos
            </strong>

            <span>
              Seus produtos favoritos
            </span>
          </div>
        </button>

        <button
          class="achou-account-item"
          type="button"
          data-account-action="history"
        >
          <div class="achou-account-item-icon">
            ↺
          </div>

          <div>
            <strong>
              Histórico
            </strong>

            <span>
              Pesquisas recentes no ACHOU!
            </span>
          </div>
        </button>

        <button
          class="achou-account-item"
          type="button"
          data-account-action="alerts"
        >
          <div class="achou-account-item-icon">
            ♢
          </div>

          <div>
            <strong>
              Alertas de preço
            </strong>

            <span>
              Prepare seus alertas para acompanhar ofertas
            </span>
          </div>
        </button>

        <button
          class="achou-account-item"
          type="button"
          data-account-action="logout"
        >
          <div class="achou-account-item-icon">
            ↪
          </div>

          <div>
            <strong>
              Sair da conta
            </strong>

            <span>
              Encerrar sua sessão
            </span>
          </div>
        </button>

      </div>

      <div class="achou-account-footer">
        ACHOU! — Compare antes de comprar.
      </div>

    </div>
  `;

  document.body.appendChild(
    accountModal
  );

  accountModal
    .querySelector("#accountClose")
    .addEventListener(
      "click",
      closeAccountPanel
    );

  accountModal.addEventListener(
    "click",
    event => {
      if (event.target === accountModal) {
        closeAccountPanel();
      }
    }
  );

  accountModal
    .querySelectorAll(
      "[data-account-action]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {
          handleAccountAction(
            button.dataset.accountAction
          );
        }
      );

    });
}

/* =========================================================
   ATUALIZAR PAINEL DA CONTA
   ========================================================= */

function updateAccountPanel(user) {
  createAccountPanel();

  const metadata =
    user?.user_metadata || {};

  const name =
    metadata.full_name ||
    metadata.name ||
    user?.email?.split("@")[0] ||
    "Usuário";

  const firstName =
    name.trim().split(/\s+/)[0] ||
    "Usuário";

  document.getElementById(
    "accountName"
  ).textContent =
    `Olá, ${firstName}`;

  document.getElementById(
    "accountEmail"
  ).textContent =
    user?.email || "";

  document.getElementById(
    "accountAvatar"
  ).textContent =
    firstName
      .charAt(0)
      .toUpperCase();
}

/* =========================================================
   ABRIR MINHA CONTA
   ========================================================= */

function openAccountPanel() {
  if (!currentUser) {
    return openLogin();
  }

  updateAccountPanel(
    currentUser
  );

  accountModal.classList.add(
    "active"
  );

  accountModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "login-open"
  );
}

/* =========================================================
   FECHAR MINHA CONTA
   ========================================================= */

function closeAccountPanel() {
  if (!accountModal) return;

  accountModal.classList.remove(
    "active"
  );

  accountModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "login-open"
  );
}

/* =========================================================
   AÇÕES DA CONTA
   ========================================================= */

function handleAccountAction(action) {

  if (action === "logout") {

    closeAccountPanel();

    showLogoutConfirmation();

    return;
  }

  if (action === "history") {

    let history = [];

    try {
      history = JSON.parse(
        localStorage.getItem(
          "achou_search_history"
        ) || "[]"
      );
    } catch (_) {
      history = [];
    }

    showMessage(
      "Seu histórico",
      history.length
        ? history
            .map(
              (item, i) =>
                `${i + 1}. ${item}`
            )
            .join("\n")
        : "Você ainda não fez nenhuma pesquisa.",
      "success",
      "FECHAR"
    );

    return;
  }

  if (action === "favorites") {

    showMessage(
      "Meus favoritos",
      "A área de favoritos já está preparada no ACHOU!.\n\nO próximo passo será permitir salvar produtos diretamente nos seus favoritos.",
      "success",
      "ENTENDI"
    );

    return;
  }

  if (action === "alerts") {

    showMessage(
      "Alertas de preço",
      "Essa função está preparada para a próxima fase.\n\nEm breve você poderá acompanhar quando o preço de um produto baixar.",
      "success",
      "ENTENDI"
    );

    return;
  }

  if (action === "profile") {

    const name =
      currentUser?.user_metadata?.full_name ||
      currentUser?.email?.split("@")[0] ||
      "Usuário";

    showMessage(
      "Minha conta",
      `Nome: ${name}\n\nE-mail: ${currentUser?.email || ""}\n\nConta ativa no ACHOU!`,
      "success",
      "FECHAR"
    );

    return;
  }
}

/* =========================================================
   BOTÃO ENTRAR / OLÁ, NOME
   ========================================================= */

function updateLoginButton(user) {

  currentUser = user || null;

  if (!loginButton) return;

  if (!user) {

    loginButton.textContent =
      "Entrar";

    loginButton.dataset.loggedIn =
      "false";

    loginButton.removeAttribute(
      "title"
    );

    return;
  }

  const metadata =
    user.user_metadata || {};

  const name =
    metadata.full_name ||
    metadata.name ||
    user.email?.split("@")[0] ||
    "Usuário";

  const firstName =
    name.trim().split(/\s+/)[0] ||
    "Usuário";

  loginButton.textContent =
    `Olá, ${firstName}`;

  loginButton.dataset.loggedIn =
    "true";

  loginButton.title =
    "Minha conta";
}

if (loginButton) {

  loginButton.addEventListener(
    "click",
    event => {

      event.preventDefault();

      if (currentUser) {
        openAccountPanel();
      } else {
        openLogin();
      }

    }
  );

}

/* =========================================================
   CONFIRMAÇÃO DE LOGOUT
   ========================================================= */

function showLogoutConfirmation() {

  createMessageModal();

  messageTitle.textContent =
    "Sair da conta?";

  messageText.textContent =
    "Você deseja realmente sair da sua conta do ACHOU!?";

  messageIcon.textContent =
    "?";

  messageButton.style.display =
    "none";

  const old =
    messageModal.querySelector(
      ".achou-confirm-buttons"
    );

  if (old) {
    old.remove();
  }

  const buttons =
    document.createElement("div");

  buttons.className =
    "achou-confirm-buttons";

  buttons.innerHTML = `
    <button
      type="button"
      class="achou-confirm-button achou-confirm-cancel"
      id="achouLogoutCancel"
    >
      CANCELAR
    </button>

    <button
      type="button"
      class="achou-confirm-button achou-confirm-logout"
      id="achouLogoutConfirm"
    >
      SAIR DA CONTA
    </button>
  `;

  messageModal
    .querySelector(
      ".achou-message-box"
    )
    .appendChild(buttons);

  document
    .getElementById(
      "achouLogoutCancel"
    )
    .addEventListener(
      "click",
      closeMessage
    );

  document
    .getElementById(
      "achouLogoutConfirm"
    )
    .addEventListener(
      "click",
      performLogout
    );

  messageModal.classList.add(
    "active"
  );

  messageModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "login-open"
  );
}

/* =========================================================
   LOGOUT REAL
   ========================================================= */

async function performLogout() {

  const button =
    document.getElementById(
      "achouLogoutConfirm"
    );

  if (button) {

    button.disabled = true;

    button.textContent =
      "SAINDO...";
  }

  if (!supabaseClient) {

    showMessage(
      "Sistema indisponível",
      "Não foi possível acessar sua conta agora.\n\nAtualize a página e tente novamente.",
      "error"
    );

    return;
  }

  const {
    error
  } =
    await supabaseClient.auth.signOut();

  if (error) {

    console.error(error);

    showMessage(
      "Não foi possível sair",
      "Ocorreu um erro ao encerrar sua sessão.\n\nTente novamente.",
      "error"
    );

    return;
  }

  updateLoginButton(null);

  showMessage(
    "Sessão encerrada",
    "Você saiu da sua conta do ACHOU!.",
    "success",
    "CONTINUAR"
  );
}

/* =========================================================
   LOGIN REAL
   ========================================================= */

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (!supabaseClient) {

        return showMessage(
          "Sistema indisponível",
          "O sistema de login não foi carregado.\n\nAtualize a página e tente novamente.",
          "error"
        );
      }

      const email =
        loginEmail?.value.trim() || "";

      const password =
        loginPassword?.value || "";

      if (!email || !password) {

        return showMessage(
          "Preencha os campos",
          "Digite seu e-mail e sua senha para entrar.",
          "error"
        );
      }

      const button =
        loginForm.querySelector(
          ".login-submit"
        );

      if (button) {

        button.disabled = true;

        button.textContent =
          "ENTRANDO...";
      }

      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password
          });

        if (error) {

          const text =
            String(
              error.message || ""
            ).toLowerCase();

          if (
            text.includes(
              "email not confirmed"
            )
          ) {

            showMessage(
              "E-mail não confirmado",
              "Seu e-mail ainda não foi confirmado.\n\nConfira sua caixa de entrada e clique no link de confirmação antes de fazer login.",
              "error",
              "ENTENDI"
            );

          } else {

            showMessage(
              "Não foi possível entrar",
              "O e-mail ou a senha estão incorretos.\n\nConfira seus dados e tente novamente.",
              "error",
              "TENTAR NOVAMENTE"
            );

          }

          return;
        }

        if (data?.session) {

          updateLoginButton(
            data.user
          );

          closeLogin();

          showMessage(
            "Login realizado!",
            "Você entrou na sua conta do ACHOU! com sucesso.",
            "success",
            "CONTINUAR"
          );
        }

      } catch (error) {

        console.error(error);

        showMessage(
          "Ocorreu um erro",
          "Não foi possível realizar o login agora.\n\nTente novamente.",
          "error"
        );

      } finally {

        if (button) {

          button.disabled = false;

          button.textContent =
            "ENTRAR";
        }
      }

    }
  );
}

/* =========================================================
   CADASTRO REAL
   ========================================================= */

if (signupForm) {

  signupForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (!supabaseClient) {

        return showMessage(
          "Sistema indisponível",
          "O sistema de cadastro não foi carregado.\n\nAtualize a página e tente novamente.",
          "error"
        );
      }

      const name =
        signupName?.value.trim() || "";

      const email =
        signupEmail?.value.trim() || "";

      const password =
        signupPassword?.value || "";

      const confirm =
        signupPasswordConfirm?.value || "";

      if (!name) {

        return showMessage(
          "Nome obrigatório",
          "Digite seu nome completo para criar sua conta.",
          "error"
        );
      }

      if (!email) {

        return showMessage(
          "E-mail obrigatório",
          "Digite um e-mail válido para continuar.",
          "error"
        );
      }

      if (password.length < 6) {

        return showMessage(
          "Senha muito curta",
          "A senha precisa ter pelo menos 6 caracteres.",
          "error"
        );
      }

      if (password !== confirm) {

        return showMessage(
          "Senhas diferentes",
          "As duas senhas precisam ser iguais.",
          "error"
        );
      }

      const button =
        signupForm.querySelector(
          ".signup-submit"
        );

      if (button) {

        button.disabled = true;

        button.textContent =
          "CRIANDO...";
      }

      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth.signUp({

            email,

            password,

            options: {

              data: {
                full_name: name
              },

              emailRedirectTo:
                SITE_URL
            }

          });

        if (error) {

          const text =
            String(
              error.message || ""
            ).toLowerCase();

          if (
            text.includes(
              "already registered"
            ) ||
            text.includes(
              "already exists"
            )
          ) {

            showMessage(
              "E-mail já cadastrado",
              "Esse e-mail já possui uma conta no ACHOU!.\n\nTente fazer login ou use outro e-mail.",
              "error",
              "ENTENDI"
            );

          } else {

            showMessage(
              "Não foi possível criar a conta",
              error.message ||
                "Ocorreu um erro ao criar sua conta.",
              "error"
            );

          }

          return;
        }

        closeSignup();

        signupForm.reset();

        if (data?.session) {

          updateLoginButton(
            data.user
          );

          showMessage(
            "Conta criada!",
            "Sua conta foi criada com sucesso.\n\nVocê já pode começar a usar o ACHOU!",
            "success",
            "CONTINUAR"
          );

        } else {

          showMessage(
            "Conta criada!",
            "Sua conta foi criada com sucesso!\n\nEnviamos um e-mail de confirmação para você.\n\nAbra seu e-mail e clique no link de confirmação antes de fazer login.",
            "success",
            "OK, ENTENDI"
          );

        }

      } catch (error) {

        console.error(error);

        showMessage(
          "Ocorreu um erro",
          "Não foi possível criar sua conta agora.\n\nTente novamente.",
          "error"
        );

      } finally {

        if (button) {

          button.disabled = false;

          button.textContent =
            "CRIAR CONTA";
        }
      }

    }
  );
}

/* =========================================================
   TECLA ESC
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (event.key !== "Escape") {
      return;
    }

    if (
      messageModal?.classList.contains(
        "active"
      )
    ) {
      return closeMessage();
    }

    if (
      accountModal?.classList.contains(
        "active"
      )
    ) {
      return closeAccountPanel();
    }

    if (
      signupModal?.classList.contains(
        "active"
      )
    ) {
      return closeSignup();
    }

    if (
      loginModal?.classList.contains(
        "active"
      )
    ) {
      return closeLogin();
    }

  }
);

/* =========================================================
   ESTADO DE AUTENTICAÇÃO SUPABASE
   ========================================================= */

if (supabaseClient) {

  supabaseClient.auth.onAuthStateChange(
    (event, session) => {

      if (session?.user) {

        updateLoginButton(
          session.user
        );

      } else if (
        event === "SIGNED_OUT"
      ) {

        updateLoginButton(null);
      }

    }
  );

  supabaseClient.auth
    .getSession()
    .then(({ data, error }) => {

      if (error) {

        console.error(
          "Erro ao verificar sessão:",
          error
        );

        return;
      }

      updateLoginButton(
        data?.session?.user || null
      );

    });

}

/* =========================================================
   FIM DO SCRIPT
   ========================================================= */
