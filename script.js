const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const productCards = [...document.querySelectorAll(".product-card")];
const popularButtons = document.querySelectorAll(".popular button");
const menuButton = document.querySelector(".menu-button");

function searchProducts(term){
  const query = term.trim().toLowerCase();
  productCards.forEach(card => {
    const name = card.dataset.name.toLowerCase();
    card.style.display = !query || name.includes(query) ? "" : "none";
  });
  if (query) {
    document.getElementById("productList").scrollIntoView({behavior:"smooth", block:"start"});
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchProducts(searchInput.value);
});

popularButtons.forEach(button => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.search;
    searchProducts(button.dataset.search);
  });
});

menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  menuButton.classList.toggle("open", !open);
});

document.querySelectorAll(".offer").forEach(link => {
  link.addEventListener("click", event => event.preventDefault());
});
