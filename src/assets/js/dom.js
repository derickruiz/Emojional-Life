/* Methods relating to manipulating the DOM in some way. */
const DOM = {
  freezeScreen() {

    GLOBAL_STATE.previousScrollY = window.scrollY; // Store the old scroll position

    setTimeout(function () {
      window.scrollTo(0, 0); // Jump back to top for selecting emoji.
    }, 0);

    document.body.classList.add("O(hidden)");

  },

  unfreezeScreen() {

    setTimeout(function () {
      window.scrollTo(0, GLOBAL_STATE.previousScrollY);
    }, 0);

    document.body.classList.remove("O(hidden)");

  },

  showApp() {
    let app = document.querySelector(".js-app"),
        loading = document.querySelector(".js-loading");

    app.classList.remove("hidden");
    loading.classList.add("hidden");
  }
};
