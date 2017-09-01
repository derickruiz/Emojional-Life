"use strict";

var AJAX = function () {

  var options = {
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

      // console.log("response after fetching.", response);
      //
      // response.text().then(function (s) {
      //   console.log("s");
      // });
      if (refresh) {
        location.reload();
      } else {
        //console.log("response after fetching.", response);
        return response.json();
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
}();

// AJAX.post();
'use strict';

var App = new Vue({
  el: "#app",

  data: {

    /* Booleans */
    shouldShowEmoji: true, /* Whether to show the Emoji page or the Tracking page. */
    canSwitchEmoji: false, /* Whether the user can go ahead and start switching emoji by pressing and changing with caorusel */
    shouldLogin: false, /* Whether to show the Login form or not. */
    shouldSignUp: false, /* Whether to show the sign up form or not. */
    isLoggedIn: false,
    isShowingAllEntries: false,

    /* Whether the user has any entries at all (any days). Used for showing the empty state in the entries screen. */
    hasEntries: false,
    hasTodayEntries: false, /* Whether the user has any entries today. */

    /*
     * @description: Whether to try and get the geolocation directly when tracking an entry
     * without first providing the user with an notification to give permission. */
    getLocationDirectly: false,

    /*
     * @description: Whether or not to show the notification that asks the user for permissions
     * to give their location
     */
    showLocationNotification: false,

    /* Whether or not to show tooltips related to each action. */
    tooltips: {
      tap: false,
      write: false,
      press: false
    },

    /* Data from server to populate. */
    entries: [], /* The notes */
    entriesToShow: undefined, /* Shows the last two inputted notes for the day. */
    emojions: undefined, /* The emojis. */
    currentDay: undefined, /* For saving notes into the right place in the database. */
    previousDayCharts: undefined, /* The charts for the previous days */
    notUserEmojions: [], /* The list of emojis that are currently not in the user's 8. */
    emptyTracking: undefined, /* Not sure? */

    /*
     * @description - What will eventually be populated with the user's location if they give permission.
     */
    userPosition: undefined,

    /* UI-only variables. */
    elapsedTime: undefined,
    emojionBlockColors: ['blue', 'red', 'purple', 'orange', 'green', 'black', 'brown', 'pink'],

    // Username and password that the user will sign up with.
    signUpEmail: "",
    signUpPassword: "",
    loginEmail: "",
    loginPassword: "",
    confirmPassword: "",
    signUpLoginError: undefined
  },

  created: function created() {
    var _this = this;

    DB.getUserEmojions(function (emojions) {
      console.log("user emojions", emojions);
      _this.emojions = emojions;
    });

    DB.getNotUserEmojions(function (emojions) {
      console.log("this.notUserEmojions", emojions);
      _this.notUserEmojions = emojions;
    });

    DOM.showApp();

    this.shouldShowEmoji = true;

    DOM.freezeScreen();

    this.canSwitchEmoji = true;

    this.isLoggedIn = GLOBAL_STATE.isLoggedIn;
    console.log("this.isLoggedIn", this.isLoggedIn);

    // What is data that I need immeditely to get the app working right away?
    // The emotions and the tap.

    // Get the user's emojions and show the app.
    // DB.getUserEmojions((emojions) => {
    //   console.log("getUserEmojions");
    //
    //   this.emojions = emojions;
    //   DOM.showApp();
    //
    //   DB.getAllEmojionsExceptUsers((notUserEmojions) => {
    //     this.canSwitchEmoji = true;
    //     this.notUserEmojions = notUserEmojions
    //   });
    //
    // });

    // // Get entries if any exist.
    // DB.getTodaysEntries((entries) => {
    //   console.log("Getting the entries for today.");
    //   this.entries = entries;
    //   let entriesCopy = this.entries.slice();
    //   this.entriesToShow = entriesCopy.splice(entriesCopy.length - 2, entriesCopy.length);
    //
    //   if (this.entries.length >= 1) {
    //     this.hasEntries = true;
    //   }
    // });

    DB.getTodaysEntries(function (entries) {
      console.log("Get today's entries");
      console.log("entries", entries);
      _this.entries = entries;

      if (_this.entries && _this.entries.length >= 1) {
        _this.hasTodayEntries = true;
        _this.hasEntries = true;
      }

      console.log("this.hasEntries", _this.hasEntries);
    });

    DB.getPreviousDayCharts(function (charts) {
      console.log("What's charts?", charts);

      if (charts && Object.keys(charts).length >= 1) {
        _this.hasEntries = true;
        _this.previousDayCharts = charts;
      }
    });

    /*
     * @description - Shows the right tooltips to new users based on the state of the app.
     */

    DB.getTooltips(function (tooltips) {
      console.log("DB.getTooltips");
      console.log("tooltips", tooltips);
      _this.tooltips = tooltips;
    });

    DB.getUserLocationPermissions(function (permissionObj) {
      console.log("Getting the user location permissions.");
      console.log("permissionObj", permissionObj);

      /* possible values are { permission: 'granted', 'pending', or 'denied' } */

      if (permissionObj.permission === "granted") {
        _this.getLocationDirectly = true;
      }

      if (permissionObj.permission === "pending") {
        _this.showLocationNotification = true;
        // Show the notification to get the user to accept or decline permissions.
      }

      if (permissionObj.permission === "denied") {
        // The user explicitly denied after clicking "Add location." on the notification.
        // Not sure about what to do here yet, but don't do anything for now.
      }

      console.log("this.showLocationNotification", _this.showLocationNotification);

      _this.$forceUpdate();
    });

    DB.getSignUpLoginErrors(function (errorObj) {

      console.log("What's the errorObj?", errorObj);

      if (errorObj != null) {
        // do something?

        _this.signUpLoginError = errorObj.message;

        if (errorObj.for === "register") {
          _this.shouldSignUp = true;
          _this.shouldLogin = false;
        }

        if (errorObj.for === "login") {
          _this.shouldLogin = true;
          _this.shouldSignUp = false;
        }
      }
    });
  },

  methods: {

    /*
     * @description - Shows the correct message in the patterns view depending on the state of the app.
     * @return String - The message */
    getPatternsMessage: function getPatternsMessage() {

      if (this.entries == null) {
        return CONSTS.NEW_USER.empty;
      }

      if (this.entries.length === 1) {
        return CONSTS.NEW_USER.first;
      }

      return CONSTS.RETURNING_USER.patternsMessage;
    },

    /*
     * @description: Whether to show the Emoji page or the Tracking page
     * Toggles by default but if passed in a value goes to that value
     * @param bool:Boolean - the state to toggle it to.
     * @use - Being used with click event */
    toggleEmoji: function toggleEmoji(bool) {

      console.log("toggleEmoji");

      if (typeof bool !== "undefined" && this.shouldShowEmoji === bool) {
        console.log("Gonna return");
        return;
      }

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

    /* Event Callbacks */

    /*
     * @description: Gets called whenever the user presses and holds an emojion block.
     * Ensures that only one carousel is on at a time.
     * @param index:Number - The index of the emojion block
     * @return Void
     */
    turnOnCarousel: function turnOnCarousel(index) {
      console.log("App.turnOnCaorusel");
      console.log("index", index);
      console.log("this.$refs.emojions", this.$refs.emojions);

      for (var i = 0; i < this.$refs.emojions.length; i += 1) {
        if (i !== index) {
          // Probably not best practice, but turns off the carousel at least.

          if (this.$refs.emojions[i].isChangingEmoji) {
            console.log("Going to turn this thing off.");
            this.$refs.emojions[i].isChangingEmoji = false;
            this.$refs.emojions[i].turnOnOffCarousel();
          }
        }
      }
    },

    /*
     * @description - Gets called whenever a carousel is turned off. Makes an API request to save the new emoji
     * @param emojionSelectorIndex:Number - the index of the emojiblock on the page
     * @param emojiIndex:Number - the index of the emoji in the database.
     * @param emoji:String - The emoji character
     * @return Void
     */
    turnOffCarousel: function turnOffCarousel(emojionSelectorIndex, emojionToChangeTo, emojionToChangeToIndex) {
      var _this2 = this;

      // console.log("turnOffCarousel");
      // console.log("emojionSelectorIndex", emojionSelectorIndex);
      // console.log("emojion", emojionToChangeTo);
      // console.log('emojionToChangeToIndex', emojionToChangeToIndex);
      // console.log("this.entries[emojionSelectorIndex]", this.emojions[emojionSelectorIndex]);
      // console.log("this.notUserEmojions[emojionToChangeToIndex]", this.notUserEmojions[emojionToChangeToIndex]);

      this.notUserEmojions[emojionToChangeToIndex] = this.emojions[emojionSelectorIndex];
      this.emojions[emojionSelectorIndex] = emojionToChangeTo;
      //
      // console.log("this.emojions", this.emojions);
      // console.log("this.notUserEmojions", this.notUserEmojions);

      DB.saveUserEmojions(this.emojions);
      DB.saveNotUserEmojions(this.notUserEmojions);

      // Can probably be sure that this is the first time the user is doing this.
      console.log("this.tooltips", this.tooltips);

      DB.recordTooltip('press', function (tooltips) {
        _this2.tooltips = tooltips;
      });

      // // Update the UI
      // let previousEmojion = this.emojions[emojionSelectorIndex];
      // this.emojions[emojionSelectorIndex] = emojion;
      //
      // // Remove the old emoji from the list and put the old one in there instead.
      // UTILS.replaceAtIndex(this.notUserEmojions, UTILS.getIndex(this.notUserEmojions, emojion), previousEmojion);
      //
      // // Make Ajax call to update user preferences
      // // If pass keep it that way,
      // // else revert the UI.
      //
      // DB.saveUserEmojions(this.emojions, function () {
      //   console.log("Saved the user's preferences.");
      // });

      this.$forceUpdate();
    },

    toggleEntriesForDay: function toggleEntriesForDay() {

      this.isShowingAllEntries = !this.isShowingAllEntries;

      if (this.isShowingAllEntries) {
        this.entriesToShow = this.entries;
      } else {

        var entriesCopy = this.entries.slice();
        this.entriesToShow = entriesCopy.splice(entriesCopy.length - 2, entriesCopy.length);
      }
    },

    /* Methods that make calls to the server. */
    /*
     * @description: Puts a new entry into tracking
     * @use - Called from click event.
     */
    trackEntry: function trackEntry(emojion, color, textColor, question) {
      var _this3 = this;

      console.log("Tracking the entry.");

      var self = this;

      emojion["time"] = new Date().getTime();

      var entryIndex = undefined;

      console.log("emojion", emojion);
      console.log("color", color);

      DB.trackEntry(emojion, color, textColor, question, function (newEntries) {

        console.log("Tracking an entry.");
        console.log("newEntries", newEntries);

        _this3.entries = newEntries;
        _this3.toggleEmoji(false); // Move user to patterns page after tapping an emotion.

        if (_this3.entries && _this3.entries.length >= 1) {
          _this3.hasTodayEntries = true;
          _this3.hasEntries = true;
        }

        var entryIndex = _this3.entries.length - 1;
        var entry = _this3.entries[entryIndex];

        console.log('Gonna get user location permissions.');

        DB.getUserLocationPermissions(function (permissionObj) {
          if (permissionObj.permission === "granted") {

            // Show a loading icon "Earth emoji" on the entry.

            // Make an ajax request to save the location data.
            window.navigator.geolocation.getCurrentPosition(function (position) {
              console.log('position', position);
              DB.saveLocationToEntry(entryIndex, entry, position, function (entries) {
                console.log("Saved the location to the entry.");

                self.entries = entries;
                // Why is it not updating?
                self.$forceUpdate();
              });
            });
          }
        });
      });

      DB.recordTooltip('tap', function (tooltips) {
        _this3.tooltips = tooltips;
      });
    },

    /*
     * @description - Just some logic for saving the user. */
    signUpUser: function signUpUser() {
      if (this.signUpEmail !== "" && this.signUpPassword !== "") {

        if (this.signUpPassword !== this.confirmPassword) {
          this.signUpLoginError = "Those passwords aren't matching up.";
        } else {
          this.signUpLoginError = undefined;
          DB.signUpUser(this.signUpEmail, this.signUpPassword);
        }
      }
    },

    loginUser: function loginUser() {
      if (this.loginEmail !== "" && this.loginPassword !== "") {
        DB.loginUser(this.loginEmail, this.loginPassword);
      }
    },

    logoutUser: function logoutUser() {

      console.log("Calling App.logoutUser");
      DB.logoutUser();
    },

    // entry, entryIndex, note, callback)
    saveNote: function saveNote(entry, entryIndex, note) {
      var _this4 = this;

      console.log("App.saveNote");
      console.log("entry", entry);
      console.log("entryIndex", entryIndex);
      console.log("note", note);

      DB.saveNote(entry, entryIndex, note, function (updatedEntries) {
        console.log("Saved the note!");
        _this4.entries = updatedEntries;
      });

      // Still false so that means it's the first time for a user to be writing a note.
      if (this.tooltips.write === true) {
        this.toggleEmoji(true); // Go ahead and switch the user over so they can experiment with the carousel switching functionality.
      }

      DB.recordTooltip('write', function (tooltips) {
        console.log("After recording write");
        console.log("tooltips", tooltips);
        _this4.tooltips = tooltips;
      });
    },

    toggleLogin: function toggleLogin() {
      this.shouldLogin = !this.shouldLogin;
      this.shouldSignUp = false;
    },

    toggleSignUp: function toggleSignUp() {
      this.shouldLogin = false;
      this.shouldSignUp = !this.shouldSignUp;
    }
  }
});
"use strict";

var DayEmotionChartCarousel = {

  template: "<div class='js-charts'><slot></slot></div>",

  mounted: function mounted() {

    new Flickity(this.$el, {
      cellAlign: "left",
      pageDots: false
    });
  }
};

Vue.component('day-emotion-chart-carousel', DayEmotionChartCarousel);
'use strict';

var DayEmotionChart = {

  template: "<div><div class='js-chart'><slot></slot></div><div class='Ff(serifRegular) Fz(default) C(black) Ta(c)'>{{ readableDate(day) }}</div></div>",

  props: {
    data: {
      type: Object,
      required: false,
      default: function _default() {

        return {
          labels: ['🤔', '👆', '🌏'],
          series: [5, 3, 4],
          colors: ['green', 'blue', 'red', 'orange']
        };
      }
    },
    day: {
      type: String,
      required: false
    }
  },

  mounted: function mounted() {

    var options = {
      labelInterpolationFnc: function labelInterpolationFnc(value) {
        return value;
      },
      width: '100px',
      height: '100px'
    };

    var chart = new Chartist.Pie(this.$el.querySelector(".js-chart"), this.data, options);

    var index = 0; // Gonna use this to render the correct color form the colors array.

    var self = this;

    chart.on('draw', function (context) {
      console.log("Drawing the chart.");
      console.log("What's the context?");
      console.log(context);

      if (context.type === "slice") {

        context.element.attr({
          "fill": "#" + self.data.colors[index]
        });

        index += 1;
      }
    });
  },

  methods: {
    readableDate: function readableDate(date) {
      // console.log("readableDate");
      // console.log("What's the date?", date);

      var fromNow = moment(date).from(moment(new Date()));
      var displayer = "";

      // If it's a day ago, make it say "Yesterday"
      if (fromNow === "a day ago") {
        displayer = "Yesterday";
      } else {
        displayer = moment(date).format('dddd');
      }

      // otherwise make it say the day of the week.

      // console.log("What's the readable date?", readableDate);
      console.log("What's the displayer?", displayer);
      return displayer;
    }

  }
};

Vue.component('day-emotion-chart', DayEmotionChart);
"use strict";

var EmojionCarousel = {

  template: "#emojion_carousel_template",

  props: {
    emojions: {
      type: Array,
      required: true
    },
    color: {
      type: String,
      required: true
    }
  },

  created: function created() {
    console.log("Created the emojion carousel.");
  },

  mounted: function mounted() {
    var _this = this;

    console.log("Mounted the emojion carousel.");

    var flickity = new Flickity(this.$el, {
      pageDots: false
    });

    document.querySelector(".flickity-viewport").style.height = "100%";

    this.$emit('select-emoji-to-change-to', this.emojions[0], 0);

    flickity.on('select', function () {
      _this.$emit('select-emoji-to-change-to', _this.emojions[flickity.selectedIndex], flickity.selectedIndex);
    });
  }
};

Vue.component('emojion-carousel', EmojionCarousel);
'use strict';

var Emojion = {

  template: "#emojion_template",

  props: {

    index: {
      type: Number,
      required: true
    },

    canSwitchEmoji: {
      type: Boolean,
      required: true
    },

    emojion: {
      type: Object,
      required: true
    },

    notUserEmojions: {
      type: Array,
      required: true
    },

    colors: {
      type: Array,
      required: true
    }
  },

  data: function data() {
    return {

      /*
       * @description - The emoji character to display in the block.
       * @type String
       */
      emoji: this.emojion.emoji,

      /*
       * @description - The color of the emojion block
       * @type String
       */
      color: this.emojion.color,

      /*
       * @description - The text color for the emojion block
       * @type String
       */
      textColor: this.emojion.text_color,

      /* @description - The question associated with this emotion.
       * @type String
       */
      question: this.emojion.question,

      /*
       * @description - The color of the emotion when switching using the carouselColor
       * @type String
       */
      carouselColor: undefined,

      /*
       * @description - The emojion that this block will change to after selecting a new one via the carousel.
       * @type: Object
       */
      emojionToChangeTo: undefined,

      /*
       * @description - The emojion index (in the not user emojions array) to change to
       * @type Number
       */
      emojionToChangeToIndex: undefined,

      /*
       * @description: - Whether the user is currently changing the emoji on this block with the carousel
       * @type Boolean
       */
      isChangingEmoji: false
    };
  },

  mounted: function mounted() {
    var _this = this;

    /* Set up the press events to get the switching going */
    var toucher = new Hammer(this.$el);

    // Switching emoji.
    toucher.on('press', function (ev) {
      _this.isChangingEmoji = !_this.isChangingEmoji;
      _this.turnOnOffCarousel();
    });

    // Tracking entries.
    toucher.on('tap', function (ev) {
      console.log("Tapped");

      // Don't wanna send anything to the server if switching with the carousel.
      if (!_this.isChangingEmoji) {
        _this.$emit('track-entry', _this.emojion, _this.emojion.color, _this.emojion.text_color, _this.emojion.question);
      }
    });
  },

  methods: {

    /*
     * @description - Call back function from the carousel. */
    selectEmojionToChangeTo: function selectEmojionToChangeTo(emojion, emojionIndex) {
      console.log("Selecting an emojion to change to.");
      console.log("emojion", emojion);
      console.log("emojionIndex", emojionIndex);
      this.carouselColor = emojion.color;
      this.emojionToChangeTo = emojion;
      this.emojionToChangeToIndex = emojionIndex;
    },

    turnOnOffCarousel: function turnOnOffCarousel() {
      if (!this.isChangingEmoji) {

        this.carouselColor = undefined; // Go back to the original color until actually changing the color.

        this.emoji = this.emojionToChangeTo.emoji;
        this.color = this.emojionToChangeTo.color;
        this.textColor = this.emojionToChangeTo.text_color;

        console.log('this.emojionToChangeToIndex', this.emojionToChangeToIndex);

        this.$emit('turn-off-carousel', this.index, this.emojionToChangeTo, this.emojionToChangeToIndex);
      } else {
        this.$emit('turn-on-carousel', this.index);
      }
    }
  }
};

Vue.component('emojion', Emojion);
"use strict";

var Entry = {
  template: "#entry_template",

  props: {
    entry: {
      type: Object,
      required: true
    },

    index: {
      type: Number,
      requied: true
    },

    totalEntries: {
      type: Number,
      required: true
    },

    showTooltip: {
      type: Boolean,
      required: true,
      default: false
    }
  },

  data: function data() {
    return {
      canInputNote: false,
      shouldResizeTextArea: false,
      note: "",
      alreadyHasNote: false,
      isViewingNote: false
    };
  },

  created: function created() {

    console.log("created'");
    console.log("index", this.index);
    console.log("this.totalEntries", this.totalEntries);
    console.log("this.showTooltip", this.showTooltip);

    // The entry already has a note.
    if (this.entry.note != null) {
      this.alreadyHasNote = true; // Gonna use this for showing the icon and expanding it and stuff.
    }

    if (this.index === this.totalEntries - 1 && !this.alreadyHasNote) {
      this.canInputNote = true;
    } else {
      this.canInputNote = false;
    }
  },

  mounted: function mounted() {

    if (this.canInputNote) {
      autosize(this.$el.querySelector(".js-note-input"));
    }

    if (this.alreadyHasNote) {
      // do some stuff in here related to the note.
    }
  },

  updated: function updated() {

    console.log("Updating entry.");

    console.log("this.index", this.index);
    console.log("this.totalEntries", this.totalEntries);

    if (this.index === this.totalEntries - 1 && !this.alreadyHasNote) {
      this.canInputNote = true;
    } else {
      this.canInputNote = false;
    }
  },

  methods: {
    resizeTextArea: function resizeTextArea(event) {

      var val = event.target.value;

      if (val && val.length >= 1) {
        window.scrollTo(0, 0);
        this.shouldResizeTextArea = true;
      } else {
        window.scrollTo(0, GLOBAL_STATE.previousScrollY);
        this.shouldResizeTextArea = false;
      }

      this.note = val;
    },

    saveNote: function saveNote(event) {

      if (this.note && this.note.length >= 1) {
        this.shouldResizeTextArea = false;
        this.canInputNote = false;
        this.alreadyHasNote = true;
        this.isViewingNote = true;
        this.$emit('save-note', this.entry, this.index, this.note);
        this.$forceUpdate();
      }
    },

    formatTime: function formatTime(unformattedTime) {
      console.log("What's the unformatted time?");
      console.log("unformattedTime", unformattedTime);

      if (typeof unformattedTime === "string") {
        return moment(parseInt(unformattedTime, 10)).format('LT');
      } else {
        return moment(unformattedTime).format('LT');
      }
    },

    // Just shows the note so the user can read what they've previously written down.
    showNote: function showNote() {
      this.isViewingNote = !this.isViewingNote;
    }
  }
};

Vue.component('entry', Entry);
"use strict";

var Notification = {

  template: "#notification_template",

  props: {
    message: {
      type: String,
      required: true
    },

    emoji: {
      type: String,
      required: true
    },

    callToActionMessage: {
      type: String,
      required: false
    },
    method: {
      type: String,
      required: false
    },

    first: {
      type: Boolean,
      required: false,
      default: false
    }
  },

  data: function data() {

    return {
      methods: {},
      shouldShow: true,
      statusText: undefined
    };
  },

  created: function created() {

    console.log("What's this.method?", this.method);

    if (typeof this.method !== "undefined") {
      this.methods['click'] = this[this.method];
    }
  },

  methods: {
    askUserForLocation: function askUserForLocation() {

      var self = this;

      this.statusText = "Loading...";

      if (window.navigator.geolocation !== "undefined") {
        console.log("Gonna ask for the user's permission.");
        window.navigator.geolocation.getCurrentPosition(function (position) {
          // Save into the DB.
          DB.saveUserLocationPermissions("granted");

          self.shouldShow = false;
        }, function (error) {
          DB.saveUserLocationPermissions("denied");
          self.shouldShow = false;
        });
      }
    }
  }
};

Vue.component('notification', Notification);
"use strict";

var Tooltip = {
  template: "#tooltip_template",

  props: {
    emoji: {
      type: String,
      required: true
    },

    action: {
      type: String,
      requied: true
    },

    message: {
      type: String,
      required: true
    },

    arrowPosition: {
      type: String,
      required: false,
      default: ""
    },

    reverse: {
      type: Boolean,
      required: false,
      default: false
    },

    tooltipType: {
      type: String,
      required: true
    }
  }
};

Vue.component('tooltip', Tooltip);
"use strict";

var GLOBAL_STATE = {
   previousScrollY: undefined,
   isFirstTime: true,
   isLoggedIn: false
};

var CONSTS = {
   googleMapsURL: function googleMapsURL(latitude, longitude) {
      return "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + latitude + "," + longitude + "&sensor=true";
   },


   RETURNING_USER: {
      patternsMessage: "What am I noticing in my mind and body today?"
   },

   NEW_USER: {
      empty: "Nothing yet! 👻 Tap an emotion to it.",
      first: "Awesome, first one tracked. 👊 Add a note."
   },

   DEFAULT_USER_EMOJIONS: [{
      "emoji": "\uD83D\uDE04",
      "0": "\uD83D\uDE04",
      "emotion": "Joy",
      "1": "Joy",
      "key": "1",
      "2": "1",
      "color": "F4C811",
      "3": "F4C811",
      "text_color": "413504",
      "4": "413504",
      "question": "What actions did I take to put me into this state?",
      "5": "What actions did I take to put me into this state?"
   }, {
      "emoji": "\uD83D\uDE0C",
      "0": "\uD83D\uDE0C",
      "emotion": "Grateful",
      "1": "Grateful",
      "key": "2",
      "2": "2",
      "color": "5BE399",
      "3": "5BE399",
      "text_color": "163826",
      "4": "163826",
      "question": "What triggered this feeling of gratitude and how can I trigger it again?",
      "5": "What triggered this feeling of gratitude and how can I trigger it again?"
   }, {
      "emoji": "\uD83D\uDE0E",
      "0": "\uD83D\uDE0E",
      "emotion": "Arrogant",
      "1": "Arrogant",
      "key": "3",
      "2": "3",
      "color": "6734F1",
      "3": "6734F1",
      "text_color": "1F1146",
      "4": "1F1146",
      "question": "What\u2019s a healthier way to meet my need for significance?",
      "5": "What\u2019s a healthier way to meet my need for significance?"
   }, {
      "emoji": "\uD83E\uDD23",
      "0": "\uD83E\uDD23",
      "emotion": "Funny",
      "1": "Funny",
      "key": "4",
      "2": "4",
      "color": "F16E27",
      "3": "F16E27",
      "text_color": "341706",
      "4": "341706",
      "question": "What makes you laugh?",
      "5": "What makes you laugh?"
   }, {
      "emoji": "\uD83D\uDE21",
      "0": "\uD83D\uDE21",
      "emotion": "Angry",
      "1": "Angry",
      "key": "5",
      "2": "5",
      "color": "F04235",
      "3": "F04235",
      "text_color": "40110D",
      "4": "40110D",
      "question": "What else could this mean and is it significant?",
      "5": "What else could this mean and is it significant?"
   }, {
      "emoji": "\uD83D\uDCAA",
      "0": "\uD83D\uDCAA",
      "emotion": "Confident",
      "1": "Confident",
      "key": "6",
      "2": "6",
      "color": "7A2EF1",
      "3": "7A2EF1",
      "text_color": "200A44",
      "4": "200A44",
      "question": "How can I continue to extend this feeling?",
      "5": "How can I continue to extend this feeling?"
   }, {
      "emoji": "\uD83D\uDE30",
      "0": "\uD83D\uDE30",
      "emotion": "Anxious",
      "1": "Anxious",
      "key": "7",
      "2": "7",
      "color": "150311",
      "3": "150311",
      "text_color": "FFFFFF",
      "4": "FFFFFF",
      "question": "What\u2019s one thing that I can be grateful about praise myself for right now?",
      "5": "What\u2019s one thing that I can be grateful about praise myself for right now?"
   }, {
      "emoji": "\uD83D\uDE1E",
      "0": "\uD83D\uDE1E",
      "emotion": "Down",
      "1": "Down",
      "key": "9",
      "2": "9",
      "color": "445EF1",
      "3": "445EF1",
      "text_color": "172054",
      "4": "172054",
      "question": "What would I have to believe to feel this way right now?",
      "5": "What would I have to believe to feel this way right now?"
   }],

   DEFAULT_NOT_USER_EMOJIONS: [{
      "emoji": "\uD83D\uDC4A",
      "0": "\uD83D\uDC4A",
      "emotion": "In Control",
      "1": "In Control",
      "key": "10",
      "2": "10",
      "color": "5CE372",
      "3": "5CE372",
      "text_color": "122C17",
      "4": "122C17",
      "question": "What\u2019s the current state of things to make me feel this way?",
      "5": "What\u2019s the current state of things to make me feel this way?"
   }, {
      "emoji": "\uD83D\uDE4C",
      "0": "\uD83D\uDE4C",
      "emotion": "Motivated",
      "1": "Motivated",
      "key": "11",
      "2": "11",
      "color": "EC3751",
      "3": "EC3751",
      "text_color": "3D0D14",
      "4": "3D0D14",
      "question": "What\u2019s a single thing that I can do right now to capture this motivation?",
      "5": "What\u2019s a single thing that I can do right now to capture this motivation?"
   }, {
      "emoji": "\uD83D\uDE31",
      "0": "\uD83D\uDE31",
      "emotion": "Fearful",
      "1": "Fearful",
      "key": "12",
      "2": "12",
      "color": "150311",
      "3": "150311",
      "text_color": "FFFFFF",
      "4": "FFFFFF",
      "question": "What\u2019s the best thing that could happen?",
      "5": "What\u2019s the best thing that could happen?"
   }, {
      "emoji": "\uD83D\uDC41",
      "0": "\uD83D\uDC41",
      "emotion": "Focused",
      "1": "Focused",
      "key": "14",
      "2": "14",
      "color": "484DF1",
      "3": "484DF1",
      "text_color": "10113C",
      "4": "10113C",
      "question": "How can I plan my day in the future so that it continues to proceed like this?",
      "5": "How can I plan my day in the future so that it continues to proceed like this?"
   }, {
      "emoji": "\uD83D\uDC7B",
      "0": "\uD83D\uDC7B",
      "emotion": "Ignored",
      "1": "Ignored",
      "key": "16",
      "2": "16",
      "color": "FFFFFF",
      "3": "FFFFFF",
      "text_color": "000000",
      "4": "000000",
      "question": "What else could this mean and what\u2019s an action I can take to move forward?",
      "5": "What else could this mean and what\u2019s an action I can take to move forward?"
   }, {
      "emoji": "\uD83E\uDD16",
      "0": "\uD83E\uDD16",
      "emotion": "Apathetic",
      "1": "Apathetic",
      "key": "18",
      "2": "18",
      "color": "A6A6A6",
      "3": "A6A6A6",
      "text_color": "000000",
      "4": "000000",
      "question": "What\u2019s one small thing that I can do for someone else to show that I care about them?",
      "5": "What\u2019s one small thing that I can do for someone else to show that I care about them?"
   }, {
      "emoji": "\uD83E\uDD25",
      "0": "\uD83E\uDD25",
      "emotion": "Used",
      "1": "Used",
      "key": "19",
      "2": "19",
      "color": "4B93F1",
      "3": "4B93F1",
      "text_color": "172E4D",
      "4": "172E4D",
      "question": "How do you let people take advantage of you? ",
      "5": "How do you let people take advantage of you? "
   }, {
      "emoji": "\uD83E\uDD20",
      "0": "\uD83E\uDD20",
      "emotion": "Courageous",
      "1": "Courageous",
      "key": "20",
      "2": "20",
      "color": "F19D11",
      "3": "F19D11",
      "text_color": "312004",
      "4": "312004",
      "question": "What was the thing that caused me to push through and take action?",
      "5": "What was the thing that caused me to push through and take action?"
   }, {
      "emoji": "\uD83D\uDC45",
      "0": "\uD83D\uDC45",
      "emotion": "Horny",
      "1": "Horny",
      "key": "22",
      "2": "22",
      "color": "F03177",
      "3": "F03177",
      "text_color": "380A1B",
      "4": "380A1B",
      "question": "What\u2019s the healthiest way to satisfy this feeling?",
      "5": "What\u2019s the healthiest way to satisfy this feeling?"
   }, {
      "emoji": "\uD83E\uDD22",
      "0": "\uD83E\uDD22",
      "emotion": "Disgusted",
      "1": "Disgusted",
      "key": "24",
      "2": "24",
      "color": "788311",
      "3": "788311",
      "text_color": "181B03",
      "4": "181B03",
      "question": "How did you break your own values, and what\u2019s one thing you can do in the future to lessen the intensity of this feeling or avoid it?",
      "5": "How did you break your own values, and what\u2019s one thing you can do in the future to lessen the intensity of this feeling or avoid it?"
   }, {
      "emoji": "\uD83D\uDC76",
      "0": "\uD83D\uDC76",
      "emotion": "Powerless",
      "1": "Powerless",
      "key": "25",
      "2": "25",
      "color": "56CBF1",
      "3": "56CBF1",
      "text_color": "173A45",
      "4": "173A45",
      "question": "What is it that I really want?",
      "5": "What is it that I really want?"
   }, {
      "emoji": "\uD83D\uDE2B",
      "0": "\uD83D\uDE2B",
      "emotion": "Overwhelmed",
      "1": "Overwhelmed",
      "key": "26",
      "2": "26",
      "color": "F3BA11",
      "3": "F3BA11",
      "text_color": "413205",
      "4": "413205",
      "question": "What is one small thing that I can do right now to move forward?",
      "5": "What is one small thing that I can do right now to move forward?"
   }, {
      "emoji": "\uD83D\uDE29",
      "0": "\uD83D\uDE29",
      "emotion": "Lethargic",
      "1": "Lethargic",
      "key": "27",
      "2": "27",
      "color": "8F3711",
      "3": "8F3711",
      "text_color": "2B1004",
      "4": "2B1004",
      "question": "Can I drink one bottle of water?",
      "5": "Can I drink one bottle of water?"
   }, {
      "emoji": "\uD83D\uDE14",
      "0": "\uD83D\uDE14",
      "emotion": "Guilty",
      "1": "Guilty",
      "key": "28",
      "2": "28",
      "color": "6A6A6A",
      "3": "6A6A6A",
      "text_color": "000000",
      "4": "000000",
      "question": "What\u2019s one thing that I can listen to right now that will make me feel empowered?",
      "5": "What\u2019s one thing that I can listen to right now that will make me feel empowered?"
   }, {
      "emoji": "\uD83D\uDE16",
      "0": "\uD83D\uDE16",
      "emotion": "Frustrated",
      "1": "Frustrated",
      "key": "29",
      "2": "29",
      "color": "F04235",
      "3": "F04235",
      "text_color": "40110D",
      "4": "40110D",
      "question": "What are my other options?",
      "5": "What are my other options?"
   }]
};
"use strict";

//   // But if we have position data, then get that and add it to the entries later.
//   // if (typeof UTILS.POSITION !== "undefined") {
//   //   var latitude = UTILS.POSITION.coords.latitude,
//   //       longitude = UTILS.POSITION.coords.longitude;
//   //
//   //   UTILS.get(CONSTS.googleMapsURL(latitude, longitude), function (event) {
//   //
//   //     let response = undefined;
//   //     let address = undefined;
//   //
//   //     try {
//   //       response = JSON.parse(this.responseText);
//   //     } catch (e) {
//   //       console.log("Caught!");
//   //       console.log(e);
//   //     }
//   //
//   //     address = UTILS.getAddress(response);
//   //
//   //     // Set the entry again with the address in place.
//   //     entry.update({
//   //       "address": address
//   //     });
//   //
//   //   });
//   // }

/*
 * If the user is logged out, then everything will be saved to local storage.
 * If the user is logged in, we'll save the data to the USER_DATA object.
 */
var DB = {

  /*
   * @description: Gets the sign up and login errors if there are any.
   * @return Object || NULL
   */
  getSignUpLoginErrors: function getSignUpLoginErrors(callback) {

    if (ERROR_DATA != null) {

      if (callback) {
        callback(ERROR_DATA);
      }
    } else {

      if (callback) {
        callback(null);
      }
    }
  },

  // GETTERS
  getLocalEntries: function getLocalEntries(date) {
    var items = void 0;

    try {
      items = window.localStorage.getItem('entries');
    } catch (e) {
      console.log("e", e);
    }

    console.log("items");

    if (items != null) {
      items = JSON.parse(items);

      if (typeof items[date] !== "undefined") {
        return items[date];
      } else {
        return null;
      }
    } else {
      return null;
    }
  },

  recordTooltip: function recordTooltip(tooltipName, callback) {
    console.log('recordTooltip');
    var tooltips = void 0;

    // {
    //   "press": true,
    //   "tap": true
    // }

    try {
      tooltips = window.localStorage.getItem('tooltips');
    } catch (e) {
      console.log("e", e);
    }

    if (tooltips != null) {
      tooltips = JSON.parse(tooltips);
      tooltips[tooltipName] = false;
      console.log('tooltips', tooltips);
      window.localStorage.setItem('tooltips', JSON.stringify(tooltips));
      callback(tooltips);
    } else {
      var obj = {};
      obj.press = true;
      obj.write = true;
      obj.tap = true;
      obj[tooltipName] = false;
      console.log('obj', obj);
      window.localStorage.setItem('tooltips', JSON.stringify(obj));
      callback(obj);
    }
  },

  getTooltips: function getTooltips(callback) {
    console.log("getTooltips");
    var tooltips = void 0;

    try {
      tooltips = window.localStorage.getItem('tooltips');
    } catch (e) {
      console.log("e", e);
    }

    console.log('tooltips', tooltips);

    if (tooltips != null) {
      tooltips = JSON.parse(tooltips);
      callback(tooltips);
    } else {
      callback({
        press: true,
        write: true,
        tap: true
      });
    }
  },

  /*
   * @description: Small API over localStorage that saves an array of objects into a key.
   * @
   */
  saveLocalEntries: function saveLocalEntries(date, item, index, color, textColor, question) {

    console.log("UTILS.save");
    console.log("date", date);
    console.log("item", item);
    console.log("index", index);

    var items = void 0;

    if (typeof color !== "undefined") {
      item.color = color;
    }

    if (typeof textColor !== "undefined") {
      item.text_color = textColor;
    }

    if (typeof question !== "undefined") {
      item.question = question;
    }

    try {
      items = window.localStorage.getItem('entries');
    } catch (e) {
      console.log("e", e);
    }

    console.log("items", items);

    if (items == null) {
      console.log("items are null");
      try {
        var obj = {};
        obj[date] = [item];
        window.localStorage.setItem('entries', JSON.stringify(obj));
      } catch (e) {
        console.log("e", e);
      }
    } else {

      console.log("items not null");

      items = JSON.parse(items);

      if (typeof index === "undefined") {
        console.log("No index.");
        if (typeof items[date] === "undefined") {
          items[date] = [item];
        } else {
          items[date].push(item);
        }
      } else {
        console.log("There's an index");
        console.log("index", index);
        items[date][index] = item;
      }

      try {
        window.localStorage.setItem('entries', JSON.stringify(items));
      } catch (e) {
        console.log("e", e);
      }
    }

    console.log("DONE SETTING");
    console.log("window.localStorage.getItem", window.localStorage.getItem('entries', JSON.stringify(items)));
  },

  getTodaysEntries: function getTodaysEntries(callback) {

    var currentDay = moment(moment.now()).format("YYYY-MM-DD");

    if (!GLOBAL_STATE.isLoggedIn) {
      callback(DB.getLocalEntries(currentDay));
    } else {
      callback(USER_DATA["entries"]);
    }
  },

  // SETTERS
  saveNote: function saveNote(entry, entryIndex, note, callback) {

    console.log("DB.saveNote");
    console.log('entry', entry);
    console.log('entryIndex', entryIndex);
    console.log('note', note);

    if (!GLOBAL_STATE.isLoggedIn) {
      var entryDate = moment(entry.time).format('YYYY-MM-DD');
      entry.note = note;
      callback(DB.saveLocalEntries(entryDate, entry, entryIndex));
    } else {

      AJAX.post("saveNote", {
        entry: entry,
        note: note
      }).then(function (json) {

        console.log("What's the JSON?");
        console.log("json", json);

        callback(json);
      });
    }
  },

  trackEntry: function trackEntry(emojion, color, textColor, question, callback) {

    var currentDay = moment(moment.now()).format('YYYY-MM-DD');

    console.log("trackEntry");
    console.log("emojion", emojion);
    console.log("color", color);
    console.log("question", question);

    if (!GLOBAL_STATE.isLoggedIn) {
      // Save to local storage
      DB.saveLocalEntries(currentDay, emojion, undefined, color, textColor, question);
      callback(DB.getLocalEntries(currentDay));
    } else {

      console.log("Making the AJAX request");
      AJAX.post("trackEntry", {
        emojion: emojion,
        color: color,
        textColor: textColor,
        question: question
      }).then(function (json) {

        console.log("What's the JSON?");
        console.log("json", json);

        callback(json);
      });

      // Ajax request
    }
  },

  /*
   * @description - Signs up a user to the service and saves all their stuff in local storage.
   */
  signUpUser: function signUpUser(email, password) {

    console.log("DB.signUpUser");
    console.log("email", email);
    console.log("password", password);

    console.log("entries");
    console.log(window.localStorage.getItem('entries'));
    console.log("userEmojions");
    console.log(window.localStorage.getItem('userEmojions'));

    var userDataObj = {
      "signUpEmail": email,
      "signUpPassword": password,
      "timezone": UTILS.getClientTimezone()
    };

    var entries = window.localStorage.getItem('entries'),
        userEmojions = window.localStorage.getItem('userEmojions');

    if (entries != null) {
      userDataObj["entries"] = JSON.parse(entries);
    }

    if (userEmojions != null) {
      userDataObj["userEmojions"] = JSON.parse(userEmojions);
    }

    console.log("userDataObj", userDataObj);

    AJAX.post("signup", userDataObj, true).then(function (response) {
      console.log("What's the response?", response);
    });
  },

  /*
   * @description - Logs a user into the service and saves their entries (if any) from local storage into the DB.
   */
  loginUser: function loginUser(email, password) {

    console.log("DB.loginUser");
    console.log("email", email);
    console.log("password", password);

    var userDataObj = {
      "loginEmail": email,
      "loginPassword": password,
      "timezone": UTILS.getClientTimezone()
    };

    var entries = window.localStorage.getItem('entries');

    if (entries != null) {
      userDataObj["entries"] = JSON.parse(entries);
    }

    console.log("userDataObj", userDataObj);

    AJAX.post("login", userDataObj, true).then(function (response) {
      console.log("What's the response?", response);
    });
  },

  /*
   * @description - Just logs the user out and then refreshes the page. */
  logoutUser: function logoutUser() {

    console.log("Calling DB.logoutUser");

    AJAX.post("logout", {}, true).then(function (response) {
      console.log("What's the response?", response);
    });
  },

  /*
   * @description - Saves the user's emojions array into local storage.
   */
  saveUserEmojions: function saveUserEmojions(emojionsArray) {

    if (GLOBAL_STATE.isLoggedIn) {
      console.log("Saving the user's emojions. Making an ajx request.s");

      console.log("Fetching.");

      console.log(USER_DATA["user_emojions"]);

      AJAX.post("saveEmojions", USER_DATA["user_emojions"]).then(function (json) {
        console.log("What's the JSON?");
        console.log("json", json);
      });
    } else {
      window.localStorage.setItem('userEmojions', JSON.stringify(emojionsArray));
    }
  },

  saveNotUserEmojions: function saveNotUserEmojions(emojionsArray) {
    window.localStorage.setItem('notUserEmojions', JSON.stringify(emojionsArray));
  },

  getUserEmojions: function getUserEmojions(callback) {

    console.log("getUSerEmojions");

    var emojions = void 0;

    if (GLOBAL_STATE.isLoggedIn) {

      console.log(" The user is already logged in.");

      try {
        emojions = USER_DATA["user_emojions"];
      } catch (e) {
        console.log("e", e);
      }

      if (emojions != null) {
        callback(emojions);
      }
    } else {

      try {
        emojions = window.localStorage.getItem('userEmojions');
      } catch (e) {
        console.log("e", e);
      }

      if (emojions != null) {
        callback(JSON.parse(emojions));
      } else {
        callback(CONSTS.DEFAULT_USER_EMOJIONS);
      }
    }
  },

  getPreviousDayCharts: function getPreviousDayCharts(callback) {

    if (GLOBAL_STATE.isLoggedIn) {
      callback(USER_DATA["previousDayCharts"]);
    } else {
      callback(undefined);
    }
  },

  getNotUserEmojions: function getNotUserEmojions(callback) {

    console.log("getNotUserEmojions");

    var emojions = void 0;

    if (GLOBAL_STATE.isLoggedIn) {
      console.log("The user is logged in.");
      emojions = USER_DATA["not_user_emojions"];

      if (emojions != null) {
        callback(emojions);
      }
    } else {
      try {
        emojions = window.localStorage.getItem('notUserEmojions');
      } catch (e) {
        console.log("e", e);
      }

      if (emojions != null) {
        callback(JSON.parse(emojions));
      } else {
        callback(CONSTS.DEFAULT_NOT_USER_EMOJIONS);
      }
    }
  },

  saveUserLocationPermissions: function saveUserLocationPermissions(permission) {

    window.localStorage.setItem('userLocationPermissions', JSON.stringify({
      permission: permission
    }));
  },

  getUserLocationPermissions: function getUserLocationPermissions(callback) {

    var permissions = void 0;

    try {
      permissions = window.localStorage.getItem('userLocationPermissions');
    } catch (e) {
      console.log("e", e);
    }

    if (permissions != null) {
      callback(JSON.parse(permissions));
    } else {
      window.localStorage.setItem('userLocationPermissions', JSON.stringify({
        permission: "pending"
      }));

      callback({
        permission: "pending"
      });
    }
  },

  saveLocationToEntry: function saveLocationToEntry(entryIndex, entry, positionObj, callback) {
    console.log('savelocation to entry');
    console.log("entryIndex", entryIndex);
    console.log('entry', entry);
    console.log('positionObj', positionObj);

    var entryDate = moment(+entry.time).format('YYYY-MM-DD');

    console.log("What's entryDate?", entryDate);

    var latitude = positionObj.coords.latitude,
        longitude = positionObj.coords.longitude;

    if (GLOBAL_STATE.isLoggedIn) {

      console.log("What's the entryKey?", entry["key"]);

      console.log("latitude", latitude);
      console.log("longitude", longitude);

      AJAX.post("saveLocationToEntry", {
        entryKey: entry["key"],
        latitude: latitude,
        longitude: longitude
      }).then(function (json) {
        console.log("Coming back from saveLocationToEntry.");
        console.log("What's the JSON?");
        console.log("json", json);

        callback(json);
      });
    } else {
      DB.saveLocalEntries(entryDate, entry, entryIndex);

      if (typeof callback !== "undefined") {
        callback(DB.getLocalEntries(entryDate));
      }
    }
  }
};
"use strict";

/* Methods relating to manipulating the DOM in some way. */

console.log("Defining, dom.");

var DOM = {
  freezeScreen: function freezeScreen() {

    GLOBAL_STATE.previousScrollY = window.scrollY; // Store the old scroll position


    console.log("Calling freezeScreen");

    console.log("GLOBAL_STATE.previousScrollY", GLOBAL_STATE.previousScrollY);

    setTimeout(function () {
      console.log("Scrolling to the top.");
      window.scrollTo(0, 0); // Jump back to top for selecting emoji.
    }, 0);

    document.body.classList.remove("Ox(hidden)");
    document.body.classList.add("O(hidden)", "rsp-1-Oy(visible)");
  },
  unfreezeScreen: function unfreezeScreen() {

    setTimeout(function () {
      window.scrollTo(0, GLOBAL_STATE.previousScrollY);
    }, 0);

    document.body.classList.remove("O(hidden)", "rsp-1-Oy(visible)");
    document.body.classList.add("Ox(hidden)");
  },
  showApp: function showApp() {
    var app = document.querySelector(".js-app"),
        loading = document.querySelector(".js-loading");

    app.classList.remove("hidden");
    loading.classList.add("hidden");
  },
  showError: function showError() {
    var error = document.querySelector(".js-error");
    error.classList.remove("hidden");
  },
  hideError: function hideError() {
    var error = document.querySelector(".js-error");
    error.classList.add("hidden");
  }
};
"use strict";

var UTILS = {

  /*
   * @description - Takes a firebase object in the form of { "ao49ds": { } } and converts into array of objects with ".key" property. */
  toArray: function toArray(object) {

    var array = [];

    for (var prop in object) {
      object[prop][".key"] = prop;
      array.push(object[prop]);
    }

    return array;
  },
  removeKeys: function removeKeys(array) {
    for (var i = 0; i < array.length; i += 1) {
      delete array[i][".key"];
    }

    return array;
  },


  /*
   * @description: Given an array of objects and an object returns the key of that object within the array
   * @return Number
   */
  getIndex: function getIndex(arrayOfObjs, obj) {
    for (var i = 0; i < arrayOfObjs.length; i += 1) {

      if (_.isEqual(arrayOfObjs[i], obj)) {
        return i;
      }
    }

    return -1;
  },


  /*
   * @description - Given an array, replace an element at a specific index with another element
   * @param array:Array
   * @param index:Number,
   * @param newItem:Object
   * @return Void */
  replaceAtIndex: function replaceAtIndex(array, index, newItem) {
    array[index] = newItem;
  },


  getClientTimezone: function getClientTimezone() {
    var offset = new Date().getTimezoneOffset();

    offset = offset === 0 ? 0 : -offset;

    console.log("What's the offset?", offset);

    return offset;
  },

  convertUnixTimeToPMAM: function convertUnixTimeToPMAM(unixTime) {

    console.log("convertUnixTimeToPMAM");
    console.log("unixTime", unixTime);

    function formatAMPM(date) {
      var hours = date.getHours(),
          minutes = date.getMinutes(),
          ampm = hours >= 12 ? 'pm' : 'am',
          strTime = undefined;

      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0' + minutes : minutes;

      strTime = hours + ':' + minutes + ' ' + ampm;
      return strTime;
    }

    return formatAMPM(new Date(unixTime));
  },


  /*
   * @description - Iterating over a Google Maps API Response from Long and Lat. to find a place name.
   * @return String
   */
  getAddress: function getAddress(response) {

    var address = "";

    if (response.results.length) {

      response.results[0]["address_components"].forEach(function (addressComponent) {

        if (addressComponent.types.includes("sublocality")) {
          address += addressComponent.long_name + ", ";
        }

        if (addressComponent.types.includes("locality")) {
          address += addressComponent.long_name;
        }
      });
    }

    return address;
  },


  comparer: function comparer(otherArray, key) {
    return function (current) {
      return otherArray.filter(function (other) {
        return other[key] === current[key];
      }).length === 0;
    };
  },

  showError: function showError() {},

  /* @description - Only removes the entries and emojions so when the user logs in it's a clean slate again. */
  removeUserDataFromLocalStorage: function removeUserDataFromLocalStorage() {
    window.localStorage.removeItem('entries');
    window.localStorage.removeItem('userEmojions');
    window.localStorage.removeItem('notUserEmojions');
  },

  /* @description - Removes all local storage stuff including tooltips and user location. */
  removeAllLocalStorage: function removeAllLocalStorage() {
    window.localStorage.removeItem('tooltips');
    window.localStorage.removeItem('entries');
    window.localStorage.removeItem('userEmojions');
    window.localStorage.removeItem('notUserEmojions');
    window.localStorage.removeItem('userLocation');
  }
};

/*

{
  "2017-08-08": []
}

*/
'use strict';

/*!
	Autosize 4.0.0
	license: MIT
	http://www.jacklmoore.com/autosize
*/
(function (global, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['exports', 'module'], factory);
	} else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
		factory(exports, module);
	} else {
		var mod = {
			exports: {}
		};
		factory(mod.exports, mod);
		global.autosize = mod.exports;
	}
})(undefined, function (exports, module) {
	'use strict';

	var map = typeof Map === "function" ? new Map() : function () {
		var keys = [];
		var values = [];

		return {
			has: function has(key) {
				return keys.indexOf(key) > -1;
			},
			get: function get(key) {
				return values[keys.indexOf(key)];
			},
			set: function set(key, value) {
				if (keys.indexOf(key) === -1) {
					keys.push(key);
					values.push(value);
				}
			},
			'delete': function _delete(key) {
				var index = keys.indexOf(key);
				if (index > -1) {
					keys.splice(index, 1);
					values.splice(index, 1);
				}
			}
		};
	}();

	var createEvent = function createEvent(name) {
		return new Event(name, { bubbles: true });
	};
	try {
		new Event('test');
	} catch (e) {
		// IE does not support `new Event()`
		createEvent = function createEvent(name) {
			var evt = document.createEvent('Event');
			evt.initEvent(name, true, false);
			return evt;
		};
	}

	function assign(ta) {
		if (!ta || !ta.nodeName || ta.nodeName !== 'TEXTAREA' || map.has(ta)) return;

		var heightOffset = null;
		var clientWidth = ta.clientWidth;
		var cachedHeight = null;

		function init() {
			var style = window.getComputedStyle(ta, null);

			if (style.resize === 'vertical') {
				ta.style.resize = 'none';
			} else if (style.resize === 'both') {
				ta.style.resize = 'horizontal';
			}

			if (style.boxSizing === 'content-box') {
				heightOffset = -(parseFloat(style.paddingTop) + parseFloat(style.paddingBottom));
			} else {
				heightOffset = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
			}
			// Fix when a textarea is not on document body and heightOffset is Not a Number
			if (isNaN(heightOffset)) {
				heightOffset = 0;
			}

			update();
		}

		function changeOverflow(value) {
			{
				// Chrome/Safari-specific fix:
				// When the textarea y-overflow is hidden, Chrome/Safari do not reflow the text to account for the space
				// made available by removing the scrollbar. The following forces the necessary text reflow.
				var width = ta.style.width;
				ta.style.width = '0px';
				// Force reflow:
				/* jshint ignore:start */
				ta.offsetWidth;
				/* jshint ignore:end */
				ta.style.width = width;
			}

			ta.style.overflowY = value;
		}

		function getParentOverflows(el) {
			var arr = [];

			while (el && el.parentNode && el.parentNode instanceof Element) {
				if (el.parentNode.scrollTop) {
					arr.push({
						node: el.parentNode,
						scrollTop: el.parentNode.scrollTop
					});
				}
				el = el.parentNode;
			}

			return arr;
		}

		function resize() {
			var originalHeight = ta.style.height;
			var overflows = getParentOverflows(ta);
			var docTop = document.documentElement && document.documentElement.scrollTop; // Needed for Mobile IE (ticket #240)

			ta.style.height = '';

			var endHeight = ta.scrollHeight + heightOffset;

			if (ta.scrollHeight === 0) {
				// If the scrollHeight is 0, then the element probably has display:none or is detached from the DOM.
				ta.style.height = originalHeight;
				return;
			}

			ta.style.height = endHeight + 'px';

			// used to check if an update is actually necessary on window.resize
			clientWidth = ta.clientWidth;

			// prevents scroll-position jumping
			overflows.forEach(function (el) {
				el.node.scrollTop = el.scrollTop;
			});

			if (docTop) {
				document.documentElement.scrollTop = docTop;
			}
		}

		function update() {
			resize();

			var styleHeight = Math.round(parseFloat(ta.style.height));
			var computed = window.getComputedStyle(ta, null);

			// Using offsetHeight as a replacement for computed.height in IE, because IE does not account use of border-box
			var actualHeight = computed.boxSizing === 'content-box' ? Math.round(parseFloat(computed.height)) : ta.offsetHeight;

			// The actual height not matching the style height (set via the resize method) indicates that
			// the max-height has been exceeded, in which case the overflow should be allowed.
			if (actualHeight !== styleHeight) {
				if (computed.overflowY === 'hidden') {
					changeOverflow('scroll');
					resize();
					actualHeight = computed.boxSizing === 'content-box' ? Math.round(parseFloat(window.getComputedStyle(ta, null).height)) : ta.offsetHeight;
				}
			} else {
				// Normally keep overflow set to hidden, to avoid flash of scrollbar as the textarea expands.
				if (computed.overflowY !== 'hidden') {
					changeOverflow('hidden');
					resize();
					actualHeight = computed.boxSizing === 'content-box' ? Math.round(parseFloat(window.getComputedStyle(ta, null).height)) : ta.offsetHeight;
				}
			}

			if (cachedHeight !== actualHeight) {
				cachedHeight = actualHeight;
				var evt = createEvent('autosize:resized');
				try {
					ta.dispatchEvent(evt);
				} catch (err) {
					// Firefox will throw an error on dispatchEvent for a detached element
					// https://bugzilla.mozilla.org/show_bug.cgi?id=889376
				}
			}
		}

		var pageResize = function pageResize() {
			if (ta.clientWidth !== clientWidth) {
				update();
			}
		};

		var destroy = function (style) {
			window.removeEventListener('resize', pageResize, false);
			ta.removeEventListener('input', update, false);
			ta.removeEventListener('keyup', update, false);
			ta.removeEventListener('autosize:destroy', destroy, false);
			ta.removeEventListener('autosize:update', update, false);

			Object.keys(style).forEach(function (key) {
				ta.style[key] = style[key];
			});

			map['delete'](ta);
		}.bind(ta, {
			height: ta.style.height,
			resize: ta.style.resize,
			overflowY: ta.style.overflowY,
			overflowX: ta.style.overflowX,
			wordWrap: ta.style.wordWrap
		});

		ta.addEventListener('autosize:destroy', destroy, false);

		// IE9 does not fire onpropertychange or oninput for deletions,
		// so binding to onkeyup to catch most of those events.
		// There is no way that I know of to detect something like 'cut' in IE9.
		if ('onpropertychange' in ta && 'oninput' in ta) {
			ta.addEventListener('keyup', update, false);
		}

		window.addEventListener('resize', pageResize, false);
		ta.addEventListener('input', update, false);
		ta.addEventListener('autosize:update', update, false);
		ta.style.overflowX = 'hidden';
		ta.style.wordWrap = 'break-word';

		map.set(ta, {
			destroy: destroy,
			update: update
		});

		init();
	}

	function destroy(ta) {
		var methods = map.get(ta);
		if (methods) {
			methods.destroy();
		}
	}

	function update(ta) {
		var methods = map.get(ta);
		if (methods) {
			methods.update();
		}
	}

	var autosize = null;

	// Do nothing in Node.js environment and IE8 (or lower)
	if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
		autosize = function autosize(el) {
			return el;
		};
		autosize.destroy = function (el) {
			return el;
		};
		autosize.update = function (el) {
			return el;
		};
	} else {
		autosize = function autosize(el, options) {
			if (el) {
				Array.prototype.forEach.call(el.length ? el : [el], function (x) {
					return assign(x, options);
				});
			}
			return el;
		};
		autosize.destroy = function (el) {
			if (el) {
				Array.prototype.forEach.call(el.length ? el : [el], destroy);
			}
			return el;
		};
		autosize.update = function (el) {
			if (el) {
				Array.prototype.forEach.call(el.length ? el : [el], update);
			}
			return el;
		};
	}

	module.exports = autosize;
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define('Chartist', [], function () {
      return root['Chartist'] = factory();
    });
  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Chartist'] = factory();
  }
})(undefined, function () {

  /* Chartist.js 0.11.0
   * Copyright © 2017 Gion Kunz
   * Free to use under either the WTFPL license or the MIT license.
   * https://raw.githubusercontent.com/gionkunz/chartist-js/master/LICENSE-WTFPL
   * https://raw.githubusercontent.com/gionkunz/chartist-js/master/LICENSE-MIT
   */
  /**
   * The core module of Chartist that is mainly providing static functions and higher level functions for chart modules.
   *
   * @module Chartist.Core
   */
  var Chartist = {
    version: '0.11.0'
  };

  (function (window, document, Chartist) {
    'use strict';

    /**
     * This object contains all namespaces used within Chartist.
     *
     * @memberof Chartist.Core
     * @type {{svg: string, xmlns: string, xhtml: string, xlink: string, ct: string}}
     */

    Chartist.namespaces = {
      svg: 'http://www.w3.org/2000/svg',
      xmlns: 'http://www.w3.org/2000/xmlns/',
      xhtml: 'http://www.w3.org/1999/xhtml',
      xlink: 'http://www.w3.org/1999/xlink',
      ct: 'http://gionkunz.github.com/chartist-js/ct'
    };

    /**
     * Helps to simplify functional style code
     *
     * @memberof Chartist.Core
     * @param {*} n This exact value will be returned by the noop function
     * @return {*} The same value that was provided to the n parameter
     */
    Chartist.noop = function (n) {
      return n;
    };

    /**
     * Generates a-z from a number 0 to 26
     *
     * @memberof Chartist.Core
     * @param {Number} n A number from 0 to 26 that will result in a letter a-z
     * @return {String} A character from a-z based on the input number n
     */
    Chartist.alphaNumerate = function (n) {
      // Limit to a-z
      return String.fromCharCode(97 + n % 26);
    };

    /**
     * Simple recursive object extend
     *
     * @memberof Chartist.Core
     * @param {Object} target Target object where the source will be merged into
     * @param {Object...} sources This object (objects) will be merged into target and then target is returned
     * @return {Object} An object that has the same reference as target but is extended and merged with the properties of source
     */
    Chartist.extend = function (target) {
      var i, source, sourceProp;
      target = target || {};

      for (i = 1; i < arguments.length; i++) {
        source = arguments[i];
        for (var prop in source) {
          sourceProp = source[prop];
          if ((typeof sourceProp === 'undefined' ? 'undefined' : _typeof(sourceProp)) === 'object' && sourceProp !== null && !(sourceProp instanceof Array)) {
            target[prop] = Chartist.extend(target[prop], sourceProp);
          } else {
            target[prop] = sourceProp;
          }
        }
      }

      return target;
    };

    /**
     * Replaces all occurrences of subStr in str with newSubStr and returns a new string.
     *
     * @memberof Chartist.Core
     * @param {String} str
     * @param {String} subStr
     * @param {String} newSubStr
     * @return {String}
     */
    Chartist.replaceAll = function (str, subStr, newSubStr) {
      return str.replace(new RegExp(subStr, 'g'), newSubStr);
    };

    /**
     * Converts a number to a string with a unit. If a string is passed then this will be returned unmodified.
     *
     * @memberof Chartist.Core
     * @param {Number} value
     * @param {String} unit
     * @return {String} Returns the passed number value with unit.
     */
    Chartist.ensureUnit = function (value, unit) {
      if (typeof value === 'number') {
        value = value + unit;
      }

      return value;
    };

    /**
     * Converts a number or string to a quantity object.
     *
     * @memberof Chartist.Core
     * @param {String|Number} input
     * @return {Object} Returns an object containing the value as number and the unit as string.
     */
    Chartist.quantity = function (input) {
      if (typeof input === 'string') {
        var match = /^(\d+)\s*(.*)$/g.exec(input);
        return {
          value: +match[1],
          unit: match[2] || undefined
        };
      }
      return { value: input };
    };

    /**
     * This is a wrapper around document.querySelector that will return the query if it's already of type Node
     *
     * @memberof Chartist.Core
     * @param {String|Node} query The query to use for selecting a Node or a DOM node that will be returned directly
     * @return {Node}
     */
    Chartist.querySelector = function (query) {
      return query instanceof Node ? query : document.querySelector(query);
    };

    /**
     * Functional style helper to produce array with given length initialized with undefined values
     *
     * @memberof Chartist.Core
     * @param length
     * @return {Array}
     */
    Chartist.times = function (length) {
      return Array.apply(null, new Array(length));
    };

    /**
     * Sum helper to be used in reduce functions
     *
     * @memberof Chartist.Core
     * @param previous
     * @param current
     * @return {*}
     */
    Chartist.sum = function (previous, current) {
      return previous + (current ? current : 0);
    };

    /**
     * Multiply helper to be used in `Array.map` for multiplying each value of an array with a factor.
     *
     * @memberof Chartist.Core
     * @param {Number} factor
     * @returns {Function} Function that can be used in `Array.map` to multiply each value in an array
     */
    Chartist.mapMultiply = function (factor) {
      return function (num) {
        return num * factor;
      };
    };

    /**
     * Add helper to be used in `Array.map` for adding a addend to each value of an array.
     *
     * @memberof Chartist.Core
     * @param {Number} addend
     * @returns {Function} Function that can be used in `Array.map` to add a addend to each value in an array
     */
    Chartist.mapAdd = function (addend) {
      return function (num) {
        return num + addend;
      };
    };

    /**
     * Map for multi dimensional arrays where their nested arrays will be mapped in serial. The output array will have the length of the largest nested array. The callback function is called with variable arguments where each argument is the nested array value (or undefined if there are no more values).
     *
     * @memberof Chartist.Core
     * @param arr
     * @param cb
     * @return {Array}
     */
    Chartist.serialMap = function (arr, cb) {
      var result = [],
          length = Math.max.apply(null, arr.map(function (e) {
        return e.length;
      }));

      Chartist.times(length).forEach(function (e, index) {
        var args = arr.map(function (e) {
          return e[index];
        });

        result[index] = cb.apply(null, args);
      });

      return result;
    };

    /**
     * This helper function can be used to round values with certain precision level after decimal. This is used to prevent rounding errors near float point precision limit.
     *
     * @memberof Chartist.Core
     * @param {Number} value The value that should be rounded with precision
     * @param {Number} [digits] The number of digits after decimal used to do the rounding
     * @returns {number} Rounded value
     */
    Chartist.roundWithPrecision = function (value, digits) {
      var precision = Math.pow(10, digits || Chartist.precision);
      return Math.round(value * precision) / precision;
    };

    /**
     * Precision level used internally in Chartist for rounding. If you require more decimal places you can increase this number.
     *
     * @memberof Chartist.Core
     * @type {number}
     */
    Chartist.precision = 8;

    /**
     * A map with characters to escape for strings to be safely used as attribute values.
     *
     * @memberof Chartist.Core
     * @type {Object}
     */
    Chartist.escapingMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#039;'
    };

    /**
     * This function serializes arbitrary data to a string. In case of data that can't be easily converted to a string, this function will create a wrapper object and serialize the data using JSON.stringify. The outcoming string will always be escaped using Chartist.escapingMap.
     * If called with null or undefined the function will return immediately with null or undefined.
     *
     * @memberof Chartist.Core
     * @param {Number|String|Object} data
     * @return {String}
     */
    Chartist.serialize = function (data) {
      if (data === null || data === undefined) {
        return data;
      } else if (typeof data === 'number') {
        data = '' + data;
      } else if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
        data = JSON.stringify({ data: data });
      }

      return Object.keys(Chartist.escapingMap).reduce(function (result, key) {
        return Chartist.replaceAll(result, key, Chartist.escapingMap[key]);
      }, data);
    };

    /**
     * This function de-serializes a string previously serialized with Chartist.serialize. The string will always be unescaped using Chartist.escapingMap before it's returned. Based on the input value the return type can be Number, String or Object. JSON.parse is used with try / catch to see if the unescaped string can be parsed into an Object and this Object will be returned on success.
     *
     * @memberof Chartist.Core
     * @param {String} data
     * @return {String|Number|Object}
     */
    Chartist.deserialize = function (data) {
      if (typeof data !== 'string') {
        return data;
      }

      data = Object.keys(Chartist.escapingMap).reduce(function (result, key) {
        return Chartist.replaceAll(result, Chartist.escapingMap[key], key);
      }, data);

      try {
        data = JSON.parse(data);
        data = data.data !== undefined ? data.data : data;
      } catch (e) {}

      return data;
    };

    /**
     * Create or reinitialize the SVG element for the chart
     *
     * @memberof Chartist.Core
     * @param {Node} container The containing DOM Node object that will be used to plant the SVG element
     * @param {String} width Set the width of the SVG element. Default is 100%
     * @param {String} height Set the height of the SVG element. Default is 100%
     * @param {String} className Specify a class to be added to the SVG element
     * @return {Object} The created/reinitialized SVG element
     */
    Chartist.createSvg = function (container, width, height, className) {
      var svg;

      width = width || '100%';
      height = height || '100%';

      // Check if there is a previous SVG element in the container that contains the Chartist XML namespace and remove it
      // Since the DOM API does not support namespaces we need to manually search the returned list http://www.w3.org/TR/selectors-api/
      Array.prototype.slice.call(container.querySelectorAll('svg')).filter(function filterChartistSvgObjects(svg) {
        return svg.getAttributeNS(Chartist.namespaces.xmlns, 'ct');
      }).forEach(function removePreviousElement(svg) {
        container.removeChild(svg);
      });

      // Create svg object with width and height or use 100% as default
      svg = new Chartist.Svg('svg').attr({
        width: width,
        height: height
      }).addClass(className);

      svg._node.style.width = width;
      svg._node.style.height = height;

      // Add the DOM node to our container
      container.appendChild(svg._node);

      return svg;
    };

    /**
     * Ensures that the data object passed as second argument to the charts is present and correctly initialized.
     *
     * @param  {Object} data The data object that is passed as second argument to the charts
     * @return {Object} The normalized data object
     */
    Chartist.normalizeData = function (data, reverse, multi) {
      var labelCount;
      var output = {
        raw: data,
        normalized: {}
      };

      // Check if we should generate some labels based on existing series data
      output.normalized.series = Chartist.getDataArray({
        series: data.series || []
      }, reverse, multi);

      // If all elements of the normalized data array are arrays we're dealing with
      // multi series data and we need to find the largest series if they are un-even
      if (output.normalized.series.every(function (value) {
        return value instanceof Array;
      })) {
        // Getting the series with the the most elements
        labelCount = Math.max.apply(null, output.normalized.series.map(function (series) {
          return series.length;
        }));
      } else {
        // We're dealing with Pie data so we just take the normalized array length
        labelCount = output.normalized.series.length;
      }

      output.normalized.labels = (data.labels || []).slice();
      // Padding the labels to labelCount with empty strings
      Array.prototype.push.apply(output.normalized.labels, Chartist.times(Math.max(0, labelCount - output.normalized.labels.length)).map(function () {
        return '';
      }));

      if (reverse) {
        Chartist.reverseData(output.normalized);
      }

      return output;
    };

    /**
     * This function safely checks if an objects has an owned property.
     *
     * @param {Object} object The object where to check for a property
     * @param {string} property The property name
     * @returns {boolean} Returns true if the object owns the specified property
     */
    Chartist.safeHasProperty = function (object, property) {
      return object !== null && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && object.hasOwnProperty(property);
    };

    /**
     * Checks if a value is considered a hole in the data series.
     *
     * @param {*} value
     * @returns {boolean} True if the value is considered a data hole
     */
    Chartist.isDataHoleValue = function (value) {
      return value === null || value === undefined || typeof value === 'number' && isNaN(value);
    };

    /**
     * Reverses the series, labels and series data arrays.
     *
     * @memberof Chartist.Core
     * @param data
     */
    Chartist.reverseData = function (data) {
      data.labels.reverse();
      data.series.reverse();
      for (var i = 0; i < data.series.length; i++) {
        if (_typeof(data.series[i]) === 'object' && data.series[i].data !== undefined) {
          data.series[i].data.reverse();
        } else if (data.series[i] instanceof Array) {
          data.series[i].reverse();
        }
      }
    };

    /**
     * Convert data series into plain array
     *
     * @memberof Chartist.Core
     * @param {Object} data The series object that contains the data to be visualized in the chart
     * @param {Boolean} [reverse] If true the whole data is reversed by the getDataArray call. This will modify the data object passed as first parameter. The labels as well as the series order is reversed. The whole series data arrays are reversed too.
     * @param {Boolean} [multi] Create a multi dimensional array from a series data array where a value object with `x` and `y` values will be created.
     * @return {Array} A plain array that contains the data to be visualized in the chart
     */
    Chartist.getDataArray = function (data, reverse, multi) {
      // Recursively walks through nested arrays and convert string values to numbers and objects with value properties
      // to values. Check the tests in data core -> data normalization for a detailed specification of expected values
      function recursiveConvert(value) {
        if (Chartist.safeHasProperty(value, 'value')) {
          // We are dealing with value object notation so we need to recurse on value property
          return recursiveConvert(value.value);
        } else if (Chartist.safeHasProperty(value, 'data')) {
          // We are dealing with series object notation so we need to recurse on data property
          return recursiveConvert(value.data);
        } else if (value instanceof Array) {
          // Data is of type array so we need to recurse on the series
          return value.map(recursiveConvert);
        } else if (Chartist.isDataHoleValue(value)) {
          // We're dealing with a hole in the data and therefore need to return undefined
          // We're also returning undefined for multi value output
          return undefined;
        } else {
          // We need to prepare multi value output (x and y data)
          if (multi) {
            var multiValue = {};

            // Single series value arrays are assumed to specify the Y-Axis value
            // For example: [1, 2] => [{x: undefined, y: 1}, {x: undefined, y: 2}]
            // If multi is a string then it's assumed that it specified which dimension should be filled as default
            if (typeof multi === 'string') {
              multiValue[multi] = Chartist.getNumberOrUndefined(value);
            } else {
              multiValue.y = Chartist.getNumberOrUndefined(value);
            }

            multiValue.x = value.hasOwnProperty('x') ? Chartist.getNumberOrUndefined(value.x) : multiValue.x;
            multiValue.y = value.hasOwnProperty('y') ? Chartist.getNumberOrUndefined(value.y) : multiValue.y;

            return multiValue;
          } else {
            // We can return simple data
            return Chartist.getNumberOrUndefined(value);
          }
        }
      }

      return data.series.map(recursiveConvert);
    };

    /**
     * Converts a number into a padding object.
     *
     * @memberof Chartist.Core
     * @param {Object|Number} padding
     * @param {Number} [fallback] This value is used to fill missing values if a incomplete padding object was passed
     * @returns {Object} Returns a padding object containing top, right, bottom, left properties filled with the padding number passed in as argument. If the argument is something else than a number (presumably already a correct padding object) then this argument is directly returned.
     */
    Chartist.normalizePadding = function (padding, fallback) {
      fallback = fallback || 0;

      return typeof padding === 'number' ? {
        top: padding,
        right: padding,
        bottom: padding,
        left: padding
      } : {
        top: typeof padding.top === 'number' ? padding.top : fallback,
        right: typeof padding.right === 'number' ? padding.right : fallback,
        bottom: typeof padding.bottom === 'number' ? padding.bottom : fallback,
        left: typeof padding.left === 'number' ? padding.left : fallback
      };
    };

    Chartist.getMetaData = function (series, index) {
      var value = series.data ? series.data[index] : series[index];
      return value ? value.meta : undefined;
    };

    /**
     * Calculate the order of magnitude for the chart scale
     *
     * @memberof Chartist.Core
     * @param {Number} value The value Range of the chart
     * @return {Number} The order of magnitude
     */
    Chartist.orderOfMagnitude = function (value) {
      return Math.floor(Math.log(Math.abs(value)) / Math.LN10);
    };

    /**
     * Project a data length into screen coordinates (pixels)
     *
     * @memberof Chartist.Core
     * @param {Object} axisLength The svg element for the chart
     * @param {Number} length Single data value from a series array
     * @param {Object} bounds All the values to set the bounds of the chart
     * @return {Number} The projected data length in pixels
     */
    Chartist.projectLength = function (axisLength, length, bounds) {
      return length / bounds.range * axisLength;
    };

    /**
     * Get the height of the area in the chart for the data series
     *
     * @memberof Chartist.Core
     * @param {Object} svg The svg element for the chart
     * @param {Object} options The Object that contains all the optional values for the chart
     * @return {Number} The height of the area in the chart for the data series
     */
    Chartist.getAvailableHeight = function (svg, options) {
      return Math.max((Chartist.quantity(options.height).value || svg.height()) - (options.chartPadding.top + options.chartPadding.bottom) - options.axisX.offset, 0);
    };

    /**
     * Get highest and lowest value of data array. This Array contains the data that will be visualized in the chart.
     *
     * @memberof Chartist.Core
     * @param {Array} data The array that contains the data to be visualized in the chart
     * @param {Object} options The Object that contains the chart options
     * @param {String} dimension Axis dimension 'x' or 'y' used to access the correct value and high / low configuration
     * @return {Object} An object that contains the highest and lowest value that will be visualized on the chart.
     */
    Chartist.getHighLow = function (data, options, dimension) {
      // TODO: Remove workaround for deprecated global high / low config. Axis high / low configuration is preferred
      options = Chartist.extend({}, options, dimension ? options['axis' + dimension.toUpperCase()] : {});

      var highLow = {
        high: options.high === undefined ? -Number.MAX_VALUE : +options.high,
        low: options.low === undefined ? Number.MAX_VALUE : +options.low
      };
      var findHigh = options.high === undefined;
      var findLow = options.low === undefined;

      // Function to recursively walk through arrays and find highest and lowest number
      function recursiveHighLow(data) {
        if (data === undefined) {
          return undefined;
        } else if (data instanceof Array) {
          for (var i = 0; i < data.length; i++) {
            recursiveHighLow(data[i]);
          }
        } else {
          var value = dimension ? +data[dimension] : +data;

          if (findHigh && value > highLow.high) {
            highLow.high = value;
          }

          if (findLow && value < highLow.low) {
            highLow.low = value;
          }
        }
      }

      // Start to find highest and lowest number recursively
      if (findHigh || findLow) {
        recursiveHighLow(data);
      }

      // Overrides of high / low based on reference value, it will make sure that the invisible reference value is
      // used to generate the chart. This is useful when the chart always needs to contain the position of the
      // invisible reference value in the view i.e. for bipolar scales.
      if (options.referenceValue || options.referenceValue === 0) {
        highLow.high = Math.max(options.referenceValue, highLow.high);
        highLow.low = Math.min(options.referenceValue, highLow.low);
      }

      // If high and low are the same because of misconfiguration or flat data (only the same value) we need
      // to set the high or low to 0 depending on the polarity
      if (highLow.high <= highLow.low) {
        // If both values are 0 we set high to 1
        if (highLow.low === 0) {
          highLow.high = 1;
        } else if (highLow.low < 0) {
          // If we have the same negative value for the bounds we set bounds.high to 0
          highLow.high = 0;
        } else if (highLow.high > 0) {
          // If we have the same positive value for the bounds we set bounds.low to 0
          highLow.low = 0;
        } else {
          // If data array was empty, values are Number.MAX_VALUE and -Number.MAX_VALUE. Set bounds to prevent errors
          highLow.high = 1;
          highLow.low = 0;
        }
      }

      return highLow;
    };

    /**
     * Checks if a value can be safely coerced to a number. This includes all values except null which result in finite numbers when coerced. This excludes NaN, since it's not finite.
     *
     * @memberof Chartist.Core
     * @param value
     * @returns {Boolean}
     */
    Chartist.isNumeric = function (value) {
      return value === null ? false : isFinite(value);
    };

    /**
     * Returns true on all falsey values except the numeric value 0.
     *
     * @memberof Chartist.Core
     * @param value
     * @returns {boolean}
     */
    Chartist.isFalseyButZero = function (value) {
      return !value && value !== 0;
    };

    /**
     * Returns a number if the passed parameter is a valid number or the function will return undefined. On all other values than a valid number, this function will return undefined.
     *
     * @memberof Chartist.Core
     * @param value
     * @returns {*}
     */
    Chartist.getNumberOrUndefined = function (value) {
      return Chartist.isNumeric(value) ? +value : undefined;
    };

    /**
     * Checks if provided value object is multi value (contains x or y properties)
     *
     * @memberof Chartist.Core
     * @param value
     */
    Chartist.isMultiValue = function (value) {
      return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && ('x' in value || 'y' in value);
    };

    /**
     * Gets a value from a dimension `value.x` or `value.y` while returning value directly if it's a valid numeric value. If the value is not numeric and it's falsey this function will return `defaultValue`.
     *
     * @memberof Chartist.Core
     * @param value
     * @param dimension
     * @param defaultValue
     * @returns {*}
     */
    Chartist.getMultiValue = function (value, dimension) {
      if (Chartist.isMultiValue(value)) {
        return Chartist.getNumberOrUndefined(value[dimension || 'y']);
      } else {
        return Chartist.getNumberOrUndefined(value);
      }
    };

    /**
     * Pollard Rho Algorithm to find smallest factor of an integer value. There are more efficient algorithms for factorization, but this one is quite efficient and not so complex.
     *
     * @memberof Chartist.Core
     * @param {Number} num An integer number where the smallest factor should be searched for
     * @returns {Number} The smallest integer factor of the parameter num.
     */
    Chartist.rho = function (num) {
      if (num === 1) {
        return num;
      }

      function gcd(p, q) {
        if (p % q === 0) {
          return q;
        } else {
          return gcd(q, p % q);
        }
      }

      function f(x) {
        return x * x + 1;
      }

      var x1 = 2,
          x2 = 2,
          divisor;
      if (num % 2 === 0) {
        return 2;
      }

      do {
        x1 = f(x1) % num;
        x2 = f(f(x2)) % num;
        divisor = gcd(Math.abs(x1 - x2), num);
      } while (divisor === 1);

      return divisor;
    };

    /**
     * Calculate and retrieve all the bounds for the chart and return them in one array
     *
     * @memberof Chartist.Core
     * @param {Number} axisLength The length of the Axis used for
     * @param {Object} highLow An object containing a high and low property indicating the value range of the chart.
     * @param {Number} scaleMinSpace The minimum projected length a step should result in
     * @param {Boolean} onlyInteger
     * @return {Object} All the values to set the bounds of the chart
     */
    Chartist.getBounds = function (axisLength, highLow, scaleMinSpace, onlyInteger) {
      var i,
          optimizationCounter = 0,
          newMin,
          newMax,
          bounds = {
        high: highLow.high,
        low: highLow.low
      };

      bounds.valueRange = bounds.high - bounds.low;
      bounds.oom = Chartist.orderOfMagnitude(bounds.valueRange);
      bounds.step = Math.pow(10, bounds.oom);
      bounds.min = Math.floor(bounds.low / bounds.step) * bounds.step;
      bounds.max = Math.ceil(bounds.high / bounds.step) * bounds.step;
      bounds.range = bounds.max - bounds.min;
      bounds.numberOfSteps = Math.round(bounds.range / bounds.step);

      // Optimize scale step by checking if subdivision is possible based on horizontalGridMinSpace
      // If we are already below the scaleMinSpace value we will scale up
      var length = Chartist.projectLength(axisLength, bounds.step, bounds);
      var scaleUp = length < scaleMinSpace;
      var smallestFactor = onlyInteger ? Chartist.rho(bounds.range) : 0;

      // First check if we should only use integer steps and if step 1 is still larger than scaleMinSpace so we can use 1
      if (onlyInteger && Chartist.projectLength(axisLength, 1, bounds) >= scaleMinSpace) {
        bounds.step = 1;
      } else if (onlyInteger && smallestFactor < bounds.step && Chartist.projectLength(axisLength, smallestFactor, bounds) >= scaleMinSpace) {
        // If step 1 was too small, we can try the smallest factor of range
        // If the smallest factor is smaller than the current bounds.step and the projected length of smallest factor
        // is larger than the scaleMinSpace we should go for it.
        bounds.step = smallestFactor;
      } else {
        // Trying to divide or multiply by 2 and find the best step value
        while (true) {
          if (scaleUp && Chartist.projectLength(axisLength, bounds.step, bounds) <= scaleMinSpace) {
            bounds.step *= 2;
          } else if (!scaleUp && Chartist.projectLength(axisLength, bounds.step / 2, bounds) >= scaleMinSpace) {
            bounds.step /= 2;
            if (onlyInteger && bounds.step % 1 !== 0) {
              bounds.step *= 2;
              break;
            }
          } else {
            break;
          }

          if (optimizationCounter++ > 1000) {
            throw new Error('Exceeded maximum number of iterations while optimizing scale step!');
          }
        }
      }

      var EPSILON = 2.221E-16;
      bounds.step = Math.max(bounds.step, EPSILON);
      function safeIncrement(value, increment) {
        // If increment is too small use *= (1+EPSILON) as a simple nextafter
        if (value === (value += increment)) {
          value *= 1 + (increment > 0 ? EPSILON : -EPSILON);
        }
        return value;
      }

      // Narrow min and max based on new step
      newMin = bounds.min;
      newMax = bounds.max;
      while (newMin + bounds.step <= bounds.low) {
        newMin = safeIncrement(newMin, bounds.step);
      }
      while (newMax - bounds.step >= bounds.high) {
        newMax = safeIncrement(newMax, -bounds.step);
      }
      bounds.min = newMin;
      bounds.max = newMax;
      bounds.range = bounds.max - bounds.min;

      var values = [];
      for (i = bounds.min; i <= bounds.max; i = safeIncrement(i, bounds.step)) {
        var value = Chartist.roundWithPrecision(i);
        if (value !== values[values.length - 1]) {
          values.push(value);
        }
      }
      bounds.values = values;
      return bounds;
    };

    /**
     * Calculate cartesian coordinates of polar coordinates
     *
     * @memberof Chartist.Core
     * @param {Number} centerX X-axis coordinates of center point of circle segment
     * @param {Number} centerY X-axis coordinates of center point of circle segment
     * @param {Number} radius Radius of circle segment
     * @param {Number} angleInDegrees Angle of circle segment in degrees
     * @return {{x:Number, y:Number}} Coordinates of point on circumference
     */
    Chartist.polarToCartesian = function (centerX, centerY, radius, angleInDegrees) {
      var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians)
      };
    };

    /**
     * Initialize chart drawing rectangle (area where chart is drawn) x1,y1 = bottom left / x2,y2 = top right
     *
     * @memberof Chartist.Core
     * @param {Object} svg The svg element for the chart
     * @param {Object} options The Object that contains all the optional values for the chart
     * @param {Number} [fallbackPadding] The fallback padding if partial padding objects are used
     * @return {Object} The chart rectangles coordinates inside the svg element plus the rectangles measurements
     */
    Chartist.createChartRect = function (svg, options, fallbackPadding) {
      var hasAxis = !!(options.axisX || options.axisY);
      var yAxisOffset = hasAxis ? options.axisY.offset : 0;
      var xAxisOffset = hasAxis ? options.axisX.offset : 0;
      // If width or height results in invalid value (including 0) we fallback to the unitless settings or even 0
      var width = svg.width() || Chartist.quantity(options.width).value || 0;
      var height = svg.height() || Chartist.quantity(options.height).value || 0;
      var normalizedPadding = Chartist.normalizePadding(options.chartPadding, fallbackPadding);

      // If settings were to small to cope with offset (legacy) and padding, we'll adjust
      width = Math.max(width, yAxisOffset + normalizedPadding.left + normalizedPadding.right);
      height = Math.max(height, xAxisOffset + normalizedPadding.top + normalizedPadding.bottom);

      var chartRect = {
        padding: normalizedPadding,
        width: function width() {
          return this.x2 - this.x1;
        },
        height: function height() {
          return this.y1 - this.y2;
        }
      };

      if (hasAxis) {
        if (options.axisX.position === 'start') {
          chartRect.y2 = normalizedPadding.top + xAxisOffset;
          chartRect.y1 = Math.max(height - normalizedPadding.bottom, chartRect.y2 + 1);
        } else {
          chartRect.y2 = normalizedPadding.top;
          chartRect.y1 = Math.max(height - normalizedPadding.bottom - xAxisOffset, chartRect.y2 + 1);
        }

        if (options.axisY.position === 'start') {
          chartRect.x1 = normalizedPadding.left + yAxisOffset;
          chartRect.x2 = Math.max(width - normalizedPadding.right, chartRect.x1 + 1);
        } else {
          chartRect.x1 = normalizedPadding.left;
          chartRect.x2 = Math.max(width - normalizedPadding.right - yAxisOffset, chartRect.x1 + 1);
        }
      } else {
        chartRect.x1 = normalizedPadding.left;
        chartRect.x2 = Math.max(width - normalizedPadding.right, chartRect.x1 + 1);
        chartRect.y2 = normalizedPadding.top;
        chartRect.y1 = Math.max(height - normalizedPadding.bottom, chartRect.y2 + 1);
      }

      return chartRect;
    };

    /**
     * Creates a grid line based on a projected value.
     *
     * @memberof Chartist.Core
     * @param position
     * @param index
     * @param axis
     * @param offset
     * @param length
     * @param group
     * @param classes
     * @param eventEmitter
     */
    Chartist.createGrid = function (position, index, axis, offset, length, group, classes, eventEmitter) {
      var positionalData = {};
      positionalData[axis.units.pos + '1'] = position;
      positionalData[axis.units.pos + '2'] = position;
      positionalData[axis.counterUnits.pos + '1'] = offset;
      positionalData[axis.counterUnits.pos + '2'] = offset + length;

      var gridElement = group.elem('line', positionalData, classes.join(' '));

      // Event for grid draw
      eventEmitter.emit('draw', Chartist.extend({
        type: 'grid',
        axis: axis,
        index: index,
        group: group,
        element: gridElement
      }, positionalData));
    };

    /**
     * Creates a grid background rect and emits the draw event.
     *
     * @memberof Chartist.Core
     * @param gridGroup
     * @param chartRect
     * @param className
     * @param eventEmitter
     */
    Chartist.createGridBackground = function (gridGroup, chartRect, className, eventEmitter) {
      var gridBackground = gridGroup.elem('rect', {
        x: chartRect.x1,
        y: chartRect.y2,
        width: chartRect.width(),
        height: chartRect.height()
      }, className, true);

      // Event for grid background draw
      eventEmitter.emit('draw', {
        type: 'gridBackground',
        group: gridGroup,
        element: gridBackground
      });
    };

    /**
     * Creates a label based on a projected value and an axis.
     *
     * @memberof Chartist.Core
     * @param position
     * @param length
     * @param index
     * @param labels
     * @param axis
     * @param axisOffset
     * @param labelOffset
     * @param group
     * @param classes
     * @param useForeignObject
     * @param eventEmitter
     */
    Chartist.createLabel = function (position, length, index, labels, axis, axisOffset, labelOffset, group, classes, useForeignObject, eventEmitter) {
      var labelElement;
      var positionalData = {};

      positionalData[axis.units.pos] = position + labelOffset[axis.units.pos];
      positionalData[axis.counterUnits.pos] = labelOffset[axis.counterUnits.pos];
      positionalData[axis.units.len] = length;
      positionalData[axis.counterUnits.len] = Math.max(0, axisOffset - 10);

      if (useForeignObject) {
        // We need to set width and height explicitly to px as span will not expand with width and height being
        // 100% in all browsers
        var content = document.createElement('span');
        content.className = classes.join(' ');
        content.setAttribute('xmlns', Chartist.namespaces.xhtml);
        content.innerText = labels[index];
        content.style[axis.units.len] = Math.round(positionalData[axis.units.len]) + 'px';
        content.style[axis.counterUnits.len] = Math.round(positionalData[axis.counterUnits.len]) + 'px';

        labelElement = group.foreignObject(content, Chartist.extend({
          style: 'overflow: visible;'
        }, positionalData));
      } else {
        labelElement = group.elem('text', positionalData, classes.join(' ')).text(labels[index]);
      }

      eventEmitter.emit('draw', Chartist.extend({
        type: 'label',
        axis: axis,
        index: index,
        group: group,
        element: labelElement,
        text: labels[index]
      }, positionalData));
    };

    /**
     * Helper to read series specific options from options object. It automatically falls back to the global option if
     * there is no option in the series options.
     *
     * @param {Object} series Series object
     * @param {Object} options Chartist options object
     * @param {string} key The options key that should be used to obtain the options
     * @returns {*}
     */
    Chartist.getSeriesOption = function (series, options, key) {
      if (series.name && options.series && options.series[series.name]) {
        var seriesOptions = options.series[series.name];
        return seriesOptions.hasOwnProperty(key) ? seriesOptions[key] : options[key];
      } else {
        return options[key];
      }
    };

    /**
     * Provides options handling functionality with callback for options changes triggered by responsive options and media query matches
     *
     * @memberof Chartist.Core
     * @param {Object} options Options set by user
     * @param {Array} responsiveOptions Optional functions to add responsive behavior to chart
     * @param {Object} eventEmitter The event emitter that will be used to emit the options changed events
     * @return {Object} The consolidated options object from the defaults, base and matching responsive options
     */
    Chartist.optionsProvider = function (options, responsiveOptions, eventEmitter) {
      var baseOptions = Chartist.extend({}, options),
          currentOptions,
          mediaQueryListeners = [],
          i;

      function updateCurrentOptions(mediaEvent) {
        var previousOptions = currentOptions;
        currentOptions = Chartist.extend({}, baseOptions);

        if (responsiveOptions) {
          for (i = 0; i < responsiveOptions.length; i++) {
            var mql = window.matchMedia(responsiveOptions[i][0]);
            if (mql.matches) {
              currentOptions = Chartist.extend(currentOptions, responsiveOptions[i][1]);
            }
          }
        }

        if (eventEmitter && mediaEvent) {
          eventEmitter.emit('optionsChanged', {
            previousOptions: previousOptions,
            currentOptions: currentOptions
          });
        }
      }

      function removeMediaQueryListeners() {
        mediaQueryListeners.forEach(function (mql) {
          mql.removeListener(updateCurrentOptions);
        });
      }

      if (!window.matchMedia) {
        throw 'window.matchMedia not found! Make sure you\'re using a polyfill.';
      } else if (responsiveOptions) {

        for (i = 0; i < responsiveOptions.length; i++) {
          var mql = window.matchMedia(responsiveOptions[i][0]);
          mql.addListener(updateCurrentOptions);
          mediaQueryListeners.push(mql);
        }
      }
      // Execute initially without an event argument so we get the correct options
      updateCurrentOptions();

      return {
        removeMediaQueryListeners: removeMediaQueryListeners,
        getCurrentOptions: function getCurrentOptions() {
          return Chartist.extend({}, currentOptions);
        }
      };
    };

    /**
     * Splits a list of coordinates and associated values into segments. Each returned segment contains a pathCoordinates
     * valueData property describing the segment.
     *
     * With the default options, segments consist of contiguous sets of points that do not have an undefined value. Any
     * points with undefined values are discarded.
     *
     * **Options**
     * The following options are used to determine how segments are formed
     * ```javascript
     * var options = {
     *   // If fillHoles is true, undefined values are simply discarded without creating a new segment. Assuming other options are default, this returns single segment.
     *   fillHoles: false,
     *   // If increasingX is true, the coordinates in all segments have strictly increasing x-values.
     *   increasingX: false
     * };
     * ```
     *
     * @memberof Chartist.Core
     * @param {Array} pathCoordinates List of point coordinates to be split in the form [x1, y1, x2, y2 ... xn, yn]
     * @param {Array} values List of associated point values in the form [v1, v2 .. vn]
     * @param {Object} options Options set by user
     * @return {Array} List of segments, each containing a pathCoordinates and valueData property.
     */
    Chartist.splitIntoSegments = function (pathCoordinates, valueData, options) {
      var defaultOptions = {
        increasingX: false,
        fillHoles: false
      };

      options = Chartist.extend({}, defaultOptions, options);

      var segments = [];
      var hole = true;

      for (var i = 0; i < pathCoordinates.length; i += 2) {
        // If this value is a "hole" we set the hole flag
        if (Chartist.getMultiValue(valueData[i / 2].value) === undefined) {
          // if(valueData[i / 2].value === undefined) {
          if (!options.fillHoles) {
            hole = true;
          }
        } else {
          if (options.increasingX && i >= 2 && pathCoordinates[i] <= pathCoordinates[i - 2]) {
            // X is not increasing, so we need to make sure we start a new segment
            hole = true;
          }

          // If it's a valid value we need to check if we're coming out of a hole and create a new empty segment
          if (hole) {
            segments.push({
              pathCoordinates: [],
              valueData: []
            });
            // As we have a valid value now, we are not in a "hole" anymore
            hole = false;
          }

          // Add to the segment pathCoordinates and valueData
          segments[segments.length - 1].pathCoordinates.push(pathCoordinates[i], pathCoordinates[i + 1]);
          segments[segments.length - 1].valueData.push(valueData[i / 2]);
        }
      }

      return segments;
    };
  })(window, document, Chartist);
  ; /**
    * Chartist path interpolation functions.
    *
    * @module Chartist.Interpolation
    */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    Chartist.Interpolation = {};

    /**
     * This interpolation function does not smooth the path and the result is only containing lines and no curves.
     *
     * @example
     * var chart = new Chartist.Line('.ct-chart', {
     *   labels: [1, 2, 3, 4, 5],
     *   series: [[1, 2, 8, 1, 7]]
     * }, {
     *   lineSmooth: Chartist.Interpolation.none({
     *     fillHoles: false
     *   })
     * });
     *
     *
     * @memberof Chartist.Interpolation
     * @return {Function}
     */
    Chartist.Interpolation.none = function (options) {
      var defaultOptions = {
        fillHoles: false
      };
      options = Chartist.extend({}, defaultOptions, options);
      return function none(pathCoordinates, valueData) {
        var path = new Chartist.Svg.Path();
        var hole = true;

        for (var i = 0; i < pathCoordinates.length; i += 2) {
          var currX = pathCoordinates[i];
          var currY = pathCoordinates[i + 1];
          var currData = valueData[i / 2];

          if (Chartist.getMultiValue(currData.value) !== undefined) {

            if (hole) {
              path.move(currX, currY, false, currData);
            } else {
              path.line(currX, currY, false, currData);
            }

            hole = false;
          } else if (!options.fillHoles) {
            hole = true;
          }
        }

        return path;
      };
    };

    /**
     * Simple smoothing creates horizontal handles that are positioned with a fraction of the length between two data points. You can use the divisor option to specify the amount of smoothing.
     *
     * Simple smoothing can be used instead of `Chartist.Smoothing.cardinal` if you'd like to get rid of the artifacts it produces sometimes. Simple smoothing produces less flowing lines but is accurate by hitting the points and it also doesn't swing below or above the given data point.
     *
     * All smoothing functions within Chartist are factory functions that accept an options parameter. The simple interpolation function accepts one configuration parameter `divisor`, between 1 and ∞, which controls the smoothing characteristics.
     *
     * @example
     * var chart = new Chartist.Line('.ct-chart', {
     *   labels: [1, 2, 3, 4, 5],
     *   series: [[1, 2, 8, 1, 7]]
     * }, {
     *   lineSmooth: Chartist.Interpolation.simple({
     *     divisor: 2,
     *     fillHoles: false
     *   })
     * });
     *
     *
     * @memberof Chartist.Interpolation
     * @param {Object} options The options of the simple interpolation factory function.
     * @return {Function}
     */
    Chartist.Interpolation.simple = function (options) {
      var defaultOptions = {
        divisor: 2,
        fillHoles: false
      };
      options = Chartist.extend({}, defaultOptions, options);

      var d = 1 / Math.max(1, options.divisor);

      return function simple(pathCoordinates, valueData) {
        var path = new Chartist.Svg.Path();
        var prevX, prevY, prevData;

        for (var i = 0; i < pathCoordinates.length; i += 2) {
          var currX = pathCoordinates[i];
          var currY = pathCoordinates[i + 1];
          var length = (currX - prevX) * d;
          var currData = valueData[i / 2];

          if (currData.value !== undefined) {

            if (prevData === undefined) {
              path.move(currX, currY, false, currData);
            } else {
              path.curve(prevX + length, prevY, currX - length, currY, currX, currY, false, currData);
            }

            prevX = currX;
            prevY = currY;
            prevData = currData;
          } else if (!options.fillHoles) {
            prevX = currX = prevData = undefined;
          }
        }

        return path;
      };
    };

    /**
     * Cardinal / Catmull-Rome spline interpolation is the default smoothing function in Chartist. It produces nice results where the splines will always meet the points. It produces some artifacts though when data values are increased or decreased rapidly. The line may not follow a very accurate path and if the line should be accurate this smoothing function does not produce the best results.
     *
     * Cardinal splines can only be created if there are more than two data points. If this is not the case this smoothing will fallback to `Chartist.Smoothing.none`.
     *
     * All smoothing functions within Chartist are factory functions that accept an options parameter. The cardinal interpolation function accepts one configuration parameter `tension`, between 0 and 1, which controls the smoothing intensity.
     *
     * @example
     * var chart = new Chartist.Line('.ct-chart', {
     *   labels: [1, 2, 3, 4, 5],
     *   series: [[1, 2, 8, 1, 7]]
     * }, {
     *   lineSmooth: Chartist.Interpolation.cardinal({
     *     tension: 1,
     *     fillHoles: false
     *   })
     * });
     *
     * @memberof Chartist.Interpolation
     * @param {Object} options The options of the cardinal factory function.
     * @return {Function}
     */
    Chartist.Interpolation.cardinal = function (options) {
      var defaultOptions = {
        tension: 1,
        fillHoles: false
      };

      options = Chartist.extend({}, defaultOptions, options);

      var t = Math.min(1, Math.max(0, options.tension)),
          c = 1 - t;

      return function cardinal(pathCoordinates, valueData) {
        // First we try to split the coordinates into segments
        // This is necessary to treat "holes" in line charts
        var segments = Chartist.splitIntoSegments(pathCoordinates, valueData, {
          fillHoles: options.fillHoles
        });

        if (!segments.length) {
          // If there were no segments return 'Chartist.Interpolation.none'
          return Chartist.Interpolation.none()([]);
        } else if (segments.length > 1) {
          // If the split resulted in more that one segment we need to interpolate each segment individually and join them
          // afterwards together into a single path.
          var paths = [];
          // For each segment we will recurse the cardinal function
          segments.forEach(function (segment) {
            paths.push(cardinal(segment.pathCoordinates, segment.valueData));
          });
          // Join the segment path data into a single path and return
          return Chartist.Svg.Path.join(paths);
        } else {
          // If there was only one segment we can proceed regularly by using pathCoordinates and valueData from the first
          // segment
          pathCoordinates = segments[0].pathCoordinates;
          valueData = segments[0].valueData;

          // If less than two points we need to fallback to no smoothing
          if (pathCoordinates.length <= 4) {
            return Chartist.Interpolation.none()(pathCoordinates, valueData);
          }

          var path = new Chartist.Svg.Path().move(pathCoordinates[0], pathCoordinates[1], false, valueData[0]),
              z;

          for (var i = 0, iLen = pathCoordinates.length; iLen - 2 * !z > i; i += 2) {
            var p = [{ x: +pathCoordinates[i - 2], y: +pathCoordinates[i - 1] }, { x: +pathCoordinates[i], y: +pathCoordinates[i + 1] }, { x: +pathCoordinates[i + 2], y: +pathCoordinates[i + 3] }, { x: +pathCoordinates[i + 4], y: +pathCoordinates[i + 5] }];
            if (z) {
              if (!i) {
                p[0] = { x: +pathCoordinates[iLen - 2], y: +pathCoordinates[iLen - 1] };
              } else if (iLen - 4 === i) {
                p[3] = { x: +pathCoordinates[0], y: +pathCoordinates[1] };
              } else if (iLen - 2 === i) {
                p[2] = { x: +pathCoordinates[0], y: +pathCoordinates[1] };
                p[3] = { x: +pathCoordinates[2], y: +pathCoordinates[3] };
              }
            } else {
              if (iLen - 4 === i) {
                p[3] = p[2];
              } else if (!i) {
                p[0] = { x: +pathCoordinates[i], y: +pathCoordinates[i + 1] };
              }
            }

            path.curve(t * (-p[0].x + 6 * p[1].x + p[2].x) / 6 + c * p[2].x, t * (-p[0].y + 6 * p[1].y + p[2].y) / 6 + c * p[2].y, t * (p[1].x + 6 * p[2].x - p[3].x) / 6 + c * p[2].x, t * (p[1].y + 6 * p[2].y - p[3].y) / 6 + c * p[2].y, p[2].x, p[2].y, false, valueData[(i + 2) / 2]);
          }

          return path;
        }
      };
    };

    /**
     * Monotone Cubic spline interpolation produces a smooth curve which preserves monotonicity. Unlike cardinal splines, the curve will not extend beyond the range of y-values of the original data points.
     *
     * Monotone Cubic splines can only be created if there are more than two data points. If this is not the case this smoothing will fallback to `Chartist.Smoothing.none`.
     *
     * The x-values of subsequent points must be increasing to fit a Monotone Cubic spline. If this condition is not met for a pair of adjacent points, then there will be a break in the curve between those data points.
     *
     * All smoothing functions within Chartist are factory functions that accept an options parameter.
     *
     * @example
     * var chart = new Chartist.Line('.ct-chart', {
     *   labels: [1, 2, 3, 4, 5],
     *   series: [[1, 2, 8, 1, 7]]
     * }, {
     *   lineSmooth: Chartist.Interpolation.monotoneCubic({
     *     fillHoles: false
     *   })
     * });
     *
     * @memberof Chartist.Interpolation
     * @param {Object} options The options of the monotoneCubic factory function.
     * @return {Function}
     */
    Chartist.Interpolation.monotoneCubic = function (options) {
      var defaultOptions = {
        fillHoles: false
      };

      options = Chartist.extend({}, defaultOptions, options);

      return function monotoneCubic(pathCoordinates, valueData) {
        // First we try to split the coordinates into segments
        // This is necessary to treat "holes" in line charts
        var segments = Chartist.splitIntoSegments(pathCoordinates, valueData, {
          fillHoles: options.fillHoles,
          increasingX: true
        });

        if (!segments.length) {
          // If there were no segments return 'Chartist.Interpolation.none'
          return Chartist.Interpolation.none()([]);
        } else if (segments.length > 1) {
          // If the split resulted in more that one segment we need to interpolate each segment individually and join them
          // afterwards together into a single path.
          var paths = [];
          // For each segment we will recurse the monotoneCubic fn function
          segments.forEach(function (segment) {
            paths.push(monotoneCubic(segment.pathCoordinates, segment.valueData));
          });
          // Join the segment path data into a single path and return
          return Chartist.Svg.Path.join(paths);
        } else {
          // If there was only one segment we can proceed regularly by using pathCoordinates and valueData from the first
          // segment
          pathCoordinates = segments[0].pathCoordinates;
          valueData = segments[0].valueData;

          // If less than three points we need to fallback to no smoothing
          if (pathCoordinates.length <= 4) {
            return Chartist.Interpolation.none()(pathCoordinates, valueData);
          }

          var xs = [],
              ys = [],
              i,
              n = pathCoordinates.length / 2,
              ms = [],
              ds = [],
              dys = [],
              dxs = [],
              path;

          // Populate x and y coordinates into separate arrays, for readability

          for (i = 0; i < n; i++) {
            xs[i] = pathCoordinates[i * 2];
            ys[i] = pathCoordinates[i * 2 + 1];
          }

          // Calculate deltas and derivative

          for (i = 0; i < n - 1; i++) {
            dys[i] = ys[i + 1] - ys[i];
            dxs[i] = xs[i + 1] - xs[i];
            ds[i] = dys[i] / dxs[i];
          }

          // Determine desired slope (m) at each point using Fritsch-Carlson method
          // See: http://math.stackexchange.com/questions/45218/implementation-of-monotone-cubic-interpolation

          ms[0] = ds[0];
          ms[n - 1] = ds[n - 2];

          for (i = 1; i < n - 1; i++) {
            if (ds[i] === 0 || ds[i - 1] === 0 || ds[i - 1] > 0 !== ds[i] > 0) {
              ms[i] = 0;
            } else {
              ms[i] = 3 * (dxs[i - 1] + dxs[i]) / ((2 * dxs[i] + dxs[i - 1]) / ds[i - 1] + (dxs[i] + 2 * dxs[i - 1]) / ds[i]);

              if (!isFinite(ms[i])) {
                ms[i] = 0;
              }
            }
          }

          // Now build a path from the slopes

          path = new Chartist.Svg.Path().move(xs[0], ys[0], false, valueData[0]);

          for (i = 0; i < n - 1; i++) {
            path.curve(
            // First control point
            xs[i] + dxs[i] / 3, ys[i] + ms[i] * dxs[i] / 3,
            // Second control point
            xs[i + 1] - dxs[i] / 3, ys[i + 1] - ms[i + 1] * dxs[i] / 3,
            // End point
            xs[i + 1], ys[i + 1], false, valueData[i + 1]);
          }

          return path;
        }
      };
    };

    /**
     * Step interpolation will cause the line chart to move in steps rather than diagonal or smoothed lines. This interpolation will create additional points that will also be drawn when the `showPoint` option is enabled.
     *
     * All smoothing functions within Chartist are factory functions that accept an options parameter. The step interpolation function accepts one configuration parameter `postpone`, that can be `true` or `false`. The default value is `true` and will cause the step to occur where the value actually changes. If a different behaviour is needed where the step is shifted to the left and happens before the actual value, this option can be set to `false`.
     *
     * @example
     * var chart = new Chartist.Line('.ct-chart', {
     *   labels: [1, 2, 3, 4, 5],
     *   series: [[1, 2, 8, 1, 7]]
     * }, {
     *   lineSmooth: Chartist.Interpolation.step({
     *     postpone: true,
     *     fillHoles: false
     *   })
     * });
     *
     * @memberof Chartist.Interpolation
     * @param options
     * @returns {Function}
     */
    Chartist.Interpolation.step = function (options) {
      var defaultOptions = {
        postpone: true,
        fillHoles: false
      };

      options = Chartist.extend({}, defaultOptions, options);

      return function step(pathCoordinates, valueData) {
        var path = new Chartist.Svg.Path();

        var prevX, prevY, prevData;

        for (var i = 0; i < pathCoordinates.length; i += 2) {
          var currX = pathCoordinates[i];
          var currY = pathCoordinates[i + 1];
          var currData = valueData[i / 2];

          // If the current point is also not a hole we can draw the step lines
          if (currData.value !== undefined) {
            if (prevData === undefined) {
              path.move(currX, currY, false, currData);
            } else {
              if (options.postpone) {
                // If postponed we should draw the step line with the value of the previous value
                path.line(currX, prevY, false, prevData);
              } else {
                // If not postponed we should draw the step line with the value of the current value
                path.line(prevX, currY, false, currData);
              }
              // Line to the actual point (this should only be a Y-Axis movement
              path.line(currX, currY, false, currData);
            }

            prevX = currX;
            prevY = currY;
            prevData = currData;
          } else if (!options.fillHoles) {
            prevX = prevY = prevData = undefined;
          }
        }

        return path;
      };
    };
  })(window, document, Chartist);
  ; /**
    * A very basic event module that helps to generate and catch events.
    *
    * @module Chartist.Event
    */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    Chartist.EventEmitter = function () {
      var handlers = [];

      /**
       * Add an event handler for a specific event
       *
       * @memberof Chartist.Event
       * @param {String} event The event name
       * @param {Function} handler A event handler function
       */
      function addEventHandler(event, handler) {
        handlers[event] = handlers[event] || [];
        handlers[event].push(handler);
      }

      /**
       * Remove an event handler of a specific event name or remove all event handlers for a specific event.
       *
       * @memberof Chartist.Event
       * @param {String} event The event name where a specific or all handlers should be removed
       * @param {Function} [handler] An optional event handler function. If specified only this specific handler will be removed and otherwise all handlers are removed.
       */
      function removeEventHandler(event, handler) {
        // Only do something if there are event handlers with this name existing
        if (handlers[event]) {
          // If handler is set we will look for a specific handler and only remove this
          if (handler) {
            handlers[event].splice(handlers[event].indexOf(handler), 1);
            if (handlers[event].length === 0) {
              delete handlers[event];
            }
          } else {
            // If no handler is specified we remove all handlers for this event
            delete handlers[event];
          }
        }
      }

      /**
       * Use this function to emit an event. All handlers that are listening for this event will be triggered with the data parameter.
       *
       * @memberof Chartist.Event
       * @param {String} event The event name that should be triggered
       * @param {*} data Arbitrary data that will be passed to the event handler callback functions
       */
      function emit(event, data) {
        // Only do something if there are event handlers with this name existing
        if (handlers[event]) {
          handlers[event].forEach(function (handler) {
            handler(data);
          });
        }

        // Emit event to star event handlers
        if (handlers['*']) {
          handlers['*'].forEach(function (starHandler) {
            starHandler(event, data);
          });
        }
      }

      return {
        addEventHandler: addEventHandler,
        removeEventHandler: removeEventHandler,
        emit: emit
      };
    };
  })(window, document, Chartist);
  ; /**
    * This module provides some basic prototype inheritance utilities.
    *
    * @module Chartist.Class
    */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    function listToArray(list) {
      var arr = [];
      if (list.length) {
        for (var i = 0; i < list.length; i++) {
          arr.push(list[i]);
        }
      }
      return arr;
    }

    /**
     * Method to extend from current prototype.
     *
     * @memberof Chartist.Class
     * @param {Object} properties The object that serves as definition for the prototype that gets created for the new class. This object should always contain a constructor property that is the desired constructor for the newly created class.
     * @param {Object} [superProtoOverride] By default extens will use the current class prototype or Chartist.class. With this parameter you can specify any super prototype that will be used.
     * @return {Function} Constructor function of the new class
     *
     * @example
     * var Fruit = Class.extend({
       * color: undefined,
       *   sugar: undefined,
       *
       *   constructor: function(color, sugar) {
       *     this.color = color;
       *     this.sugar = sugar;
       *   },
       *
       *   eat: function() {
       *     this.sugar = 0;
       *     return this;
       *   }
       * });
     *
     * var Banana = Fruit.extend({
       *   length: undefined,
       *
       *   constructor: function(length, sugar) {
       *     Banana.super.constructor.call(this, 'Yellow', sugar);
       *     this.length = length;
       *   }
       * });
     *
     * var banana = new Banana(20, 40);
     * console.log('banana instanceof Fruit', banana instanceof Fruit);
     * console.log('Fruit is prototype of banana', Fruit.prototype.isPrototypeOf(banana));
     * console.log('bananas prototype is Fruit', Object.getPrototypeOf(banana) === Fruit.prototype);
     * console.log(banana.sugar);
     * console.log(banana.eat().sugar);
     * console.log(banana.color);
     */
    function extend(properties, superProtoOverride) {
      var superProto = superProtoOverride || this.prototype || Chartist.Class;
      var proto = Object.create(superProto);

      Chartist.Class.cloneDefinitions(proto, properties);

      var constr = function constr() {
        var fn = proto.constructor || function () {},
            instance;

        // If this is linked to the Chartist namespace the constructor was not called with new
        // To provide a fallback we will instantiate here and return the instance
        instance = this === Chartist ? Object.create(proto) : this;
        fn.apply(instance, Array.prototype.slice.call(arguments, 0));

        // If this constructor was not called with new we need to return the instance
        // This will not harm when the constructor has been called with new as the returned value is ignored
        return instance;
      };

      constr.prototype = proto;
      constr.super = superProto;
      constr.extend = this.extend;

      return constr;
    }

    // Variable argument list clones args > 0 into args[0] and retruns modified args[0]
    function cloneDefinitions() {
      var args = listToArray(arguments);
      var target = args[0];

      args.splice(1, args.length - 1).forEach(function (source) {
        Object.getOwnPropertyNames(source).forEach(function (propName) {
          // If this property already exist in target we delete it first
          delete target[propName];
          // Define the property with the descriptor from source
          Object.defineProperty(target, propName, Object.getOwnPropertyDescriptor(source, propName));
        });
      });

      return target;
    }

    Chartist.Class = {
      extend: extend,
      cloneDefinitions: cloneDefinitions
    };
  })(window, document, Chartist);
  ; /**
    * Base for all chart types. The methods in Chartist.Base are inherited to all chart types.
    *
    * @module Chartist.Base
    */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    // TODO: Currently we need to re-draw the chart on window resize. This is usually very bad and will affect performance.
    // This is done because we can't work with relative coordinates when drawing the chart because SVG Path does not
    // work with relative positions yet. We need to check if we can do a viewBox hack to switch to percentage.
    // See http://mozilla.6506.n7.nabble.com/Specyfing-paths-with-percentages-unit-td247474.html
    // Update: can be done using the above method tested here: http://codepen.io/gionkunz/pen/KDvLj
    // The problem is with the label offsets that can't be converted into percentage and affecting the chart container
    /**
     * Updates the chart which currently does a full reconstruction of the SVG DOM
     *
     * @param {Object} [data] Optional data you'd like to set for the chart before it will update. If not specified the update method will use the data that is already configured with the chart.
     * @param {Object} [options] Optional options you'd like to add to the previous options for the chart before it will update. If not specified the update method will use the options that have been already configured with the chart.
     * @param {Boolean} [override] If set to true, the passed options will be used to extend the options that have been configured already. Otherwise the chart default options will be used as the base
     * @memberof Chartist.Base
     */

    function update(data, options, override) {
      if (data) {
        this.data = data || {};
        this.data.labels = this.data.labels || [];
        this.data.series = this.data.series || [];
        // Event for data transformation that allows to manipulate the data before it gets rendered in the charts
        this.eventEmitter.emit('data', {
          type: 'update',
          data: this.data
        });
      }

      if (options) {
        this.options = Chartist.extend({}, override ? this.options : this.defaultOptions, options);

        // If chartist was not initialized yet, we just set the options and leave the rest to the initialization
        // Otherwise we re-create the optionsProvider at this point
        if (!this.initializeTimeoutId) {
          this.optionsProvider.removeMediaQueryListeners();
          this.optionsProvider = Chartist.optionsProvider(this.options, this.responsiveOptions, this.eventEmitter);
        }
      }

      // Only re-created the chart if it has been initialized yet
      if (!this.initializeTimeoutId) {
        this.createChart(this.optionsProvider.getCurrentOptions());
      }

      // Return a reference to the chart object to chain up calls
      return this;
    }

    /**
     * This method can be called on the API object of each chart and will un-register all event listeners that were added to other components. This currently includes a window.resize listener as well as media query listeners if any responsive options have been provided. Use this function if you need to destroy and recreate Chartist charts dynamically.
     *
     * @memberof Chartist.Base
     */
    function detach() {
      // Only detach if initialization already occurred on this chart. If this chart still hasn't initialized (therefore
      // the initializationTimeoutId is still a valid timeout reference, we will clear the timeout
      if (!this.initializeTimeoutId) {
        window.removeEventListener('resize', this.resizeListener);
        this.optionsProvider.removeMediaQueryListeners();
      } else {
        window.clearTimeout(this.initializeTimeoutId);
      }

      return this;
    }

    /**
     * Use this function to register event handlers. The handler callbacks are synchronous and will run in the main thread rather than the event loop.
     *
     * @memberof Chartist.Base
     * @param {String} event Name of the event. Check the examples for supported events.
     * @param {Function} handler The handler function that will be called when an event with the given name was emitted. This function will receive a data argument which contains event data. See the example for more details.
     */
    function on(event, handler) {
      this.eventEmitter.addEventHandler(event, handler);
      return this;
    }

    /**
     * Use this function to un-register event handlers. If the handler function parameter is omitted all handlers for the given event will be un-registered.
     *
     * @memberof Chartist.Base
     * @param {String} event Name of the event for which a handler should be removed
     * @param {Function} [handler] The handler function that that was previously used to register a new event handler. This handler will be removed from the event handler list. If this parameter is omitted then all event handlers for the given event are removed from the list.
     */
    function off(event, handler) {
      this.eventEmitter.removeEventHandler(event, handler);
      return this;
    }

    function initialize() {
      // Add window resize listener that re-creates the chart
      window.addEventListener('resize', this.resizeListener);

      // Obtain current options based on matching media queries (if responsive options are given)
      // This will also register a listener that is re-creating the chart based on media changes
      this.optionsProvider = Chartist.optionsProvider(this.options, this.responsiveOptions, this.eventEmitter);
      // Register options change listener that will trigger a chart update
      this.eventEmitter.addEventHandler('optionsChanged', function () {
        this.update();
      }.bind(this));

      // Before the first chart creation we need to register us with all plugins that are configured
      // Initialize all relevant plugins with our chart object and the plugin options specified in the config
      if (this.options.plugins) {
        this.options.plugins.forEach(function (plugin) {
          if (plugin instanceof Array) {
            plugin[0](this, plugin[1]);
          } else {
            plugin(this);
          }
        }.bind(this));
      }

      // Event for data transformation that allows to manipulate the data before it gets rendered in the charts
      this.eventEmitter.emit('data', {
        type: 'initial',
        data: this.data
      });

      // Create the first chart
      this.createChart(this.optionsProvider.getCurrentOptions());

      // As chart is initialized from the event loop now we can reset our timeout reference
      // This is important if the chart gets initialized on the same element twice
      this.initializeTimeoutId = undefined;
    }

    /**
     * Constructor of chart base class.
     *
     * @param query
     * @param data
     * @param defaultOptions
     * @param options
     * @param responsiveOptions
     * @constructor
     */
    function Base(query, data, defaultOptions, options, responsiveOptions) {
      this.container = Chartist.querySelector(query);
      this.data = data || {};
      this.data.labels = this.data.labels || [];
      this.data.series = this.data.series || [];
      this.defaultOptions = defaultOptions;
      this.options = options;
      this.responsiveOptions = responsiveOptions;
      this.eventEmitter = Chartist.EventEmitter();
      this.supportsForeignObject = Chartist.Svg.isSupported('Extensibility');
      this.supportsAnimations = Chartist.Svg.isSupported('AnimationEventsAttribute');
      this.resizeListener = function resizeListener() {
        this.update();
      }.bind(this);

      if (this.container) {
        // If chartist was already initialized in this container we are detaching all event listeners first
        if (this.container.__chartist__) {
          this.container.__chartist__.detach();
        }

        this.container.__chartist__ = this;
      }

      // Using event loop for first draw to make it possible to register event listeners in the same call stack where
      // the chart was created.
      this.initializeTimeoutId = setTimeout(initialize.bind(this), 0);
    }

    // Creating the chart base class
    Chartist.Base = Chartist.Class.extend({
      constructor: Base,
      optionsProvider: undefined,
      container: undefined,
      svg: undefined,
      eventEmitter: undefined,
      createChart: function createChart() {
        throw new Error('Base chart type can\'t be instantiated!');
      },
      update: update,
      detach: detach,
      on: on,
      off: off,
      version: Chartist.version,
      supportsForeignObject: false
    });
  })(window, document, Chartist);
  ; /**
    * Chartist SVG module for simple SVG DOM abstraction
    *
    * @module Chartist.Svg
    */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    /**
     * Chartist.Svg creates a new SVG object wrapper with a starting element. You can use the wrapper to fluently create sub-elements and modify them.
     *
     * @memberof Chartist.Svg
     * @constructor
     * @param {String|Element} name The name of the SVG element to create or an SVG dom element which should be wrapped into Chartist.Svg
     * @param {Object} attributes An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
     * @param {String} className This class or class list will be added to the SVG element
     * @param {Object} parent The parent SVG wrapper object where this newly created wrapper and it's element will be attached to as child
     * @param {Boolean} insertFirst If this param is set to true in conjunction with a parent element the newly created element will be added as first child element in the parent element
     */

    function Svg(name, attributes, className, parent, insertFirst) {
      // If Svg is getting called with an SVG element we just return the wrapper
      if (name instanceof Element) {
        this._node = name;
      } else {
        this._node = document.createElementNS(Chartist.namespaces.svg, name);

        // If this is an SVG element created then custom namespace
        if (name === 'svg') {
          this.attr({
            'xmlns:ct': Chartist.namespaces.ct
          });
        }
      }

      if (attributes) {
        this.attr(attributes);
      }

      if (className) {
        this.addClass(className);
      }

      if (parent) {
        if (insertFirst && parent._node.firstChild) {
          parent._node.insertBefore(this._node, parent._node.firstChild);
        } else {
          parent._node.appendChild(this._node);
        }
      }
    }

    /**
     * Set attributes on the current SVG element of the wrapper you're currently working on.
     *
     * @memberof Chartist.Svg
     * @param {Object|String} attributes An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added. If this parameter is a String then the function is used as a getter and will return the attribute value.
     * @param {String} [ns] If specified, the attribute will be obtained using getAttributeNs. In order to write namepsaced attributes you can use the namespace:attribute notation within the attributes object.
     * @return {Object|String} The current wrapper object will be returned so it can be used for chaining or the attribute value if used as getter function.
     */
    function attr(attributes, ns) {
      if (typeof attributes === 'string') {
        if (ns) {
          return this._node.getAttributeNS(ns, attributes);
        } else {
          return this._node.getAttribute(attributes);
        }
      }

      Object.keys(attributes).forEach(function (key) {
        // If the attribute value is undefined we can skip this one
        if (attributes[key] === undefined) {
          return;
        }

        if (key.indexOf(':') !== -1) {
          var namespacedAttribute = key.split(':');
          this._node.setAttributeNS(Chartist.namespaces[namespacedAttribute[0]], key, attributes[key]);
        } else {
          this._node.setAttribute(key, attributes[key]);
        }
      }.bind(this));

      return this;
    }

    /**
     * Create a new SVG element whose wrapper object will be selected for further operations. This way you can also create nested groups easily.
     *
     * @memberof Chartist.Svg
     * @param {String} name The name of the SVG element that should be created as child element of the currently selected element wrapper
     * @param {Object} [attributes] An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
     * @param {String} [className] This class or class list will be added to the SVG element
     * @param {Boolean} [insertFirst] If this param is set to true in conjunction with a parent element the newly created element will be added as first child element in the parent element
     * @return {Chartist.Svg} Returns a Chartist.Svg wrapper object that can be used to modify the containing SVG data
     */
    function elem(name, attributes, className, insertFirst) {
      return new Chartist.Svg(name, attributes, className, this, insertFirst);
    }

    /**
     * Returns the parent Chartist.SVG wrapper object
     *
     * @memberof Chartist.Svg
     * @return {Chartist.Svg} Returns a Chartist.Svg wrapper around the parent node of the current node. If the parent node is not existing or it's not an SVG node then this function will return null.
     */
    function parent() {
      return this._node.parentNode instanceof SVGElement ? new Chartist.Svg(this._node.parentNode) : null;
    }

    /**
     * This method returns a Chartist.Svg wrapper around the root SVG element of the current tree.
     *
     * @memberof Chartist.Svg
     * @return {Chartist.Svg} The root SVG element wrapped in a Chartist.Svg element
     */
    function root() {
      var node = this._node;
      while (node.nodeName !== 'svg') {
        node = node.parentNode;
      }
      return new Chartist.Svg(node);
    }

    /**
     * Find the first child SVG element of the current element that matches a CSS selector. The returned object is a Chartist.Svg wrapper.
     *
     * @memberof Chartist.Svg
     * @param {String} selector A CSS selector that is used to query for child SVG elements
     * @return {Chartist.Svg} The SVG wrapper for the element found or null if no element was found
     */
    function querySelector(selector) {
      var foundNode = this._node.querySelector(selector);
      return foundNode ? new Chartist.Svg(foundNode) : null;
    }

    /**
     * Find the all child SVG elements of the current element that match a CSS selector. The returned object is a Chartist.Svg.List wrapper.
     *
     * @memberof Chartist.Svg
     * @param {String} selector A CSS selector that is used to query for child SVG elements
     * @return {Chartist.Svg.List} The SVG wrapper list for the element found or null if no element was found
     */
    function querySelectorAll(selector) {
      var foundNodes = this._node.querySelectorAll(selector);
      return foundNodes.length ? new Chartist.Svg.List(foundNodes) : null;
    }

    /**
     * Returns the underlying SVG node for the current element.
     *
     * @memberof Chartist.Svg
     * @returns {Node}
     */
    function getNode() {
      return this._node;
    }

    /**
     * This method creates a foreignObject (see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject) that allows to embed HTML content into a SVG graphic. With the help of foreignObjects you can enable the usage of regular HTML elements inside of SVG where they are subject for SVG positioning and transformation but the Browser will use the HTML rendering capabilities for the containing DOM.
     *
     * @memberof Chartist.Svg
     * @param {Node|String} content The DOM Node, or HTML string that will be converted to a DOM Node, that is then placed into and wrapped by the foreignObject
     * @param {String} [attributes] An object with properties that will be added as attributes to the foreignObject element that is created. Attributes with undefined values will not be added.
     * @param {String} [className] This class or class list will be added to the SVG element
     * @param {Boolean} [insertFirst] Specifies if the foreignObject should be inserted as first child
     * @return {Chartist.Svg} New wrapper object that wraps the foreignObject element
     */
    function foreignObject(content, attributes, className, insertFirst) {
      // If content is string then we convert it to DOM
      // TODO: Handle case where content is not a string nor a DOM Node
      if (typeof content === 'string') {
        var container = document.createElement('div');
        container.innerHTML = content;
        content = container.firstChild;
      }

      // Adding namespace to content element
      content.setAttribute('xmlns', Chartist.namespaces.xmlns);

      // Creating the foreignObject without required extension attribute (as described here
      // http://www.w3.org/TR/SVG/extend.html#ForeignObjectElement)
      var fnObj = this.elem('foreignObject', attributes, className, insertFirst);

      // Add content to foreignObjectElement
      fnObj._node.appendChild(content);

      return fnObj;
    }

    /**
     * This method adds a new text element to the current Chartist.Svg wrapper.
     *
     * @memberof Chartist.Svg
     * @param {String} t The text that should be added to the text element that is created
     * @return {Chartist.Svg} The same wrapper object that was used to add the newly created element
     */
    function text(t) {
      this._node.appendChild(document.createTextNode(t));
      return this;
    }

    /**
     * This method will clear all child nodes of the current wrapper object.
     *
     * @memberof Chartist.Svg
     * @return {Chartist.Svg} The same wrapper object that got emptied
     */
    function empty() {
      while (this._node.firstChild) {
        this._node.removeChild(this._node.firstChild);
      }

      return this;
    }

    /**
     * This method will cause the current wrapper to remove itself from its parent wrapper. Use this method if you'd like to get rid of an element in a given DOM structure.
     *
     * @memberof Chartist.Svg
     * @return {Chartist.Svg} The parent wrapper object of the element that got removed
     */
    function remove() {
      this._node.parentNode.removeChild(this._node);
      return this.parent();
    }

    /**
     * This method will replace the element with a new element that can be created outside of the current DOM.
     *
     * @memberof Chartist.Svg
     * @param {Chartist.Svg} newElement The new Chartist.Svg object that will be used to replace the current wrapper object
     * @return {Chartist.Svg} The wrapper of the new element
     */
    function replace(newElement) {
      this._node.parentNode.replaceChild(newElement._node, this._node);
      return newElement;
    }

    /**
     * This method will append an element to the current element as a child.
     *
     * @memberof Chartist.Svg
     * @param {Chartist.Svg} element The Chartist.Svg element that should be added as a child
     * @param {Boolean} [insertFirst] Specifies if the element should be inserted as first child
     * @return {Chartist.Svg} The wrapper of the appended object
     */
    function append(element, insertFirst) {
      if (insertFirst && this._node.firstChild) {
        this._node.insertBefore(element._node, this._node.firstChild);
      } else {
        this._node.appendChild(element._node);
      }

      return this;
    }

    /**
     * Returns an array of class names that are attached to the current wrapper element. This method can not be chained further.
     *
     * @memberof Chartist.Svg
     * @return {Array} A list of classes or an empty array if there are no classes on the current element
     */
    function classes() {
      return this._node.getAttribute('class') ? this._node.getAttribute('class').trim().split(/\s+/) : [];
    }

    /**
     * Adds one or a space separated list of classes to the current element and ensures the classes are only existing once.
     *
     * @memberof Chartist.Svg
     * @param {String} names A white space separated list of class names
     * @return {Chartist.Svg} The wrapper of the current element
     */
    function addClass(names) {
      this._node.setAttribute('class', this.classes(this._node).concat(names.trim().split(/\s+/)).filter(function (elem, pos, self) {
        return self.indexOf(elem) === pos;
      }).join(' '));

      return this;
    }

    /**
     * Removes one or a space separated list of classes from the current element.
     *
     * @memberof Chartist.Svg
     * @param {String} names A white space separated list of class names
     * @return {Chartist.Svg} The wrapper of the current element
     */
    function removeClass(names) {
      var removedClasses = names.trim().split(/\s+/);

      this._node.setAttribute('class', this.classes(this._node).filter(function (name) {
        return removedClasses.indexOf(name) === -1;
      }).join(' '));

      return this;
    }

    /**
     * Removes all classes from the current element.
     *
     * @memberof Chartist.Svg
     * @return {Chartist.Svg} The wrapper of the current element
     */
    function removeAllClasses() {
      this._node.setAttribute('class', '');

      return this;
    }

    /**
     * Get element height using `getBoundingClientRect`
     *
     * @memberof Chartist.Svg
     * @return {Number} The elements height in pixels
     */
    function height() {
      return this._node.getBoundingClientRect().height;
    }

    /**
     * Get element width using `getBoundingClientRect`
     *
     * @memberof Chartist.Core
     * @return {Number} The elements width in pixels
     */
    function width() {
      return this._node.getBoundingClientRect().width;
    }

    /**
     * The animate function lets you animate the current element with SMIL animations. You can add animations for multiple attributes at the same time by using an animation definition object. This object should contain SMIL animation attributes. Please refer to http://www.w3.org/TR/SVG/animate.html for a detailed specification about the available animation attributes. Additionally an easing property can be passed in the animation definition object. This can be a string with a name of an easing function in `Chartist.Svg.Easing` or an array with four numbers specifying a cubic Bézier curve.
     * **An animations object could look like this:**
     * ```javascript
     * element.animate({
     *   opacity: {
     *     dur: 1000,
     *     from: 0,
     *     to: 1
     *   },
     *   x1: {
     *     dur: '1000ms',
     *     from: 100,
     *     to: 200,
     *     easing: 'easeOutQuart'
     *   },
     *   y1: {
     *     dur: '2s',
     *     from: 0,
     *     to: 100
     *   }
     * });
     * ```
     * **Automatic unit conversion**
     * For the `dur` and the `begin` animate attribute you can also omit a unit by passing a number. The number will automatically be converted to milli seconds.
     * **Guided mode**
     * The default behavior of SMIL animations with offset using the `begin` attribute is that the attribute will keep it's original value until the animation starts. Mostly this behavior is not desired as you'd like to have your element attributes already initialized with the animation `from` value even before the animation starts. Also if you don't specify `fill="freeze"` on an animate element or if you delete the animation after it's done (which is done in guided mode) the attribute will switch back to the initial value. This behavior is also not desired when performing simple one-time animations. For one-time animations you'd want to trigger animations immediately instead of relative to the document begin time. That's why in guided mode Chartist.Svg will also use the `begin` property to schedule a timeout and manually start the animation after the timeout. If you're using multiple SMIL definition objects for an attribute (in an array), guided mode will be disabled for this attribute, even if you explicitly enabled it.
     * If guided mode is enabled the following behavior is added:
     * - Before the animation starts (even when delayed with `begin`) the animated attribute will be set already to the `from` value of the animation
     * - `begin` is explicitly set to `indefinite` so it can be started manually without relying on document begin time (creation)
     * - The animate element will be forced to use `fill="freeze"`
     * - The animation will be triggered with `beginElement()` in a timeout where `begin` of the definition object is interpreted in milli seconds. If no `begin` was specified the timeout is triggered immediately.
     * - After the animation the element attribute value will be set to the `to` value of the animation
     * - The animate element is deleted from the DOM
     *
     * @memberof Chartist.Svg
     * @param {Object} animations An animations object where the property keys are the attributes you'd like to animate. The properties should be objects again that contain the SMIL animation attributes (usually begin, dur, from, and to). The property begin and dur is auto converted (see Automatic unit conversion). You can also schedule multiple animations for the same attribute by passing an Array of SMIL definition objects. Attributes that contain an array of SMIL definition objects will not be executed in guided mode.
     * @param {Boolean} guided Specify if guided mode should be activated for this animation (see Guided mode). If not otherwise specified, guided mode will be activated.
     * @param {Object} eventEmitter If specified, this event emitter will be notified when an animation starts or ends.
     * @return {Chartist.Svg} The current element where the animation was added
     */
    function animate(animations, guided, eventEmitter) {
      if (guided === undefined) {
        guided = true;
      }

      Object.keys(animations).forEach(function createAnimateForAttributes(attribute) {

        function createAnimate(animationDefinition, guided) {
          var attributeProperties = {},
              animate,
              timeout,
              easing;

          // Check if an easing is specified in the definition object and delete it from the object as it will not
          // be part of the animate element attributes.
          if (animationDefinition.easing) {
            // If already an easing Bézier curve array we take it or we lookup a easing array in the Easing object
            easing = animationDefinition.easing instanceof Array ? animationDefinition.easing : Chartist.Svg.Easing[animationDefinition.easing];
            delete animationDefinition.easing;
          }

          // If numeric dur or begin was provided we assume milli seconds
          animationDefinition.begin = Chartist.ensureUnit(animationDefinition.begin, 'ms');
          animationDefinition.dur = Chartist.ensureUnit(animationDefinition.dur, 'ms');

          if (easing) {
            animationDefinition.calcMode = 'spline';
            animationDefinition.keySplines = easing.join(' ');
            animationDefinition.keyTimes = '0;1';
          }

          // Adding "fill: freeze" if we are in guided mode and set initial attribute values
          if (guided) {
            animationDefinition.fill = 'freeze';
            // Animated property on our element should already be set to the animation from value in guided mode
            attributeProperties[attribute] = animationDefinition.from;
            this.attr(attributeProperties);

            // In guided mode we also set begin to indefinite so we can trigger the start manually and put the begin
            // which needs to be in ms aside
            timeout = Chartist.quantity(animationDefinition.begin || 0).value;
            animationDefinition.begin = 'indefinite';
          }

          animate = this.elem('animate', Chartist.extend({
            attributeName: attribute
          }, animationDefinition));

          if (guided) {
            // If guided we take the value that was put aside in timeout and trigger the animation manually with a timeout
            setTimeout(function () {
              // If beginElement fails we set the animated attribute to the end position and remove the animate element
              // This happens if the SMIL ElementTimeControl interface is not supported or any other problems occured in
              // the browser. (Currently FF 34 does not support animate elements in foreignObjects)
              try {
                animate._node.beginElement();
              } catch (err) {
                // Set animated attribute to current animated value
                attributeProperties[attribute] = animationDefinition.to;
                this.attr(attributeProperties);
                // Remove the animate element as it's no longer required
                animate.remove();
              }
            }.bind(this), timeout);
          }

          if (eventEmitter) {
            animate._node.addEventListener('beginEvent', function handleBeginEvent() {
              eventEmitter.emit('animationBegin', {
                element: this,
                animate: animate._node,
                params: animationDefinition
              });
            }.bind(this));
          }

          animate._node.addEventListener('endEvent', function handleEndEvent() {
            if (eventEmitter) {
              eventEmitter.emit('animationEnd', {
                element: this,
                animate: animate._node,
                params: animationDefinition
              });
            }

            if (guided) {
              // Set animated attribute to current animated value
              attributeProperties[attribute] = animationDefinition.to;
              this.attr(attributeProperties);
              // Remove the animate element as it's no longer required
              animate.remove();
            }
          }.bind(this));
        }

        // If current attribute is an array of definition objects we create an animate for each and disable guided mode
        if (animations[attribute] instanceof Array) {
          animations[attribute].forEach(function (animationDefinition) {
            createAnimate.bind(this)(animationDefinition, false);
          }.bind(this));
        } else {
          createAnimate.bind(this)(animations[attribute], guided);
        }
      }.bind(this));

      return this;
    }

    Chartist.Svg = Chartist.Class.extend({
      constructor: Svg,
      attr: attr,
      elem: elem,
      parent: parent,
      root: root,
      querySelector: querySelector,
      querySelectorAll: querySelectorAll,
      getNode: getNode,
      foreignObject: foreignObject,
      text: text,
      empty: empty,
      remove: remove,
      replace: replace,
      append: append,
      classes: classes,
      addClass: addClass,
      removeClass: removeClass,
      removeAllClasses: removeAllClasses,
      height: height,
      width: width,
      animate: animate
    });

    /**
     * This method checks for support of a given SVG feature like Extensibility, SVG-animation or the like. Check http://www.w3.org/TR/SVG11/feature for a detailed list.
     *
     * @memberof Chartist.Svg
     * @param {String} feature The SVG 1.1 feature that should be checked for support.
     * @return {Boolean} True of false if the feature is supported or not
     */
    Chartist.Svg.isSupported = function (feature) {
      return document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#' + feature, '1.1');
    };

    /**
     * This Object contains some standard easing cubic bezier curves. Then can be used with their name in the `Chartist.Svg.animate`. You can also extend the list and use your own name in the `animate` function. Click the show code button to see the available bezier functions.
     *
     * @memberof Chartist.Svg
     */
    var easingCubicBeziers = {
      easeInSine: [0.47, 0, 0.745, 0.715],
      easeOutSine: [0.39, 0.575, 0.565, 1],
      easeInOutSine: [0.445, 0.05, 0.55, 0.95],
      easeInQuad: [0.55, 0.085, 0.68, 0.53],
      easeOutQuad: [0.25, 0.46, 0.45, 0.94],
      easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
      easeInCubic: [0.55, 0.055, 0.675, 0.19],
      easeOutCubic: [0.215, 0.61, 0.355, 1],
      easeInOutCubic: [0.645, 0.045, 0.355, 1],
      easeInQuart: [0.895, 0.03, 0.685, 0.22],
      easeOutQuart: [0.165, 0.84, 0.44, 1],
      easeInOutQuart: [0.77, 0, 0.175, 1],
      easeInQuint: [0.755, 0.05, 0.855, 0.06],
      easeOutQuint: [0.23, 1, 0.32, 1],
      easeInOutQuint: [0.86, 0, 0.07, 1],
      easeInExpo: [0.95, 0.05, 0.795, 0.035],
      easeOutExpo: [0.19, 1, 0.22, 1],
      easeInOutExpo: [1, 0, 0, 1],
      easeInCirc: [0.6, 0.04, 0.98, 0.335],
      easeOutCirc: [0.075, 0.82, 0.165, 1],
      easeInOutCirc: [0.785, 0.135, 0.15, 0.86],
      easeInBack: [0.6, -0.28, 0.735, 0.045],
      easeOutBack: [0.175, 0.885, 0.32, 1.275],
      easeInOutBack: [0.68, -0.55, 0.265, 1.55]
    };

    Chartist.Svg.Easing = easingCubicBeziers;

    /**
     * This helper class is to wrap multiple `Chartist.Svg` elements into a list where you can call the `Chartist.Svg` functions on all elements in the list with one call. This is helpful when you'd like to perform calls with `Chartist.Svg` on multiple elements.
     * An instance of this class is also returned by `Chartist.Svg.querySelectorAll`.
     *
     * @memberof Chartist.Svg
     * @param {Array<Node>|NodeList} nodeList An Array of SVG DOM nodes or a SVG DOM NodeList (as returned by document.querySelectorAll)
     * @constructor
     */
    function SvgList(nodeList) {
      var list = this;

      this.svgElements = [];
      for (var i = 0; i < nodeList.length; i++) {
        this.svgElements.push(new Chartist.Svg(nodeList[i]));
      }

      // Add delegation methods for Chartist.Svg
      Object.keys(Chartist.Svg.prototype).filter(function (prototypeProperty) {
        return ['constructor', 'parent', 'querySelector', 'querySelectorAll', 'replace', 'append', 'classes', 'height', 'width'].indexOf(prototypeProperty) === -1;
      }).forEach(function (prototypeProperty) {
        list[prototypeProperty] = function () {
          var args = Array.prototype.slice.call(arguments, 0);
          list.svgElements.forEach(function (element) {
            Chartist.Svg.prototype[prototypeProperty].apply(element, args);
          });
          return list;
        };
      });
    }

    Chartist.Svg.List = Chartist.Class.extend({
      constructor: SvgList
    });
  })(window, document, Chartist);
  ; /**
    * Chartist SVG path module for SVG path description creation and modification.
    *
    * @module Chartist.Svg.Path
    */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    /**
     * Contains the descriptors of supported element types in a SVG path. Currently only move, line and curve are supported.
     *
     * @memberof Chartist.Svg.Path
     * @type {Object}
     */

    var elementDescriptions = {
      m: ['x', 'y'],
      l: ['x', 'y'],
      c: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
      a: ['rx', 'ry', 'xAr', 'lAf', 'sf', 'x', 'y']
    };

    /**
     * Default options for newly created SVG path objects.
     *
     * @memberof Chartist.Svg.Path
     * @type {Object}
     */
    var defaultOptions = {
      // The accuracy in digit count after the decimal point. This will be used to round numbers in the SVG path. If this option is set to false then no rounding will be performed.
      accuracy: 3
    };

    function element(command, params, pathElements, pos, relative, data) {
      var pathElement = Chartist.extend({
        command: relative ? command.toLowerCase() : command.toUpperCase()
      }, params, data ? { data: data } : {});

      pathElements.splice(pos, 0, pathElement);
    }

    function forEachParam(pathElements, cb) {
      pathElements.forEach(function (pathElement, pathElementIndex) {
        elementDescriptions[pathElement.command.toLowerCase()].forEach(function (paramName, paramIndex) {
          cb(pathElement, paramName, pathElementIndex, paramIndex, pathElements);
        });
      });
    }

    /**
     * Used to construct a new path object.
     *
     * @memberof Chartist.Svg.Path
     * @param {Boolean} close If set to true then this path will be closed when stringified (with a Z at the end)
     * @param {Object} options Options object that overrides the default objects. See default options for more details.
     * @constructor
     */
    function SvgPath(close, options) {
      this.pathElements = [];
      this.pos = 0;
      this.close = close;
      this.options = Chartist.extend({}, defaultOptions, options);
    }

    /**
     * Gets or sets the current position (cursor) inside of the path. You can move around the cursor freely but limited to 0 or the count of existing elements. All modifications with element functions will insert new elements at the position of this cursor.
     *
     * @memberof Chartist.Svg.Path
     * @param {Number} [pos] If a number is passed then the cursor is set to this position in the path element array.
     * @return {Chartist.Svg.Path|Number} If the position parameter was passed then the return value will be the path object for easy call chaining. If no position parameter was passed then the current position is returned.
     */
    function position(pos) {
      if (pos !== undefined) {
        this.pos = Math.max(0, Math.min(this.pathElements.length, pos));
        return this;
      } else {
        return this.pos;
      }
    }

    /**
     * Removes elements from the path starting at the current position.
     *
     * @memberof Chartist.Svg.Path
     * @param {Number} count Number of path elements that should be removed from the current position.
     * @return {Chartist.Svg.Path} The current path object for easy call chaining.
     */
    function remove(count) {
      this.pathElements.splice(this.pos, count);
      return this;
    }

    /**
     * Use this function to add a new move SVG path element.
     *
     * @memberof Chartist.Svg.Path
     * @param {Number} x The x coordinate for the move element.
     * @param {Number} y The y coordinate for the move element.
     * @param {Boolean} [relative] If set to true the move element will be created with relative coordinates (lowercase letter)
     * @param {*} [data] Any data that should be stored with the element object that will be accessible in pathElement
     * @return {Chartist.Svg.Path} The current path object for easy call chaining.
     */
    function move(x, y, relative, data) {
      element('M', {
        x: +x,
        y: +y
      }, this.pathElements, this.pos++, relative, data);
      return this;
    }

    /**
     * Use this function to add a new line SVG path element.
     *
     * @memberof Chartist.Svg.Path
     * @param {Number} x The x coordinate for the line element.
     * @param {Number} y The y coordinate for the line element.
     * @param {Boolean} [relative] If set to true the line element will be created with relative coordinates (lowercase letter)
     * @param {*} [data] Any data that should be stored with the element object that will be accessible in pathElement
     * @return {Chartist.Svg.Path} The current path object for easy call chaining.
     */
    function line(x, y, relative, data) {
      element('L', {
        x: +x,
        y: +y
      }, this.pathElements, this.pos++, relative, data);
      return this;
    }

    /**
     * Use this function to add a new curve SVG path element.
     *
     * @memberof Chartist.Svg.Path
     * @param {Number} x1 The x coordinate for the first control point of the bezier curve.
     * @param {Number} y1 The y coordinate for the first control point of the bezier curve.
     * @param {Number} x2 The x coordinate for the second control point of the bezier curve.
     * @param {Number} y2 The y coordinate for the second control point of the bezier curve.
     * @param {Number} x The x coordinate for the target point of the curve element.
     * @param {Number} y The y coordinate for the target point of the curve element.
     * @param {Boolean} [relative] If set to true the curve element will be created with relative coordinates (lowercase letter)
     * @param {*} [data] Any data that should be stored with the element object that will be accessible in pathElement
     * @return {Chartist.Svg.Path} The current path object for easy call chaining.
     */
    function curve(x1, y1, x2, y2, x, y, relative, data) {
      element('C', {
        x1: +x1,
        y1: +y1,
        x2: +x2,
        y2: +y2,
        x: +x,
        y: +y
      }, this.pathElements, this.pos++, relative, data);
      return this;
    }

    /**
     * Use this function to add a new non-bezier curve SVG path element.
     *
     * @memberof Chartist.Svg.Path
     * @param {Number} rx The radius to be used for the x-axis of the arc.
     * @param {Number} ry The radius to be used for the y-axis of the arc.
     * @param {Number} xAr Defines the orientation of the arc
     * @param {Number} lAf Large arc flag
     * @param {Number} sf Sweep flag
     * @param {Number} x The x coordinate for the target point of the curve element.
     * @param {Number} y The y coordinate for the target point of the curve element.
     * @param {Boolean} [relative] If set to true the curve element will be created with relative coordinates (lowercase letter)
     * @param {*} [data] Any data that should be stored with the element object that will be accessible in pathElement
     * @return {Chartist.Svg.Path} The current path object for easy call chaining.
     */
    function arc(rx, ry, xAr, lAf, sf, x, y, relative, data) {
      element('A', {
        rx: +rx,
        ry: +ry,
        xAr: +xAr,
        lAf: +lAf,
        sf: +sf,
        x: +x,
        y: +y
      }, this.pathElements, this.pos++, relative, data);
      return this;
    }

    /**
     * Parses an SVG path seen in the d attribute of path elements, and inserts the parsed elements into the existing path object at the current cursor position. Any closing path indicators (Z at the end of the path) will be ignored by the parser as this is provided by the close option in the options of the path object.
     *
     * @memberof Chartist.Svg.Path
     * @param {String} path Any SVG path that contains move (m), line (l) or curve (c) components.
     * @return {Chartist.Svg.Path} The current path object for easy call chaining.
     */
    function parse(path) {
      // Parsing the SVG path string into an array of arrays [['M', '10', '10'], ['L', '100', '100']]
      var chunks = path.replace(/([A-Za-z])([0-9])/g, '$1 $2').replace(/([0-9])([A-Za-z])/g, '$1 $2').split(/[\s,]+/).reduce(function (result, element) {
        if (element.match(/[A-Za-z]/)) {
          result.push([]);
        }

        result[result.length - 1].push(element);
        return result;
      }, []);

      // If this is a closed path we remove the Z at the end because this is determined by the close option
      if (chunks[chunks.length - 1][0].toUpperCase() === 'Z') {
        chunks.pop();
      }

      // Using svgPathElementDescriptions to map raw path arrays into objects that contain the command and the parameters
      // For example {command: 'M', x: '10', y: '10'}
      var elements = chunks.map(function (chunk) {
        var command = chunk.shift(),
            description = elementDescriptions[command.toLowerCase()];

        return Chartist.extend({
          command: command
        }, description.reduce(function (result, paramName, index) {
          result[paramName] = +chunk[index];
          return result;
        }, {}));
      });

      // Preparing a splice call with the elements array as var arg params and insert the parsed elements at the current position
      var spliceArgs = [this.pos, 0];
      Array.prototype.push.apply(spliceArgs, elements);
      Array.prototype.splice.apply(this.pathElements, spliceArgs);
      // Increase the internal position by the element count
      this.pos += elements.length;

      return this;
    }

    /**
     * This function renders to current SVG path object into a final SVG string that can be used in the d attribute of SVG path elements. It uses the accuracy option to round big decimals. If the close parameter was set in the constructor of this path object then a path closing Z will be appended to the output string.
     *
     * @memberof Chartist.Svg.Path
     * @return {String}
     */
    function stringify() {
      var accuracyMultiplier = Math.pow(10, this.options.accuracy);

      return this.pathElements.reduce(function (path, pathElement) {
        var params = elementDescriptions[pathElement.command.toLowerCase()].map(function (paramName) {
          return this.options.accuracy ? Math.round(pathElement[paramName] * accuracyMultiplier) / accuracyMultiplier : pathElement[paramName];
        }.bind(this));

        return path + pathElement.command + params.join(',');
      }.bind(this), '') + (this.close ? 'Z' : '');
    }

    /**
     * Scales all elements in the current SVG path object. There is an individual parameter for each coordinate. Scaling will also be done for control points of curves, affecting the given coordinate.
     *
     * @memberof Chartist.Svg.Path
     * @param {Number} x The number which will be used to scale the x, x1 and x2 of all path elements.
     * @param {Number} y The number which will be used to scale the y, y1 and y2 of all path elements.
     * @return {Chartist.Svg.Path} The current path object for easy call chaining.
     */
    function scale(x, y) {
      forEachParam(this.pathElements, function (pathElement, paramName) {
        pathElement[paramName] *= paramName[0] === 'x' ? x : y;
      });
      return this;
    }

    /**
     * Translates all elements in the current SVG path object. The translation is relative and there is an individual parameter for each coordinate. Translation will also be done for control points of curves, affecting the given coordinate.
     *
     * @memberof Chartist.Svg.Path
     * @param {Number} x The number which will be used to translate the x, x1 and x2 of all path elements.
     * @param {Number} y The number which will be used to translate the y, y1 and y2 of all path elements.
     * @return {Chartist.Svg.Path} The current path object for easy call chaining.
     */
    function translate(x, y) {
      forEachParam(this.pathElements, function (pathElement, paramName) {
        pathElement[paramName] += paramName[0] === 'x' ? x : y;
      });
      return this;
    }

    /**
     * This function will run over all existing path elements and then loop over their attributes. The callback function will be called for every path element attribute that exists in the current path.
     * The method signature of the callback function looks like this:
     * ```javascript
     * function(pathElement, paramName, pathElementIndex, paramIndex, pathElements)
     * ```
     * If something else than undefined is returned by the callback function, this value will be used to replace the old value. This allows you to build custom transformations of path objects that can't be achieved using the basic transformation functions scale and translate.
     *
     * @memberof Chartist.Svg.Path
     * @param {Function} transformFnc The callback function for the transformation. Check the signature in the function description.
     * @return {Chartist.Svg.Path} The current path object for easy call chaining.
     */
    function transform(transformFnc) {
      forEachParam(this.pathElements, function (pathElement, paramName, pathElementIndex, paramIndex, pathElements) {
        var transformed = transformFnc(pathElement, paramName, pathElementIndex, paramIndex, pathElements);
        if (transformed || transformed === 0) {
          pathElement[paramName] = transformed;
        }
      });
      return this;
    }

    /**
     * This function clones a whole path object with all its properties. This is a deep clone and path element objects will also be cloned.
     *
     * @memberof Chartist.Svg.Path
     * @param {Boolean} [close] Optional option to set the new cloned path to closed. If not specified or false, the original path close option will be used.
     * @return {Chartist.Svg.Path}
     */
    function clone(close) {
      var c = new Chartist.Svg.Path(close || this.close);
      c.pos = this.pos;
      c.pathElements = this.pathElements.slice().map(function cloneElements(pathElement) {
        return Chartist.extend({}, pathElement);
      });
      c.options = Chartist.extend({}, this.options);
      return c;
    }

    /**
     * Split a Svg.Path object by a specific command in the path chain. The path chain will be split and an array of newly created paths objects will be returned. This is useful if you'd like to split an SVG path by it's move commands, for example, in order to isolate chunks of drawings.
     *
     * @memberof Chartist.Svg.Path
     * @param {String} command The command you'd like to use to split the path
     * @return {Array<Chartist.Svg.Path>}
     */
    function splitByCommand(command) {
      var split = [new Chartist.Svg.Path()];

      this.pathElements.forEach(function (pathElement) {
        if (pathElement.command === command.toUpperCase() && split[split.length - 1].pathElements.length !== 0) {
          split.push(new Chartist.Svg.Path());
        }

        split[split.length - 1].pathElements.push(pathElement);
      });

      return split;
    }

    /**
     * This static function on `Chartist.Svg.Path` is joining multiple paths together into one paths.
     *
     * @memberof Chartist.Svg.Path
     * @param {Array<Chartist.Svg.Path>} paths A list of paths to be joined together. The order is important.
     * @param {boolean} close If the newly created path should be a closed path
     * @param {Object} options Path options for the newly created path.
     * @return {Chartist.Svg.Path}
     */

    function join(paths, close, options) {
      var joinedPath = new Chartist.Svg.Path(close, options);
      for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        for (var j = 0; j < path.pathElements.length; j++) {
          joinedPath.pathElements.push(path.pathElements[j]);
        }
      }
      return joinedPath;
    }

    Chartist.Svg.Path = Chartist.Class.extend({
      constructor: SvgPath,
      position: position,
      remove: remove,
      move: move,
      line: line,
      curve: curve,
      arc: arc,
      scale: scale,
      translate: translate,
      transform: transform,
      parse: parse,
      stringify: stringify,
      clone: clone,
      splitByCommand: splitByCommand
    });

    Chartist.Svg.Path.elementDescriptions = elementDescriptions;
    Chartist.Svg.Path.join = join;
  })(window, document, Chartist);
  ; /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    var axisUnits = {
      x: {
        pos: 'x',
        len: 'width',
        dir: 'horizontal',
        rectStart: 'x1',
        rectEnd: 'x2',
        rectOffset: 'y2'
      },
      y: {
        pos: 'y',
        len: 'height',
        dir: 'vertical',
        rectStart: 'y2',
        rectEnd: 'y1',
        rectOffset: 'x1'
      }
    };

    function Axis(units, chartRect, ticks, options) {
      this.units = units;
      this.counterUnits = units === axisUnits.x ? axisUnits.y : axisUnits.x;
      this.chartRect = chartRect;
      this.axisLength = chartRect[units.rectEnd] - chartRect[units.rectStart];
      this.gridOffset = chartRect[units.rectOffset];
      this.ticks = ticks;
      this.options = options;
    }

    function createGridAndLabels(gridGroup, labelGroup, useForeignObject, chartOptions, eventEmitter) {
      var axisOptions = chartOptions['axis' + this.units.pos.toUpperCase()];
      var projectedValues = this.ticks.map(this.projectValue.bind(this));
      var labelValues = this.ticks.map(axisOptions.labelInterpolationFnc);

      projectedValues.forEach(function (projectedValue, index) {
        var labelOffset = {
          x: 0,
          y: 0
        };

        // TODO: Find better solution for solving this problem
        // Calculate how much space we have available for the label
        var labelLength;
        if (projectedValues[index + 1]) {
          // If we still have one label ahead, we can calculate the distance to the next tick / label
          labelLength = projectedValues[index + 1] - projectedValue;
        } else {
          // If we don't have a label ahead and we have only two labels in total, we just take the remaining distance to
          // on the whole axis length. We limit that to a minimum of 30 pixel, so that labels close to the border will
          // still be visible inside of the chart padding.
          labelLength = Math.max(this.axisLength - projectedValue, 30);
        }

        // Skip grid lines and labels where interpolated label values are falsey (execpt for 0)
        if (Chartist.isFalseyButZero(labelValues[index]) && labelValues[index] !== '') {
          return;
        }

        // Transform to global coordinates using the chartRect
        // We also need to set the label offset for the createLabel function
        if (this.units.pos === 'x') {
          projectedValue = this.chartRect.x1 + projectedValue;
          labelOffset.x = chartOptions.axisX.labelOffset.x;

          // If the labels should be positioned in start position (top side for vertical axis) we need to set a
          // different offset as for positioned with end (bottom)
          if (chartOptions.axisX.position === 'start') {
            labelOffset.y = this.chartRect.padding.top + chartOptions.axisX.labelOffset.y + (useForeignObject ? 5 : 20);
          } else {
            labelOffset.y = this.chartRect.y1 + chartOptions.axisX.labelOffset.y + (useForeignObject ? 5 : 20);
          }
        } else {
          projectedValue = this.chartRect.y1 - projectedValue;
          labelOffset.y = chartOptions.axisY.labelOffset.y - (useForeignObject ? labelLength : 0);

          // If the labels should be positioned in start position (left side for horizontal axis) we need to set a
          // different offset as for positioned with end (right side)
          if (chartOptions.axisY.position === 'start') {
            labelOffset.x = useForeignObject ? this.chartRect.padding.left + chartOptions.axisY.labelOffset.x : this.chartRect.x1 - 10;
          } else {
            labelOffset.x = this.chartRect.x2 + chartOptions.axisY.labelOffset.x + 10;
          }
        }

        if (axisOptions.showGrid) {
          Chartist.createGrid(projectedValue, index, this, this.gridOffset, this.chartRect[this.counterUnits.len](), gridGroup, [chartOptions.classNames.grid, chartOptions.classNames[this.units.dir]], eventEmitter);
        }

        if (axisOptions.showLabel) {
          Chartist.createLabel(projectedValue, labelLength, index, labelValues, this, axisOptions.offset, labelOffset, labelGroup, [chartOptions.classNames.label, chartOptions.classNames[this.units.dir], axisOptions.position === 'start' ? chartOptions.classNames[axisOptions.position] : chartOptions.classNames['end']], useForeignObject, eventEmitter);
        }
      }.bind(this));
    }

    Chartist.Axis = Chartist.Class.extend({
      constructor: Axis,
      createGridAndLabels: createGridAndLabels,
      projectValue: function projectValue(value, index, data) {
        throw new Error('Base axis can\'t be instantiated!');
      }
    });

    Chartist.Axis.units = axisUnits;
  })(window, document, Chartist);
  ; /**
    * The auto scale axis uses standard linear scale projection of values along an axis. It uses order of magnitude to find a scale automatically and evaluates the available space in order to find the perfect amount of ticks for your chart.
    * **Options**
    * The following options are used by this axis in addition to the default axis options outlined in the axis configuration of the chart default settings.
    * ```javascript
    * var options = {
    *   // If high is specified then the axis will display values explicitly up to this value and the computed maximum from the data is ignored
    *   high: 100,
    *   // If low is specified then the axis will display values explicitly down to this value and the computed minimum from the data is ignored
    *   low: 0,
    *   // This option will be used when finding the right scale division settings. The amount of ticks on the scale will be determined so that as many ticks as possible will be displayed, while not violating this minimum required space (in pixel).
    *   scaleMinSpace: 20,
    *   // Can be set to true or false. If set to true, the scale will be generated with whole numbers only.
    *   onlyInteger: true,
    *   // The reference value can be used to make sure that this value will always be on the chart. This is especially useful on bipolar charts where the bipolar center always needs to be part of the chart.
    *   referenceValue: 5
    * };
    * ```
    *
    * @module Chartist.AutoScaleAxis
    */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    function AutoScaleAxis(axisUnit, data, chartRect, options) {
      // Usually we calculate highLow based on the data but this can be overriden by a highLow object in the options
      var highLow = options.highLow || Chartist.getHighLow(data, options, axisUnit.pos);
      this.bounds = Chartist.getBounds(chartRect[axisUnit.rectEnd] - chartRect[axisUnit.rectStart], highLow, options.scaleMinSpace || 20, options.onlyInteger);
      this.range = {
        min: this.bounds.min,
        max: this.bounds.max
      };

      Chartist.AutoScaleAxis.super.constructor.call(this, axisUnit, chartRect, this.bounds.values, options);
    }

    function projectValue(value) {
      return this.axisLength * (+Chartist.getMultiValue(value, this.units.pos) - this.bounds.min) / this.bounds.range;
    }

    Chartist.AutoScaleAxis = Chartist.Axis.extend({
      constructor: AutoScaleAxis,
      projectValue: projectValue
    });
  })(window, document, Chartist);
  ; /**
    * The fixed scale axis uses standard linear projection of values along an axis. It makes use of a divisor option to divide the range provided from the minimum and maximum value or the options high and low that will override the computed minimum and maximum.
    * **Options**
    * The following options are used by this axis in addition to the default axis options outlined in the axis configuration of the chart default settings.
    * ```javascript
    * var options = {
    *   // If high is specified then the axis will display values explicitly up to this value and the computed maximum from the data is ignored
    *   high: 100,
    *   // If low is specified then the axis will display values explicitly down to this value and the computed minimum from the data is ignored
    *   low: 0,
    *   // If specified then the value range determined from minimum to maximum (or low and high) will be divided by this number and ticks will be generated at those division points. The default divisor is 1.
    *   divisor: 4,
    *   // If ticks is explicitly set, then the axis will not compute the ticks with the divisor, but directly use the data in ticks to determine at what points on the axis a tick need to be generated.
    *   ticks: [1, 10, 20, 30]
    * };
    * ```
    *
    * @module Chartist.FixedScaleAxis
    */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    function FixedScaleAxis(axisUnit, data, chartRect, options) {
      var highLow = options.highLow || Chartist.getHighLow(data, options, axisUnit.pos);
      this.divisor = options.divisor || 1;
      this.ticks = options.ticks || Chartist.times(this.divisor).map(function (value, index) {
        return highLow.low + (highLow.high - highLow.low) / this.divisor * index;
      }.bind(this));
      this.ticks.sort(function (a, b) {
        return a - b;
      });
      this.range = {
        min: highLow.low,
        max: highLow.high
      };

      Chartist.FixedScaleAxis.super.constructor.call(this, axisUnit, chartRect, this.ticks, options);

      this.stepLength = this.axisLength / this.divisor;
    }

    function projectValue(value) {
      return this.axisLength * (+Chartist.getMultiValue(value, this.units.pos) - this.range.min) / (this.range.max - this.range.min);
    }

    Chartist.FixedScaleAxis = Chartist.Axis.extend({
      constructor: FixedScaleAxis,
      projectValue: projectValue
    });
  })(window, document, Chartist);
  ; /**
    * The step axis for step based charts like bar chart or step based line charts. It uses a fixed amount of ticks that will be equally distributed across the whole axis length. The projection is done using the index of the data value rather than the value itself and therefore it's only useful for distribution purpose.
    * **Options**
    * The following options are used by this axis in addition to the default axis options outlined in the axis configuration of the chart default settings.
    * ```javascript
    * var options = {
    *   // Ticks to be used to distribute across the axis length. As this axis type relies on the index of the value rather than the value, arbitrary data that can be converted to a string can be used as ticks.
    *   ticks: ['One', 'Two', 'Three'],
    *   // If set to true the full width will be used to distribute the values where the last value will be at the maximum of the axis length. If false the spaces between the ticks will be evenly distributed instead.
    *   stretch: true
    * };
    * ```
    *
    * @module Chartist.StepAxis
    */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    function StepAxis(axisUnit, data, chartRect, options) {
      Chartist.StepAxis.super.constructor.call(this, axisUnit, chartRect, options.ticks, options);

      var calc = Math.max(1, options.ticks.length - (options.stretch ? 1 : 0));
      this.stepLength = this.axisLength / calc;
    }

    function projectValue(value, index) {
      return this.stepLength * index;
    }

    Chartist.StepAxis = Chartist.Axis.extend({
      constructor: StepAxis,
      projectValue: projectValue
    });
  })(window, document, Chartist);
  ; /**
    * The Chartist line chart can be used to draw Line or Scatter charts. If used in the browser you can access the global `Chartist` namespace where you find the `Line` function as a main entry point.
    *
    * For examples on how to use the line chart please check the examples of the `Chartist.Line` method.
    *
    * @module Chartist.Line
    */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    /**
     * Default options in line charts. Expand the code view to see a detailed list of options with comments.
     *
     * @memberof Chartist.Line
     */

    var defaultOptions = {
      // Options for X-Axis
      axisX: {
        // The offset of the labels to the chart area
        offset: 30,
        // Position where labels are placed. Can be set to `start` or `end` where `start` is equivalent to left or top on vertical axis and `end` is equivalent to right or bottom on horizontal axis.
        position: 'end',
        // Allows you to correct label positioning on this axis by positive or negative x and y offset.
        labelOffset: {
          x: 0,
          y: 0
        },
        // If labels should be shown or not
        showLabel: true,
        // If the axis grid should be drawn or not
        showGrid: true,
        // Interpolation function that allows you to intercept the value from the axis label
        labelInterpolationFnc: Chartist.noop,
        // Set the axis type to be used to project values on this axis. If not defined, Chartist.StepAxis will be used for the X-Axis, where the ticks option will be set to the labels in the data and the stretch option will be set to the global fullWidth option. This type can be changed to any axis constructor available (e.g. Chartist.FixedScaleAxis), where all axis options should be present here.
        type: undefined
      },
      // Options for Y-Axis
      axisY: {
        // The offset of the labels to the chart area
        offset: 40,
        // Position where labels are placed. Can be set to `start` or `end` where `start` is equivalent to left or top on vertical axis and `end` is equivalent to right or bottom on horizontal axis.
        position: 'start',
        // Allows you to correct label positioning on this axis by positive or negative x and y offset.
        labelOffset: {
          x: 0,
          y: 0
        },
        // If labels should be shown or not
        showLabel: true,
        // If the axis grid should be drawn or not
        showGrid: true,
        // Interpolation function that allows you to intercept the value from the axis label
        labelInterpolationFnc: Chartist.noop,
        // Set the axis type to be used to project values on this axis. If not defined, Chartist.AutoScaleAxis will be used for the Y-Axis, where the high and low options will be set to the global high and low options. This type can be changed to any axis constructor available (e.g. Chartist.FixedScaleAxis), where all axis options should be present here.
        type: undefined,
        // This value specifies the minimum height in pixel of the scale steps
        scaleMinSpace: 20,
        // Use only integer values (whole numbers) for the scale steps
        onlyInteger: false
      },
      // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
      width: undefined,
      // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
      height: undefined,
      // If the line should be drawn or not
      showLine: true,
      // If dots should be drawn or not
      showPoint: true,
      // If the line chart should draw an area
      showArea: false,
      // The base for the area chart that will be used to close the area shape (is normally 0)
      areaBase: 0,
      // Specify if the lines should be smoothed. This value can be true or false where true will result in smoothing using the default smoothing interpolation function Chartist.Interpolation.cardinal and false results in Chartist.Interpolation.none. You can also choose other smoothing / interpolation functions available in the Chartist.Interpolation module, or write your own interpolation function. Check the examples for a brief description.
      lineSmooth: true,
      // If the line chart should add a background fill to the .ct-grids group.
      showGridBackground: false,
      // Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
      low: undefined,
      // Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
      high: undefined,
      // Padding of the chart drawing area to the container element and labels as a number or padding object {top: 5, right: 5, bottom: 5, left: 5}
      chartPadding: {
        top: 15,
        right: 15,
        bottom: 5,
        left: 10
      },
      // When set to true, the last grid line on the x-axis is not drawn and the chart elements will expand to the full available width of the chart. For the last label to be drawn correctly you might need to add chart padding or offset the last label with a draw event handler.
      fullWidth: false,
      // If true the whole data is reversed including labels, the series order as well as the whole series data arrays.
      reverseData: false,
      // Override the class names that get used to generate the SVG structure of the chart
      classNames: {
        chart: 'ct-chart-line',
        label: 'ct-label',
        labelGroup: 'ct-labels',
        series: 'ct-series',
        line: 'ct-line',
        point: 'ct-point',
        area: 'ct-area',
        grid: 'ct-grid',
        gridGroup: 'ct-grids',
        gridBackground: 'ct-grid-background',
        vertical: 'ct-vertical',
        horizontal: 'ct-horizontal',
        start: 'ct-start',
        end: 'ct-end'
      }
    };

    /**
     * Creates a new chart
     *
     */
    function createChart(options) {
      var data = Chartist.normalizeData(this.data, options.reverseData, true);

      // Create new svg object
      this.svg = Chartist.createSvg(this.container, options.width, options.height, options.classNames.chart);
      // Create groups for labels, grid and series
      var gridGroup = this.svg.elem('g').addClass(options.classNames.gridGroup);
      var seriesGroup = this.svg.elem('g');
      var labelGroup = this.svg.elem('g').addClass(options.classNames.labelGroup);

      var chartRect = Chartist.createChartRect(this.svg, options, defaultOptions.padding);
      var axisX, axisY;

      if (options.axisX.type === undefined) {
        axisX = new Chartist.StepAxis(Chartist.Axis.units.x, data.normalized.series, chartRect, Chartist.extend({}, options.axisX, {
          ticks: data.normalized.labels,
          stretch: options.fullWidth
        }));
      } else {
        axisX = options.axisX.type.call(Chartist, Chartist.Axis.units.x, data.normalized.series, chartRect, options.axisX);
      }

      if (options.axisY.type === undefined) {
        axisY = new Chartist.AutoScaleAxis(Chartist.Axis.units.y, data.normalized.series, chartRect, Chartist.extend({}, options.axisY, {
          high: Chartist.isNumeric(options.high) ? options.high : options.axisY.high,
          low: Chartist.isNumeric(options.low) ? options.low : options.axisY.low
        }));
      } else {
        axisY = options.axisY.type.call(Chartist, Chartist.Axis.units.y, data.normalized.series, chartRect, options.axisY);
      }

      axisX.createGridAndLabels(gridGroup, labelGroup, this.supportsForeignObject, options, this.eventEmitter);
      axisY.createGridAndLabels(gridGroup, labelGroup, this.supportsForeignObject, options, this.eventEmitter);

      if (options.showGridBackground) {
        Chartist.createGridBackground(gridGroup, chartRect, options.classNames.gridBackground, this.eventEmitter);
      }

      // Draw the series
      data.raw.series.forEach(function (series, seriesIndex) {
        var seriesElement = seriesGroup.elem('g');

        // Write attributes to series group element. If series name or meta is undefined the attributes will not be written
        seriesElement.attr({
          'ct:series-name': series.name,
          'ct:meta': Chartist.serialize(series.meta)
        });

        // Use series class from series data or if not set generate one
        seriesElement.addClass([options.classNames.series, series.className || options.classNames.series + '-' + Chartist.alphaNumerate(seriesIndex)].join(' '));

        var pathCoordinates = [],
            pathData = [];

        data.normalized.series[seriesIndex].forEach(function (value, valueIndex) {
          var p = {
            x: chartRect.x1 + axisX.projectValue(value, valueIndex, data.normalized.series[seriesIndex]),
            y: chartRect.y1 - axisY.projectValue(value, valueIndex, data.normalized.series[seriesIndex])
          };
          pathCoordinates.push(p.x, p.y);
          pathData.push({
            value: value,
            valueIndex: valueIndex,
            meta: Chartist.getMetaData(series, valueIndex)
          });
        }.bind(this));

        var seriesOptions = {
          lineSmooth: Chartist.getSeriesOption(series, options, 'lineSmooth'),
          showPoint: Chartist.getSeriesOption(series, options, 'showPoint'),
          showLine: Chartist.getSeriesOption(series, options, 'showLine'),
          showArea: Chartist.getSeriesOption(series, options, 'showArea'),
          areaBase: Chartist.getSeriesOption(series, options, 'areaBase')
        };

        var smoothing = typeof seriesOptions.lineSmooth === 'function' ? seriesOptions.lineSmooth : seriesOptions.lineSmooth ? Chartist.Interpolation.monotoneCubic() : Chartist.Interpolation.none();
        // Interpolating path where pathData will be used to annotate each path element so we can trace back the original
        // index, value and meta data
        var path = smoothing(pathCoordinates, pathData);

        // If we should show points we need to create them now to avoid secondary loop
        // Points are drawn from the pathElements returned by the interpolation function
        // Small offset for Firefox to render squares correctly
        if (seriesOptions.showPoint) {

          path.pathElements.forEach(function (pathElement) {
            var point = seriesElement.elem('line', {
              x1: pathElement.x,
              y1: pathElement.y,
              x2: pathElement.x + 0.01,
              y2: pathElement.y
            }, options.classNames.point).attr({
              'ct:value': [pathElement.data.value.x, pathElement.data.value.y].filter(Chartist.isNumeric).join(','),
              'ct:meta': Chartist.serialize(pathElement.data.meta)
            });

            this.eventEmitter.emit('draw', {
              type: 'point',
              value: pathElement.data.value,
              index: pathElement.data.valueIndex,
              meta: pathElement.data.meta,
              series: series,
              seriesIndex: seriesIndex,
              axisX: axisX,
              axisY: axisY,
              group: seriesElement,
              element: point,
              x: pathElement.x,
              y: pathElement.y
            });
          }.bind(this));
        }

        if (seriesOptions.showLine) {
          var line = seriesElement.elem('path', {
            d: path.stringify()
          }, options.classNames.line, true);

          this.eventEmitter.emit('draw', {
            type: 'line',
            values: data.normalized.series[seriesIndex],
            path: path.clone(),
            chartRect: chartRect,
            index: seriesIndex,
            series: series,
            seriesIndex: seriesIndex,
            seriesMeta: series.meta,
            axisX: axisX,
            axisY: axisY,
            group: seriesElement,
            element: line
          });
        }

        // Area currently only works with axes that support a range!
        if (seriesOptions.showArea && axisY.range) {
          // If areaBase is outside the chart area (< min or > max) we need to set it respectively so that
          // the area is not drawn outside the chart area.
          var areaBase = Math.max(Math.min(seriesOptions.areaBase, axisY.range.max), axisY.range.min);

          // We project the areaBase value into screen coordinates
          var areaBaseProjected = chartRect.y1 - axisY.projectValue(areaBase);

          // In order to form the area we'll first split the path by move commands so we can chunk it up into segments
          path.splitByCommand('M').filter(function onlySolidSegments(pathSegment) {
            // We filter only "solid" segments that contain more than one point. Otherwise there's no need for an area
            return pathSegment.pathElements.length > 1;
          }).map(function convertToArea(solidPathSegments) {
            // Receiving the filtered solid path segments we can now convert those segments into fill areas
            var firstElement = solidPathSegments.pathElements[0];
            var lastElement = solidPathSegments.pathElements[solidPathSegments.pathElements.length - 1];

            // Cloning the solid path segment with closing option and removing the first move command from the clone
            // We then insert a new move that should start at the area base and draw a straight line up or down
            // at the end of the path we add an additional straight line to the projected area base value
            // As the closing option is set our path will be automatically closed
            return solidPathSegments.clone(true).position(0).remove(1).move(firstElement.x, areaBaseProjected).line(firstElement.x, firstElement.y).position(solidPathSegments.pathElements.length + 1).line(lastElement.x, areaBaseProjected);
          }).forEach(function createArea(areaPath) {
            // For each of our newly created area paths, we'll now create path elements by stringifying our path objects
            // and adding the created DOM elements to the correct series group
            var area = seriesElement.elem('path', {
              d: areaPath.stringify()
            }, options.classNames.area, true);

            // Emit an event for each area that was drawn
            this.eventEmitter.emit('draw', {
              type: 'area',
              values: data.normalized.series[seriesIndex],
              path: areaPath.clone(),
              series: series,
              seriesIndex: seriesIndex,
              axisX: axisX,
              axisY: axisY,
              chartRect: chartRect,
              index: seriesIndex,
              group: seriesElement,
              element: area
            });
          }.bind(this));
        }
      }.bind(this));

      this.eventEmitter.emit('created', {
        bounds: axisY.bounds,
        chartRect: chartRect,
        axisX: axisX,
        axisY: axisY,
        svg: this.svg,
        options: options
      });
    }

    /**
     * This method creates a new line chart.
     *
     * @memberof Chartist.Line
     * @param {String|Node} query A selector query string or directly a DOM element
     * @param {Object} data The data object that needs to consist of a labels and a series array
     * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
     * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
     * @return {Object} An object which exposes the API for the created chart
     *
     * @example
     * // Create a simple line chart
     * var data = {
     *   // A labels array that can contain any sort of values
     *   labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
     *   // Our series array that contains series objects or in this case series data arrays
     *   series: [
     *     [5, 2, 4, 2, 0]
     *   ]
     * };
     *
     * // As options we currently only set a static size of 300x200 px
     * var options = {
     *   width: '300px',
     *   height: '200px'
     * };
     *
     * // In the global name space Chartist we call the Line function to initialize a line chart. As a first parameter we pass in a selector where we would like to get our chart created. Second parameter is the actual data object and as a third parameter we pass in our options
     * new Chartist.Line('.ct-chart', data, options);
     *
     * @example
     * // Use specific interpolation function with configuration from the Chartist.Interpolation module
     *
     * var chart = new Chartist.Line('.ct-chart', {
     *   labels: [1, 2, 3, 4, 5],
     *   series: [
     *     [1, 1, 8, 1, 7]
     *   ]
     * }, {
     *   lineSmooth: Chartist.Interpolation.cardinal({
     *     tension: 0.2
     *   })
     * });
     *
     * @example
     * // Create a line chart with responsive options
     *
     * var data = {
     *   // A labels array that can contain any sort of values
     *   labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
     *   // Our series array that contains series objects or in this case series data arrays
     *   series: [
     *     [5, 2, 4, 2, 0]
     *   ]
     * };
     *
     * // In addition to the regular options we specify responsive option overrides that will override the default configutation based on the matching media queries.
     * var responsiveOptions = [
     *   ['screen and (min-width: 641px) and (max-width: 1024px)', {
     *     showPoint: false,
     *     axisX: {
     *       labelInterpolationFnc: function(value) {
     *         // Will return Mon, Tue, Wed etc. on medium screens
     *         return value.slice(0, 3);
     *       }
     *     }
     *   }],
     *   ['screen and (max-width: 640px)', {
     *     showLine: false,
     *     axisX: {
     *       labelInterpolationFnc: function(value) {
     *         // Will return M, T, W etc. on small screens
     *         return value[0];
     *       }
     *     }
     *   }]
     * ];
     *
     * new Chartist.Line('.ct-chart', data, null, responsiveOptions);
     *
     */
    function Line(query, data, options, responsiveOptions) {
      Chartist.Line.super.constructor.call(this, query, data, defaultOptions, Chartist.extend({}, defaultOptions, options), responsiveOptions);
    }

    // Creating line chart type in Chartist namespace
    Chartist.Line = Chartist.Base.extend({
      constructor: Line,
      createChart: createChart
    });
  })(window, document, Chartist);
  ; /**
    * The bar chart module of Chartist that can be used to draw unipolar or bipolar bar and grouped bar charts.
    *
    * @module Chartist.Bar
    */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    /**
     * Default options in bar charts. Expand the code view to see a detailed list of options with comments.
     *
     * @memberof Chartist.Bar
     */

    var defaultOptions = {
      // Options for X-Axis
      axisX: {
        // The offset of the chart drawing area to the border of the container
        offset: 30,
        // Position where labels are placed. Can be set to `start` or `end` where `start` is equivalent to left or top on vertical axis and `end` is equivalent to right or bottom on horizontal axis.
        position: 'end',
        // Allows you to correct label positioning on this axis by positive or negative x and y offset.
        labelOffset: {
          x: 0,
          y: 0
        },
        // If labels should be shown or not
        showLabel: true,
        // If the axis grid should be drawn or not
        showGrid: true,
        // Interpolation function that allows you to intercept the value from the axis label
        labelInterpolationFnc: Chartist.noop,
        // This value specifies the minimum width in pixel of the scale steps
        scaleMinSpace: 30,
        // Use only integer values (whole numbers) for the scale steps
        onlyInteger: false
      },
      // Options for Y-Axis
      axisY: {
        // The offset of the chart drawing area to the border of the container
        offset: 40,
        // Position where labels are placed. Can be set to `start` or `end` where `start` is equivalent to left or top on vertical axis and `end` is equivalent to right or bottom on horizontal axis.
        position: 'start',
        // Allows you to correct label positioning on this axis by positive or negative x and y offset.
        labelOffset: {
          x: 0,
          y: 0
        },
        // If labels should be shown or not
        showLabel: true,
        // If the axis grid should be drawn or not
        showGrid: true,
        // Interpolation function that allows you to intercept the value from the axis label
        labelInterpolationFnc: Chartist.noop,
        // This value specifies the minimum height in pixel of the scale steps
        scaleMinSpace: 20,
        // Use only integer values (whole numbers) for the scale steps
        onlyInteger: false
      },
      // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
      width: undefined,
      // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
      height: undefined,
      // Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
      high: undefined,
      // Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
      low: undefined,
      // Unless low/high are explicitly set, bar chart will be centered at zero by default. Set referenceValue to null to auto scale.
      referenceValue: 0,
      // Padding of the chart drawing area to the container element and labels as a number or padding object {top: 5, right: 5, bottom: 5, left: 5}
      chartPadding: {
        top: 15,
        right: 15,
        bottom: 5,
        left: 10
      },
      // Specify the distance in pixel of bars in a group
      seriesBarDistance: 15,
      // If set to true this property will cause the series bars to be stacked. Check the `stackMode` option for further stacking options.
      stackBars: false,
      // If set to 'overlap' this property will force the stacked bars to draw from the zero line.
      // If set to 'accumulate' this property will form a total for each series point. This will also influence the y-axis and the overall bounds of the chart. In stacked mode the seriesBarDistance property will have no effect.
      stackMode: 'accumulate',
      // Inverts the axes of the bar chart in order to draw a horizontal bar chart. Be aware that you also need to invert your axis settings as the Y Axis will now display the labels and the X Axis the values.
      horizontalBars: false,
      // If set to true then each bar will represent a series and the data array is expected to be a one dimensional array of data values rather than a series array of series. This is useful if the bar chart should represent a profile rather than some data over time.
      distributeSeries: false,
      // If true the whole data is reversed including labels, the series order as well as the whole series data arrays.
      reverseData: false,
      // If the bar chart should add a background fill to the .ct-grids group.
      showGridBackground: false,
      // Override the class names that get used to generate the SVG structure of the chart
      classNames: {
        chart: 'ct-chart-bar',
        horizontalBars: 'ct-horizontal-bars',
        label: 'ct-label',
        labelGroup: 'ct-labels',
        series: 'ct-series',
        bar: 'ct-bar',
        grid: 'ct-grid',
        gridGroup: 'ct-grids',
        gridBackground: 'ct-grid-background',
        vertical: 'ct-vertical',
        horizontal: 'ct-horizontal',
        start: 'ct-start',
        end: 'ct-end'
      }
    };

    /**
     * Creates a new chart
     *
     */
    function createChart(options) {
      var data;
      var highLow;

      if (options.distributeSeries) {
        data = Chartist.normalizeData(this.data, options.reverseData, options.horizontalBars ? 'x' : 'y');
        data.normalized.series = data.normalized.series.map(function (value) {
          return [value];
        });
      } else {
        data = Chartist.normalizeData(this.data, options.reverseData, options.horizontalBars ? 'x' : 'y');
      }

      // Create new svg element
      this.svg = Chartist.createSvg(this.container, options.width, options.height, options.classNames.chart + (options.horizontalBars ? ' ' + options.classNames.horizontalBars : ''));

      // Drawing groups in correct order
      var gridGroup = this.svg.elem('g').addClass(options.classNames.gridGroup);
      var seriesGroup = this.svg.elem('g');
      var labelGroup = this.svg.elem('g').addClass(options.classNames.labelGroup);

      if (options.stackBars && data.normalized.series.length !== 0) {

        // If stacked bars we need to calculate the high low from stacked values from each series
        var serialSums = Chartist.serialMap(data.normalized.series, function serialSums() {
          return Array.prototype.slice.call(arguments).map(function (value) {
            return value;
          }).reduce(function (prev, curr) {
            return {
              x: prev.x + (curr && curr.x) || 0,
              y: prev.y + (curr && curr.y) || 0
            };
          }, { x: 0, y: 0 });
        });

        highLow = Chartist.getHighLow([serialSums], options, options.horizontalBars ? 'x' : 'y');
      } else {

        highLow = Chartist.getHighLow(data.normalized.series, options, options.horizontalBars ? 'x' : 'y');
      }

      // Overrides of high / low from settings
      highLow.high = +options.high || (options.high === 0 ? 0 : highLow.high);
      highLow.low = +options.low || (options.low === 0 ? 0 : highLow.low);

      var chartRect = Chartist.createChartRect(this.svg, options, defaultOptions.padding);

      var valueAxis, labelAxisTicks, labelAxis, axisX, axisY;

      // We need to set step count based on some options combinations
      if (options.distributeSeries && options.stackBars) {
        // If distributed series are enabled and bars need to be stacked, we'll only have one bar and therefore should
        // use only the first label for the step axis
        labelAxisTicks = data.normalized.labels.slice(0, 1);
      } else {
        // If distributed series are enabled but stacked bars aren't, we should use the series labels
        // If we are drawing a regular bar chart with two dimensional series data, we just use the labels array
        // as the bars are normalized
        labelAxisTicks = data.normalized.labels;
      }

      // Set labelAxis and valueAxis based on the horizontalBars setting. This setting will flip the axes if necessary.
      if (options.horizontalBars) {
        if (options.axisX.type === undefined) {
          valueAxis = axisX = new Chartist.AutoScaleAxis(Chartist.Axis.units.x, data.normalized.series, chartRect, Chartist.extend({}, options.axisX, {
            highLow: highLow,
            referenceValue: 0
          }));
        } else {
          valueAxis = axisX = options.axisX.type.call(Chartist, Chartist.Axis.units.x, data.normalized.series, chartRect, Chartist.extend({}, options.axisX, {
            highLow: highLow,
            referenceValue: 0
          }));
        }

        if (options.axisY.type === undefined) {
          labelAxis = axisY = new Chartist.StepAxis(Chartist.Axis.units.y, data.normalized.series, chartRect, {
            ticks: labelAxisTicks
          });
        } else {
          labelAxis = axisY = options.axisY.type.call(Chartist, Chartist.Axis.units.y, data.normalized.series, chartRect, options.axisY);
        }
      } else {
        if (options.axisX.type === undefined) {
          labelAxis = axisX = new Chartist.StepAxis(Chartist.Axis.units.x, data.normalized.series, chartRect, {
            ticks: labelAxisTicks
          });
        } else {
          labelAxis = axisX = options.axisX.type.call(Chartist, Chartist.Axis.units.x, data.normalized.series, chartRect, options.axisX);
        }

        if (options.axisY.type === undefined) {
          valueAxis = axisY = new Chartist.AutoScaleAxis(Chartist.Axis.units.y, data.normalized.series, chartRect, Chartist.extend({}, options.axisY, {
            highLow: highLow,
            referenceValue: 0
          }));
        } else {
          valueAxis = axisY = options.axisY.type.call(Chartist, Chartist.Axis.units.y, data.normalized.series, chartRect, Chartist.extend({}, options.axisY, {
            highLow: highLow,
            referenceValue: 0
          }));
        }
      }

      // Projected 0 point
      var zeroPoint = options.horizontalBars ? chartRect.x1 + valueAxis.projectValue(0) : chartRect.y1 - valueAxis.projectValue(0);
      // Used to track the screen coordinates of stacked bars
      var stackedBarValues = [];

      labelAxis.createGridAndLabels(gridGroup, labelGroup, this.supportsForeignObject, options, this.eventEmitter);
      valueAxis.createGridAndLabels(gridGroup, labelGroup, this.supportsForeignObject, options, this.eventEmitter);

      if (options.showGridBackground) {
        Chartist.createGridBackground(gridGroup, chartRect, options.classNames.gridBackground, this.eventEmitter);
      }

      // Draw the series
      data.raw.series.forEach(function (series, seriesIndex) {
        // Calculating bi-polar value of index for seriesOffset. For i = 0..4 biPol will be -1.5, -0.5, 0.5, 1.5 etc.
        var biPol = seriesIndex - (data.raw.series.length - 1) / 2;
        // Half of the period width between vertical grid lines used to position bars
        var periodHalfLength;
        // Current series SVG element
        var seriesElement;

        // We need to set periodHalfLength based on some options combinations
        if (options.distributeSeries && !options.stackBars) {
          // If distributed series are enabled but stacked bars aren't, we need to use the length of the normaizedData array
          // which is the series count and divide by 2
          periodHalfLength = labelAxis.axisLength / data.normalized.series.length / 2;
        } else if (options.distributeSeries && options.stackBars) {
          // If distributed series and stacked bars are enabled we'll only get one bar so we should just divide the axis
          // length by 2
          periodHalfLength = labelAxis.axisLength / 2;
        } else {
          // On regular bar charts we should just use the series length
          periodHalfLength = labelAxis.axisLength / data.normalized.series[seriesIndex].length / 2;
        }

        // Adding the series group to the series element
        seriesElement = seriesGroup.elem('g');

        // Write attributes to series group element. If series name or meta is undefined the attributes will not be written
        seriesElement.attr({
          'ct:series-name': series.name,
          'ct:meta': Chartist.serialize(series.meta)
        });

        // Use series class from series data or if not set generate one
        seriesElement.addClass([options.classNames.series, series.className || options.classNames.series + '-' + Chartist.alphaNumerate(seriesIndex)].join(' '));

        data.normalized.series[seriesIndex].forEach(function (value, valueIndex) {
          var projected, bar, previousStack, labelAxisValueIndex;

          // We need to set labelAxisValueIndex based on some options combinations
          if (options.distributeSeries && !options.stackBars) {
            // If distributed series are enabled but stacked bars aren't, we can use the seriesIndex for later projection
            // on the step axis for label positioning
            labelAxisValueIndex = seriesIndex;
          } else if (options.distributeSeries && options.stackBars) {
            // If distributed series and stacked bars are enabled, we will only get one bar and therefore always use
            // 0 for projection on the label step axis
            labelAxisValueIndex = 0;
          } else {
            // On regular bar charts we just use the value index to project on the label step axis
            labelAxisValueIndex = valueIndex;
          }

          // We need to transform coordinates differently based on the chart layout
          if (options.horizontalBars) {
            projected = {
              x: chartRect.x1 + valueAxis.projectValue(value && value.x ? value.x : 0, valueIndex, data.normalized.series[seriesIndex]),
              y: chartRect.y1 - labelAxis.projectValue(value && value.y ? value.y : 0, labelAxisValueIndex, data.normalized.series[seriesIndex])
            };
          } else {
            projected = {
              x: chartRect.x1 + labelAxis.projectValue(value && value.x ? value.x : 0, labelAxisValueIndex, data.normalized.series[seriesIndex]),
              y: chartRect.y1 - valueAxis.projectValue(value && value.y ? value.y : 0, valueIndex, data.normalized.series[seriesIndex])
            };
          }

          // If the label axis is a step based axis we will offset the bar into the middle of between two steps using
          // the periodHalfLength value. Also we do arrange the different series so that they align up to each other using
          // the seriesBarDistance. If we don't have a step axis, the bar positions can be chosen freely so we should not
          // add any automated positioning.
          if (labelAxis instanceof Chartist.StepAxis) {
            // Offset to center bar between grid lines, but only if the step axis is not stretched
            if (!labelAxis.options.stretch) {
              projected[labelAxis.units.pos] += periodHalfLength * (options.horizontalBars ? -1 : 1);
            }
            // Using bi-polar offset for multiple series if no stacked bars or series distribution is used
            projected[labelAxis.units.pos] += options.stackBars || options.distributeSeries ? 0 : biPol * options.seriesBarDistance * (options.horizontalBars ? -1 : 1);
          }

          // Enter value in stacked bar values used to remember previous screen value for stacking up bars
          previousStack = stackedBarValues[valueIndex] || zeroPoint;
          stackedBarValues[valueIndex] = previousStack - (zeroPoint - projected[labelAxis.counterUnits.pos]);

          // Skip if value is undefined
          if (value === undefined) {
            return;
          }

          var positions = {};
          positions[labelAxis.units.pos + '1'] = projected[labelAxis.units.pos];
          positions[labelAxis.units.pos + '2'] = projected[labelAxis.units.pos];

          if (options.stackBars && (options.stackMode === 'accumulate' || !options.stackMode)) {
            // Stack mode: accumulate (default)
            // If bars are stacked we use the stackedBarValues reference and otherwise base all bars off the zero line
            // We want backwards compatibility, so the expected fallback without the 'stackMode' option
            // to be the original behaviour (accumulate)
            positions[labelAxis.counterUnits.pos + '1'] = previousStack;
            positions[labelAxis.counterUnits.pos + '2'] = stackedBarValues[valueIndex];
          } else {
            // Draw from the zero line normally
            // This is also the same code for Stack mode: overlap
            positions[labelAxis.counterUnits.pos + '1'] = zeroPoint;
            positions[labelAxis.counterUnits.pos + '2'] = projected[labelAxis.counterUnits.pos];
          }

          // Limit x and y so that they are within the chart rect
          positions.x1 = Math.min(Math.max(positions.x1, chartRect.x1), chartRect.x2);
          positions.x2 = Math.min(Math.max(positions.x2, chartRect.x1), chartRect.x2);
          positions.y1 = Math.min(Math.max(positions.y1, chartRect.y2), chartRect.y1);
          positions.y2 = Math.min(Math.max(positions.y2, chartRect.y2), chartRect.y1);

          var metaData = Chartist.getMetaData(series, valueIndex);

          // Create bar element
          bar = seriesElement.elem('line', positions, options.classNames.bar).attr({
            'ct:value': [value.x, value.y].filter(Chartist.isNumeric).join(','),
            'ct:meta': Chartist.serialize(metaData)
          });

          this.eventEmitter.emit('draw', Chartist.extend({
            type: 'bar',
            value: value,
            index: valueIndex,
            meta: metaData,
            series: series,
            seriesIndex: seriesIndex,
            axisX: axisX,
            axisY: axisY,
            chartRect: chartRect,
            group: seriesElement,
            element: bar
          }, positions));
        }.bind(this));
      }.bind(this));

      this.eventEmitter.emit('created', {
        bounds: valueAxis.bounds,
        chartRect: chartRect,
        axisX: axisX,
        axisY: axisY,
        svg: this.svg,
        options: options
      });
    }

    /**
     * This method creates a new bar chart and returns API object that you can use for later changes.
     *
     * @memberof Chartist.Bar
     * @param {String|Node} query A selector query string or directly a DOM element
     * @param {Object} data The data object that needs to consist of a labels and a series array
     * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
     * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
     * @return {Object} An object which exposes the API for the created chart
     *
     * @example
     * // Create a simple bar chart
     * var data = {
     *   labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
     *   series: [
     *     [5, 2, 4, 2, 0]
     *   ]
     * };
     *
     * // In the global name space Chartist we call the Bar function to initialize a bar chart. As a first parameter we pass in a selector where we would like to get our chart created and as a second parameter we pass our data object.
     * new Chartist.Bar('.ct-chart', data);
     *
     * @example
     * // This example creates a bipolar grouped bar chart where the boundaries are limitted to -10 and 10
     * new Chartist.Bar('.ct-chart', {
     *   labels: [1, 2, 3, 4, 5, 6, 7],
     *   series: [
     *     [1, 3, 2, -5, -3, 1, -6],
     *     [-5, -2, -4, -1, 2, -3, 1]
     *   ]
     * }, {
     *   seriesBarDistance: 12,
     *   low: -10,
     *   high: 10
     * });
     *
     */
    function Bar(query, data, options, responsiveOptions) {
      Chartist.Bar.super.constructor.call(this, query, data, defaultOptions, Chartist.extend({}, defaultOptions, options), responsiveOptions);
    }

    // Creating bar chart type in Chartist namespace
    Chartist.Bar = Chartist.Base.extend({
      constructor: Bar,
      createChart: createChart
    });
  })(window, document, Chartist);
  ; /**
    * The pie chart module of Chartist that can be used to draw pie, donut or gauge charts
    *
    * @module Chartist.Pie
    */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    /**
     * Default options in line charts. Expand the code view to see a detailed list of options with comments.
     *
     * @memberof Chartist.Pie
     */

    var defaultOptions = {
      // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
      width: undefined,
      // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
      height: undefined,
      // Padding of the chart drawing area to the container element and labels as a number or padding object {top: 5, right: 5, bottom: 5, left: 5}
      chartPadding: 5,
      // Override the class names that are used to generate the SVG structure of the chart
      classNames: {
        chartPie: 'ct-chart-pie',
        chartDonut: 'ct-chart-donut',
        series: 'ct-series',
        slicePie: 'ct-slice-pie',
        sliceDonut: 'ct-slice-donut',
        sliceDonutSolid: 'ct-slice-donut-solid',
        label: 'ct-label'
      },
      // The start angle of the pie chart in degrees where 0 points north. A higher value offsets the start angle clockwise.
      startAngle: 0,
      // An optional total you can specify. By specifying a total value, the sum of the values in the series must be this total in order to draw a full pie. You can use this parameter to draw only parts of a pie or gauge charts.
      total: undefined,
      // If specified the donut CSS classes will be used and strokes will be drawn instead of pie slices.
      donut: false,
      // If specified the donut segments will be drawn as shapes instead of strokes.
      donutSolid: false,
      // Specify the donut stroke width, currently done in javascript for convenience. May move to CSS styles in the future.
      // This option can be set as number or string to specify a relative width (i.e. 100 or '30%').
      donutWidth: 60,
      // If a label should be shown or not
      showLabel: true,
      // Label position offset from the standard position which is half distance of the radius. This value can be either positive or negative. Positive values will position the label away from the center.
      labelOffset: 0,
      // This option can be set to 'inside', 'outside' or 'center'. Positioned with 'inside' the labels will be placed on half the distance of the radius to the border of the Pie by respecting the 'labelOffset'. The 'outside' option will place the labels at the border of the pie and 'center' will place the labels in the absolute center point of the chart. The 'center' option only makes sense in conjunction with the 'labelOffset' option.
      labelPosition: 'inside',
      // An interpolation function for the label value
      labelInterpolationFnc: Chartist.noop,
      // Label direction can be 'neutral', 'explode' or 'implode'. The labels anchor will be positioned based on those settings as well as the fact if the labels are on the right or left side of the center of the chart. Usually explode is useful when labels are positioned far away from the center.
      labelDirection: 'neutral',
      // If true the whole data is reversed including labels, the series order as well as the whole series data arrays.
      reverseData: false,
      // If true empty values will be ignored to avoid drawing unncessary slices and labels
      ignoreEmptyValues: false
    };

    /**
     * Determines SVG anchor position based on direction and center parameter
     *
     * @param center
     * @param label
     * @param direction
     * @return {string}
     */
    function determineAnchorPosition(center, label, direction) {
      var toTheRight = label.x > center.x;

      if (toTheRight && direction === 'explode' || !toTheRight && direction === 'implode') {
        return 'start';
      } else if (toTheRight && direction === 'implode' || !toTheRight && direction === 'explode') {
        return 'end';
      } else {
        return 'middle';
      }
    }

    /**
     * Creates the pie chart
     *
     * @param options
     */
    function createChart(options) {
      var data = Chartist.normalizeData(this.data);
      var seriesGroups = [],
          labelsGroup,
          chartRect,
          radius,
          labelRadius,
          totalDataSum,
          startAngle = options.startAngle;

      // Create SVG.js draw
      this.svg = Chartist.createSvg(this.container, options.width, options.height, options.donut ? options.classNames.chartDonut : options.classNames.chartPie);
      // Calculate charting rect
      chartRect = Chartist.createChartRect(this.svg, options, defaultOptions.padding);
      // Get biggest circle radius possible within chartRect
      radius = Math.min(chartRect.width() / 2, chartRect.height() / 2);
      // Calculate total of all series to get reference value or use total reference from optional options
      totalDataSum = options.total || data.normalized.series.reduce(function (previousValue, currentValue) {
        return previousValue + currentValue;
      }, 0);

      var donutWidth = Chartist.quantity(options.donutWidth);
      if (donutWidth.unit === '%') {
        donutWidth.value *= radius / 100;
      }

      // If this is a donut chart we need to adjust our radius to enable strokes to be drawn inside
      // Unfortunately this is not possible with the current SVG Spec
      // See this proposal for more details: http://lists.w3.org/Archives/Public/www-svg/2003Oct/0000.html
      radius -= options.donut && !options.donutSolid ? donutWidth.value / 2 : 0;

      // If labelPosition is set to `outside` or a donut chart is drawn then the label position is at the radius,
      // if regular pie chart it's half of the radius
      if (options.labelPosition === 'outside' || options.donut && !options.donutSolid) {
        labelRadius = radius;
      } else if (options.labelPosition === 'center') {
        // If labelPosition is center we start with 0 and will later wait for the labelOffset
        labelRadius = 0;
      } else if (options.donutSolid) {
        labelRadius = radius - donutWidth.value / 2;
      } else {
        // Default option is 'inside' where we use half the radius so the label will be placed in the center of the pie
        // slice
        labelRadius = radius / 2;
      }
      // Add the offset to the labelRadius where a negative offset means closed to the center of the chart
      labelRadius += options.labelOffset;

      // Calculate end angle based on total sum and current data value and offset with padding
      var center = {
        x: chartRect.x1 + chartRect.width() / 2,
        y: chartRect.y2 + chartRect.height() / 2
      };

      // Check if there is only one non-zero value in the series array.
      var hasSingleValInSeries = data.raw.series.filter(function (val) {
        return val.hasOwnProperty('value') ? val.value !== 0 : val !== 0;
      }).length === 1;

      // Creating the series groups
      data.raw.series.forEach(function (series, index) {
        seriesGroups[index] = this.svg.elem('g', null, null);
      }.bind(this));
      //if we need to show labels we create the label group now
      if (options.showLabel) {
        labelsGroup = this.svg.elem('g', null, null);
      }

      // Draw the series
      // initialize series groups
      data.raw.series.forEach(function (series, index) {
        // If current value is zero and we are ignoring empty values then skip to next value
        if (data.normalized.series[index] === 0 && options.ignoreEmptyValues) return;

        // If the series is an object and contains a name or meta data we add a custom attribute
        seriesGroups[index].attr({
          'ct:series-name': series.name
        });

        // Use series class from series data or if not set generate one
        seriesGroups[index].addClass([options.classNames.series, series.className || options.classNames.series + '-' + Chartist.alphaNumerate(index)].join(' '));

        // If the whole dataset is 0 endAngle should be zero. Can't divide by 0.
        var endAngle = totalDataSum > 0 ? startAngle + data.normalized.series[index] / totalDataSum * 360 : 0;

        // Use slight offset so there are no transparent hairline issues
        var overlappigStartAngle = Math.max(0, startAngle - (index === 0 || hasSingleValInSeries ? 0 : 0.2));

        // If we need to draw the arc for all 360 degrees we need to add a hack where we close the circle
        // with Z and use 359.99 degrees
        if (endAngle - overlappigStartAngle >= 359.99) {
          endAngle = overlappigStartAngle + 359.99;
        }

        var start = Chartist.polarToCartesian(center.x, center.y, radius, overlappigStartAngle),
            end = Chartist.polarToCartesian(center.x, center.y, radius, endAngle);

        var innerStart, innerEnd, donutSolidRadius;

        // Create a new path element for the pie chart. If this isn't a donut chart we should close the path for a correct stroke
        var path = new Chartist.Svg.Path(!options.donut || options.donutSolid).move(end.x, end.y).arc(radius, radius, 0, endAngle - startAngle > 180, 0, start.x, start.y);

        // If regular pie chart (no donut) we add a line to the center of the circle for completing the pie
        if (!options.donut) {
          path.line(center.x, center.y);
        } else if (options.donutSolid) {
          donutSolidRadius = radius - donutWidth.value;
          innerStart = Chartist.polarToCartesian(center.x, center.y, donutSolidRadius, startAngle - (index === 0 || hasSingleValInSeries ? 0 : 0.2));
          innerEnd = Chartist.polarToCartesian(center.x, center.y, donutSolidRadius, endAngle);
          path.line(innerStart.x, innerStart.y);
          path.arc(donutSolidRadius, donutSolidRadius, 0, endAngle - startAngle > 180, 1, innerEnd.x, innerEnd.y);
        }

        // Create the SVG path
        // If this is a donut chart we add the donut class, otherwise just a regular slice
        var pathClassName = options.classNames.slicePie;
        if (options.donut) {
          pathClassName = options.classNames.sliceDonut;
          if (options.donutSolid) {
            pathClassName = options.classNames.sliceDonutSolid;
          }
        }
        var pathElement = seriesGroups[index].elem('path', {
          d: path.stringify()
        }, pathClassName);

        // Adding the pie series value to the path
        pathElement.attr({
          'ct:value': data.normalized.series[index],
          'ct:meta': Chartist.serialize(series.meta)
        });

        // If this is a donut, we add the stroke-width as style attribute
        if (options.donut && !options.donutSolid) {
          pathElement._node.style.strokeWidth = donutWidth.value + 'px';
        }

        // Fire off draw event
        this.eventEmitter.emit('draw', {
          type: 'slice',
          value: data.normalized.series[index],
          totalDataSum: totalDataSum,
          index: index,
          meta: series.meta,
          series: series,
          group: seriesGroups[index],
          element: pathElement,
          path: path.clone(),
          center: center,
          radius: radius,
          startAngle: startAngle,
          endAngle: endAngle
        });

        // If we need to show labels we need to add the label for this slice now
        if (options.showLabel) {
          var labelPosition;
          if (data.raw.series.length === 1) {
            // If we have only 1 series, we can position the label in the center of the pie
            labelPosition = {
              x: center.x,
              y: center.y
            };
          } else {
            // Position at the labelRadius distance from center and between start and end angle
            labelPosition = Chartist.polarToCartesian(center.x, center.y, labelRadius, startAngle + (endAngle - startAngle) / 2);
          }

          var rawValue;
          if (data.normalized.labels && !Chartist.isFalseyButZero(data.normalized.labels[index])) {
            rawValue = data.normalized.labels[index];
          } else {
            rawValue = data.normalized.series[index];
          }

          var interpolatedValue = options.labelInterpolationFnc(rawValue, index);

          if (interpolatedValue || interpolatedValue === 0) {
            var labelElement = labelsGroup.elem('text', {
              dx: labelPosition.x,
              dy: labelPosition.y,
              'text-anchor': determineAnchorPosition(center, labelPosition, options.labelDirection)
            }, options.classNames.label).text('' + interpolatedValue);

            // Fire off draw event
            this.eventEmitter.emit('draw', {
              type: 'label',
              index: index,
              group: labelsGroup,
              element: labelElement,
              text: '' + interpolatedValue,
              x: labelPosition.x,
              y: labelPosition.y
            });
          }
        }

        // Set next startAngle to current endAngle.
        // (except for last slice)
        startAngle = endAngle;
      }.bind(this));

      this.eventEmitter.emit('created', {
        chartRect: chartRect,
        svg: this.svg,
        options: options
      });
    }

    /**
     * This method creates a new pie chart and returns an object that can be used to redraw the chart.
     *
     * @memberof Chartist.Pie
     * @param {String|Node} query A selector query string or directly a DOM element
     * @param {Object} data The data object in the pie chart needs to have a series property with a one dimensional data array. The values will be normalized against each other and don't necessarily need to be in percentage. The series property can also be an array of value objects that contain a value property and a className property to override the CSS class name for the series group.
     * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
     * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
     * @return {Object} An object with a version and an update method to manually redraw the chart
     *
     * @example
     * // Simple pie chart example with four series
     * new Chartist.Pie('.ct-chart', {
     *   series: [10, 2, 4, 3]
     * });
     *
     * @example
     * // Drawing a donut chart
     * new Chartist.Pie('.ct-chart', {
     *   series: [10, 2, 4, 3]
     * }, {
     *   donut: true
     * });
     *
     * @example
     * // Using donut, startAngle and total to draw a gauge chart
     * new Chartist.Pie('.ct-chart', {
     *   series: [20, 10, 30, 40]
     * }, {
     *   donut: true,
     *   donutWidth: 20,
     *   startAngle: 270,
     *   total: 200
     * });
     *
     * @example
     * // Drawing a pie chart with padding and labels that are outside the pie
     * new Chartist.Pie('.ct-chart', {
     *   series: [20, 10, 30, 40]
     * }, {
     *   chartPadding: 30,
     *   labelOffset: 50,
     *   labelDirection: 'explode'
     * });
     *
     * @example
     * // Overriding the class names for individual series as well as a name and meta data.
     * // The name will be written as ct:series-name attribute and the meta data will be serialized and written
     * // to a ct:meta attribute.
     * new Chartist.Pie('.ct-chart', {
     *   series: [{
     *     value: 20,
     *     name: 'Series 1',
     *     className: 'my-custom-class-one',
     *     meta: 'Meta One'
     *   }, {
     *     value: 10,
     *     name: 'Series 2',
     *     className: 'my-custom-class-two',
     *     meta: 'Meta Two'
     *   }, {
     *     value: 70,
     *     name: 'Series 3',
     *     className: 'my-custom-class-three',
     *     meta: 'Meta Three'
     *   }]
     * });
     */
    function Pie(query, data, options, responsiveOptions) {
      Chartist.Pie.super.constructor.call(this, query, data, defaultOptions, Chartist.extend({}, defaultOptions, options), responsiveOptions);
    }

    // Creating pie chart type in Chartist namespace
    Chartist.Pie = Chartist.Base.extend({
      constructor: Pie,
      createChart: createChart,
      determineAnchorPosition: determineAnchorPosition
    });
  })(window, document, Chartist);

  return Chartist;
});
