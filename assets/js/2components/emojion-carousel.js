const EmojionCarousel = {

  template: "#emojion_carousel_template",

  props: {
    emojions: {
      type: Array,
      required: true
    },
    color: {
      type: String,
      required: true
    }
  },

  created: function () {
    console.log("Created the emojion carousel.");
  },

  mounted: function () {

    console.log("Mounted the emojion carousel.");

    let flickity = new Flickity(this.$el, {
      pageDots: false
    });

    document.querySelector(".flickity-viewport").style.height = "100%";

    this.$emit('select-emoji-to-change-to', this.emojions[0], 0);

    flickity.on('select', () => {
      this.$emit('select-emoji-to-change-to', this.emojions[flickity.selectedIndex], flickity.selectedIndex);
    });

  }
};

Vue.component('emojion-carousel', EmojionCarousel);
