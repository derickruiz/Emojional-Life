const App = new Vue({
  el: "#app",

  data: {

    /* Booleans */
    shouldShowEmoji: true, /* Whether to show the Emoji page or the Tracking page. */
    canSwitchEmoji: false, /* Whether the user can go ahead and start switching emoji by pressing and changing with caorusel */
    isResting: false, /* Whether should be waiting before inputting another emoji or not. */

    isShowingAllEntries: false,

    hasEntries: false, /* Nope no entries. Used for showing the empty state in the entries screen. */

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
    resting: { /* Used for rendering the progress bar in the navigation when user clicks on emotion. */
      color: 'tractor'
    },
    notUserEmojions: [], /* The list of emojis that are currently not in the user's 8. */
    emptyTracking: undefined, /* Not sure? */

    /* UI-only variables. */
    elapsedTime: undefined
  },

  created: function () {

    this.emojions = [ {
      "color" : "oxford",
      "emoji" : "😄",
      "emotion" : "happy",
      "index" : 0
    }, {
      "color" : "rajah",
      "emoji" : "😌",
      "emotion" : "grateful",
      "index" : 1
    }, {
      "color" : "tractor",
      "emoji" : "😎",
      "emotion" : "Arrogantly confident",
      "index" : 2
    }, {
      "color" : "pastel",
      "emoji" : "🤣",
      "emotion" : "Everything's funny",
      "index" : 3
    }, {
      "color" : "pictoral",
      "emoji" : "😡",
      "emotion" : "Frustrated and Angry",
      "index" : 4
    }, {
      "color" : "spanish",
      "emoji" : "💪",
      "emotion" : "Confidently confident",
      "index" : 5
    }, {
      "color" : "smoky",
      "emoji" : "😰",
      "emotion" : "Anxious",
      "index" : 6
    }, {
      "color" : "caribeen",
      "emoji" : "☹",
      "emotion" : "Powerlessly Sad",
      "index" : 7
    } ];

    this.notUserEmojions = [ {
      "color" : "oxford",
      "emoji" : "🤡",
      "index" : 8
    }, {
      "color" : "rajah'",
      "emoji" : "🤓",
      "index" : 9
    }, {
      "color" : "caribeen",
      "emoji" : "🤑",
      "index" : 10
    }, {
      "color" : "tractor'",
      "emoji" : "😍",
      "index" : 11
    }, {
      "color" : "oxford",
      "emoji" : "😱",
      "index" : 12
    }, {
      "color" : "oxford",
      "emoji" : "😰",
      "index" : 13
    }, {
      "color" : "spanish",
      "emoji" : "😭",
      "index" : 14
    }, {
      "color" : "smoky",
      "emoji" : "👿",
      "index" : 15
    }, {
      "color" : "pastel",
      "emoji" : "👻",
      "index" : 16
    }, {
      "color" : "smoky",
      "emoji" : "👽",
      "index" : 17
    }, {
      "color" : "rajah",
      "emoji" : "🤖",
      "index" : 18
    }, {
      "color" : "pictoral",
      "emoji" : "🤥",
      "index" : 19
    }, {
      "color" : "caribeen",
      "emoji" : "😝",
      "index" : 20
    }, {
      "color" : "oxford",
      "emoji" : "😇",
      "index" : 21
    }, {
      "color" : "tractor",
      "emoji" : "👅",
      "index" : 22
    }, {
      "color" : "caribeen",
      "emoji" : "💅🏻",
      "index" : 23
    } ];

    DOM.showApp();

    this.shouldShowEmoji = true;
    DOM.freezeScreen();

    console.log("Calling DB.getResting in created.");

    DB.getResting((restingObj) => {
      if (restingObj != null) {

        console.log("restingObj", restingObj);

        this.resting = restingObj;

        let now = moment(moment.now());
        let savedRestingTime = moment(restingObj.time);

        console.log('savedRestingTime', savedRestingTime.format('LLL'));
        console.log('now', now.format('LLL'));
        console.log('diff', savedRestingTime.diff(now, 'seconds'));

        if (savedRestingTime.diff(now, 'seconds') >= 1) {
          this.startResting(restingObj.time, false, restingObj.color);
        }

      }

    });

    this.canSwitchEmoji = true;

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

    // getRestingState.call(this);

    DB.getTodaysEntries((entries) => {
      console.log("Get today's entries");
      console.log("entries", entries);
      this.entries = entries;
    });

    /*
     * @description - Shows the right tooltips to new users based on the state of the app.
     */

    DB.getTooltips((tooltips) => {
      console.log("DB.getTooltips");
      console.log("tooltips", tooltips);
      this.tooltips = tooltips;
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
    turnOffCarousel: function (emojionSelectorIndex, emojion) {

      console.log("turnOffCarousel");
      console.log("emojion", emojion);

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
    trackEntry: function (emojion) {
      console.log("Tracking the entry.");

      emojion["time"] = new Date().getTime();

      if (!this.isResting) {
        DB.trackEntry(emojion, (newEntries) => {
          this.entries = newEntries;
          this.toggleEmoji(false); // Move user to patterns page after tapping an emotion.
          this.startResting(undefined, true, emojion.color);
        });
      }

      DB.recordTooltip('tap', (tooltips) => {
        this.tooltips = tooltips;
      });

    },

    /*
     * @description - Progresses the progress bar in the navigation and stops the user from toggling emoji.
     */
    startResting: function (timeToWait, shouldSave, color) {

      const self = this;

      this.isResting = true;

      let timeInFuture;

      // Start it at a specific time if it exists (Passed in when rendering on load)
      if (typeof timeToWait !== "undefined") {
        timeInFuture = moment(timeToWait);
      } else {
        timeInFuture = moment(moment.now());
        timeInFuture.add(2, 'minutes');
      }

      this.resting = {
        time: timeInFuture,
        color: color
      };

      // Should we save it to to the DB, or are we just rendering the resting process after refresh for example?
      if (shouldSave) {
        DB.saveResting(this.resting);
      }

      Array.from(document.querySelectorAll(".js-emotion")).forEach(function (emojionEl) {
        emojionEl.style.filter = "grayscale(100%)"
      });

      GLOBAL_STATE.restingIntervalId = setInterval(function () {

        // $total = 160000;
        // $current = 12345;
        // $percentage = $current/$total * 100;

        const secondsDifferenceCurrent = timeInFuture.diff(moment(moment.now()), 'seconds');
        const percentage = Math.round(secondsDifferenceCurrent / 120 * 100);

        Array.from(document.querySelectorAll(".js-emotion")).forEach(function (emojionEl) {
          emojionEl.style.filter = "grayscale(100%)";
        });

        if (percentage <= 0) {
          clearInterval(GLOBAL_STATE.restingIntervalId);

          Array.from(document.querySelectorAll(".js-emotion")).forEach(function (emojionEl) {
            emojionEl.style = "";
          });

          document.querySelector(".js-progress").style = "";

          self.isResting = false;

        } else {
          document.querySelector(".js-progress").style.transform = "translate3d(-" + percentage + "%, 0px, 0px)";
        }
      }, 1000);

    },

    // entry, entryIndex, note, callback)
    saveNote: function (entry, entryIndex, note) {
      DB.saveNote(entry, entryIndex, note, function () {
        console.log("Saved the note!");
      });

      DB.recordTooltip('write', (tooltips) => {
        console.log("After recording write");
        console.log("tooltips", tooltips);
        this.tooltips = tooltips;
      });

    }
  }
});
