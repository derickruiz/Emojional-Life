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

    if (this.$el.childNodes.length === 0) {
      return;
    } else {
      const toucher = new Hammer(this.$el.querySelector(".js-toucher"));

      toucher.on('swipeleft', (ev) => {
        this.toggleEmoji(false);
      });

      toucher.on('swiperight', (ev) => {
        this.toggleEmoji(true);
      });
    }

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
        UTILS.freezeScreen();
      } else {
        UTILS.unfreezeScreen();
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
