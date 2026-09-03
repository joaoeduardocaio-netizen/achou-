/* =========================
   ELEMENTOS
========================= */

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

const productCards = [
  ...document.querySelectorAll(".product-card")
];

const popularButtons = [
  ...document.querySelectorAll(".popular button")
];

const menuButton = document.querySelector(".menu-button");


/* =========================
   BUSCA DE PRODUTOS
========================= */

function searchProducts(term){

  const query = term.trim().toLowerCase();

  productCards.forEach(card => {

    const name = (
      card.dataset.name || ""
    ).toLowerCase();

    const matches =
      !query || name.includes(query);

    card.style.display =
      matches ? "" : "none";
  });

  if(query){

    const productList =
      document.getElementById("productList");

    if(productList){

      productList.scrollIntoView({
        behavior:"smooth",
        block:"start"
      });

    }
  }
}


/* =========================
   FORMULÁRIO DE BUSCA
========================= */

if(searchForm && searchInput){

  searchForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      searchProducts(
        searchInput.value
      );

    }
  );

}


/* =========================
   BOTÕES POPULARES
========================= */

popularButtons.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      const search =
        button.dataset.search || "";

      if(searchInput){

        searchInput.value = search;

      }

      searchProducts(search);

    }
  );

});


/* =========================
   MENU MOBILE
========================= */

if(menuButton){

  menuButton.addEventListener(
    "click",
    () => {

      const isOpen =
        menuButton.getAttribute(
          "aria-expanded"
        ) === "true";

      menuButton.setAttribute(
        "aria-expanded",
        String(!isOpen)
      );

      menuButton.classList.toggle(
        "open",
        !isOpen
      );

    }
  );

}


/* =========================
   BOTÕES DE OFERTA
========================= */

document
  .querySelectorAll(".offer")
  .forEach(link => {

    link.addEventListener(
      "click",
      event => {

        event.preventDefault();

      }
    );

  });


/* =========================
   LOGIN DO CLIENTE
========================= */

const loginButton =
  document.getElementById("loginButton");

const loginModal =
  document.getElementById("loginModal");

const loginClose =
  document.getElementById("loginClose");

const loginForm =
  document.getElementById("loginForm");

const createAccount =
  document.getElementById("createAccount");


/* =========================
   ABRIR LOGIN
========================= */

function openLogin(){

  if(!loginModal) return;

  loginModal.classList.add("active");

  loginModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "login-open"
  );

  const email =
    document.getElementById("loginEmail");

  if(email){

    setTimeout(() => {
      email.focus();
    }, 200);

  }

}


/* =========================
   FECHAR LOGIN
========================= */

function closeLogin(){

  if(!loginModal) return;

  loginModal.classList.remove("active");

  loginModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "login-open"
  );

}


/* =========================
   BOTÃO ENTRAR
========================= */

if(loginButton){

  loginButton.addEventListener(
    "click",
    event => {

      event.preventDefault();

      openLogin();

    }
  );

}


/* =========================
   BOTÃO FECHAR
========================= */

if(loginClose){

  loginClose.addEventListener(
    "click",
    closeLogin
  );

}


/* =========================
   CLICAR FORA DO LOGIN
========================= */

if(loginModal){

  loginModal.addEventListener(
    "click",
    event => {

      if(event.target === loginModal){

        closeLogin();

      }

    }
  );

}


/* =========================
   TECLA ESC
========================= */

document.addEventListener(
  "keydown",
  event => {

    if(
      event.key === "Escape" &&
      loginModal &&
      loginModal.classList.contains("active")
    ){

      closeLogin();

    }

  }
);


/* =========================
   FORMULÁRIO DE LOGIN
========================= */

if(loginForm){

  loginForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      /*
        A autenticação real será
        conectada posteriormente.

        Por enquanto apenas impedimos
        o formulário de recarregar a página.
      */

      alert(
        "O sistema de login será conectado em breve."
      );

    }
  );

}


/* =========================
   CRIAR CONTA
========================= */

if(createAccount){

  createAccount.addEventListener(
    "click",
    () => {

      alert(
        "A criação de conta será implementada na próxima etapa."
      );

    }
  );

         }
