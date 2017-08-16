const AJAX = (function () {

  let options = {
    mode: "same-origin",
    credentials: "same-origin",
    headers: {
      'Content-Type': 'application/json'
    }
  };

  function post(methodName, payloasd) {
    options.method = "GET";
    options.body = JSON.stringify({
      "ajaxMethod": methodName,
      "payload": payload
    });

    return fetch(options);
  }

  return {
    post: post
  };

}());

// AJAX.post();
