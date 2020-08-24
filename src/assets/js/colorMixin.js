export default {
  computed: {
    colorCSV: function() {
      return require("../colorlist.csv").map(function(item) {
        item.used = false
        return item
      });
    }
  },
  methods: {
    generateNextColor() {
      var retColor = this.colorCSV.find(color => color.used == false);
      retColor.used = true;
      return retColor.code
    },
    setUnusedColor(colorCode) {
      var toChange = this.colorCSV.find(color => color.code == colorCode);
      toChange.used = false;
    }
  }
}