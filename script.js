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
   LOGIN
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
   CADASTRO
========================= */

const signupModal =
  document.getElementById("signupModal");

const signupClose =
  document.getElementById("signupClose");

const signupForm =
  document.getElementById("signupForm");

const signupLogin =
  document.getElementById("signupLogin");


/* =========================
   ABRIR LOGIN
========================= */

function openLogin(){

  if(!loginModal) return;


  if(signupModal){

    signupModal.classList.remove("active");

    signupModal.setAttribute(
      "aria-hidden",
      "true"
    );

  }


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
   ABRIR CADASTRO
========================= */

function openSignup(){

  if(!signupModal) return;


  if(loginModal){

    loginModal.classList.remove("active");

    loginModal.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  signupModal.classList.add("active");

  signupModal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "login-open"
  );


  const name =
    document.getElementById("signupName");


  if(name){

    setTimeout(() => {

      name.focus();

    }, 200);

  }

}


/* =========================
   FECHAR CADASTRO
========================= */

function closeSignup(){

  if(!signupModal) return;


  signupModal.classList.remove("active");

  signupModal.setAttribute(
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
   FECHAR LOGIN
========================= */

if(loginClose){

  loginClose.addEventListener(
    "click",
    closeLogin
  );

}


/* =========================
   LOGIN → CADASTRO
========================= */

if(createAccount){

  createAccount.addEventListener(
    "click",
    () => {

      openSignup();

    }
  );

}


/* =========================
   FECHAR CADASTRO
========================= */

if(signupClose){

  signupClose.addEventListener(
    "click",
    closeSignup
  );

}


/* =========================
   CADASTRO → LOGIN
========================= */

if(signupLogin){

  signupLogin.addEventListener(
    "click",
    () => {

      openLogin();

    }
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
   CLICAR FORA DO CADASTRO
========================= */

if(signupModal){

  signupModal.addEventListener(
    "click",
    event => {

      if(event.target === signupModal){

        closeSignup();

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

    if(event.key !== "Escape"){
      return;
    }


    if(
      loginModal &&
      loginModal.classList.contains("active")
    ){

      closeLogin();

    }


    if(
      signupModal &&
     
