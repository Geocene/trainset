<template>
  <BaseView class="container-fluid" id="plotBox">
    <template v-slot:navbar-content>
      <h1 class="navbar-brand"><div class="homeLink" @click="routeHandler().newHome()">TRAINSET<img id="logo" src="/static/trainset_logo.png"></div></h1>
      <ul class="navbar-nav ml-auto">
        <div class="nav-link" @click="routeHandler().newHelp()">Help</div>
        <div class="nav-link" @click="routeHandler().newLicense()">License</div>
        <li class="nav-item">
          <div class="nav-link" id="clear" @click="modalHandler().openClear()">Clear</div>
        </li>
        <div class="nav-link" id="export" @click="modalHandler().openExport()">Export</div>
      </ul>
    </template>
    <template v-slot:main-content>
      <div id="hoverbox"> 
        <div id="hoverinfo" class="card chartText" style="display: none;">
          <div class="card-subtitle">Time: {{ hoverinfo.time }}</div>
          <div class="card-subtitle">Value: {{ hoverinfo.val }}</div>
          <div class="card-subtitle">Label: {{ hoverinfo.label }}</div>
        </div>
      </div>
      <div id="maindiv"></div>

      <div id="instrSelect">
        <div id="leftInstr">
            <div class="row">
              <div class="col" id="leftInstr">
                <strong>How to Label Points</strong></br>
                <strong>Click</strong> a point to toggle it as labeled</br>
                <strong>Click & Drag</strong> over a selection of points to label them</br>
                <strong><kbd>SHIFT</kbd> + Click & Drag </strong> over a selection of points to unlabel them</br>
              </div>
            </div>
        </div>
        <div id="rightInstr">
          <div class="row">
            <div class="col" id="rightInstr">
              <strong>How to Navigate the Graph</strong></br>
              <kbd>→</kbd> or <kbd>←</kbd> : pan</br>
              <kbd>SHIFT</kbd> + <kbd>→</kbd> or <kbd>←</kbd> : fast pan</br>
              <kbd>↑</kbd> or <kbd>↓</kbd>: zoom</br>
              <strong>Click & Drag</strong> the bottom context bar to adjust focus region</br>
            </div>
          </div>
        </div>
        <div id="selectors">
          <div class="row">
            <div class="col" id="leftInstr">
              <div id="selector">
                <div id="seriesSelector" style="float: right;">
                  <div id="pSeries">
                    Active Series: <select id="seriesSelect"></select>
                  </div>
                  <div id="rSeries">
                    Reference Series: <select id="referenceSelect"></select>
                  </div>
                  <div id="labelSelector">
                      <div id="lSelect">
                        Label:
                        <div id="lBox">
                          <button type="button" class="close" style="margin-right: 5px; float: left;" @click="modalHandler().openAddLabel()">
                            <span>&plus;</span>
                          </button>
                          <select id="labelSelect" v-model="selectedLabel">
                            <option v-for="label in optionsList" :key="label.name" :name="label.name">
                              {{ label.name }}
                            </option>
                          </select>
                          <button type="button" id="deleteLabel" class="close" style="margin-left: 5px;" v-visible="deleteValid" @click="modalHandler().openDeleteLabel()">
                            <span>&times;</span>
                          </button>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LabelerModal id="modal" ref="modalComponent" @clicked-ok="modalOk" @closed="postModalClose" :modal-name="modal.name" :modal-header="modal.header">
        <template v-slot:content>
          <template v-if="modal.name == 'edit'">
            <input type="text" class="bounds" id="lowBounds" v-model="axisBounds[0]"/> 
            - 
            <input type="text" class="bounds" id="highBounds" v-model="axisBounds[1]"/>
          </template>
          <template v-else-if="modal.name == 'clear'">
            All labels from this series will be erased. This cannot be undone.
          </template>
          <template v-else-if="modal.name.includes('failed')">
            {{ modal.failMessage }}
            <!-- Make sure data is in the TRAINSET format. See help. -->
          </template>
          <template v-else-if="modal.name == 'export'">
            Upload new data set or continue labeling this one?
          </template>
          <template v-else-if="modal.name == 'delete'">
            Are you sure you want to delete label: {{ selectedLabel }}
          </template>
          <template v-else-if="modal.name == 'add'">
            <input type="text" id="inputLabel" v-model="inputLabel"/> 
          </template>
        </template>
      </LabelerModal>

      <!-- invisible buttons to get from vue scope to labeler() -->
      <button id="updateHover" style="display: none;" @click="updateHoverinfo()"></button>
      <button id="updateEdit" style="display: none;" @click="modalHandler().openEdit()"></button>
      <button id="updateSelectedLabel" style="display: none;" @click="updateSelectedLabel()"></button>
      <button id="triggerReplot" style="display: none;"></button>
      <button id="triggerRecolor" style="display: none;"></button>
      <button id="clearSeries" style="display: none;"></button>
    </template>
  </BaseView>
</template>

<script>
import * as LabelerD3 from "@/assets/js/LabelerD3.js"
import colorMixin from "@/mixins/LabelerColor.js"
import LabelerModal from "@/components/LabelerModal"
import LabelerInstruction from "@/components/LabelerInstruction"

// plotting app namespace
var plottingApp = {};

export default {
  name: "labeler",
  components: {
    LabelerModal,
    LabelerInstruction
  },
  mixins: [colorMixin],
  props: {
    csvData: Array,
    filename: String,
    headerStr: String,
    seriesList: Array,
    labelList: Array,
    isValid: Boolean
  },
  data: function() {
    return {
      hoverinfo: {
        val: "",
        time: "",
        label: "",
      },
      modal: {
        name: "",
        header: "",
        failMessage: ""
      },
      selectedLabel: "",
      inputLabel: "",
      axisBounds: [],
      optionsList: []
    };
  },
  mounted: function() {
    if (this.isValid) {
      plottingApp.headerStr = this.headerStr;
      plottingApp.filename = this.filename;
      plottingApp.csvData = this.csvData;
      plottingApp.seriesList = this.seriesList;
      plottingApp.labelList = this.labelList.sort();
      $("#maindiv").append("<div class=\"loader\"></div>");

      // populate selectors
      this.handleSelector();

      LabelerD3.drawLabeler(plottingApp);
    } else {
      $("#clear").hide();
      $("#export").hide();
      $("#hoverbox").hide();
      $("#labelInstr").hide();
      this.modalHandler().openUploadFailed();
    }
  },
  watch: {
    // propogate selectedLabel to plottingApp
    selectedLabel: function(newLabel, oldLabel) {
      plottingApp.selectedLabel = newLabel;
    }
  },
  computed: {
    // determines if delete button should be visible
    deleteValid: function() {
      return !(this.optionsList.length == 1)
    }
  },
  methods: {
    // return to Index.vue
    routeHandler: function() {
      var self = this;
      return {
        // push home to vue router
        goHome: function() {
          self.$router.push({ name: "home", params: {nextUp: false} });
        },
        // push home with new upload to vue router
        newUpload: function() {
          self.$router.push({ name: "home", params: {nextUp: true} });
        },
        // open Index.vue in new window
        newHome: function() {
          let routeData = self.$router.resolve({ name: "home", params: {nextUp: false} });
          window.open(routeData.href, "_blank");
        },
        // open Help.vue in new window
        newHelp: function() {
          var routeData = self.$router.resolve({ name: "help" });
          window.open(routeData.href, "_blank");
        },
        // open License.vue in new window
        newLicense: function() {
          var routeData = self.$router.resolve({ name: "license" });
          window.open(routeData.href, "_blank");
        },
      }
    },
    modalHandler: function() {
      var self = this;
      return {
        openClear: function() {
          self.modal.name = "clear";
          self.modal.header = "Clear all labels?";
          self.$refs.modalComponent.show();
        },
        openEdit: function() {
          self.axisBounds = plottingApp.axisBounds[plottingApp.editSeries].slice(0);
          self.modal.name = "edit";
          self.modal.header = "Edit Axis Bounds";
          self.$refs.modalComponent.show();
        },
        openExport: function() {
          self.modal.name = "export";
          self.modal.header = "Export complete";
          self.$refs.modalComponent.show();
        },
        openDeleteLabel: function() {
          self.modal.name = "delete";
          self.modal.header = "Delete label?";
          self.$refs.modalComponent.show();
        },
        openAddLabel: function() {
          self.modal.name = "add";
          self.modal.header = "Add label";
          self.$refs.modalComponent.show();
        },
        openUploadFailed: function() {
          self.modal.name = "upload_failed";
          self.modal.header = "Upload Failed";
          self.modal.failMessage = "Make sure data is in the TRAINSET format. See help.";
          self.$refs.modalComponent.show();
        },
        openAxisFailed: function() {
          self.modal.name = "axis_failed";
          self.modal.header = "Invalid Bounds";
          self.modal.failMessage = "Make sure input bounds are numbers.";
          self.$refs.modalComponent.show();
        },
        openLabelFailed: function() {
          self.modal.name = "label_failed";
          self.modal.header = "Invalid Label";
          self.modal.failMessage = "Labels can only contain ≤16 letters, numbers, hyphens, or underscores. Example: my_good_label-1";
          self.$refs.modalComponent.show();
        },
        openLabelExistsFailed: function() {
          self.modal.name = "label_failed";
          self.modal.header = "Invalid Label";
          self.modal.failMessage = "Label already exists.";
          self.$refs.modalComponent.show();
        }
      }
    },
    // update #hoverinfo data
    updateHoverinfo() {
      this.hoverinfo.time = plottingApp.hoverinfo.time;
      this.hoverinfo.val = plottingApp.hoverinfo.val;
      this.hoverinfo.label = plottingApp.hoverinfo.label;
    },
    // update selected label with plottingApp.selectedLabel
    updateSelectedLabel() {
      this.selectedLabel = plottingApp.selectedLabel;
    },
    // return index in sorted labelList to add item
    searchLabelList(array, item) {
      if (array[0]["name"] > item) {
        return 0
      }
      var i = 1;
      while (i < array.length && !(array[i]["name"] > item && array[i-1]["name"] <= item)) {
          i = i + 1;
      }
      return i;
    },
    // add label in correct spot and handle delete button
    addLabel() {
      var inputIndex = this.searchLabelList(this.optionsList, this.inputLabel);
      this.optionsList.splice(inputIndex, 0, this.mapToColor(this.inputLabel));
      this.selectedLabel = this.optionsList[inputIndex].name;
    },
    // remove label
    removeLabel() {
      var toDelete = $("#labelSelect option:selected").attr("name"),
      delIndex = this.optionsList.map(l => l.name).indexOf(toDelete);
      if (delIndex != -1) {
        var deleted = this.optionsList.splice(delIndex, 1)[0];
        this.deleteColor(deleted.color);
        // remove label from plottingApp.allData
        plottingApp.allData.filter(d => d.label == deleted.name).map(d => d.label = "");
        this.selectedLabel = this.optionsList[0].name;
        $("#triggerRecolor").click();
      } else {
        alert("failed to remove");
      }
    },
    // validate axis bounds
    validBounds(bounds) {
      var valid = true;
      if (isNaN(bounds[0]) || isNaN(bounds[1]) || (bounds[0] == bounds[1])) {
        valid = false;
      }
      return valid;
    },
    // validate label
    validLabel(label) {
      return label.length > 0 
            && !(this.containsLabel(this.inputLabel)) 
            && (/^[a-zA-Z0-9_-]{0,16}$/.test(this.inputLabel)) 
    },
    containsLabel(label) {
      for (var key in this.optionsList) {
        var labelObj = this.optionsList[key];
        if (labelObj.name == label) {
          return true
        }
      }
      return false
    },
    // handle modal post-close actions (for failed popup modal)
    postModalClose(modal_name) {
      if (this.renderModal == "failed_axis") {
        this.$nextTick(() => this.modalHandler().openAxisFailed());
      } else if (this.renderModal == "failed_label") {
        this.$nextTick(() => this.modalHandler().openLabelFailed());
      } else if (this.renderModal == "failed_label_exists") {
        this.$nextTick(() => this.modalHandler().openLabelExistsFailed());
      }
      this.renderModal = "";
    },
    // handle modal ok click
    modalOk(modal_name) {
      if (modal_name == "clear") {
        $("#clearSeries").click();
      } else if (modal_name == "export") {
        this.routeHandler().newUpload();
      } else if (modal_name == "upload_failed") {
        this.routeHandler().goHome();
      } else if (modal_name == "delete") {
        this.removeLabel();
      } else if (modal_name == "edit") {
        // check validity of axisBounds
        if (this.validBounds(this.axisBounds)) {
          plottingApp.axisBounds[plottingApp.editSeries] = this.axisBounds.slice(0);
          $("#triggerReplot").click();
        } else {
          this.renderModal = "failed_axis";
        }
      } else if (modal_name == "add") {
        // check validity of inputLabel
        if (this.validLabel(this.inputLabel)) {
          this.addLabel();
        } else  {
          if (this.containsLabel(this.inputLabel)) {
            this.renderModal = "failed_label_exists";
          } else {
            this.renderModal = "failed_label";
          }
        }
      }
    },
    // map label to unique color
    mapToColor(label) {
      var color = this.generateNextColor();
      return {name: label, color: color};
    },
    // remove color from used colors
    deleteColor(color) {
      this.setUnusedColor(color)
    },
    // build series selector using seriesList
    handleSelector() {
      // populate series selector
      $.each(plottingApp.seriesList, function(i, p) {
        $("#seriesSelect").append($("<option></option>").val(p).html(p));
        $("#referenceSelect").append($("<option></option>").val(p).html(p));
      });
      // if theres only one series, omit selectors
      if (plottingApp.seriesList.length == 1) {
        $("#pSeries").hide();
        $("#rSeries").hide();
        $("#seriesSelect").hide();
        $("#referenceSelect").hide();
        $("#labelSelector").css("margin-right", "0px");
      }
      // if there no labels, use label_1
      if (plottingApp.labelList.length == 0) {
        plottingApp.labelList.push("label_1");
      }
      this.optionsList = plottingApp.labelList.map(l => this.mapToColor(l));
      plottingApp.labelList = this.optionsList;
      this.selectedLabel = this.optionsList[0].name;

      // set hoverinfo right margin 
      // TODO: MOVE HOVERINFO OVER

    }
  }
};
</script>

<style>
svg {
  font: 10px sans-serif;
  display: block;
  position: absolute;
  margin: auto;
  overflow: auto;
}

#maindiv {
  text-align: left;
}

#instrSelect {
  display: inline-grid;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
}

#labelInstr {
  display: block;
  float: left;
  max-width: 40%;
}

#selectors {
  display: block;
  float: right;
  padding-right: 15px;
}

#hoverbox {
  position: relative;
  float: right;
  z-index: 5;
}

#hoverinfo {
  position: absolute;
  text-align: left;
  padding: 10px;
  padding-bottom: 0px;
  width: 260px;
  border-color: #2c3e50;
  top: 10px;
  right: 30px;
  margin-right: 80px;
}

#selector {
  padding-right: 10%;
}

#pSeries {
  float: right;
  padding-bottom: 10px;
}

#labelSelector {
  float: right;
  z-index: 1;
  padding-top: 10px;
}

#lBox {
  display: inline-block;
}

#secondary_line {
  stroke: grey;
}

#plotbox {
  position: relative;
}

.editBtn:hover {
  fill: #E3E3E3;
}

.mainChart {
  display: block;
}

.area {
  fill: black;
  clip-path: url(#clip);
}

.line {
  fill: none;
  stroke: black;
  stroke-width: 1.5px;
  clip-path: url(#clip);
  pointer-events: none;
}

.point {
  fill: black;
  stroke: none;
  clip-path: url(#clip);
}

.axis path,
.axis line {
  fill: none;
  stroke: #000;
  shape-rendering: crispEdges;
}

.main_brush .extent,
.context_brush .extent {
  stroke: #fff;
  fill-opacity: .125;
  shape-rendering: crispEdges;
}

.loader {
  position: fixed;
  left: 45%;
  right: 25%;
  top: 25%;
  border: 16px solid #f3f3f3; /* Light grey */
  border-top: 16px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 120px;
  height: 120px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chartText {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}

#chartTitle {
  font-size: 1.4rem !important;
}

.bounds {
  width: 40%;
}

hr {
  background: #f4f4f4;
  margin-top: 0px;
}

kbd {
    display: inline-block;
    border: 1px solid #ccc !important;
    border-radius: 4px !important;
    padding: 0.1em 0.5em;
    margin: 0 0.2em;
    box-shadow: 0 1px 0px rgba(0, 0, 0, 0.2), 0 0 0 2px #fff inset;
    background-color: #f7f7f7 !important;
    font-size: 0.75em !important;
    color:black !important;
}

#legend {
  margin-top: 520px;
  margin-bottom: 30px;
  display: block;
}

#logo {
  max-height: 30px;
}
</style>

<style scoped>
html, body {
  max-width: 100% !important;
  overflow-x: hidden !important;
  overflow: hidden !important;
}
</style>