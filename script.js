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

       
