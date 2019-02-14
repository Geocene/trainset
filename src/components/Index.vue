<template>
  <div class="container">
    <nav class="navbar navbar-expand-lg fixed-top"> 
      <h1 class="navbar-brand">TRAINSET</h1>
      <div class="navbar-nav ml-auto">
        <router-link class="nav-link" v-bind:to="'/help'">Help</router-link>
      </div>
    </nav>
    <h3 id="welcome">Welcome to TRAINSET</h3>
    <button type="button" class="btn btn-lg btn-outline-danger upload" id="upload" @click="upload">Upload Data</button>
    <input type="file" id="upload-file" ref="fileInput" class="fileCheck" @change="fileCheck">
  </div>
</template>

<script>
export default {
  name: 'index',
  methods: {
    upload () {
      this.$refs.fileInput.click()
    },
    fileCheck () {
      var fileInput = document.getElementById("upload-file").files.item(0), fileText;
      var filename = fileInput.name;
      var id = 0;
      var reader = new FileReader();
      var timestamps = [];
      var values = [];
      var labels = [];
      var plotDict = [];
      if (fileInput.name.split('.').pop() == 'csv') {
        reader.readAsBinaryString(fileInput);
        reader.onloadend = () => {
          fileText = $.csv.toArrays(reader.result);
          for (var i = 1; i < fileText.length ; i++) {
            if (fileText[i].length == 4 
              && fileText[i][1].match(/((\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})[+-](\d{2})\:?(\d{2}))$/)
              && fileText[i][2].match(/-?\d+(.\d+)?$/)
              && fileText[i][3].match(/1|0$/)) {
              timestamps.push(fileText[i][1]);
              values.push(Number(fileText[i][2]));
              labels.push(Number(fileText[i][3]));
              plotDict.push({
                'id': id,
                'val': Number(fileText[i][2]),
                'time': fileText[i][1],
                'selected': Number(fileText[i][3])
              });
              id++;
            } else {
              // invalid handle
              alert("invalid");
              break;
            }
          }
          var plotData = [timestamps, values, labels];

          this.$router.push({
            name: 'labeler',
            params: {
              csvData: JSON.stringify(plotDict),
              filename: filename,
              isValid: true
            }
          });
        }
      }
      
      // check valid file
      // redirect to relevant page
      // if (fileInput.name.split('.').pop() == 'csv'
      //   /* && check if valid formed time-series csv */) {
      //   this.$router.push({
      //     path: '/upload',
      //     params: {
      //       csvData: fileInput,
      //       isValid: true
      //     }
      //   });
      // } else {
      //   this.$router.push('/fail')
      // }
    }
  }
};
</script>