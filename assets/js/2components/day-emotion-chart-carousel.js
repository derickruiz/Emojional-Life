const DayEmotionChartCarousel = {

  template: "<div class='js-charts'><slot></slot></div>",

  mounted: function () {
    
    new Flickity(this.$el, {
      cellAlign: "left",
      pageDots: false
    });
  }
};

Vue.component('day-emotion-chart-carousel', DayEmotionChartCarousel);
