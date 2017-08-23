const DayEmotionChart = {

  template: "<div class='js-chart'><slot></slot></div>",

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

    new Chartist.Pie(this.$el, this.data, options);
  }
};

Vue.component('day-emotion-chart', DayEmotionChart);
