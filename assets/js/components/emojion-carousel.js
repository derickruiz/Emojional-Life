const EmojionCarousel = {

  template: "#emojion_carousel_template",

  props: {
    emojions: {
      type: Array,
      required: true
    }
  },

  created: function () {
    console.log("Created the emojion carousel.");  
  },

  mounted: function () {

    console.log("Mounted the emojion carousel.");

    let flickity = new Flickity(this.$el, {
      showDots: false
    });

    document.querySelector(".flickity-viewport").style.height = "100%";

    this.$emit('select-emoji-to-change-to', this.emojions[0]);

    flickity.on('select', () => {
      this.$emit('select-emoji-to-change-to', this.emojions[flickity.selectedIndex]);
    });

  }
};

Vue.component('emojion-carousel', EmojionCarousel);
