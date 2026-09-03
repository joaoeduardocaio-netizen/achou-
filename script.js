/* =========================================================
   ACHOU! — SCRIPT PRINCIPAL
   ========================================================= */


/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
  "https://wulhcgkphclwgidqlvtr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_Wi0Kz5aB4LeLnlxQE_34Yw_1KwA8ebc";

let supabaseClient = null;

if (window.supabase && window.supabase.createClient) {

  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

} else {

  console.error(
    "Supabase não foi carregado. Verifique o CDN no index.html."
  );

}


/* =========================================================
   ELEMENTOS DA BUSCA
   ========================================================= */

const searchForm =
  document.querySelector(".search-form");

const searchInput =
  document.querySelector(".search-form input");

const productCards =
  document.querySelectorAll(".product-card");

const popularButtons =
  document.querySelectorAll(".popular button");


/* =========================================================
   BUSCA DE PRODUTOS
   ========================================================= */

function searchProducts(query) {

  const text =
    String(query || "")
      .trim()
      .toLowerCase();

  productCards.forEach(card => {

    const name =
      String(card.dataset.name || "")
        .toLowerCase();

    const cardText =
      String(card.textContent || "")
        .toLowerCase();

    const match =
      !text ||
      name.includes(text) ||
      cardText.includes(text);

    if (match) {

      card.style.display = "";

    } else {

      card.style.display = "none";

    }

  });


  if (text) {

    const productList =
      document.getElementById("productList");

    if (productList) {

      productList.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

  }

}


/* =========================================================
   FORMULÁRIO DE BUSCA
   ========================================================= */

if (searchForm) {

  searchForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const query =
        searchInput
          ? searchInput.value
          : "";

      searchProducts(query);

    }
  );

}


/* =========================================================
   BOTÕES POPULARES
   ========================================================= */

popularButtons.forEach(button => {

  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      const text =
        button.textContent.trim();

      if (searchInput) {

        searchInput.value = text;

      }

      searchProducts(text);

    }
  );

});


/* =========================================================
   MENU MOBILE
   ========================================================= */

const menuToggle =
  document.querySelector(".menu-toggle");

const menu =
  document.querySelector(".nav-menu") ||
  document.querySelector(".mobile-menu") ||
  document.querySelector("header nav");


if (menuToggle) {

  menuToggle.addEventListener(
    "click",
    event => {

      event.preventDefault();

      const isOpen =
        menuToggle.getAttribute(
          "aria-expanded"
        ) === "true";

      menuToggle.setAttribute(
        "aria-expanded",
        String(!isOpen)
      );

      menuToggle.classList.toggle(
        "open",
        !isOpen
      );

      if (menu) {

        menu.classList.toggle(
          "open",
          !isOpen
        );

      }

    }
  );

}


/* =========================================================
   LINKS DE OFERTAS
   ========================================================= */

const offerLinks =
  document.querySelectorAll(
    ".deal, .offer, .offer-link"
  );


offerLinks.forEach(link => {

  link.addEventListener(
    "click",
    event => {

      const href =
        link.getAttribute("href");

      if (
        !href ||
        href === "#"
      ) {

        event.preventDefault();

      }

    }
  );

});


/* =========================================================
   SISTEMA DE MENSAGENS DO ACHOU!
   ========================================================= */

let achouMessageModal = null;
let achouMessageTitle = null;
let achouMessageText = null;
let achouMessageButton = null;
let achouMessageIcon = null;


/* =========================================================
   CRIAR ESTILO DAS MENSAGENS
   ========================================================= */

function createAchouMessageStyles() {

  if (
    document.getElementById(
      "achouMessageStyles"
    )
  ) {

    return;

  }


  const style =
    document.createElement("style");


  style.id =
    "achouMessageStyles";


  style.textContent = `

    #achouMessageModal{
      position:fixed;
      inset:0;
      z-index:20000;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
      background:rgba(0,0,0,.84);
      backdrop-filter:blur(9px);
      -webkit-backdrop-filter:blur(9px);
      opacity:0;
      visibility:hidden;
      pointer-events:none;
      transition:
        opacity .2s ease,
        visibility .2s ease;
    }

    #achouMessageModal.active{
      opacity:1;
      visibility:visible;
      pointer-events:auto;
    }

    .achou-message-box{
      position:relative;
      width:100%;
      max-width:370px;
      padding:30px 24px 24px;
      background:#050505;
      border:1px solid #292929;
      border-radius:16px;
      box-shadow:
        0 20px 70px rgba(0,0,0,.85),
        0 0 35px rgba(255,212,0,.05);
      text-align:center;
      transform:translateY(15px) scale(.98);
      transition:transform .2s ease;
    }

    #achouMessageModal.active
    .achou-message-box{
      transform:translateY(0) scale(1);
    }

    .achou-message-logo{
      font-size:25px;
      font-weight:950;
      letter-spacing:-1.5px;
      color:#fff;
      margin-bottom:18px;
    }

    .achou-message-logo span{
      color:#FFD400;
    }

    .achou-message-icon{
      width:54px;
      height:54px;
      margin:0 auto 16px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      border:2px solid #FFD400;
      color:#FFD400;
      font-size:27px;
      font-weight:900;
    }

    .achou-message-title{
      margin:0 0 10px;
      color:#fff;
      font-size:18px;
      font-weight:900;
      letter-spacing:-.4px;
    }

    .achou-message-text{
      margin:0 auto 22px;
      max-width:290px;
      color:#999;
      font-size:10px;
      line-height:1.55;
      white-space:pre-line;
    }

    .achou-message-button{
      width:100%;
      height:44px;
      border:0;
      border-radius:9px;
      background:#FFD400;
      color:#000;
      font-size:9px;
      font-weight:950;
      cursor:pointer;
    }

    .achou-message-button:active{
      transform:scale(.98);
    }

    @media(max-width:420px){

      #achouMessageModal{
        padding:16px;
      }

      .achou-message-box{
        padding:28px 20px 21px;
        border-radius:15px;
      }

    }

  `;


  document.head.appendChild(style);

}


/* =========================================================
   CRIAR MODAL DE MENSAGEM
   ========================================================= */

function createAchouMessageModal() {

  if (
    document.getElementById(
      "achouMessageModal"
    )
  ) {

    return;

  }


  createAchouMessageStyles();


  const modal =
    document.createElement("div");


  modal.id =
    "achouMessageModal";


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  modal.innerHTML = `

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


  document.body.appendChild(modal);


  achouMessageModal =
    modal;


  achouMessageTitle =
    modal.querySelector(
      ".achou-message-title"
    );


  achouMessageText =
    modal.querySelector(
      ".achou-message-text"
    );


  achouMessageButton =
    modal.querySelector(
      ".achou-message-button"
    );


  achouMessageIcon =
    modal.querySelector(
      ".achou-message-icon"
    );


  achouMessageButton.addEventListener(
    "click",
    closeAchouMessage
  );


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        closeAchouMessage();

      }

    }
  );

}


/* =========================================================
   ABRIR MENSAGEM
   ========================================================= */

function showAchouMessage(
  title,
  message,
  type = "success",
  buttonText = "OK, ENTENDI"
) {

  createAchouMessageModal();


  if (achouMessageTitle) {

    achouMessageTitle.textContent =
      title;

  }


  if (achouMessageText) {

    achouMessageText.textContent =
      message;

  }


  if (achouMessageButton) {

    achouMessageButton.textContent =
      buttonText;

  }


  if (achouMessageIcon) {

    if (
      type === "error"
    ) {

      achouMessageIcon.textContent =
        "!";

    } else {

      achouMessageIcon.textContent =
        "✓";

    }

    achouMessageIcon.style.color =
      "#FFD400";

    achouMessageIcon.style.borderColor =
      "#FFD400";

  }


  if (achouMessageModal) {

    achouMessageModal.classList.add(
      "active"
    );

    achouMessageModal.setAttribute(
      "aria-hidden",
      "false"
    );

  }


  document.body.classList.add(
    "login-open"
  );

}


/* =========================================================
   FECHAR MENSAGEM
   ========================================================= */

function closeAchouMessage() {

  if (achouMessageModal) {

    achouMessageModal.classList.remove(
      "active"
    );

    achouMessageModal.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  document.body.classList.remove(
    "login-open"
  );

}


/* =========================================================
   ELEMENTOS DO LOGIN
   ========================================================= */

const loginButton =
  document.getElementById(
    "loginButton"
  );


const loginModal =
  document.getElementById(
    "loginModal"
  );


const loginClose =
  document.getElementById(
    "loginClose"
  );


const loginForm =
  document.getElementById(
    "loginForm"
  );


const loginEmail =
  document.getElementById(
    "loginEmail"
  );


const loginPassword =
  document.getElementById(
    "loginPassword"
  );


const createAccount =
  document.getElementById(
    "createAccount"
  );


/* =========================================================
   ELEMENTOS DO CADASTRO
   ========================================================= */

const signupModal =
  document.getElementById(
    "signupModal"
  );


const signupClose =
  document.getElementById(
    "signupClose"
  );


const signupForm =
  document.getElementById(
    "signupForm"
  );


const signupName =
  document.getElementById(
    "signupName"
  );


const signupEmail =
  document.getElementById(
    "signupEmail"
  );


const signupPassword =
  document.getElementById(
    "signupPassword"
  );


const signupPasswordConfirm =
  document.getElementById(
    "signupPasswordConfirm"
  );


const signupLogin =
  document.getElementById(
    "signupLogin"
  );


/* =========================================================
   ABRIR LOGIN
   ========================================================= */

function openLogin() {

  closeAchouMessage();


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


  setTimeout(
    () => {

      if (loginEmail) {

        loginEmail.focus();

      }

    },
    200
  );

}


/* =========================================================
   FECHAR LOGIN
   ========================================================= */

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
   ABRIR CADASTRO
   ========================================================= */

function openSignup() {

  closeAchouMessage();


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


  setTimeout(
    () => {

      if (signupName) {

        signupName.focus();

      }

    },
    200
  );

}


/* =========================================================
   FECHAR CADASTRO
   ========================================================= */

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


/* =========================================================
   BOTÃO ENTRAR / CONTA
   ========================================================= */

if (loginButton) {

  loginButton.addEventListener(
    "click",
    async event => {

      event.preventDefault();


      /* =========================
         NÃO LOGADO
      ========================= */

      if (
        loginButton.dataset.loggedIn !==
        "true"
      ) {

        openLogin();

        return;

      }


      /* =========================
         LOGADO
      ========================= */

      const confirmLogout =
        window.confirm(
          "Deseja sair da sua conta?"
        );


      if (!confirmLogout) {

        return;

      }


      if (!supabaseClient) {

        showAchouMessage(
          "Sistema indisponível",
          "Não foi possível acessar o sistema de conta agora.\n\nAtualize a página e tente novamente.",
          "error"
        );

        return;

      }


      try {

        const {
          error
        } =
          await supabaseClient.auth.signOut();


        if (error) {

          console.error(
            "Erro ao sair:",
            error
          );


          showAchouMessage(
            "Não foi possível sair",
            "Ocorreu um erro ao encerrar sua sessão.\n\nTente novamente.",
            "error"
          );

          return;

        }


        resetLoginButton();


        showAchouMessage(
          "Sessão encerrada",
          "Você saiu da sua conta do ACHOU!.",
          "success",
          "CONTINUAR"
        );


      } catch (error) {

        console.error(
          "Erro inesperado ao sair:",
          error
        );


        showAchouMessage(
          "Ocorreu um erro",
          "Não foi possível encerrar sua sessão agora.\n\nTente novamente.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   FECHAR LOGIN PELO X
   ========================================================= */

if (loginClose) {

  loginClose.addEventListener(
    "click",
    closeLogin
  );

}


/* =========================================================
   ABRIR CADASTRO
   ========================================================= */

if (createAccount) {

  createAccount.addEventListener(
    "click",
    openSignup
  );

}


/* =========================================================
   FECHAR CADASTRO PELO X
   ========================================================= */

if (signupClose) {

  signupClose.addEventListener(
    "click",
    closeSignup
  );

}


/* =========================================================
   CADASTRO → LOGIN
   ========================================================= */

if (signupLogin) {

  signupLogin.addEventListener(
    "click",
    openLogin
  );

}


/* =========================================================
   LOGIN REAL PELO SUPABASE
   ========================================================= */

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!supabaseClient) {

        showAchouMessage(
          "Sistema indisponível",
          "O sistema de login não foi carregado.\n\nAtualize a página e tente novamente.",
          "error"
        );

        return;

      }


      const email =
        loginEmail
          ? loginEmail.value.trim()
          : "";


      const password =
        loginPassword
          ? loginPassword.value
          : "";


      if (
        !email ||
        !password
      ) {

        showAchouMessage(
          "Preencha os campos",
          "Digite seu e-mail e sua senha para entrar.",
          "error"
        );

        return;

      }


      const submitButton =
        loginForm.querySelector(
          ".login-submit"
        );


      if (submitButton) {

        submitButton.disabled =
          true;

        submitButton.textContent =
          "ENTRANDO...";

      }


      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth
            .signInWithPassword({

              email:
                email,

              password:
                password

            });
