let GLOBAL_STATE = {
  previousScrollY: undefined,
  isFirstTime: true,
  isLoggedIn: false
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
    "key" : 1
  }, {
    "color" : "rajah",
    "emoji" : "😌",
    "emotion" : "Grateful",
    "key" : 2
  }, {
    "color" : "tractor",
    "emoji" : "😎",
    "emotion" : "Cool",
    "key" : 3
  }, {
    "color" : "pastel",
    "emoji" : "🤣",
    "emotion" : "Funny",
    "key" : 4
  }, {
    "color" : "pictoral",
    "emoji" : "😡",
    "emotion" : "Frustrated",
    "key" : 5
  }, {
    "color" : "spanish",
    "emoji" : "💪",
    "emotion" : "Confident",
    "key" : 6
  }, {
    "color" : "tractor",
    "emoji" : "😰",
    "emotion" : "Anxious",
    "key" : 7
  }, {
    "color" : "caribeen",
    "emoji" : "🤡",
    "emotion" : "Clown",
    "key" : 8
  } ],

  DEFAULT_NOT_USER_EMOJIONS: [{
    "color" : "rajah",
    "emoji" : "🤓",
    "emotion": "Smart",
    "key" : 9
  }, {
    "color" : "caribeen",
    "emoji" : "🤑",
    "emotion": "Greedy",
    "key" : 10
  }, {
    "color" : "tractor",
    "emoji" : "😍",
    "emotion": "Love",
    "key" : 11
  }, {
    "color" : "oxford",
    "emoji" : "😱",
    "emotion": "Panic",
    "key" : 12
  }, {
    "color" : "oxford",
    "emoji" : "😰",
    "emotion": "Embarassed",
    "key" : 13
  }, {
    "color" : "spanish",
    "emoji" : "😭",
    "emotion": "Sad",
    "key" : 14
  }, {
    "color" : "tractor",
    "emoji" : "👿",
    "emotion": "Evil",
    "key" : 15
  }, {
    "color" : "pastel",
    "emoji" : "👻",
    "emotion": "Empty",
    "key" : 16
  }, {
    "color" : "caribeen",
    "emoji" : "👽",
    "emotion": "Different",
    "key" : 17
  }, {
    "color" : "rajah",
    "emoji" : "🤖",
    "emotion": "Emotionless",
    "key" : 18
  }, {
    "color" : "pictoral",
    "emoji" : "🤥",
    "emotion": "Liar",
    "key" : 19
  }, {
    "color" : "caribeen",
    "emoji" : "😝",
    "emotion": "Playful",
    "key" : 20
  }, {
    "color" : "oxford",
    "emoji" : "😇",
    "emotion": "Innocent",
    "key" : 21
  }, {
    "color" : "tractor",
    "emoji" : "👅",
    "emotion": "Horny",
    "key" : 22
  }, {
    "color" : "caribeen",
    "emoji" : "💅🏻",
    "emotion": "Pretty",
    "key" : 23
  },
  {
    "color": "brown",
    "emoji": "💩",
    "emotion": "Shit",
    "key": 24
  }]
};
