const Emojion = {

  template: "#emojion_template",

  props: {

    index: {
      type: Number,
      required: true
    },

    canSwitchEmoji: {
      type: Boolean,
      required: true
    },

    emojion: {
      type: Object,
      required: true
    },

    notUserEmojions: {
      type: Array,
      required: true
    }
  },

  data: function () {
    return {

      /*
       * @description - The emoji character to display in the block.
       * @type String
       */
      emoji: this.emojion.emoji,

      /*
       * @description - The color of the emojion block
       * @type String
       */
       color: this.emojion.color,

       /*
        * @description - The color of the emotion when switching using the carouselColor
        * @type String
        */
       carouselColor: undefined,

      /*
       * @description - The emojion that this block will change to after selecting a new one via the carousel.
       * @type: Object
       */
      emojionToChangeTo: undefined,

      /*
       * @description: - Whether the user is currently changing the emoji on this block with the carousel
       * @type Boolean
       */
      isChangingEmoji: false
    };
  },

  mounted: function () {

    /* Set up the press events to get the switching going */
    let toucher = new Hammer(this.$el);

    // Switching emoji.
    toucher.on('press', (ev) => {
      this.isChangingEmoji = !this.isChangingEmoji;
      this.turnOnOffCarousel();
    });

    // Tracking entries.
    toucher.on('tap', (ev) => {
      console.log("Tapped");

      // Don't wanna send anything to the server if switching with the carousel.
      if ( ! this.isChangingEmoji) {
        this.$emit('track-entry', this.emojion);
      }

    });

  },

  methods: {

    selectEmojionToChangeTo: function (emojion) {
      console.log("Selecting an emojion to change to.");
      console.log("emojion", emojion);
      this.carouselColor = emojion.color;
      this.emojionToChangeTo = emojion;
    },

    turnOnOffCarousel: function () {
      if ( ! this.isChangingEmoji) {
        this.$emit('turn-off-carousel', this.index, this.emojionToChangeTo);
      } else {
        this.$emit('turn-on-carousel', this.index);
      }
    }
  }
};

Vue.component('emojion', Emojion);
