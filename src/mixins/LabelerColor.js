export default {
  data: function () {
    return {
      fullColorIndex: 0
    }
  },
  computed: {
    colorCSV: function () {
      return require('@/../static/files/colorlist.csv').map(function (item) {
        item.used = false
        return item
      })
    }
  },
  methods: {
    generateNextColor () {
      var retColor = this.colorCSV.find(color => color.used === false)
      if (typeof retColor === 'undefined') {
        var retCode = this.colorCSV[this.fullColorIndex].code
        this.fullColorIndex += 1
        if (this.fullColorIndex === this.colorCSV.length) {
          this.fullColorIndex = 0
        }
        return retCode
      }
      retColor.used = true
      return retColor.code
    },
    setUnusedColor (colorCode) {
      var toChange = this.colorCSV.find(color => color.code === colorCode)
      toChange.used = false
    }
  }
}
