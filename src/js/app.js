// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyD_Lna7XxvzEXr-JxqrJJoEXGA5PA48ivk",
  authDomain: "emojional-life.firebaseapp.com",
  databaseURL: "https://emojional-life.firebaseio.com",
  projectId: "emojional-life",
  storageBucket: "emojional-life.appspot.com",
  messagingSenderId: "888518070529"
});

// Go ahead and sign the user in anonymously as quickly as possible.
firebase.auth().signInAnonymously();

// Ask for position right away.
if (typeof window.navigator.geolocation !== "undefined" && window.navigator.geolocation) {
  window.navigator.geolocation.getCurrentPosition(function (position) {
    UTILS.POSITION = position;
  });
}

let GLOBAL_STATE = {
  previousScrollY: undefined,
};

const CONSTS = {
  googleMapsURL(latitude, longitude) {
    return `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&sensor=true`;
  }
};
const UTILS = {

  /*
   * @description - Takes a firebase object in the form of { "ao49ds": { } } and converts into array of objects with ".key" property. */
  toArray(object) {

    let array = [];

    for (let prop in object) {
      object[prop][".key"] = prop;
      array.push(object[prop]);
    }

    return array;

  },

  convertUnixTimeToPMAM(unixTime) {

    function formatAMPM(date) {
      var hours = date.getHours(),
          minutes = date.getMinutes(),
          ampm = hours >= 12 ? 'pm' : 'am',
          strTime = undefined;

      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0'+minutes : minutes;

      strTime = hours + ':' + minutes + ' ' + ampm;
      return strTime;
    }

    return formatAMPM(new Date(unixTime));

  },

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

  get(URL, callback) {
    var request = new XMLHttpRequest();

    request.addEventListener("load", callback);
    request.open("GET", URL);
    request.send();

  },

  /*
   * @description - Iterating over a Google Maps API Response from Long and Lat. to find a place name.
   * @return String
   */
  getAddress(response) {

    let address = "";

    if (response.results.length) {

      response.results[0]["address_components"].forEach(function (addressComponent) {

        if (addressComponent.types.includes("sublocality")) {
          address += addressComponent.long_name + ", ";
        }

        if (addressComponent.types.includes("locality")) {
          address += addressComponent.long_name
        }
      });
    }

    return address;
  }
};

const DB = {

  // GETTERS
  getEmojions: function () {
    return firebase.database().ref('emojions').once('value').then(
      function(snapshot) {
        const emojions = snapshot.val();
        return emojions;
      });
  },

  getEntries: function (callback) {
    return firebase.auth().signInAnonymously().then(function (user) {
      return firebase.database().ref('entries/' + user.uid).on('value', function(snapshot) {
          const entries = snapshot.val();
          callback(UTILS.toArray(entries));
        });
    });
  },

  getEmptyTracking: function () {
    return firebase.database().ref('emptyTracking').once('value').then(
      function (snapshot) {
        const emptyTracking = snapshot.val();
        return emptyTracking;
    });
  },

  // SETTERS
  trackEntry: function (emojion, callback) {
    return firebase.auth().signInAnonymously().then(function (user) {

      let data = {
        emoji: emojion.emoji,
        time: firebase.database.ServerValue.TIMESTAMP,
        color: emojion.color
      };

      // Go ahead and save the data as is.
      const entry = firebase.database().ref("entries/" + user.uid).push();

      callback(entry.set(data));

      // But if we have position data, then get that and add it to the entries later.
      if (typeof UTILS.POSITION !== "undefined") {
        var latitude = UTILS.POSITION.coords.latitude,
            longitude = UTILS.POSITION.coords.longitude;

        UTILS.get(CONSTS.googleMapsURL(latitude, longitude), function (event) {

          let response = undefined;
          let address = undefined;

          try {
            response = JSON.parse(this.responseText);
          } catch (e) {
            console.log("Caught!");
            console.log(e);
          }

          address = UTILS.getAddress(response);

          // Set the entry again with the address in place.
          entry.update({
            "address": address
          });

        });
      }

    });
  },

  limitEntry() {
    firebase.auth().signInAnonymously().then(function (user) {

      // Set time for the last entry as now.
      firebase.database().ref("entry_time_limits").child(user.uid).set({
        "last_entry": firebase.database.ServerValue.TIMESTAMP
      });

    });
  },

  getResting(callback) {

    const ONE_MINUTE = 60000;

    firebase.auth().signInAnonymously().then(function (user) {

      // Set time for the last entry as now.
      firebase.database().ref("entry_time_limits/" + user.uid).on("value", function (snapshot) {

        let val = snapshot.val();

        if (val === null) {
          callback({
            isResting: false
          });
        } else {

          let lastEntry = new Date(val.last_entry);
          let now = Date.now();

          if ((now - lastEntry) < ONE_MINUTE) {
            callback({
              lastEntry: lastEntry,
              isResting: true
            });
          } else {
            callback({
              isResting: false
            });
          }
        }
      });

    });

  }
};
