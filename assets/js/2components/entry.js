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
      alreadyHasNote: false,
      isViewingNote: false,
      noteBorderColor: undefined, /* The textfield's border color calculated with the emojion color */
      showLabel: false /* Whether or not to show the Question (that's a label) above the note */
    };
  },

  created: function () {

    console.log("created'");
    console.log("index", this.index);
    console.log("this.totalEntries", this.totalEntries);
    console.log("this.showTooltip", this.showTooltip);

    this.noteBorderColor = UTILS.luminate(this.entry.color, -0.1);

    // The entry already has a note.
    if (this.entry.note != null) {
      this.alreadyHasNote = true; // Gonna use this for showing the icon and expanding it and stuff.
    }

    if (this.index === this.totalEntries - 1 && !this.alreadyHasNote) {
      this.canInputNote = true;
      this.showLabel = true;
    } else {
      this.canInputNote = false;
    }
  },

  mounted: function () {

    let noteInput = this.$el.querySelector(".js-note-input");

    console.log("Whast's noteInput?", noteInput);

    if (this.canInputNote) {
      autosize(noteInput);
    }

  },

  updated: function () {

    console.log("Updating entry.");

    console.log("this.index", this.index);
    console.log("this.totalEntries", this.totalEntries);

    if (this.index === this.totalEntries - 1 && !this.alreadyHasNote) {
      this.canInputNote = true;
    } else {
      this.canInputNote = false;
    }

  },

  methods: {

    /*
     * @description - Whether or not to show the label again depending on if there's content or not. */
    shouldShowLabel: function () {
      console.log("What's this.note.length?", this.note.length);
      if (this.note.length === 0) {
        this.showLabel = true;
      }
    },

    /*
     * @description - Don't show the label above the textarea */
    hideLabel: function () {
      this.showLabel = false;
    },

    resizeTextArea: function (event) {

      console.log("Entry.resizeTextArea");

      const val = event.target.value;

      if (val && val.length >= 1) {
        window.scrollTo(0, 0);
        this.shouldResizeTextArea = true;
      } else {
        window.scrollTo(0, GLOBAL_STATE.previousScrollY);
        this.shouldResizeTextArea = false;
      }

      this.note = val;

    },

    saveNote: function (event) {

      if (this.note && this.note.length >= 1) {
        this.shouldResizeTextArea = false;
        this.canInputNote = false;
        this.alreadyHasNote = true;
        this.isViewingNote = true;
        this.$emit('save-note', this.entry, this.index, this.note);
        this.$forceUpdate();
      }
    },

    formatTime: function (unformattedTime) {
      console.log("What's the unformatted time?");
      console.log("unformattedTime", unformattedTime);

      if (typeof unformattedTime === "string") {
        return moment(parseInt(unformattedTime, 10)).format('LT');
      } else {
        return moment(unformattedTime).format('LT');
      }

    },

    // Just shows the note so the user can read what they've previously written down.
    showNote: function () {
      this.isViewingNote = !this.isViewingNote;
    }
  }
};

Vue.component('entry', Entry);
