const App = new Vue({
  el: "#app",

  data: {

    /* Booleans */
    shouldShowEmoji: true, /* Whether to show the Emoji page or the Tracking page. */
    canSwitchEmoji: false, /* Whether the user can go ahead and start switching emoji by pressing and changing with caorusel */
    shouldLogin: false, /* Whether to show the Login form or not. */
    shouldSignUp: false, /* Whether to show the sign up form or not. */
    isLoggedIn: false,
    isShowingAllEntries: false,

    hasEntries: false, /* Nope no entries. Used for showing the empty state in the entries screen. */

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

    notUserEmojions: [], /* The list of emojis that are currently not in the user's 8. */
    emptyTracking: undefined, /* Not sure? */

    /*
     * @description - What will eventually be populated with the user's location if they give permission.
     */
    userPosition: undefined,

    /* UI-only variables. */
    elapsedTime: undefined,
    emojionBlockColors: ['blue', 'red', 'purple', 'orange', 'green', 'black', 'brown', 'pink']
  },

  created: function () {

    DB.getUserEmojions( (emojions) => {
      this.emojions = emojions;
    });

    DB.getNotUserEmojions( (emojions) => {
      this.notUserEmojions = emojions;
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

    DB.getTodaysEntries((entries) => {
      console.log("Get today's entries");
      console.log("entries", entries);
      this.entries = entries;

      if (this.entries && this.entries.length >= 1) {
        this.hasEntries = true;
      }

      console.log("this.hasEntries", this.hasEntries);

    });

    /*
     * @description - Shows the right tooltips to new users based on the state of the app.
     */

    DB.getTooltips((tooltips) => {
      console.log("DB.getTooltips");
      console.log("tooltips", tooltips);
      this.tooltips = tooltips;
    });

    DB.getUserLocationPermissions( (permissionObj) => {
      console.log("Getting the user location permissions.");
      console.log("permissionObj", permissionObj);

      /* possible values are { permission: 'granted', 'pending', or 'denied' } */

      if (permissionObj.permission === "granted") {
        this.getLocationDirectly = true;
      }

      if (permissionObj.permission === "pending") {
        this.showLocationNotification = true;
        // Show the notification to get the user to accept or decline permissions.
      }

      if (permissionObj.permission === "denied") {
        // The user explicitly denied after clicking "Add location." on the notification.
        // Not sure about what to do here yet, but don't do anything for now.
      }

      console.log("this.showLocationNotification", this.showLocationNotification);

      this.$forceUpdate();


    });

  },

  methods: {

    /*
     * @description - Shows the correct message in the patterns view depending on the state of the app.
     * @return String - The message */
    getPatternsMessage: function () {

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
    toggleEmoji: function (bool) {

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
    turnOnCarousel: function (index) {
      console.log("App.turnOnCaorusel");
      console.log("index", index);
      console.log("this.$refs.emojions", this.$refs.emojions);

      for (let i = 0; i < this.$refs.emojions.length; i += 1) {
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
    turnOffCarousel: function (emojionSelectorIndex, emojionToChangeTo, emojionToChangeToIndex) {

      console.log("turnOffCarousel");
      console.log("emojionSelectorIndex", emojionSelectorIndex);
      console.log("emojion", emojionToChangeTo);
      console.log('emojionToChangeToIndex', emojionToChangeToIndex);
      console.log("this.entries[emojionSelectorIndex]", this.emojions[emojionSelectorIndex]);
      console.log("this.notUserEmojions[emojionToChangeToIndex]", this.notUserEmojions[emojionToChangeToIndex]);

      this.notUserEmojions[emojionToChangeToIndex] = this.emojions[emojionSelectorIndex];
      this.emojions[emojionSelectorIndex] = emojionToChangeTo;
      //
      // console.log("this.emojions", this.emojions);
      // console.log("this.notUserEmojions", this.notUserEmojions);

      DB.saveUserEmojions(this.emojions);
      DB.saveNotUserEmojions(this.notUserEmojions);

      // Can probably be sure that this is the first time the user is doing this.
      console.log("this.tooltips", this.tooltips);

      if (this.tooltips.press === true) {
        this.toggleEmoji(false); // Go ahead and send them back to the patterns page to see more messages.
      }

      DB.recordTooltip('press', (tooltips) => {
        this.tooltips = tooltips;
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

    toggleEntriesForDay: function () {

      this.isShowingAllEntries = !this.isShowingAllEntries;


      if (this.isShowingAllEntries) {
          this.entriesToShow = this.entries;
      } else {

        let entriesCopy = this.entries.slice();
        this.entriesToShow = entriesCopy.splice(entriesCopy.length - 2, entriesCopy.length);
      }
    },

    /* Methods that make calls to the server. */
    /*
     * @description: Puts a new entry into tracking
     * @use - Called from click event.
     */
    trackEntry: function (emojion, color) {
      console.log("Tracking the entry.");

      let self = this;

      emojion["time"] = new Date().getTime();

      let entryIndex = undefined;

      console.log("emojion", emojion);
      console.log("color", color);

      DB.trackEntry(emojion, color, (newEntries) => {
        this.entries = newEntries;
        this.toggleEmoji(false); // Move user to patterns page after tapping an emotion.

        if (this.entries && this.entries.length >= 1) {
          this.hasEntries = true;
        }

        let entryIndex = this.entries.length - 1;
        let entry = this.entries[entryIndex];

        console.log('Gonna get user location permissions.');

        DB.getUserLocationPermissions( (permissionObj) => {
          if (permissionObj.permission === "granted") {

            console.log('gonna get the geolocation.');

            window.navigator.geolocation.getCurrentPosition(function (position) {
              console.log('position', position);
              DB.saveLocationToEntry(entryIndex, entry, position, function (entries) {
                self.entries = entries;
                self.$forceUpdate();
              });
            });
          }
        });

      });

      DB.recordTooltip('tap', (tooltips) => {
        this.tooltips = tooltips;
      });

    },

    // entry, entryIndex, note, callback)
    saveNote: function (entry, entryIndex, note) {
      console.log("App.saveNote");
      console.log("entry", entry);
      console.log("entryIndex", entryIndex);
      console.log("note", note);

      DB.saveNote(entry, entryIndex, note, function () {
        console.log("Saved the note!");
      });

      // Still false so that means it's the first time for a user to be writing a note.
      if (this.tooltips.write === true) {
        this.toggleEmoji(true); // Go ahead and switch the user over so they can experiment with the carousel switching functionality.
      }

      DB.recordTooltip('write', (tooltips) => {
        console.log("After recording write");
        console.log("tooltips", tooltips);
        this.tooltips = tooltips;
      });

      console.log("entries.length");
      if (this.entries.length === 1) {
        this.toggleEmoji(true);
      }

    },

    toggleLogin: function () {
      this.shouldLogin = !this.shouldLogin;
      this.shouldSignUp = false;
    },

    toggleSignUp: function () {
      this.shouldLogin = false;
      this.shouldSignUp = !this.shouldSignUp;
    }
  }
});
