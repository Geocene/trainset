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
      TRAINSET evolved from a tool called <a href="https://github.com/geocene/sumsarizer" target="_blank">SUMSarizer</a>. SUMSarizer helps facilitate the application of ensemble machine learning tools to time series data. Most SUMSarizer users apply the tool to detect cooking events from temperature sensors called stove use monitoring systems (SUMS). SUMS are used to monitor cookstove adoption. Funding from __TODO__ has funded the development and maintenance of TRAINSET and SUMSarizer. SUMSarizer is an open-source R package available on <a href="https://github.com/geocene/sumsarizer" target="_blank">SUMSarizer's GitHub page</a>.<br><br>
      
      <h5 class="subh">Who made it?</h5>
      TRAINSET is maintained by <a href="https://geocene.com" target="_blank">Geocene Inc.</a> with extensive contributions from Rush Kapoor, Ajay Pillarisetti, Jeremy Coyle, Skot Croshere, Marc Paré, Hamza Benkhay, and Danny Wilson.</br></br>
    </div>
  </div>
</template>

<script>
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
    fileCheck () {
      window.onerror = (errorMsg, url, lineNumber) => {
        this.error();
      }
      var fileInput = document.getElementById("upload-file").files.item(0), fileText;
      var filename;
      var id = 0;
      var reader = new FileReader();
      var timestamps = [];
      var values = [];
      var labels = [];
      var plotDict = [];
      var headerStr;
      reader.readAsBinaryString(fileInput);
      reader.onloadend = () => {
        fileText = $.csv.toArrays(reader.result);
        headerStr = fileText[0].toString();
        for (var i = 1; i < fileText.length ; i++) {
          if (i === 1) {
            filename = fileText[i][0];
          }
          if (fileText[i].length === 4 
            && fileText[i][1].match(/((\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})(.(\d{3}))?(([+-](\d{2})\:?(\d{2}))|Z))$/)
            && fileText[i][2].match(/-?\d+(.\d+)?$/)
            && fileText[i][3].match(/1|0$/)
            && fileText[i][0].includes(filename)) {
            var date;
            var isMatch = /([+-](\d{2})\:?(\d{2}))$/.exec(fileText[i][1]);
            if (isMatch != null && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
              var safariDate = fileText[i][1].replace(isMatch[0], "");
              date = strftime('%Y-%m-%d %H:%M:%S', new Date(safariDate)) + isMatch[0];
            } else {
              date = strftime('%Y-%m-%d %H:%M:%S%z', new Date(fileText[i][1]));
            }  
            timestamps.push(date.toString());
            values.push(fileText[i][2]);
            labels.push(Number(fileText[i][3]));
            plotDict.push({
              'id': id.toString(),
              'val': Number(fileText[i][2]).toString(),
              'time': date.toString(),
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
            } else if (!fileText[i][0].match(filename)) {
              console.log('filename parse error');
            } else {
              console.log('date parse error');
            }
            this.error();
            break;
          }
        }
        var minMax = [Math.max.apply(Math, values), Math.min.apply(Math, values)];
        minMax[0] = minMax[0] + ((minMax[0] - minMax[1]) * 0.05);
        minMax[1] = minMax[1] - ((minMax[0] - minMax[1]) * 0.05);
        var plotData = [timestamps, values, labels];

        this.$router.push({
          name: 'labeler',
          params: {
            csvData: plotDict,
            minMax: minMax,
            filename: filename,
            headerStr: headerStr,
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