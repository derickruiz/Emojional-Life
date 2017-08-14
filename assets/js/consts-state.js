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
    "emotion" : "Happy",
    "index" : 0
  }, {
    "color" : "rajah",
    "emoji" : "😌",
    "emotion" : "Grateful",
    "index" : 1
  }, {
    "color" : "tractor",
    "emoji" : "😎",
    "emotion" : "Cool",
    "index" : 2
  }, {
    "color" : "pastel",
    "emoji" : "🤣",
    "emotion" : "Funny",
    "index" : 3
  }, {
    "color" : "pictoral",
    "emoji" : "😡",
    "emotion" : "Frustrated",
    "index" : 4
  }, {
    "color" : "spanish",
    "emoji" : "💪",
    "emotion" : "Confident",
    "index" : 5
  }, {
    "color" : "tractor",
    "emoji" : "😰",
    "emotion" : "Anxious",
    "index" : 6
  }, {
    "color" : "caribeen",
    "emoji" : "☹",
    "emotion" : "Sad",
    "index" : 7
  } ],

  DEFAULT_NOT_USER_EMOJIONS: [ {
    "color" : "oxford",
    "emoji" : "🤡",
    "emotion": "Clown",
    "index" : 8
  }, {
    "color" : "rajah",
    "emoji" : "🤓",
    "emotion": "Smart",
    "index" : 9
  }, {
    "color" : "caribeen",
    "emoji" : "🤑",
    "emotion": "Greedy",
    "index" : 10
  }, {
    "color" : "tractor",
    "emoji" : "😍",
    "emotion": "Love",
    "index" : 11
  }, {
    "color" : "oxford",
    "emoji" : "😱",
    "emotion": "Panic",
    "index" : 12
  }, {
    "color" : "oxford",
    "emoji" : "😰",
    "emotion": "Embarassed",
    "index" : 13
  }, {
    "color" : "spanish",
    "emoji" : "😭",
    "emotion": "Sad",
    "index" : 14
  }, {
    "color" : "tractor",
    "emoji" : "👿",
    "emotion": "Evil",
    "index" : 15
  }, {
    "color" : "pastel",
    "emoji" : "👻",
    "emotion": "Empty",
    "index" : 16
  }, {
    "color" : "caribeen",
    "emoji" : "👽",
    "emotion": "Different",
    "index" : 17
  }, {
    "color" : "rajah",
    "emoji" : "🤖",
    "emotion": "Emotionless",
    "index" : 18
  }, {
    "color" : "pictoral",
    "emoji" : "🤥",
    "emotion": "Liar",
    "index" : 19
  }, {
    "color" : "caribeen",
    "emoji" : "😝",
    "emotion": "Playful",
    "index" : 20
  }, {
    "color" : "oxford",
    "emoji" : "😇",
    "emotion": "Innocent",
    "index" : 21
  }, {
    "color" : "tractor",
    "emoji" : "👅",
    "emotion": "Horny",
    "index" : 22
  }, {
    "color" : "caribeen",
    "emoji" : "💅🏻",
    "emotion": "Pretty",
    "index" : 23
  } ]
};
