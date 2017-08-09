var AJAX = (function() {

  function doFetch(method, url, body) {
    var options = {
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: method
    };

    if (typeof body != 'undefinded' && body != null) {
      options.body = JSON.stringify(body);
    }

    return window.fetch(url, options);
  }

  return {
    get: function(url) {
      return doFetch('GET', url);
    },
    put: function(url, body) {
      return doFetch('PUT', url, body);
    },
    post: function(url, body) {
      return doFetch('POST', url, body);
    },
    delete: function(url) {
      return doFetch('DELETE', url);
    }
  };
}());
