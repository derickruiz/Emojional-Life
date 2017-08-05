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
  },

  comparer: function (otherArray, key) {
    return function(current) {
      return otherArray.filter(function (other) {
        return other[key] === current[key]
      }).length === 0;
    }
  }

};

const DB = {

  // GETTERS
  getUserEmojions: function (callback) {
    firebase.auth().signInAnonymously().then(function (user) {
      firebase.database().ref('user_emojions/' + user.uid).once('value', function(snapshot) {

          if (snapshot.exists()) {
            callback(UTILS.toArray(snapshot.val().emojions));
          } else {
            DB.getAndSetDefaultEmojis(callback);
          }

        });
    });
  },

  /*
   * @description: Sets the default emojis to a user and passes them to the callback.
   */
  getAndSetDefaultEmojis: function (callback) {

    firebase.auth().signInAnonymously().then(function (user) {
      DB.getEmojions(8, function (emojions) {
        let data = {
          emojions: emojions,
          time: firebase.database.ServerValue.TIMESTAMP
        };

        // Go ahead and save the data as is.
        const entry = firebase.database().ref("user_emojions/" + user.uid).set(data);

        callback(emojions);

      });
    });
  },

  getAllEmojionsExceptUsers: function (callback) {

    DB.getUserEmojions(function (userEmojions) {
      DB.getEmojions(null, function (allEmojions) {
        let allEmojionsNotUsers = allEmojions.filter(UTILS.comparer(userEmojions, "emoji"));
        callback(allEmojionsNotUsers);
      });

    });

  },

  getEmojions: function (limit, callback) {

    if (limit) {
      firebase.database().ref('emojions').limitToFirst(limit).once('value').then(
        function(snapshot) {
          const emojions = snapshot.val();
          callback(emojions);
        });
    } else {
      firebase.database().ref('emojions').once('value').then(
        function(snapshot) {
          const emojions = snapshot.val();
          callback(emojions);
        });
    }
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

const Emojion = {
  template: "#emojion_template",
  data: function () {
    return {
      isSelectingEmoji: false,
      selectedEmoji: this.emoji
    };
  },
  props: {

    index: {
      type: Number,
      required: true
    },

    color: {
      type: String,
      required: true
    },

    emoji: {
      type: String,
      required: true
    },

    notUserEmojions: {
      type: Array,
      required: true
    }
  },

  mounted: function () {

    let toucher = new Hammer(this.$el);

    toucher.on('press', (ev) => {

      this.isSelectingEmoji = !this.isSelectingEmoji;

      console.log("this.isSelectingEmoji", this.isSelectingEmoji);

      this.turnOnOffCarousel();

    });
  },

  methods: {
    setEmoji: function(emoji) {
      console.log("What's the emoji?", emoji);
      this.selectedEmoji = emoji;
    },
    emojionToSelect: function (emoji) {

      this.emojiToSelect = emoji;

    },

    turnOnOffCarousel: function () {
      if ( ! this.isSelectingEmoji) {
        this.$emit('turn-off-carousel', this.index, this.emojiToSelect);
      } else {
        this.$emit('turn-on-carousel', this.index);
      }
    }
  }
};

const EmojionCarousel = {
  template: "#emojion_carousel_template",
  props: {
    emojions: {
      type: Array,
      required: true
    }
  },
  mounted: function () {
    let flickity = new Flickity(this.$el, {
      showDots: false
    });
    document.querySelector(".flickity-viewport").style.height = "100%";

    this.$el.flickity = flickity; // Add it as a reference here for later.

    // vanilla JS
    flickity.on('select', () => {
      this.$emit('select-emoji', flickity.selectedElement.innerHTML);
    });

  }
};

Vue.component('emojion', Emojion);
Vue.component('emojion-carousel', EmojionCarousel);

const App = new Vue({
  el: "#app",

  data: {

    /* Booleans */
    shouldShowEmoji: true,
    isResting: false,

    /* Data from server to populate. */
    entries: undefined,
    emojions: undefined,
    notUserEmojions: [],
    emptyTracking: undefined,

    /* UI-only variables. */
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

    // Get the user's emojions and show the app.
    DB.getUserEmojions((emojions) => {
      this.emojions = emojions;
      DOM.showApp();
    });

    // Get all the other emojions in case the user wants to switch.
    DB.getAllEmojionsExceptUsers((emojions) => {
      this.notUserEmojions = emojions;
    });

    // Get the empty tracking emoji
    DB.getEmptyTracking().then((emptyTracking) => {
      this.emptyTracking = emptyTracking;
    });

    // Get entries if any exist.
    DB.getEntries((entries) => {
      this.entries = entries;
    });

    getRestingState.call(this);

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

    turnOnCarousel: function (index) {
      console.log("this.$refs", this.$refs);
      console.log("Turning on the carousel.");

      for (let i = 0; i < this.$refs.emojions.length; i += 1) {

        if (i !== index) {
          // Probably not best practice, but turns off the carousel at least.
          this.$refs.emojions[i].isSelectingEmoji = false;

        }
      }

    },

    turnOffCarousel: function (emojionSelectorIndex, emoji) {
      this.emojions[emojionSelectorIndex].emoji = emoji.replace(/^\s+|\s+$/g, '');
      this.$forceUpdate();
    },

    /* Methods that make calls to the server. */
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
