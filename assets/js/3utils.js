const UTILS = {

  /*
   * @description - Takes a firebase object in the form of { "ao49ds": { } } and converts into array of objects with ".key" property. */
  toArray(object) {

    let array = [];

    for (let prop in object) {
      object[prop][".key"] = prop;
      array.push(object[prop]);
    }

    return array;

  },

  removeKeys(array) {
    for (let i = 0; i < array.length; i += 1) {
      delete array[i][".key"];
    }

    return array;
  },

  /*
   * @description: Given an array of objects and an object returns the key of that object within the array
   * @return Number
   */
  getIndex(arrayOfObjs, obj) {
    for (let i = 0; i < arrayOfObjs.length; i += 1) {

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
  replaceAtIndex(array, index, newItem) {
    array[index] = newItem;
  },

  getClientTimezone: function() {
    let offset = new Date().getTimezoneOffset();

    offset = offset === 0 ? 0 : -offset;

    console.log("What's the offset?", offset);

    return offset;
  },

  convertUnixTimeToPMAM(unixTime) {

    console.log("convertUnixTimeToPMAM");
    console.log("unixTime", unixTime);

    function formatAMPM(date) {
      var hours = date.getHours(),
          minutes = date.getMinutes(),
          ampm = hours >= 12 ? 'pm' : 'am',
          strTime = undefined;

      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0'+minutes : minutes;

      strTime = hours + ':' + minutes + ' ' + ampm;
      return strTime;
    }

    return formatAMPM(new Date(unixTime));

  },

  /*
   * @description - Iterating over a Google Maps API Response from Long and Lat. to find a place name.
   * @return String
   */
  getAddress(response) {

    let address = "";

    if (response.results.length) {

      response.results[0]["address_components"].forEach(function (addressComponent) {

        if (addressComponent.types.includes("sublocality")) {
          address += addressComponent.long_name + ", ";
        }

        if (addressComponent.types.includes("locality")) {
          address += addressComponent.long_name
        }
      });
    }

    return address;
  },

  comparer: function (otherArray, key) {
    return function(current) {
      return otherArray.filter(function (other) {
        return other[key] === current[key]
      }).length === 0;
    }
  },

  showError: function () {

  },

  /* @description - Only removes the entries and emojions so when the user logs in it's a clean slate again. */
  removeUserDataFromLocalStorage: function () {
    window.localStorage.removeItem('entries');
    window.localStorage.removeItem('userEmojions');
    window.localStorage.removeItem('notUserEmojions');
  },

  /* @description - Removes all local storage stuff including tooltips and user location. */
  removeAllLocalStorage: function () {
    window.localStorage.removeItem('tooltips');
    window.localStorage.removeItem('entries');
    window.localStorage.removeItem('userEmojions');
    window.localStorage.removeItem('notUserEmojions');
    window.localStorage.removeItem('userLocation');
  },

  /*
   * @description - Lighten or Darken a hex code.
   * @param hex:String - The hexcode color
   * @param lum:Number - Decimal that is lumation. 0.2 for 20% lighter. -0.5 for 50% darker.
   * @return String */
  luminate: function ColorLuminance(hex, lum) {

  	// validate hex string
  	hex = String(hex).replace(/[^0-9a-f]/gi, '');
  	if (hex.length < 6) {
  		hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  	}
  	lum = lum || 0;

  	// convert to decimal and change luminosity
  	var rgb = "#", c, i;
  	for (i = 0; i < 3; i++) {
  		c = parseInt(hex.substr(i*2,2), 16);
  		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
  		rgb += ("00"+c).substr(c.length);
  	}

  	return rgb;
  }

};

/*

{
  "2017-08-08": []
}

*/
