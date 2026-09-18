<script>
  document
    .getElementById("logoutButton")
    .addEventListener("click", function () {

      sessionStorage.removeItem(
        "ntp_admin_logged"
      );

      window.location.href =
        "index.html";

    });
</script>
