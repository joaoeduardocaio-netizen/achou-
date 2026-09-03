/* =========================================================
   ACHOU! - SCRIPT PRINCIPAL
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
    "Supabase não foi carregado. Verifique o script do CDN no index.html."
  );

}


/* =========================================================
   ELEMENTOS
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

  let found = 0;

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

      found++;

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
   MENU
   ========================================================= */

const menuToggle =
  document.querySelector(
    ".menu-toggle"
  );

const menu =
  document.querySelector(
    ".nav-menu"
  ) ||
  document.querySelector(
    ".mobile-menu"
  ) ||
  document.querySelector(
    "header nav"
  );


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
   LOGIN
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
   CADASTRO
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
   BOTÃO ENTRAR
   ========================================================= */

if (loginButton) {

  loginButton.addEventListener(
    "click",
    event => {

      event.preventDefault();

      openLogin();

    }
  );

}


/* =========================================================
   FECHAR LOGIN PELO X
   ========================================================= */

if (loginClose) {

  loginClose.addEventListener(
    "click",
    () => {

      closeLogin();

    }
  );

}


/* =========================================================
   ABRIR CADASTRO
   ========================================================= */

if (createAccount) {

  createAccount.addEventListener(
    "click",
    () => {

      openSignup();

    }
  );

}


/* =========================================================
   FECHAR CADASTRO PELO X
   ========================================================= */

if (signupClose) {

  signupClose.addEventListener(
    "click",
    () => {

      closeSignup();

    }
  );

}


/* =========================================================
   CADASTRO → LOGIN
   ========================================================= */

if (signupLogin) {

  signupLogin.addEventListener(
    "click",
    () => {

      openLogin();

    }
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

        alert(
          "O sistema de login não foi carregado. Atualize a página e tente novamente."
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


      if (!email || !password) {

        alert(
          "Digite seu e-mail e sua senha."
        );

        return;

      }


      const submitButton =
        loginForm.querySelector(
          ".login-submit"
        );


      if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
          "ENTRANDO...";

      }


      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

          });


        if (error) {

          console.error(
            "Erro no login:",
            error
          );


          const message =
            String(
              error.message || ""
            ).toLowerCase();


          if (
            message.includes(
              "email not confirmed"
            )
          ) {

            alert(
              "Seu e-mail ainda não foi confirmado. Confira sua caixa de entrada e confirme o cadastro."
            );

          } else {

            alert(
              "E-mail ou senha incorretos."
            );

          }


          return;

        }


        if (
          data &&
          data.session
        ) {

          closeLogin();

          alert(
            "Login realizado com sucesso!"
          );

        } else {

          alert(
            "Não foi possível iniciar sua sessão. Tente novamente."
          );

        }

      } catch (error) {

        console.error(
          "Erro inesperado no login:",
          error
        );

        alert(
          "Ocorreu um erro ao tentar entrar. Tente novamente."
        );

      } finally {

        if (submitButton) {

          submitButton.disabled = false;

          submitButton.textContent =
            "ENTRAR";

        }

      }

    }
  );

}


/* =========================================================
   CADASTRO REAL PELO SUPABASE
   ========================================================= */

if (signupForm) {

  signupForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!supabaseClient) {

        alert(
          "O sistema de cadastro não foi carregado. Atualize a página e tente novamente."
        );

        return;

      }


      const name =
        signupName
          ? signupName.value.trim()
          : "";

      const email =
        signupEmail
          ? signupEmail.value.trim()
          : "";

      const password =
        signupPassword
          ? signupPassword.value
          : "";

      const passwordConfirm =
        signupPasswordConfirm
          ? signupPasswordConfirm.value
          : "";


      if (!name) {

        alert(
          "Digite seu nome completo."
        );

        return;

      }


      if (!email) {

        alert(
          "Digite seu e-mail."
        );

        return;

      }


      if (password.length < 6) {

        alert(
          "A senha precisa ter pelo menos 6 caracteres."
        );

        return;

      }


      if (
        password !==
        passwordConfirm
      ) {

        alert(
          "As senhas não são iguais."
        );

        return;

      }


      const submitButton =
        signupForm.querySelector(
          ".signup-submit"
        );


      if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
          "CRIANDO...";

      }


      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {

              data: {

                full_name: name

              },

              emailRedirectTo:
                "https://joaoeduardocaio-netizen.github.io/achou-/"

            }

          });


        if (error) {

          console.error(
            "Erro no cadastro:",
            error
          );


          alert(
            "Não foi possível criar sua conta.\n\n" +
            error.message
          );

          return;

        }


        closeSignup();


        if (
          data &&
          data.session
        ) {

          alert(
            "Conta criada com sucesso!"
          );

        } else {

          alert(
            "Conta criada com sucesso!\n\n" +
            "Enviamos um e-mail para confirmar seu cadastro. " +
            "Abra seu e-mail e clique no link de confirmação antes de fazer login."
          );

        }


        signupForm.reset();

      } catch (error) {

        console.error(
          "Erro inesperado no cadastro:",
          error
        );

        alert(
          "Ocorreu um erro ao criar sua conta. Tente novamente."
        );

      } finally {

        if (submitButton) {

          submitButton.disabled = false;

          submitButton.textContent =
            "CRIAR CONTA";

        }

      }

    }
  );

}


/* =========================================================
   CLICAR FORA DO LOGIN
   ========================================================= */

if (loginModal) {

  loginModal.addEventListener(
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

}


/* =========================================================
   CLICAR FORA DO CADASTRO
   ========================================================= */

if (signupModal) {

  signupModal.addEventListener(
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

}


/* =========================================================
   TECLA ESC
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !==
      "Escape"
    ) {

      return;

    }


    if (
      loginModal &&
      loginModal.classList.contains(
        "active"
      )
    ) {

      closeLogin();

    }


    if (
      signupModal &&
      signupModal.classList.contains(
        "active"
      )
    ) {

      closeSignup();

    }

  }
);


/* =========================================================
   VERIFICAR SESSÃO ATUAL
   ========================================================= */

if (supabaseClient) {

  supabaseClient.auth.getSession()
    .then(
      ({ data, error }) => {

        if (error) {

          console.error(
            "Erro ao verificar sessão:",
            error
          );

          return;

        }


        if (
          data &&
          data.session
        ) {

          console.log(
            "Usuário já está autenticado:",
            data.session.user.email
          );

        }

      }
    );


  supabaseClient.auth.onAuthStateChange(
    (event, session) => {

      console.log(
        "Estado da autenticação:",
        event
      );


      if (
        event ===
        "SIGNED_OUT"
      ) {

        console.log(
          "Usuário saiu da conta."
        );

      }

    }
  );

}


/* =========================================================
   FIM DO SCRIPT
   ========================================================= */
