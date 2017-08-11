const Notification = {

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
    }
  },

  data: function () {

    return {
      methods: {},
      shouldShow: true
    };

  },

  created: function () {

    console.log("What's this.method?", this.method);

    if (typeof this.method !== "undefined") {
      this.methods['click'] = this[this.method];
    }
  },

  methods: {
    askUserForLocation: function () {

      let self = this;

      if (window.navigator.geolocation !== "undefined") {
        console.log("Gonna ask for the user's permission.");
        window.navigator.geolocation.getCurrentPosition(function (position) {
          // Save into the DB.
          DB.saveUserLocationPermissions("granted");
        }, function (error) {
          DB.saveUserLocationPermissions("denied");
        });
      }
    }
  }
};

Vue.component('notification', Notification);
