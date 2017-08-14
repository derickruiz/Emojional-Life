const DayEmotionChart = {

  template: "<div class='js-chart'><slot></slot></div>",

  mounted: function () {

    var data = {
      labels: ['🤔', '👆', '🌏'],
      series: [5, 3, 4]
    };

    var options = {
      labelInterpolationFnc: function(value) {
        return value;
      },
      width: '100px',
      height: '100px'
    };

    new Chartist.Pie(this.$el, data, options);
  }
};

Vue.component('day-emotion-chart', DayEmotionChart);
