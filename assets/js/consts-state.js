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
    patternsMessage: "What am I noticing in my mind and body"
  },

  NEW_USER: {
    patternsMessage: "Awesome, first one tracked. Add a note."
  }
};
