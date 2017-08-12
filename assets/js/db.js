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

const DB = {

  // GETTERS

  getLocalResting: function () {
    let restingState;

    try {
      restingState = window.localStorage.getItem('resting');
    } catch (e) {
      console.log("e", e);
    }

    if (restingState != null) {
      return JSON.parse(restingState);
    } else {
      return null;
    }
  },

  /*
   * @description - Saves the resting time and color into local storage.
   * @param restingObj:Object - { 'time': 3434030, 'color': 'oxford' }
   */
  saveLocalResting: function (restingObj) {
    window.localStorage.setItem('resting', JSON.stringify(restingObj));
  },

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
  saveLocalEntries: function (date, item, index) {

    console.log("UTILS.save");
    console.log("date", date);
    console.log("item", item);
    console.log("index", index);

    let items;

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

  },

  getTodaysEntries: function (callback) {

    const currentDay = moment(moment.now()).format("YYYY-MM-DD");

    if (GLOBAL_STATE.notLoggedIn) {
      callback(DB.getLocalEntries(currentDay));
    } else {
      // AJAX
    }
  },

  // SETTERS
  saveNote: function (entry, entryIndex, note, callback) {

    console.log("DB.saveNote");
    console.log('entry', entry);
    console.log('entryIndex', entryIndex);
    console.log('note', note);

    if (GLOBAL_STATE.notLoggedIn) {
      let entryDate = moment(entry.time).format('YYYY-MM-DD');
      entry.note = note;
      callback(DB.saveLocalEntries(entryDate, entry, entryIndex));
    } else {

    }

  },

  trackEntry: function (emojion, callback) {

    let currentDay = moment(moment.now()).format('YYYY-MM-DD');

    if (GLOBAL_STATE.notLoggedIn) {
      // Save to local storage
      DB.saveLocalEntries(currentDay, emojion);
      callback(DB.getLocalEntries(currentDay));

    } else {
      // Ajax request
    }
  },

  saveResting(restingObj, callback) {

    if (GLOBAL_STATE.notLoggedIn) {
      DB.saveLocalResting(restingObj);

      if (typeof callback !== "undefined") {
        callback(DB.getLocalResting());
      }

    } else {
      // AJAX
    }

  },

  getResting(callback) {

    if (GLOBAL_STATE.notLoggedIn) {
      callback(DB.getLocalResting());
    } else {
      // Ajax request
    }

  },

  /*
   * @description - Saves the user's emojions array into local storage.
   */
  saveUserEmojions: function (emojionsArray) {
    window.localStorage.setItem('userEmojions', JSON.stringify(emojionsArray));
  },

  saveNotUserEmojions: function (emojionsArray) {
    window.localStorage.setItem('notUserEmojions', JSON.stringify(emojionsArray));
  },

  getUserEmojions: function (callback) {
    let emojions;

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

  },

  getNotUserEmojions: function (callback) {
    let emojions;

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

  saveLocationToEntry: function (entryIndex, entry, positionObj) {
    console.log('savelocation to entry');
    console.log("entryIndex", entryIndex);
    console.log('entry', entry);
    console.log('positionObj', positionObj);
    let entryDate = moment(entry.time).format('YYYY-MM-DD');
    entry.location = {
      latitude: positionObj.coords.latitude,
      longitude: positionObj.coords.longitude
    };

    if (typeof callback !== "undefined") {
      callback(DB.saveLocalEntries(entryDate, entry, entryIndex));
    } else {
      DB.saveLocalEntries(entryDate, entry, entryIndex)
    }

  }
};
