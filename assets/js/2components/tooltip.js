const Tooltip = {
  template: "#tooltip_template",

  props: {
    emoji: {
      type: String,
      required: true
    },

    action: {
      type: String,
      requied: true
    },

    message: {
      type: String,
      required: true
    },

    arrowPosition: {
      type: String,
      required: false,
      default: ""
    },

    reverse: {
      type: Boolean,
      required: false,
      default: false
    },

    tooltipType: {
      type: String,
      required: true
    }
  }
};

Vue.component('tooltip', Tooltip);
