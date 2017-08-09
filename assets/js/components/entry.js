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
    }
  },

  data: function () {
    return {
      canInputNote: false,
      shouldResizeTextArea: false,
      note: ""
    };
  },

  created: function () {
    if (this.index === this.totalEntries - 1) {
      this.canInputNote = true;
    }
  },

  updated: function () {

    console.log("Updating entry.");

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
        this.$emit('save-note', this.entry, this.index, this.note);
        this.shouldresizeTextArea = false;
        this.canInputNote = false;
      }

    },

    formatTime: function (unformattedTime) {
      return moment(unformattedTime).format('LT');
    }
  }
};

Vue.component('entry', Entry);
