let GLOBAL_STATE = {
  previousScrollY: undefined,
};

const CONSTS = {
  googleMapsURL(latitude, longitude) {
    return `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&sensor=true`;
  }
};
