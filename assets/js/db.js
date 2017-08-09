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

  /*
   * @description: Small API over localStorage that saves an array of objects into a key.
   * @
   */
  saveLocalEntries: function (date, item, index) {

    console.log("UTILS.save");

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

      if ( ! index) {
        if (typeof items[date] === "undefined") {
          items[date] = [item];
        } else {
          items[date].push(item);
        }
      } else {
        items[date][index] = item;
      }

      try {
        window.localStorage.setItem('entries', JSON.stringify(items));
      } catch (e) {
        console.log("e", e);
      }

    }
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

  }
};
