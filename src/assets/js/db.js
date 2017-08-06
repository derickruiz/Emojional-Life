const DB = {

  // GETTERS
  getUserEmojions: function (callback) {
    firebase.auth().signInAnonymously().then(function (user) {
      firebase.database().ref('user_emojions/' + user.uid).on('value', function(snapshot) {

        if (snapshot.exists()) {
          callback(UTILS.toArray(snapshot.val().emojions));
        } else {
          console.log("Setting up a new user.");
          DB.setUpNewUser();
        }

      });
    });
  },

  /*
   * @description - Set up the new user with some default emojions
   */
  setUpNewUser(callback) {
    firebase.auth().signInAnonymously().then(function (user) {
      firebase.database().ref('emojions').once('value', function (snapshot) {
        const allEmojions = snapshot.val();

        firebase.database().ref('user_emojions/' + user.uid).set({
          "emojions": allEmojions.splice(0, 8)
        });

      });
    });

  },

  getAllEmojionsExceptUsers: function (callback) {

    firebase.auth().signInAnonymously().then(function (user) {
      firebase.database().ref('emojions').once('value', function(snapshot) {

        const allEmojions = snapshot.val();

        firebase.database().ref('user_emojions/' + user.uid).once('value', function (snapshot) {

          const userEmojions = snapshot.val().emojions;

          callback(UTILS.toArray(allEmojions.filter(UTILS.comparer(userEmojions, "index"))));

        });

      });
    });

  },

  getEntries: function (callback) {
    return firebase.auth().signInAnonymously().then(function (user) {
      return firebase.database().ref('entries/' + user.uid).on('value', function(snapshot) {
          const entries = snapshot.val();
          callback(UTILS.toArray(entries));
        });
    });
  },

  saveUserEmojions: function (newEmojions, callback) {
    firebase.auth().signInAnonymously().then(function (user) {
      firebase.database().ref('user_emojions/' + user.uid).update({
        "emojions": UTILS.removeKeys(newEmojions)
      });
    });

  },

  // SETTERS
  trackEntry: function (emojion, callback) {
    return firebase.auth().signInAnonymously().then(function (user) {

      let data = {
        emoji: emojion.emoji,
        time: firebase.database.ServerValue.TIMESTAMP,
      };

      if (typeof emojion.color !== "undefined") {
        data.color = emojion.color
      }

      // Go ahead and save the data as is.
      const entry = firebase.database().ref("entries/" + user.uid).push();

      callback(entry.set(data));

      // But if we have position data, then get that and add it to the entries later.
      // if (typeof UTILS.POSITION !== "undefined") {
      //   var latitude = UTILS.POSITION.coords.latitude,
      //       longitude = UTILS.POSITION.coords.longitude;
      //
      //   UTILS.get(CONSTS.googleMapsURL(latitude, longitude), function (event) {
      //
      //     let response = undefined;
      //     let address = undefined;
      //
      //     try {
      //       response = JSON.parse(this.responseText);
      //     } catch (e) {
      //       console.log("Caught!");
      //       console.log(e);
      //     }
      //
      //     address = UTILS.getAddress(response);
      //
      //     // Set the entry again with the address in place.
      //     entry.update({
      //       "address": address
      //     });
      //
      //   });
      // }

    });
  },

  limitEntry() {
    firebase.auth().signInAnonymously().then(function (user) {

      // Set time for the last entry as now.
      firebase.database().ref("entry_time_limits").child(user.uid).set({
        "last_entry": firebase.database.ServerValue.TIMESTAMP
      });

    });
  },

  getResting(callback) {

    const ONE_MINUTE = 60000;

    firebase.auth().signInAnonymously().then(function (user) {

      // Set time for the last entry as now.
      firebase.database().ref("entry_time_limits/" + user.uid).on("value", function (snapshot) {

        let val = snapshot.val();

        if (val === null) {
          callback({
            isResting: false
          });
        } else {

          let lastEntry = new Date(val.last_entry);
          let now = Date.now();

          if ((now - lastEntry) < ONE_MINUTE) {
            callback({
              lastEntry: lastEntry,
              isResting: true
            });
          } else {
            callback({
              isResting: false
            });
          }
        }
      });

    });

  }
};
