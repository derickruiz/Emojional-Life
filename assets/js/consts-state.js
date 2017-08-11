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
    patternsMessage: "What am I noticing in my mind and body today?"
  },

  NEW_USER: {
    empty: "Nothing yet! 👻 Tap an emotion to it.",
    first: "Awesome, first one tracked. 👊 Add a note."
  },

  DEFAULT_USER_EMOJIONS: [ {
    "color" : "oxford",
    "emoji" : "😄",
    "emotion" : "happy",
    "index" : 0
  }, {
    "color" : "rajah",
    "emoji" : "😌",
    "emotion" : "grateful",
    "index" : 1
  }, {
    "color" : "tractor",
    "emoji" : "😎",
    "emotion" : "Arrogantly confident",
    "index" : 2
  }, {
    "color" : "pastel",
    "emoji" : "🤣",
    "emotion" : "Everything's funny",
    "index" : 3
  }, {
    "color" : "pictoral",
    "emoji" : "😡",
    "emotion" : "Frustrated and Angry",
    "index" : 4
  }, {
    "color" : "spanish",
    "emoji" : "💪",
    "emotion" : "Confidently confident",
    "index" : 5
  }, {
    "color" : "tractor",
    "emoji" : "😰",
    "emotion" : "Anxious",
    "index" : 6
  }, {
    "color" : "caribeen",
    "emoji" : "☹",
    "emotion" : "Powerlessly Sad",
    "index" : 7
  } ],

  DEFAULT_NOT_USER_EMOJIONS: [ {
    "color" : "oxford",
    "emoji" : "🤡",
    "index" : 8
  }, {
    "color" : "rajah",
    "emoji" : "🤓",
    "index" : 9
  }, {
    "color" : "caribeen",
    "emoji" : "🤑",
    "index" : 10
  }, {
    "color" : "tractor",
    "emoji" : "😍",
    "index" : 11
  }, {
    "color" : "oxford",
    "emoji" : "😱",
    "index" : 12
  }, {
    "color" : "oxford",
    "emoji" : "😰",
    "index" : 13
  }, {
    "color" : "spanish",
    "emoji" : "😭",
    "index" : 14
  }, {
    "color" : "tractor",
    "emoji" : "👿",
    "index" : 15
  }, {
    "color" : "pastel",
    "emoji" : "👻",
    "index" : 16
  }, {
    "color" : "caribeen",
    "emoji" : "👽",
    "index" : 17
  }, {
    "color" : "rajah",
    "emoji" : "🤖",
    "index" : 18
  }, {
    "color" : "pictoral",
    "emoji" : "🤥",
    "index" : 19
  }, {
    "color" : "caribeen",
    "emoji" : "😝",
    "index" : 20
  }, {
    "color" : "oxford",
    "emoji" : "😇",
    "index" : 21
  }, {
    "color" : "tractor",
    "emoji" : "👅",
    "index" : 22
  }, {
    "color" : "caribeen",
    "emoji" : "💅🏻",
    "index" : 23
  } ]
};
