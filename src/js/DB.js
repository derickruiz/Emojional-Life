// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyD_Lna7XxvzEXr-JxqrJJoEXGA5PA48ivk",
  authDomain: "emojional-life.firebaseapp.com",
  databaseURL: "https://emojional-life.firebaseio.com",
  projectId: "emojional-life",
  storageBucket: "emojional-life.appspot.com",
  messagingSenderId: "888518070529"
});

// Go ahead and sign the user in anonymously as quickly as possible.
firebase.auth().signInAnonymously();

// Ask for position right away.
(function () {
  
  function geoSuccess(position) {
    UTILS.POSITION = position;
  }
  
  navigator.geolocation.getCurrentPosition(geoSuccess, function () { });
  
}());

var UTILS = {
  
  /*
   * @description - Takes a firebase object in the form of { "ao49ds": { } } and converts into array of objects with ".key" property. */
  toArray: function (object) {
    
    var array = [];
    
    for (var prop in object) {
      object[prop][".key"] = prop;
      array.push(object[prop]);
    }
    
    return array;
  },
  
  convertUnixTimeToPMAM: function (unixTime) {
    
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
  
  previousScrollY: undefined,
  
  freezeScreen: function () {
    UTILS.previousScrollY = window.scrollY; // Store the old scroll position
    setTimeout(function () {
      window.scrollTo(0, 0); // Jump back to top for selecting emoji.
    }, 0);
    document.body.classList.add("O(hidden)");
  },
  
  unfreezeScreen: function () {
    
    setTimeout(function () {
      window.scrollTo(0, UTILS.previousScrollY);
    }, 0);
    
    document.body.classList.remove("O(hidden)");
    
  },
  
  get: function (URL, callback) {
    var request = new XMLHttpRequest();
    
    request.addEventListener("load", callback);
    request.open("GET", URL);
    request.send();
    
  },
  
  getAddress: function (response) {
    
    var address = "";
    
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
  }
};

var DB = {
  
  // GETTERS
  getEmojions: function () {
    return firebase.database().ref('emojions').once('value').then(
      function(snapshot) {
        var emojions = snapshot.val();
        return emojions;
      });
  },
  
  getEntries: function (callback) {
    return firebase.auth().signInAnonymously().then(function (user) {
      return firebase.database().ref('entries/' + user.uid).on('value', function(snapshot) {
          var entries = snapshot.val();
        callback(UTILS.toArray(entries));
        });
    });
  },
  
  getEmptyTracking: function () {
    return firebase.database().ref('emptyTracking').once('value').then(
      function (snapshot) {
        var emptyTracking = snapshot.val();
        return emptyTracking;
    });
  },
  
  // SETTERS
  trackEntry: function (emojion) {
    return firebase.auth().signInAnonymously().then(function (user) {
      
      var data = {
        emoji: emojion.emoji,
        time: firebase.database.ServerValue.TIMESTAMP,
        color: emojion.color
      };
      
      // Go ahead and save the data as is.
      var entry = firebase.database().ref("entries/" + user.uid).push();
      entry.set(data);
      
      // But if we have position data, then get that and add it to the entries later.
      if (typeof UTILS.POSITION !== "undefined") {
        var latitude = UTILS.POSITION.coords.latitude,
            longitude = UTILS.POSITION.coords.longitude;
        
        var GOOGLEMAPS_API_URL = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + latitude + "," + longitude + "&sensor=true";
        
        
        UTILS.get(GOOGLEMAPS_API_URL, function (event) {
          
          var response,
              address;
          
          try {
            response = JSON.parse(this.responseText);
          } catch (e) {
            console.log("Caught!");
            console.log(e);
          }
          
          data.address = UTILS.getAddress(response);
          
          // Set the entry again with the address in place.
          entry.set(data);
          
        });
      }
      
    });
  }
};