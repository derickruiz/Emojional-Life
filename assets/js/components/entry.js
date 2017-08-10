const Entry = {
  template: "#entry_template",

  props: {
    entry: {
      type: Object,
      required: true
    },

    index: {
      type: Number,
      requied: true
    },

    totalEntries: {
      type: Number,
      required: true
    },

    showTooltip: {
      type: Boolean,
      required: true,
      default: false
    }
  },

  data: function () {
    return {
      canInputNote: false,
      shouldResizeTextArea: false,
      note: "",
    };
  },

  created: function () {

    console.log("created'");
    console.log("index", this.index);
    console.log("this.totalEntries", this.totalEntries);
    console.log("this.showTooltip", this.showTooltip);

    if (this.index === this.totalEntries - 1) {
      this.canInputNote = true;
    } else {
      this.canInputNote = false;
    }
  },

  mounted: function () {

    if (this.canInputNote) {
      autosize(this.$el.querySelector(".js-note-input"));
    }

  },

  updated: function () {

    console.log("Updating entry.");

    console.log("this.index", this.index);
    console.log("this.totalEntries", this.totalEntries);

    if (this.index === this.totalEntries - 1) {
      this.canInputNote = true;
    } else {
      this.canInputNote = false;
    }

  },

  methods: {
    resizeTextArea: function (event) {

      const val = event.target.value;

      if (val && val.length >= 1) {
        this.shouldResizeTextArea = true;
      } else {
        this.shouldResizeTextArea = false;
      }

      this.note = val;

    },

    saveNote: function (event) {

      if (this.note && this.note.length >= 1) {
        this.shouldResizeTextArea = false;
        this.canInputNote = false;
        this.$emit('save-note', this.entry, this.index, this.note);
      }

    },

    formatTime: function (unformattedTime) {
      return moment(unformattedTime).format('LT');
    }
  }
};

Vue.component('entry', Entry);
