/* Methods relating to manipulating the DOM in some way. */

console.log("Defining, dom.");

const DOM = {
  freezeScreen() {

    GLOBAL_STATE.previousScrollY = window.scrollY; // Store the old scroll position


    console.log("Calling freezeScreen");

    console.log("GLOBAL_STATE.previousScrollY", GLOBAL_STATE.previousScrollY);

    setTimeout(function () {
      console.log("Scrolling to the top.");
      window.scrollTo(0, 0); // Jump back to top for selecting emoji.
    }, 0);

    document.body.classList.remove("Ox(hidden)");
    document.body.classList.add("O(hidden)");

  },

  unfreezeScreen() {

    setTimeout(function () {
      window.scrollTo(0, GLOBAL_STATE.previousScrollY);
    }, 0);

    document.body.classList.remove("O(hidden)");
    document.body.classList.add("Ox(hidden)");
  },

  showApp() {
    let app = document.querySelector(".js-app"),
        loading = document.querySelector(".js-loading");

    app.classList.remove("hidden");
    loading.classList.add("hidden");
  },

  showError() {
    let error = document.querySelector(".js-error");
    error.classList.remove("hidden");
  },

  hideError() {
    let error = document.querySelector(".js-error");
    error.classList.add("hidden");
  }
};
