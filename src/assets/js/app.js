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

// Modules
const EmojionalLife = new Vue({
  el: "#app",
  data: {
    shouldShowEmoji: true,
    entries: undefined,
    emojions: undefined,
    emptyTracking: undefined,
    isResting: false,
    elapsedTime: undefined
  },

  created: function () {

    function getRestingState() {
      DB.getResting((restingInterval) => {

        this.isResting = restingInterval.isResting

        if (restingInterval.isResting) {

          this.toggleEmoji(false);
          window.scrollTo(0, document.body.scrollHeight);

          const intervalId = setInterval(() => {

            const a = moment(new Date(Date.now())),
                  b = moment(new Date(restingInterval.lastEntry)),
                  diff = a.diff(b, 'seconds'); // 86400000

            this.elapsedTime = 60 - diff;

            console.log("diff", diff);

            if (diff >= 60) {
              clearInterval(intervalId);
              getRestingState.call(this);
            }

          }, 1000);
        }
      });

    }

    getRestingState.call(this);

    // Get the initial emojions
    DB.getEmojions().then((emojions) => {
      console.log("Got the emojions!");
      console.log("emotions", emojions);

      DOM.showApp();

      this.emojions = emojions;
    });

    // Get the empty tracking emoji
    DB.getEmptyTracking().then((emptyTracking) => {
      this.emptyTracking = emptyTracking;
    });

    // Get entries if any exist.
    DB.getEntries((entries) => {
      this.entries = entries;
    });

  },

  updated: function () {

    // if (this.$el.childNodes.length === 0) {
    //   return;
    // } else {
    //   const toucher = new Hammer(this.$el.querySelector(".js-toucher"));
    //
    //   toucher.on('swipeleft', (ev) => {
    //     this.toggleEmoji(false);
    //   });
    //
    //   toucher.on('swiperight', (ev) => {
    //     this.toggleEmoji(true);
    //   });
    // }

  },

  methods: {

    /*
     * @description: Whether to show the Emoji page or the Tracking page
     * Toggles by default but if passed in a value goes to that value
     * @param bool:Boolean - the state to toggle it to.
     * @use - Being used with click event */
    toggleEmoji: function (bool) {

      if (typeof bool !== "undefined") {
        this.shouldShowEmoji = bool;
      } else {
        this.shouldShowEmoji = !this.shouldShowEmoji;
      }

      if (this.shouldShowEmoji) {
        DOM.freezeScreen();
      } else {
        DOM.unfreezeScreen();
      }
    },

    /*
     * @converts the entries time into a more readable format.
     */

    convertTime: function (unixTime) {
      return UTILS.convertUnixTimeToPMAM(unixTime);
    },

    /*
     * @description: Puts a new entry into tracking
     * @use - Called from click event.
     */
    trackEntry: function (emojion) {
      DB.trackEntry(emojion, function (entry) {

        entry.then(function () {
          DB.limitEntry();
        }).catch(function () {
          console.log("Couldn't successfully write.");
        });

      });
    }
  }
});
