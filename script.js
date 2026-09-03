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

  /* Se pesquisou alguma coisa,
     leva até as ofertas */

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

        /*
          Por enquanto os links
          não levam para nenhuma loja.
          Evita recarregar a página.
        */

        event.preventDefault();

      }
    );

  });
