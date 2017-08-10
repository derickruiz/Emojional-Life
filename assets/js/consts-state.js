let GLOBAL_STATE = {
  previousScrollY: undefined,
  isFirstTime: true,
  notLoggedIn: true
};

const CONSTS = {
  googleMapsURL(latitude, longitude) {
    return `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&sensor=true`;
  },

  RETURNING_USER: {
    patternsMessage: "What am I noticing in my mind and body today?"
  },

  NEW_USER: {
    empty: "Nothing yet! 👻 Tap an emotion to it.",
    first: "Awesome, first one tracked. 👊 Add a note."
  }
};
