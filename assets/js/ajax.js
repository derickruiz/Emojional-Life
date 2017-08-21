const AJAX = (function () {

  let options = {
    mode: "same-origin",
    credentials: "same-origin",
    headers: {
      'Content-Type': 'application/json'
    }
  };

  function post(methodName, payload, refresh) {

    refresh = refresh || false; // Whether to refresh the page or not after this post succeeds.

    options.method = "POST";
    options.body = JSON.stringify({
      "ajaxMethod": methodName,
      "payload": payload
    });

    return fetch("/", options).then(function (response) {

      console.log("response after fetching.", response);

      response.text().then(function (s) {
        console.log("s", s);
      });
      if (refresh) {
        location.reload();
      } else {

        console.log("response after fetching.", response);
        // return response.json();
      }

    }).catch(function (error) {
      console.log("An error while doing some AJAX stuff.");
      console.log("error", error);
      return error;
    });
  }

  return {
    post: post
  };

}());

// AJAX.post();
