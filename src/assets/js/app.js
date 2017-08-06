const App = new Vue({
  el: "#app",

  data: {

    /* Booleans */
    shouldShowEmoji: true, /* Whether to show the Emoji page or the Tracking page. */
    canSwitchEmoji: false, /* Whether the user can go ahead and start switching emoji by pressing and changing with caorusel */
    isResting: false, /* Whether should be waiting before inputting another emoji or not. */

    /* Data from server to populate. */
    entries: undefined, /* The notes */
    emojions: undefined, /* The emojis. */
    notUserEmojions: [], /* The list of emojis that are currently not in the user's 8. */
    emptyTracking: undefined, /* Not sure? */

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

    // What is data that I need immeditely to get the app working right away?
    // The emotions and the tap.

    // Get the user's emojions and show the app.
    DB.getUserEmojions((emojions) => {
      this.emojions = emojions;
      DOM.showApp();
    });

    DB.getAllEmojionsExceptUsers((emojions) => {
      console.log("DB.getAllEmojionsExceptUsers", emojions);
      this.canSwitchEmoji = true;
      this.notUserEmojions = emojions;
    });

    //
    // // Get entries if any exist.
    // DB.getEntries((entries) => {
    //   this.entries = entries;
    // });

    // getRestingState.call(this);

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

    /* Event Callbacks */

    /*
     * @description: Gets called whenever the user presses and holds an emojion block.
     * Ensures that only one carousel is on at a time.
     * @param index:Number - The index of the emojion block
     * @return Void
     */
    turnOnCarousel: function (index) {
      console.log("App.turnOnCaorusel");
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

      // Update the UI
      let previousEmojion = this.emojions[emojionSelectorIndex];
      this.emojions[emojionSelectorIndex] = emojion;

      // Remove the old emoji from the list and put the old one in there instead.
      UTILS.replaceAtIndex(this.notUserEmojions, UTILS.getIndex(this.notUserEmojions, emojion), previousEmojion);

      // Make Ajax call to update user preferences
      // If pass keep it that way,
      // else revert the UI.

      DB.saveUserEmojions(this.emojions, function () {
        console.log("Saved the user's preferences.");
      });

      this.$forceUpdate();
    },

    /* Methods that make calls to the server. */
    /*
     * @description: Puts a new entry into tracking
     * @use - Called from click event.
     */
    trackEntry: function (emojion) {

      console.log("Tracking the entry.");

      DB.trackEntry(emojion, function (entry) {

        console.log("What's entry?", entry);

        entry.then(function () {
          console.log("SUCCESS1");
          // DB.limitEntry();
        }).catch(function () {
          console.log("Couldn't successfully write.");
        });

      });
    }
  }
});
