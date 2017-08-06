const DB = {

  // GETTERS
  getUserEmojions: function (callback) {

    console.log("getUserEmojions");
    firebase.auth().signInAnonymously().then(function (user) {
      console.log("Signing in anonymously.");
      console.log("What's user?", user);
      console.log("user.uid", user.uid);

      let timeoutId = setTimeout(function () {
        DOM.showError();
      }, 5000);

      firebase.database().ref('user_emojions/' + user.uid).once('value', function(snapshot) {

        clearTimeout(timeoutId);
        DOM.hideError();

        console.log("Just got back from user_emojions ref calling once.");

        if (snapshot.exists()) {
          console.log("Returning User");
          GLOBAL_STATE.isNewUser = false;
          callback(UTILS.toArray(snapshot.val().emojions));
        } else {
          console.log("new User");
          GLOBAL_STATE.isNewUser = true;
          DB.setUpNewUser(callback);
        }

      });
    });
  },

  /*
   * @description - Set up the new user with some default emojions
   */
  setUpNewUser(callback) {

    console.log("setUpNewUser");

    firebase.auth().signInAnonymously().then(function (user) {
      firebase.database().ref('emojions').once('value', function (snapshot) {
        const allEmojions = snapshot.val();

        firebase.database().ref('user_emojions/' + user.uid).set({
          "emojions": allEmojions.splice(0, 8)
        });

        console.log("Calling the getUsersEmojions func again.");
        DB.getUserEmojions(callback);
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

  getTodaysEntries: function (callback) {

    const currentDay = moment(moment.now()).format("YYYY-MM-DD");

    firebase.auth().signInAnonymously().then(function (user) {
      firebase.database().ref('entries/' + user.uid + "/" + currentDay).on('value', function(snapshot) {
          const entries = snapshot.val();
          callback(UTILS.toArray(entries));
        });
    });

  },

  getEntries: function (callback) {
    firebase.auth().signInAnonymously().then(function (user) {
      firebase.database().ref('entries/' + user.uid).on('value', function(snapshot) {
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

  saveNote: function (currentDay, entryKey, note, callback) {
    firebase.auth().signInAnonymously().then(function (user) {

      callback(firebase.database().ref('entries/' + user.uid + "/" + currentDay + "/" + entryKey).update({
        "note": note
      }));

    });
  },

  trackEntry: function (emojion, callback) {

    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        console.log("user", user);
        } else {
          // No user is signed in.
          console.log("Not signed in");
        }
      });

    // return firebase.auth().signInAnonymously().then(function (user) {
    //
    //   let data = {
    //     emoji: emojion.emoji,
    //     time: firebase.database.ServerValue.TIMESTAMP,
    //   };
    //
    //   if (typeof emojion.color !== "undefined") {
    //     data.color = emojion.color
    //   }
    //
    //   // ref.orderByChild("date").startAt("2017-01-01").endAt("2017-01-31")
    //   const currentDay = moment(moment.now()).format("YYYY-MM-DD");
    //
    //   console.log("currentDay", currentDay);
    //
    //   // Go ahead and save the data as is.
    //   const entry = firebase.database().ref("entries/" + user.uid + "/" + currentDay).push();
    //
    //   callback(entry.set(data));
    //
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
    //
    // });
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
