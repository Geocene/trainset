<template>
  <div class="container">
    <nav class="navbar navbar-expand-lg fixed-top"> 
      <h1 class="navbar-brand">TRAINSET<img id="logo" src="../assets/trainset_logo.png"></h1>
      <div class="navbar-nav ml-auto">
        <router-link class="nav-link" v-bind:to="'/help'">Help</router-link>
        <router-link class="nav-link" v-bind:to="'/license'">License</router-link>
      </div>
    </nav>
    <div>
      <h3 id="welcome">Welcome to TRAINSET</h3>
      <button type="button" class="btn btn-lg btn-outline-danger upload" id="upload" @click="upload">Upload Data</button>
      <input type="file" id="upload-file" ref="fileInput" class="fileCheck" @change="fileCheck">
      <a id="sampleCSV" href="/static/sample_trainset.csv" download>sample CSV</a>
    </div>
    <br>
    <div id="info">
      <h5 class="subh">What is it?</h5>
      TRAINSET is a graphical tool for labeling time series data. Labeling is typically used to record interesting points in time series data. For example, if you had temperature data from a sensor mounted to a stove, you could label points  that constitute cooking events. Labels could be used as-is or as a training set for machine learning algorithms. For example, TRAINSET could be used to build a training set for an algorithm that detects cooking events in temperature time series data.<br><br>
      
      <h5 class="subh">Where did it come from?</h5>
      TRAINSET evolved from a tool called <a href="https://github.com/geocene/sumsarizer" target="_blank">SUMSarizer</a>. SUMSarizer helps facilitate the application of ensemble machine learning tools to time series data. Most SUMSarizer users apply the tool to detect cooking events from temperature sensors called stove use monitoring systems (SUMS). SUMS are used to monitor cookstove adoption. The development of TRAINSET was funded by the NIH Clean Cooking Implementation Science Network with funding from the NIH Common Fund for Global Health. In addition to to the development of TRAINSET, NIH also supported further development of SUMSarizer. The original development of the first SUMSarizer was supported by the Center for Effective Global Action (CEGA) and Innovations for Poverty Action (IPA). SUMSarizer is an open-source R package available on <a href="https://github.com/geocene/sumsarizer" target="_blank">SUMSarizer's GitHub page</a>.<br><br>
      
      <h5 class="subh">Who made it?</h5>
      TRAINSET is maintained by <a href="https://geocene.com" target="_blank">Geocene Inc.</a> with extensive contributions from Rush Kapoor, Ajay Pillarisetti, Jeremy Coyle, Skot Croshere, Marc Paré, Hamza Benkhay, and Danny Wilson.</br></br>
    </div>
  </div>
</template>

<script>
const { DateTime } = require("luxon");
var strftime = require('strftime');

export default {
  name: 'index',
  props: {
    nextUp: Boolean
  },
  methods: {
    error() {
      this.$router.push({
        name: 'labeler',
        params: {
          csvData: [],
          minMax: [],
          filename: "",
          headerStr: "",
          isValid: false
        }
      });
    },
    shouldUpload() {
      if (this.nextUp === true) {
        this.$nextTick(function() {this.upload()});
      }
    },
    upload () {
      this.$refs.fileInput.click()
    },
    parseDate (date) {
      var parts = date.split(/\D/);
      return new Date()
    },
    toISOString (date) {
      var tzo = -date.getTimezoneOffset(),
          dif = tzo >= 0 ? '+' : '-',
          pad = function(num) {
              var norm = Math.floor(Math.abs(num));
              return (norm < 10 ? '0' : '') + norm;
          },
          padms = function(ms) {
            ms = ms.toString()
            while (ms.length < 3) {
              ms = "0" + ms
            }
            return ms
          };
      return date.getFullYear() +
          '-' + pad(date.getMonth() + 1) +
          '-' + pad(date.getDate()) +
          'T' + pad(date.getHours()) +
          ':' + pad(date.getMinutes()) +
          ':' + pad(date.getSeconds()) +
          '.' + padms(date.getMilliseconds()) +
          dif + pad(tzo / 60) + pad(tzo % 60);
    },
    fileCheck () {
      window.onerror = (errorMsg, url, lineNumber) => {
        this.error();
      }
      var fileInput = document.getElementById("upload-file").files.item(0), fileText;
      var filename = fileInput.name.split('.csv')[0];
      var id = 0;
      var reader = new FileReader();
      var seriesList = new Set();
      var plotDict = [];
      var headerStr;
      reader.readAsBinaryString(fileInput);
      reader.onloadend = () => {
        fileText = $.csv.toArrays(reader.result);
        headerStr = fileText[0].toString();
        for (var i = 1; i < fileText.length ; i++) {
          if (fileText[i].length === 4 
            && fileText[i][1].match(/((\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})(.(\d{3}))?(([+-](\d{2})\:?(\d{2}))|Z))$/)
            && fileText[i][2].match(/-?\d+(.\d+)?$/)
            && fileText[i][3].match(/1|0$/)
            /* && fileText[i][0].includes(filename) */) {
            var date = DateTime.fromISO(fileText[i][1], {setZone: true});
            var series = fileText[i][0];
            seriesList.add(series);
            plotDict.push({
              'id': id.toString(),
              'val': Number(fileText[i][2]).toString(),
              'time': date,
              'series': series,
              'selected': Number(fileText[i][3]).toString()
            });
            id++;
          } else {
            if (!(fileText[i].length === 4)) {
              console.log('line parse error');
            } else if (!fileText[i][2].match(/-?\d+(.\d+)?$/)) {
              console.log('val parse error');
            } else if (!fileText[i][3].match(/1|0$/)) {
              console.log('selected parse error');
            } else {
              console.log('date parse error');
            }
            this.error();
            break;
          }
        }

        seriesList = Array.from(seriesList);

        this.$router.push({
          name: 'labeler',
          params: {
            csvData: plotDict,
            filename: filename,
            headerStr: headerStr,
            seriesList: seriesList,
            isValid: true
          }
        });
      }
    }
  },
  created() {
    this.shouldUpload()
  }
};
</script>

<style>
#upload { margin-top: 20px; border-width: 3px; border-color: #7E4C64; color: #7E4C64; padding: 15px 60px; }
#upload:hover {  background: #7E4C64; color: #f4f4f4; }
#upload-file { display: none; }
</style>

<style scoped>
#welcome { color: #7E4C64; font-weight: bold; }
#info { text-align: left; padding-left: 100px; }
.subh { color: #7E4C64; font-weight: 900 !important; }
#sampleCSV {
  display: block;
  padding-top: 10px;
  padding-bottom: 5px;
  margin-left: 40%;
  margin-right: 40%;
}
</style>