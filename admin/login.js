const loginForm =
  document.getElementById("loginForm");

const loginError =
  document.getElementById("loginError");


loginForm.addEventListener(
  "submit",
  function(event) {

    event.preventDefault();

    const username =
      document
        .getElementById("username")
        .value
        .trim();

    const password =
      document
        .getElementById("password")
        .value;


    /*
      LOGIN TEMPORÁRIO

      Esta etapa serve apenas para
      estruturar o painel.

      NÃO use esta senha em produção.
    */

    if (
      username === "admin" &&
      password === "ntp123"
    ) {

      sessionStorage.setItem(
        "ntp_admin_logged",
        "true"
      );

      window.location.href =
        "dashboard.html";

      return;
    }


    loginError.textContent =
      "Usuário ou senha incorretos.";

  }
);
