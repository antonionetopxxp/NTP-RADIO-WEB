<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Login | NTP RADIO OS</title>

  <link rel="stylesheet" href="style.css">
</head>

<body class="login-page">

  <main class="login-container">

    <div class="login-logo">
      NTP
    </div>

    <h1>NTP RADIO OS</h1>

    <p class="login-subtitle">
      Área administrativa
    </p>

    <form id="loginForm">

      <div class="login-field">

        <label for="username">
          Usuário
        </label>

        <input
          id="username"
          type="text"
          autocomplete="username"
          placeholder="Digite seu usuário"
          required
        >

      </div>

      <div class="login-field">

        <label for="password">
          Senha
        </label>

        <input
          id="password"
          type="password"
          autocomplete="current-password"
          placeholder="Digite sua senha"
          required
        >

      </div>

      <button
        type="submit"
        class="login-button"
      >
        Entrar no painel
      </button>

      <p
        id="loginError"
        class="login-error"
      ></p>

    </form>

    <a
      href="../index.html"
      class="back-site"
    >
      ← Voltar para a rádio
    </a>

  </main>

  <script src="login.js"></script>

</body>
</html>
