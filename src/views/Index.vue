<template>
  <BaseView class="container">
    <template v-slot:main-content>
      <div>
        <h3 class="title">Welcome to TRAINSET</h3>
        <button type="button" class="btn btn-lg btn-outline-danger upload" id="upload" @click="upload">Upload Data</button>
        <input type="file" id="upload-file" ref="fileInput" class="fileCheck" @change="fileCheck">
        <a id="sampleCSV" href="/static/files/sample_trainset.csv" download>sample CSV</a>
      </div>
      <br>
      <div class="info">
        <h5 class="subh">What is it?</h5>
        TRAINSET is a graphical tool for labeling time series data. Labeling is typically used to record interesting points in time series data. For example, if you had temperature data from a sensor mounted to a stove, you could label points  that constitute cooking events. Labels could be used as-is or as a training set for machine learning algorithms. For example, TRAINSET could be used to build a training set for an algorithm that detects cooking events in temperature time series data.<br><br>

        <h5 class="subh">Where did it come from?</h5>
        TRAINSET evolved from a tool called <a href="https://github.com/geocene/sumsarizer" target="_blank">SUMSarizer</a>. SUMSarizer helps facilitate the application of ensemble machine learning tools to time series data. Most SUMSarizer users apply the tool to detect cooking events from temperature sensors called stove use monitoring systems (SUMS). SUMS are used to monitor cookstove adoption. The development of TRAINSET was funded by the NIH Clean Cooking Implementation Science Network with funding from the NIH Common Fund for Global Health. In addition to to the development of TRAINSET, NIH also supported further development of SUMSarizer. The original development of the first SUMSarizer was supported by the Center for Effective Global Action (CEGA) and Innovations for Poverty Action (IPA). SUMSarizer is an open-source R package available on <a href="https://github.com/geocene/sumsarizer" target="_blank">SUMSarizer's GitHub page</a>.<br><br>

        <h5 class="subh">Who made it?</h5>
        TRAINSET is maintained by <a href="https://geocene.com" target="_blank">Geocene Inc.</a> with extensive contributions from Rush Kapoor, Ajay Pillarisetti, Jeremy Coyle, Skot Croshere, Marc Paré, Hamza Benkhay, and Danny Wilson.<br/><br/>
      </div>
    </template>
  </BaseView>
</template>

<script>
const { DateTime } = require('luxon')

/* eslint-disable no-unused-vars */
const strftime = require('strftime')
/* eslint-enable no-unused-vars */

export default {
  name: 'index',
  data: function () {
    return {
      errorUpload: false
    }
  },
  props: {
    nextUp: Boolean
  },
  methods: {
    // push Labeler.vue invalid landing
    error () {
      this.errorUpload = true
      this.$router.push({
        name: 'labeler',
        params: {
          csvData: [],
          minMax: [],
          filename: '',
          headerStr: '',
          isValid: false
        }
      })
    },
    // trigger file upload
    shouldUpload () {
      if (this.nextUp === true) {
        setTimeout(() => this.upload(), 100)
      }
    },
    upload () {
      this.$refs.fileInput.click()
    },
    // check format validity of csv
    fileCheck () {
      window.onerror = (errorMsg, url, lineNumber) => {
        this.error()
      }
      var fileInput = document.getElementById('upload-file').files.item(0); var fileText
      var filename = fileInput.name.split('.csv')[0]
      var id = 0
      var reader = new FileReader()
      var seriesList = new Set(); var labelList = new Set(); var plotDict = []; var headerStr
      reader.readAsBinaryString(fileInput)
      reader.onloadend = () => {
        fileText = $.csv.toArrays(reader.result)
        headerStr = fileText[0].toString()
        for (var i = 1; i < fileText.length; i++) {
          if (fileText[i].length === 4 &&
            fileText[i][1].match(/^((\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(.(\d{3}))?(([+-](\d{2}):?(\d{2}))|Z))$/) &&
            fileText[i][2].match(/^-?\d+(.\d+)?$/) &&
            fileText[i][3].match(/^[a-zA-Z0-9_-]{0,16}$/)
            /* && fileText[i][0].includes(filename) */) {
            var date = DateTime.fromISO(fileText[i][1], {setZone: true})
            var series = fileText[i][0]
            seriesList.add(series)
            if (fileText[i][3]) {
              labelList.add(fileText[i][3])
            }
            plotDict.push({
              'id': id.toString(),
              'val': Number(fileText[i][2]).toString(),
              'time': date,
              'series': series,
              'label': fileText[i][3]
            })
            id++
          } else {
            if (!(fileText[i].length === 4)) {
              console.log('line parse error')
            } else if (!fileText[i][2].match(/-?\d+(.\d+)?$/)) {
              console.log('val parse error')
            } else if (!fileText[i][3].match(/^[a-zA-Z0-9_-]{0,16}$/)) {
              console.log('label parse error')
            } else {
              console.log('date parse error')
            }
            this.error()
            break
          }
        }
        // if there was no error parsing csv
        if (!this.errorUpload) {
          seriesList = Array.from(seriesList)
          labelList = Array.from(labelList)

          this.$router.push({
            name: 'labeler',
            params: {
              csvData: plotDict,
              filename: filename,
              headerStr: headerStr,
              seriesList: seriesList,
              labelList: labelList,
              isValid: true
            }
          })
        }
      }
    }
  },
  created () {
    this.shouldUpload()
  }
}
</script>

<style scoped>
#upload { margin-top: 20px; border-width: 3px; border-color: #7E4C64; color: #7E4C64; padding: 15px 60px; }
#upload:hover {  background: #7E4C64; color: #f4f4f4; }
#upload-file { display: none; }
.subh { font-weight: 900 !important; }
#sampleCSV {
  display: block;
  padding-top: 10px;
  padding-bottom: 5px;
  margin-left: 40%;
  margin-right: 40%;
}
</style>
