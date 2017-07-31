var EmojionalLife = new Vue({
  el: "#app",
  data: {
    shouldShowEmoji: true,
    entries: undefined,
    emojions: undefined,
    emptyTracking: undefined
  },
  
  created: function () {
    
    var self = this;
    
    // Get the initial emojions
    DB.getEmojions().then(function (emojions) {
      self.emojions = emojions;
    });
    
    // Get the empty tracking emoji
    DB.getEmptyTracking().then(function (emptyTracking) {
      self.emptyTracking = emptyTracking;
    });
    
    // Get entries if any exist.
    DB.getEntries(function (entries) {
      self.entries = entries;
    });
  },
  
  updated: function () {
    
    var self = this;
    
    if (typeof self.$el.querySelector == "undefined") {
      return;
    } else {
      
      var hammertime = new Hammer(self.$el.querySelector(".js-toucher"));
      
      hammertime.on('swipeleft', function(ev) {
        self.toggleEmoji(false);
      });
      
      hammertime.on('swiperight', function(ev) {
        self.toggleEmoji(true);
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
      DB.trackEntry(emojion).then(function () {
        console.log("success!");
      });
    }
  }
});