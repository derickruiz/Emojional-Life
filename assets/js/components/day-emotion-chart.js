const DayEmotionChart = {

  template: "<div><div class='js-chart'><slot></slot></div><div class='Ff(serifRegular) Fz(default) C(black) Ta(c)'>{{ readableDate(day) }}</div></div>",

  props: {
    data: {
      type: Object,
      required: false,
      default: function () {

        return {
          labels: ['🤔', '👆', '🌏'],
          series: [5, 3, 4]
        };

      }
    },
    day: {
      type: String,
      required: false
    }
  },

  mounted: function () {

    var options = {
      labelInterpolationFnc: function(value) {
        return value;
      },
      width: '100px',
      height: '100px'
    };

    new Chartist.Pie(this.$el.querySelector(".js-chart"), this.data, options);
  },

  methods: {
    readableDate: function (date) {
      // console.log("readableDate");
      // console.log("What's the date?", date);

      let fromNow = moment(date).from(moment(new Date()));
      let displayer = "";

      // If it's a day ago, make it say "Yesterday"
      if (fromNow === "a day ago") {
        displayer = "Yesterday";
      } else {
        displayer = moment(date).format('dddd');
      }

      // otherwise make it say the day of the week.

      // console.log("What's the readable date?", readableDate);
      console.log("What's the displayer?", displayer);
      return displayer;
    }

  }
};

Vue.component('day-emotion-chart', DayEmotionChart);
