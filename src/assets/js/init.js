// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyD_Lna7XxvzEXr-JxqrJJoEXGA5PA48ivk",
  authDomain: "emojional-life.firebaseapp.com",
  databaseURL: "https://emojional-life.firebaseio.com",
  projectId: "emojional-life",
  storageBucket: "emojional-life.appspot.com",
  messagingSenderId: "888518070529"
});

// Ask for position right away.
if (typeof window.navigator.geolocation !== "undefined" && window.navigator.geolocation) {
  window.navigator.geolocation.getCurrentPosition(function (position) {
    UTILS.POSITION = position;
  });
}
