//   // But if we have position data, then get that and add it to the entries later.
//   // if (typeof UTILS.POSITION !== "undefined") {
//   //   var latitude = UTILS.POSITION.coords.latitude,
//   //       longitude = UTILS.POSITION.coords.longitude;
//   //
//   //   UTILS.get(CONSTS.googleMapsURL(latitude, longitude), function (event) {
//   //
//   //     let response = undefined;
//   //     let address = undefined;
//   //
//   //     try {
//   //       response = JSON.parse(this.responseText);
//   //     } catch (e) {
//   //       console.log("Caught!");
//   //       console.log(e);
//   //     }
//   //
//   //     address = UTILS.getAddress(response);
//   //
//   //     // Set the entry again with the address in place.
//   //     entry.update({
//   //       "address": address
//   //     });
//   //
//   //   });
//   // }

/*
 * If the user is logged out, then everything will be saved to local storage.
 * If the user is logged in, we'll save the data to the USER_DATA object.
 */
const DB = {

  /*
   * @description: Gets the sign up and login errors if there are any.
   * @return Object || NULL
   */
  getSignUpLoginErrors: function (callback) {

    if (typeof ERROR_DATA !== "undefined" && ERROR_DATA) {

      if (callback) {
        callback(ERROR_DATA);
      }

    } else {

      if (callback) {
        callback(null);
      }
    }
  },

  // GETTERS
  getLocalEntries: function (date) {
    let items;

    try {
      items = window.localStorage.getItem('entries');
    } catch (e) {
      console.log("e", e);
    }

    console.log("items");

    if (items != null) {
      items = JSON.parse(items);

      if (typeof items[date] !== "undefined") {
        return items[date];
      } else {
        return null;
      }

    } else {
      return null;
    }
  },

  recordTooltip: function (tooltipName, callback) {
    console.log('recordTooltip');
    let tooltips;

    // {
    //   "press": true,
    //   "tap": true
    // }

    try {
      tooltips = window.localStorage.getItem('tooltips');
    } catch (e) {
      console.log("e", e);
    }

    if (tooltips != null) {
      tooltips = JSON.parse(tooltips);
      tooltips[tooltipName] = false;
      console.log('tooltips', tooltips);
      window.localStorage.setItem('tooltips', JSON.stringify(tooltips));
      callback(tooltips);
    } else {
      let obj = {};
      obj.press = true;
      obj.write = true;
      obj.tap = true;
      obj[tooltipName] = false;
      console.log('obj', obj);
      window.localStorage.setItem('tooltips', JSON.stringify(obj));
      callback(obj);
    }
  },

  getTooltips: function (callback) {
    console.log("getTooltips");
    let tooltips;

    try {
      tooltips = window.localStorage.getItem('tooltips');
    } catch (e) {
      console.log("e", e);
    }

    console.log('tooltips', tooltips);

    if (tooltips != null) {
      tooltips = JSON.parse(tooltips);
      callback(tooltips);
    } else {
      callback({
        press: true,
        write: true,
        tap: true
      });
    }
  },

  /*
   * @description: Small API over localStorage that saves an array of objects into a key.
   * @
   */
  saveLocalEntries: function (date, item, index, color, textColor, question) {

    console.log("UTILS.save");
    console.log("date", date);
    console.log("item", item);
    console.log("index", index);

    let items;

    if (typeof color !== "undefined") {
      item.color = color;
    }

    if (typeof textColor !== "undefined") {
      item.text_color = textColor;
    }

    if (typeof question !== "undefined") {
      item.question = question;
    }

    try {
      items = window.localStorage.getItem('entries');
    } catch (e) {
      console.log("e", e);
    }

    console.log("items", items);

    if (items == null) {
      console.log("items are null");
      try {
        let obj = {};
        obj[date] = [item];
        window.localStorage.setItem('entries', JSON.stringify(obj));
      } catch (e) {
        console.log("e", e);
      }
    } else {

      console.log("items not null");

      items = JSON.parse(items);

      if (typeof index === "undefined") {
        console.log("No index.");
        if (typeof items[date] === "undefined") {
          items[date] = [item];
        } else {
          items[date].push(item);
        }
      } else {
        console.log("There's an index");
        console.log("index", index);
        items[date][index] = item;
      }

      try {
        window.localStorage.setItem('entries', JSON.stringify(items));
      } catch (e) {
        console.log("e", e);
      }

    }

    console.log("DONE SETTING");
    console.log("window.localStorage.getItem", window.localStorage.getItem('entries', JSON.stringify(items)));

    // return window.localStorage.getItem('entries', JSON.stringify(items));

  },

  getTodaysEntries: function (callback) {

    const currentDay = moment(moment.now()).format("YYYY-MM-DD");

    if ( ! GLOBAL_STATE.isLoggedIn) {
      callback(DB.getLocalEntries(currentDay));
    } else {
      callback(USER_DATA["entries"]);
    }
  },

  // SETTERS
  saveNote: function (entry, entryIndex, note, callback) {

    console.log("DB.saveNote");
    console.log('entry', entry);
    console.log('entryIndex', entryIndex);
    console.log('note', note);

    if ( ! GLOBAL_STATE.isLoggedIn) {
      let entryDate = moment(entry.time).format('YYYY-MM-DD');
      entry.note = note;

      DB.saveLocalEntries(entryDate, entry, entryIndex)
      callback(DB.getLocalEntries(entryDate));

    } else {

      AJAX.post("saveNote", {
        entry: entry,
        note: note
      }).then(function (json) {


        console.log("What's the JSON?");
        console.log("json", json);

        callback(json);
      });

    }

  },

  trackEntry: function (emojion, color, textColor, question, emotion, callback) {

    let currentDay = moment(moment.now()).format('YYYY-MM-DD');

    console.log("trackEntry");
    console.log("emojion", emojion);
    console.log("color", color);
    console.log("question", question);

    if ( ! GLOBAL_STATE.isLoggedIn) {
      // Save to local storage
      DB.saveLocalEntries(currentDay, emojion, undefined, color, textColor, question, emotion);
      callback(DB.getLocalEntries(currentDay));

    } else {

      console.log("Making the AJAX request");
      AJAX.post("trackEntry", {
        emojion: emojion,
        color: color,
        textColor: textColor,
        question: question,
        emotion: emotion
      }).then(function (json) {


        console.log("What's the JSON?");
        console.log("json", json);

        callback(json);
      });

      // Ajax request
    }
  },

  /*
   * @description - Signs up a user to the service and saves all their stuff in local storage.
   */
  signUpUser: function (email, password) {

    console.log("DB.signUpUser");
    console.log("email", email);
    console.log("password", password);

    console.log("entries");
    console.log(window.localStorage.getItem('entries'));
    console.log("userEmojions");
    console.log(window.localStorage.getItem('userEmojions'));

    let userDataObj = {
      "signUpEmail": email,
      "signUpPassword": password,
      "timezone": UTILS.getClientTimezone()
    };

    let entries = window.localStorage.getItem('entries'),
        userEmojions = window.localStorage.getItem('userEmojions');

    if (entries != null) {
      userDataObj["entries"] = JSON.parse(entries);
    }

    if (userEmojions != null) {
      userDataObj["userEmojions"] = JSON.parse(userEmojions);
    }

    console.log("userDataObj", userDataObj);

    AJAX.post("signup", userDataObj, true).then(function (response) {
      console.log("What's the response?", response);
    });

  },

  /*
   * @description - Logs a user into the service and saves their entries (if any) from local storage into the DB.
   */
  loginUser: function (email, password) {

    console.log("DB.loginUser");
    console.log("email", email);
    console.log("password", password);

    let userDataObj = {
      "loginEmail": email,
      "loginPassword": password,
      "timezone": UTILS.getClientTimezone()
    };

    let entries = window.localStorage.getItem('entries');

    if (entries != null) {
      userDataObj["entries"] = JSON.parse(entries);
    }

    console.log("userDataObj", userDataObj);

    AJAX.post("login", userDataObj, true).then(function (response) {
      console.log("What's the response?", response);
    });

  },

  /*
   * @description - Just logs the user out and then refreshes the page. */
  logoutUser: function () {

    console.log("Calling DB.logoutUser");

    AJAX.post("logout", {}, true).then(function (response) {
      console.log("What's the response?", response);
    });
  },

  /*
   * @description - Saves the user's emojions array into local storage.
   */
  saveUserEmojions: function (emojionsArray) {

    if (GLOBAL_STATE.isLoggedIn) {
      console.log("Saving the user's emojions. Making an ajx request.s");

      console.log("Fetching.");

      console.log(USER_DATA["user_emojions"]);

      AJAX.post("saveEmojions", USER_DATA["user_emojions"]).then(function (json) {
        console.log("What's the JSON?");
        console.log("json", json);
      });

    } else {
      window.localStorage.setItem('userEmojions', JSON.stringify(emojionsArray));
    }

  },

  saveNotUserEmojions: function (emojionsArray) {
    window.localStorage.setItem('notUserEmojions', JSON.stringify(emojionsArray));
  },

  getUserEmojions: function (callback) {

    console.log("getUSerEmojions");

    let emojions;


    if (GLOBAL_STATE.isLoggedIn) {

      console.log(" The user is already logged in.");

      try {
        emojions = USER_DATA["user_emojions"];
      } catch (e) {
        console.log("e", e);
      }

      if (emojions != null) {
        callback(emojions);
      }

    } else {

      try {
        emojions = window.localStorage.getItem('userEmojions');
      } catch (e) {
        console.log("e", e);
      }

      if (emojions != null) {
        callback(JSON.parse(emojions));
      } else {
        callback(CONSTS.DEFAULT_USER_EMOJIONS);
      }
    }
  },

  getPreviousDayCharts: function (callback) {

    if (GLOBAL_STATE.isLoggedIn) {
      callback(USER_DATA["previousDayCharts"]);
    } else {
      callback(undefined);
    }

  },

  getNotUserEmojions: function (callback) {

    console.log("getNotUserEmojions");

    let emojions;

    if (GLOBAL_STATE.isLoggedIn) {
      console.log("The user is logged in.");
      emojions = USER_DATA["not_user_emojions"];

      if (emojions != null) {
        callback(emojions);
      }

    } else {
      try {
        emojions = window.localStorage.getItem('notUserEmojions');
      } catch (e) {
        console.log("e", e);
      }

      if (emojions != null) {
        callback(JSON.parse(emojions));
      } else {
        callback(CONSTS.DEFAULT_NOT_USER_EMOJIONS);
      }
    }

  },

  saveUserLocationPermissions: function (permission) {

    window.localStorage.setItem('userLocationPermissions', JSON.stringify({
      permission: permission
    }));

  },

  getUserLocationPermissions: function (callback) {

    let permissions;

    try {
      permissions = window.localStorage.getItem('userLocationPermissions');
    } catch (e) {
      console.log("e", e);
    }

    if (permissions != null) {
      callback(JSON.parse(permissions));
    } else {
      window.localStorage.setItem('userLocationPermissions', JSON.stringify({
        permission: "pending"
      }));

      callback({
        permission: "pending"
      });

    }
  },

  saveLocationToEntry: function (entryIndex, entry, positionObj, callback) {
    console.log('savelocation to entry');
    console.log("entryIndex", entryIndex);
    console.log('entry', entry);
    console.log('positionObj', positionObj);

    let entryDate = moment(+entry.time).format('YYYY-MM-DD');

    console.log("What's entryDate?", entryDate);

    let latitude = positionObj.coords.latitude,
        longitude = positionObj.coords.longitude

    if (GLOBAL_STATE.isLoggedIn) {

      console.log("What's the entryKey?", entry["key"]);

      console.log("latitude", latitude);
      console.log("longitude", longitude);

      AJAX.post("saveLocationToEntry", {
        entryKey: entry["key"],
        latitude: latitude,
        longitude: longitude
      }).then(function (json) {
        console.log("Coming back from saveLocationToEntry.");
        console.log("What's the JSON?");
        console.log("json", json);

        callback(json);
      });
    } else {
      DB.saveLocalEntries(entryDate, entry, entryIndex)

      if (typeof callback !== "undefined") {
        callback(DB.getLocalEntries(entryDate));
      }
    }

  }
};
