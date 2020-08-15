<template>
  <div class="container-fluid" id="plotBox">

    <nav class="navbar navbar-expand fixed-top"> 
      <h1 class="navbar-brand"><div class="homeLink" @click="newHome()">TRAINSET<img id="logo" src="../assets/trainset_logo.png"></div></h1>
      <ul class="navbar-nav ml-auto">
        <div class="nav-link" @click="newHelp()">Help</div>
        <div class="nav-link" @click="newLicense()">License</div>
        <li class="nav-item">
          <div class="nav-link" id="clear" @click="openClearModal()">Clear</div>
        </li>
        <div class="nav-link" id="export" @click="openExportModal()">Export</div>
      </ul>
    </nav>

    <div id="hoverbox">
      <div id="selector">
        <div id="labelSelector">
          <button type="button" class="close" style="margin-right: 5px; float: left;">
            <span>&plus;</span>
          </button>
          <select id="labelSelect">
          </select>
          <button type="button" class="close" style="margin-left: 5px;">
            <span>&times;</span>
          </button>
        </div>
        <div id="seriesSelector" style="float: right;">
          <select id="seriesSelect"></select><input type=checkbox id="ref_selector"/>
        </div>
      </div>
      <div id="hoverinfo" class="card">
        <div class="card-subtitle">Time: {{ time }}</div>
        <div class="card-subtitle">Value: {{ val }}</div>
        <div class="card-subtitle">Series: {{ hoverSeries }}</div>
      </div>
    </div>
    <div id="maindiv"></div>

    <div id="legend" class="container">
      <div class="row">
        <div class="col">
          <strong>How to Label Points</strong></br>
          <strong>Click</strong> a point to toggle it as labeled</br>
          <strong>Click & Drag</strong> over a selection of points to label them</br>
          <strong><kbd>SHIFT</kbd> + Click & Drag </strong> over a selection of points to unlabel them</br>
        </div>
        <div class="col">
          <strong>How to Navigate the Graph</strong></br>
          <kbd>→</kbd> or <kbd>←</kbd> : pan</br>
          <kbd>SHIFT</kbd> + <kbd>→</kbd> or <kbd>←</kbd> : fast pan</br>
          <kbd>↑</kbd> or <kbd>↓</kbd>: zoom</br>
          <strong>Click & Drag</strong> the bottom context bar to adjust focus region</br>
        </div>
      </div>
    </div>

    <DialogModal id="modal" ref="modalComponent" @clicked-ok="modalOk" :modalName="modal.name" :modalHeader="modal.header">
      <template v-slot:content>
        <template v-if="modal.name == 'edit'">
          <input type="text" class="bounds" id="lowBounds" v-model="axisBounds[0]"/> 
          - 
          <input type="text" class="bounds" id="highBounds" v-model="axisBounds[1]"/>
        </template>
        <template v-else-if="modal.name == 'clear'">
          All labels from this set will be erased. This cannot be undone.
        </template>
        <template v-else-if="modal.name == 'failed'">
          Make sure data is in the TRAINSET format. See help.
        </template>
        <template v-else-if="modal.name == 'export'">
          Upload new data set or continue labeling this one?
        </template>
      </template>
    </DialogModal>

    <!-- invisible buttons to get from vue scope to labeler() -->
    <button id="updateHover" style="display: none;" v-on:click="updateHoverinfo"></button>
    <button id="updateEdit" style="display: none;" v-on:click="openEditModal"></button>
    <button id="triggerReplot" style="display: none;"></button>
    <button id="clearSeries" style="display: none;"></button>

  </div>
</template>

<script>
import * as d3 from "d3"
import * as dc from "dc"
import { largestTriangleThreeBucket } from "d3fc-sample";
import DialogModal from "./Modal";
const { DateTime } = require("luxon");

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function() {  
  return this.each(function() { 
      var firstChild = this.parentNode.firstChild; 
      if (firstChild) {
          this.parentNode.insertBefore(this, firstChild); 
      } 
  });
};

d3.selection.prototype.first = function() {  
  return d3.select(this.nodes()[0]);  
};

d3.selection.prototype.last = function() {
  return d3.select(this.nodes()[this.size() - 1]);
};

// plotting app namespace
var plottingApp = {};

export default {
  name: "labeler",
  components: {
    DialogModal
  },
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
      val: "",
      time: "",
      hoverSeries: "",
      axisBounds: [],
      modal: {
        name: "",
        header: "",
        message: ""
      }
    };
  },
  methods: {
    // return to Index.vue
    goHome() {
      this.$router.push({ name: "home", params: {nextUp: false} });
    },
    // return to Index.vue and trigger file upload selection
    newUpload() {
      this.$router.push({ name: "home", params: {nextUp: true} });
    },
    // open Help.vue in new window
    newHelp() {
      let routeData = this.$router.resolve({ name: "help" });
      window.open(routeData.href, "_blank");
    },
    // open License.vue in new window
    newLicense() {
      let routeData = this.$router.resolve({ name: "license" });
      window.open(routeData.href, "_blank");
    },
    // open Index.vue in new window
    newHome() {
      let routeData = this.$router.resolve({ name: "home", params: {nextUp: false} });
      window.open(routeData.href, "_blank");
    },
    // update #hoverinfo data
    updateHoverinfo() {
      this.time = window.time;
      this.val = window.val;
      this.hoverSeries = window.hoverSeries;
    },
    // update #editAxis info
    updateEditinfo() {
      this.axisBounds = window.axisBounds[window.editSeries];
    },
    // open clear modal
    openClearModal() {
      this.modal.name = "clear";
      this.modal.header = "Clear all labels?";
      this.$refs.modalComponent.show();
    },
    // open edit modal
    openEditModal() {
      this.axisBounds = window.axisBounds[window.editSeries];
      this.modal.name = "edit";
      this.modal.header = "Edit Axis Bounds";
      this.$refs.modalComponent.show();
    },
    // open export modal
    openExportModal() {
      this.modal.name = "export";
      this.modal.header = "Export complete";
      this.$refs.modalComponent.show();
    },
    // handle upload failed modal
    uploadFailed() {
      $("#clear").hide();
      $("#export").hide();
      $("#hoverbox").hide();
      this.modal.name = "failed";
      this.modal.header = "Upload Failed";
      this.$refs.modalComponent.show();
    },
    // validate axis bounds
    invalidBounds(bounds) {
      var invalid = false;
      if (isNaN(bounds[0]) || isNaN(bounds[1]) || (bounds[0] == bounds[1])) {
        invalid = true;
      }
      return invalid;
    },
    // handle modal ok click
    modalOk(modal_name) {
      if (modal_name == "edit") {
        // check validity of axisBounds
        if (this.invalidBounds(this.axisBounds)) {
          alert("invalid");
        } else {
          $("#triggerReplot").click();
        }
      } else if (modal_name == "clear") {
        $("#clearSeries").click();
      } else if (modal_name == "export") {
        this.newUpload();
      } else if (modal_name == "failed") {
        this.goHome();
      }
    },
    // build series selector using seriesList
    handleSelector() {
      // populate series selector
      $.each(plottingApp.seriesList, function(i, p) {
        $("#seriesSelect").append($("<option></option>").val(p).html(p));
      });
      // if theres only one series, omit selector
      if (plottingApp.seriesList.length == 1) {
        $("#seriesSelector").hide();
        $("#labelSelector").css("margin-right", "0px");
      }
      // if there no labels, use label_1
      if (plottingApp.labelList.length == 0) {
        plottingApp.labelList.push("label_1");
      }
      // populate label selector
      $.each(plottingApp.labelList, function(i, p) {
        $("#labelSelect").append($("<option></option>").val(p).html(p));
      });
      plottingApp.selectedLabel = $("#labelSelect option:selected").val();
    }
  },
  mounted() {
      if (this.isValid) {
        plottingApp.headerStr = this.headerStr;
        plottingApp.filename = this.filename;
        plottingApp.csvData = this.csvData;
        plottingApp.seriesList = this.seriesList;
        plottingApp.labelList = this.labelList;
        $("#maindiv").append("<div class=\"loader\"></div>");
        $("#maindiv").css("padding", "0% 5.2%");

        // populate selectors
        this.handleSelector();

        $("#hoverinfo").hide();

        // global axis bounds dict
        window.axisBounds = {};

        labeler();
      } else {
        this.uploadFailed();
      }
  }
}

function labeler () {
  // main -- main plot
  // context -- smaller context plot for zooming, scrolling

  //margins
  plottingApp.main_margin = {top: 10, right: 10, bottom: 100, left: 40},
  plottingApp.context_margin = {top: 430, right: 40, bottom: 20, left: 40},
  plottingApp.maindiv_width = $("#maindiv").width(),
  plottingApp.width = plottingApp.maindiv_width - plottingApp.main_margin.left - plottingApp.main_margin.right,
  plottingApp.main_height = 500 - plottingApp.main_margin.top - plottingApp.main_margin.bottom,
  plottingApp.context_height = 500 - plottingApp.context_margin.top - plottingApp.context_margin.bottom,
  plottingApp.label_margin = {small: 10, large: 20};

  //scales
  plottingApp.main_xscale = d3.scaleTime().range([0, plottingApp.width]),
  plottingApp.context_xscale = d3.scaleTime().range([0, plottingApp.width]),
  plottingApp.main_yscale = d3.scaleLinear().range([plottingApp.main_height, 0]),
  plottingApp.secondary_yscale = d3.scaleLinear().range([plottingApp.main_height, 0]),
  plottingApp.context_yscale = d3.scaleLinear().range([plottingApp.context_height, 0]);

  //axes
  //can adjust multiscale time ticks: http://bl.ocks.org/mbostock/4149176
  plottingApp.main_xaxis = d3.axisBottom(plottingApp.main_xscale),
  plottingApp.context_xaxis = d3.axisBottom(plottingApp.context_xscale),
  plottingApp.y_axis = d3.axisLeft(plottingApp.main_yscale),
  plottingApp.ref_axis = d3.axisRight(plottingApp.secondary_yscale);

  var viewBox_width = plottingApp.width + plottingApp.main_margin.left + plottingApp.main_margin.right,
  viewBox_height = plottingApp.main_height + plottingApp.main_margin.top + plottingApp.main_margin.bottom;

  //plotting areas
  plottingApp.svg = d3.select("#maindiv").append("svg")
  .classed("container-fluid", true)
  .classed("mainChart", true)
  .attr("id", "mainChart")
  .attr("width", viewBox_width)
  .attr("height", viewBox_height)
  .attr("viewBox", "0 0 " + viewBox_width + " " + viewBox_height)
  .attr("perserveAspectRatio", "xMinYMid meet");

  d3.select("#maindiv")
      .insert("text", "#mainChart")
        .attr("id", "chartTitle")
        .attr("x", (plottingApp.width / 2))             
        .attr("y", 0)
        .attr("padding-bottom", "-300px")
        .attr("padding", "inherit 150px")  
        .style("font-size", "25px")
        .text("Filename: " + plottingApp.filename)
        .attr("viewBox", "0 0 " + viewBox_width + " " + viewBox_height)
      .attr("perserveAspectRatio", "xMinYMid meet");

  // create clipPath for svg elements (prevents svg elements outside of main window)
  plottingApp.svg.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", plottingApp.width)
  .attr("height", plottingApp.main_height);

  //main window
  plottingApp.main = plottingApp.svg.append("g")
  .attr("class", "main")
  .attr("transform", "translate(" + plottingApp.main_margin.left + "," + plottingApp.main_margin.top + ")");

  // smaller context window
  plottingApp.context = plottingApp.svg.append("g")
  .attr("class", "context")
  .attr("transform", "translate(" + plottingApp.context_margin.left + "," + plottingApp.context_margin.top + ")");

  // d3 brushes
  plottingApp.main_brush = d3.brush()
  .extent([[0,0], [plottingApp.width, plottingApp.main_height]])
  .on("end", brushedMain);

  plottingApp.context_brush = d3.brushX()
  .extent([[0,0],[plottingApp.width, plottingApp.context_height]])
  .on("end", brushedContext)
  .on("brush", limitContext);

  // d3 lines
  plottingApp.main_line = d3.line()
  .curve(d3.curveLinear)
  .x(function(d) { return plottingApp.main_xscale(d.time); })
  .y(function(d) { return plottingApp.main_yscale(d.val); });

  plottingApp.secondary_line = d3.line()
  .curve(d3.curveLinear)
  .x(function(d) { return plottingApp.main_xscale(d.time); })
  .y(function(d) { return plottingApp.secondary_yscale(d.val); });

  plottingApp.context_line = d3.line()
  .curve(d3.curveLinear)
  .x(function(d) { return plottingApp.context_xscale(d.time); })
  .y(function(d) { return plottingApp.context_yscale(d.val); });

  // add ref graph selector if len(seriesList) > 1
  if (plottingApp.seriesList.length > 1) {
    $("#ref_selector").on("change", function() {
      if (this.checked) {
        setReference(1);
      } else {
        setReference(0);
      }
    });
  }

  // load data format and brushes
  plottingApp.shiftKey = false,
  plottingApp.brushSelector = "Invert",
  plottingApp.selectedSeries = $("#seriesSelect option:selected").val(),
  plottingApp.refSeries = "";
  // plot namespace (for svg selections associated with d3 objects)
  plottingApp.plot = {};

  $(function () {
   init();
  });

  /* initialize plots with default series data */
  function init() {
    plottingApp.allData = plottingApp.csvData.map(type);
    plottingApp.data = plottingApp.allData.filter(d => d.series == plottingApp.selectedSeries);
    
    updateBrushData();

    // get default focus
    var defaultExtent = getDefaultExtent();
    // set scales based on loaded data, default focus
    plottingApp.context_xscale.domain(padExtent(d3.extent(
      plottingApp.allData.map(function(d) { return d.time; })))); // xaxis set according to allData
    
    defaultExtent[0] = plottingApp.context_xscale.domain()[0];
    plottingApp.main_xscale.domain(defaultExtent);

    initPlot();
    updateYAxis();
    updateMain();
    plotContext();

    plottingApp.plot.context_brush.call(plottingApp.context_brush.move, 
      defaultExtent.map(plottingApp.context_xscale));
    plottingApp.plot.context_brush.moveToBack();

    // remove loading bar
    $(".loader").css("display", "none");
  }

  /* initialize plot brushes, axes */
  function initPlot() {
    // create context and main x axes
    plottingApp.main.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + plottingApp.main_height + ")")
    .call(plottingApp.main_xaxis);

    plottingApp.context.append("g")
      .attr("transform", "translate(0," + plottingApp.context_height + ")")
      .attr("class", "x axis")
      .call(plottingApp.context_xaxis);

    // create main and context brushes
    plottingApp.plot.main_brush = plottingApp.main.append("g")
    .attr("class", "main_brush")
    .call(plottingApp.main_brush);

    plottingApp.plot.context_brush = plottingApp.context.append("g")
    .attr("class", "context_brush")
    .call(plottingApp.context_brush);

    // move brushes to back
    plottingApp.plot.main_brush.moveToBack();
    plottingApp.plot.context_brush.moveToBack();

    // disable click selection clear on context brush

    // store the reference to the original handler
    var oldMousedown = plottingApp.plot.context_brush.on("mousedown.brush");

    // and replace it with our custom handler
    plottingApp.plot.context_brush.on("mousedown.brush", function () {
        plottingApp.plot.context_brush.on("mouseup.brush", function () {
            clearHandlers();
        });

        plottingApp.plot.context_brush.on("mousemove.brush", function () {
            clearHandlers();
            oldMousedown.call(this);
        });

        function clearHandlers() {
            plottingApp.plot.context_brush.on("mousemove.brush", null);
            plottingApp.plot.context_brush.on("mouseup.brush", null);
        }
    });
  }

  /* plot context graph line */
  function plotContext() {
    // if context line already exists, delete it
    if (plottingApp.plot.context_line) {
      plottingApp.plot.context_line.remove();
    }

    //context plot
    plottingApp.plot.context_line = plottingApp.context.append("path")
    .datum(plottingApp.context_data)
    .attr("class", "line")
    .attr("d", plottingApp.context_line);


    plottingApp.context_points = plottingApp.context.selectAll(".point")
    .data(plottingApp.context_data)
    .join("circle")
    .attr("class", "point")
    .attr("cx", function(d) { return plottingApp.context_xscale(d.time); })
    .attr("cy", function(d) { return plottingApp.context_yscale(d.val); })
    .attr("r", 2)
    .classed("selected", function(d) { return isSelected(d); });
  }

  /* update yaxes bounds based on selected and reference series */
  function updateYAxis() {
    // set y-axis based on selected series
    var minMax;
    if (window.axisBounds[plottingApp.selectedSeries]) {
      minMax = window.axisBounds[plottingApp.selectedSeries];
    } else {
      minMax = getMinMax(plottingApp.selectedSeries);
      window.axisBounds[plottingApp.selectedSeries] = minMax;
    }

    plottingApp.main_yscale.domain(minMax);
    plottingApp.context_yscale.domain(padExtent(getMinMax(plottingApp.selectedSeries)));

    // redraw / draw primary y axis
    if (plottingApp.plot.y_axis) {
      plottingApp.plot.y_axis.remove();
    }

    plottingApp.plot.y_axis = plottingApp.main.append("g")
    .attr("class", "y axis primary")
    .call(plottingApp.y_axis)
    .call(g => g.select(".domain").remove());

    // add primary y axis label
    var axisBox = plottingApp.plot.y_axis.node().getBBox();
    plottingApp.main.select(".y.axis.primary").append("text")
    .attr("class", "y label primary")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - axisBox.width - plottingApp.label_margin.small)
    .attr("x", 0 - plottingApp.main_height / 2)
    .attr("fill", "currentColor")
    .text(plottingApp.selectedSeries);

    // handle editable primary y axis
    var lastTick = plottingApp.main.selectAll(".y.axis.primary .tick").last(),
    translateY = Number(lastTick.attr("transform").split(",")[1].slice(0, -1)); // drop Edit button to highest tick

    plottingApp.main.select(".y.axis.primary").append("g")
    .attr("class", "button y primary")
    .attr("transform", "translate(" + (0 - axisBox.width - plottingApp.label_margin.small) + "," + translateY + ")")
    .append("text")
    .text("Edit")
    .attr("dy", "0.32em")
    .attr("cursor", "default")
    .attr("fill", "currentColor")
    .on("click", function(d, i) { return updateMainY(plottingApp.selectedSeries); });

    // handle redraw reference y axis
    if (plottingApp.plot.ref_axis) {
      plottingApp.plot.ref_axis.remove();
    }

    // handle ref series
    if (plottingApp.refSeries != "" && plottingApp.selectedSeries != plottingApp.refSeries) {
      if (window.axisBounds[plottingApp.refSeries]) {
        minMax = window.axisBounds[plottingApp.refSeries];
      } else {
        minMax = getMinMax(plottingApp.refSeries);
        window.axisBounds[plottingApp.refSeries] = minMax;
      }

      plottingApp.secondary_yscale.domain(minMax);

      plottingApp.plot.ref_axis = plottingApp.main.append("g")
      .attr("class", "y axis secondary")
      .attr("transform", "translate(" + plottingApp.width + ",0)")
      .call(plottingApp.ref_axis)
      .call(g => g.select(".domain").remove());

      // add reference y axis label
      axisBox = plottingApp.plot.ref_axis.node().getBBox();
      plottingApp.main.select(".y.axis.secondary").append("text")
          .attr("class", "y label secondary")
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 + axisBox.width + plottingApp.label_margin.large)
          .attr("x", 0 - plottingApp.main_height / 2)
          .attr("fill", "currentColor")
          .text(plottingApp.refSeries);

      // handle editable primary y axis
      lastTick = plottingApp.main.selectAll(".y.axis.secondary .tick").last(),
      translateY = lastTick.attr("transform").split(",")[1].slice(0, -1); // drop Edit button to highest tick

      plottingApp.main.select(".y.axis.secondary").append("g")
      .attr("class", "button y secondary")
      .attr("transform", "translate(" + (axisBox.width + plottingApp.label_margin.small) + "," + translateY + ")")
      .append("text")
      .text("Edit")
      .attr("dy", "0.32em")
      .attr("cursor", "default")
      .attr("fill", "currentColor")
      .on("click", function(d, i) { return updateMainY(plottingApp.refSeries); });
    }
  }

  /* redraw main graph with new points */
  function updateMain() {
    // subset to only data in current domain
    var x_domain = plottingApp.main_xscale.domain();

    var  main_data = plottingApp.data.filter(function(d){
      return x_domain[0] <= d.time & d.time <= x_domain[1]
    });

    // handles ref series
    var secondary_data = plottingApp.refSeries == "" || 
      plottingApp.refSeries == plottingApp.selectedSeries ? null : plottingApp.allData
        .filter(d => d.series == plottingApp.refSeries)
        .filter(function(d) {
          return x_domain[0] <= d.time & d.time <= x_domain[1]
        });

    var total_data = secondary_data == null ? main_data : [...main_data, ...secondary_data];

    // redraw path
    var path = plottingApp.main.selectAll("path");
    path.remove();

    // add primary series data line
    plottingApp.main.append("path")
      .datum(main_data)
      .attr("class","line")
      .attr("fill-opacity", "0.7")
      .attr("d", plottingApp.main_line);

    // redraw points
    var point = plottingApp.main.selectAll("circle").data(total_data);

    point.join("circle")
    .attr("class", "point")
    .attr("cx", function(d) { return plottingApp.main_xscale(d.time); })
    .attr("cy", function(d) { return selectYScale(d); })
    .attr("r", 5)
    .classed("selected", function(d) { return isSelected(d); });

    // add secondary line and update secondary point styling if there is reference
    if (secondary_data) {
      plottingApp.main.append("path")
        .datum(secondary_data)
        .attr("class","line")
        .attr("id", "secondary_line")
        .attr("fill-opacity", "0.4")
        .attr("d", plottingApp.secondary_line)
        .moveToBack();

      plottingApp.main.selectAll(".point")
      .filter((d, i) => d.series == plottingApp.refSeries)
      .attr("fill-opacity", "0.4")
      .attr("r", 2)
      .attr("pointer-events", "none")
      .moveToBack();
    }

    /* add hover and click-label functionality for primary series points */
    var timer;

    plottingApp.main.selectAll(".point")
    .filter((d, i) => d.series == plottingApp.selectedSeries)
    .moveToFront()
    .attr("fill-opacity", "0.7")
    .attr("pointer-events", "all")
    .on("click", function(point){
          //allow clicking on single points
          point.selected=1-point.selected;
          updateSelection();
        });

    toggleHoverinfo(true);

    // update xAxis svg element
    plottingApp.main.select(".x.axis").call(plottingApp.main_xaxis);
  }

  /* replot svg after changing series */
  function replot() {
    updateBrushData();
    updateYAxis();
    plotContext();
    updateMain();
    updateSelection();
  }

  /* downsample context points using largest triangle three buckets algorithm
     and build quadtree for main brushing */
  function updateBrushData() {
    // Build quadtree for fast brushing
    plottingApp.quadtree = d3.quadtree()
              .x(function(d) { return d.time; })
              .y(function(d) { return d.val; })
              .addAll(plottingApp.data);

    // Downsample context data for big datasets
    var sampler = largestTriangleThreeBucket();
    
    // Configure the x / y value accessors
    sampler.x(function (d) { return d.x; })
        .y(function (d) { return d.y; });

    // Configure the size of the buckets used to downsample the data.
    // Have at most 1000 context points
    var bucket_size = Math.max(Math.round(plottingApp.data.length / 1000), 1);

    // bump bucket size if 2 (doesn't preserve outliers)
    // bucket_size = (bucket_size == 2) ? bucket_size + 1 : bucket_size;

    sampler.bucketSize(bucket_size);
    
    plottingApp.context_data = sampler(plottingApp.data);
  }

  function createInView(domain) {
    function inView(d) {
      var dom = domain.map(function(d) { return plottingApp.context_xscale(d); });
      return plottingApp.context_xscale(d.x) >= dom[0] && plottingApp.context_xscale(d.x) <= dom[1];
    }
    return inView;
  }  

  function brushedMain() {
    var extent = d3.brushSelection(plottingApp.plot.main_brush.node());
    if (extent === null) {
      return;
    }
    
    // convert pixels defining brush into actual time, value scales
    var xmin = plottingApp.main_xscale.invert(extent[0][0]),
    xmax = plottingApp.main_xscale.invert(extent[1][0]),
    ymax = plottingApp.main_yscale.invert(extent[0][1]),
    ymin = plottingApp.main_yscale.invert(extent[1][1]);
    
    search(plottingApp.quadtree, xmin, ymin, xmax, ymax);
    updateSelection();
    plottingApp.plot.main_brush.call(plottingApp.main_brush.move, null);
  }

  function limitContext() {
    var s = d3.brushSelection(plottingApp.plot.context_brush.node()).map(plottingApp.context_xscale.invert, plottingApp.context_xscale);
    var brushData = plottingApp.data.filter(createInView(s));
    if (brushData.length >= 2000) {
      var firstIndex = plottingApp.data.map(function(d) { return d.time; }).indexOf(s[0]);
    }
  }

  function brushedContext() {
    var s = d3.brushSelection(plottingApp.plot.context_brush.node()) || plottingApp.context_xscale.range();
    plottingApp.main_xscale.domain(s.map(plottingApp.context_xscale.invert, plottingApp.context_xscale));

    updateMain();

    
    var limits = plottingApp.context_xscale.domain();
    if (plottingApp.context_brush.extent()[1] >= 1 * plottingApp.context_xscale.domain()[1]) {
      console.log("far right");
    }
  }

  //keyboard functions to change the focus
  function transformContext(shift,scale) {
    var currentExtent = d3.brushSelection(plottingApp.plot.context_brush.node());
    currentExtent = currentExtent.map(function(d) {
      return plottingApp.context_xscale.invert(d);
    });


    var offset0 = ((1 - Math.pow(1.1,scale)) + 0.1 * shift) * (currentExtent[1] - currentExtent[0]);
    var offset1 = ((Math.pow(1.1,scale) - 1) + 0.1 * shift) * (currentExtent[1] - currentExtent[0]);

    // don't shift past the ends of the scale
    var limits = plottingApp.context_xscale.domain();

    // if we go off the left edge, don't allow us to move left
    if ((1*currentExtent[0])+offset0<limits[0]) {
      shift = 0;
      offset0 = limits[0] - currentExtent[0];
      offset1 = offset0 + ((Math.pow(1.1,scale) - 1) + 0.1 * shift) * (currentExtent[1] - currentExtent[0]);
    }

    // if we go off the right edge, don't allow us to move right
    if ((1*currentExtent[1])+offset1>limits[1]) {
      shift = 0;
      offset1 = limits[1] - currentExtent[1];
      offset0 = offset1 + ((1 - Math.pow(1.1,scale)) + 0.1 * shift) * (currentExtent[1] - currentExtent[0]);

    }

    // double check that the last bit didn't push us too far left
    if ((1 * currentExtent[0]) + offset0 < limits[0]) {
      shift = 0;
      offset0 = limits[0] - currentExtent[0];
    }


    // do shift and update brushing
    var newExtent = [(1 * currentExtent[0]) + offset0,(1 * currentExtent[1]) + offset1];

    // disable mouseover info while shifting
    toggleHoverinfo(false);

    plottingApp.plot.context_brush.call(plottingApp.context_brush.move, 
      newExtent.map(function(d) { return plottingApp.context_xscale(d); }));

    // re-enable mouseover info
    toggleHoverinfo(true);
  }
  
  // Find the nodes within the specified rectangle.
  function search(quadtree, brush_xmin, brush_ymin, brush_xmax, brush_ymax) {
    // use quadtree to brush points in defined rectangle
    plottingApp.quadtree.visit(function(node, quad_xmin, quad_ymin, quad_xmax, quad_ymax) {
      if (!node.length) {
        do {
          var d = node.data;
          // change selected property of points in brush
          if (!plottingApp.shiftKey) {
            d.selected = ((d.time >= brush_xmin) && (d.time <= brush_xmax) && (d.val >= brush_ymin) && (d.val <= brush_ymax)) ? 1 : d.selected;
          } else {
            d.selected = ((d.time >= brush_xmin) && (d.time <= brush_xmax) && (d.val >= brush_ymin) && (d.val <= brush_ymax)) ? 0 : d.selected;
          }
          
        } while (node = node.next);
      }
      
      // return true if current quadtree rectangle intersects with brush (looks deeper in tree if true)
      return quad_xmin >= brush_xmax || quad_ymin >= brush_ymax || quad_xmax < brush_xmin || quad_ymax < brush_ymin;
    });
  }

  /* if b == true, enable mouseover info modal
     else, disable mouseover info modal */
  function toggleHoverinfo(b) {
    if (b) {
      // enable mouseover/mouseout hoverinfo
      plottingApp.main.selectAll(".point")
      .on("mouseover", function(point) {
          plottingApp.hoverTimer = setTimeout(function() {
            updateHoverinfo(point.actual_time, point.val, point.series);
          }, 250);  
        })
      .on("mouseout", function() {
          clearTimeout(plottingApp.hoverTimer);
          plottingApp.hoverTimer = null;
          updateHoverinfo("", "", "");
      });
    } else {
      // clear hoverinfo and timeout
      if (plottingApp.hoverTimer) {
        clearTimeout(plottingApp.hoverTimer);
        updateHoverinfo("", "", "");
      }
      
      // replace handler
      plottingApp.main.selectAll(".point")
      .on("mouseover", function(e) {
        e.preventDefault();
      })
      .on("mouseout", function(e) {
        e.preventDefault();
      });
    }
    
  }

  /* update hoverbox info with point data */
  function updateHoverinfo(time, val, series) {
    if (time === "" && val === "" && series == "") {
      $("#hoverinfo").hide();
      window.time = "";
      window.val = "";
      window.hoverSeries = "";
      $("#updateHover").click();
    } else {
      $("#hoverinfo").show();
      window.time = formatHover(time);
      window.val = val.toFixed(2);
      window.hoverSeries = series.toString();
      $("#updateHover").click();
    }
  }

  /* format csv data with data structure */ 
  function type(d) {
    d.actual_time = DateTime.fromISO(d.time, {setZone: true});
    var d2 = d.time.toISO({ includeOffset: false });
    d.time = DateTime.fromISO(d2);;
    d.val = +d.val;
    d.series = d.series;
    d.label = d.label;
    d.x = +d.time;
    d.y = d.val;
    return d;
  }

  /* format luxon datetime obj to hoverbox time */
  function formatHover(datetime) {
    var hoverdate = datetime.toISO();
    hoverdate = hoverdate.match(/(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+)([+-][0-2]\d:[0-5]\d|Z)/);
    var dateArr = hoverdate[1].split(".");
    if (dateArr[1] == "000") {
      return dateArr[0]
    } else {
      return hoverdate
    }
  }
  
  /* manually update main Y axis with user input */
  function updateMainY(axis) {
    // handle dynamic data
    window.editSeries = axis;
    $("#updateEdit").click();
  }

  function updateSelection() {
    plottingApp.main.selectAll(".point").classed("selected", function(d) { return isSelected(d); });
    plottingApp.context.selectAll(".point").classed("selected", function(d) { return isSelected(d); });
  }

  /* calculate default extent based on data length */
  function getDefaultExtent() {
    var start_date = plottingApp.data[0].time,
    d_len = plottingApp.data.length, end_date;
    if (d_len <= 100) {
      end_date = plottingApp.data[d_len - 1].time;
    } else if (d_len <= 1000) {
      end_date = plottingApp.data[100].time;
    } else if (d_len >= 10000) {
      end_date = plottingApp.data[1000].time;
    } else {
      end_date = plottingApp.data[Math.round((d_len - 1) / 10)].time;
    }
    return [start_date, end_date]
  }

  /* */
  function isSelected(d) {
    if (d.label == '') {
      return false
    }
    return true
  }

  /* set reference series on checkbox change
     1 == checked; 0 == unchecked */
  function setReference(b) {
    if (b == 1) {
      plottingApp.refSeries = plottingApp.selectedSeries;
    } else {
      if (plottingApp.refSeries == plottingApp.selectedSeries) {
        plottingApp.refSeries = "";
      }
    }
  }

  /* return appropriate yscale applied to val of d 
     based on whether primary or reference series */
  function selectYScale(d) {
    if (d.series == plottingApp.selectedSeries) {
      return plottingApp.main_yscale(d.val);
    }
    if (d.series == plottingApp.refSeries) {
      return plottingApp.secondary_yscale(d.val);
    }
  } 

  /* increase extent by padding */
  function padExtent(extent, padding) {
    padding = (typeof padding === "undefined") ? 0.01 : padding;
    var range = extent[1]-extent[0];
    // 1*x is quick hack to handle date/time axes
    return [(1 * extent[0]) - padding * range, (1 * extent[1]) + padding * range].map(d => d.toFixed(3));
  }

  /* return the bounds of the given y axis */
  function getMinMax(axis) {
    var y_vals = plottingApp.allData.filter(d => d.series == axis).map(d => d.val),
    minMax = [Math.min.apply(Math, y_vals), Math.max.apply(Math, y_vals)];
    return padExtent(minMax, 0.1);
  }

  $("#seriesSelect").change(function() {
    plottingApp.selectedSeries = $("#seriesSelect option:selected").val();
    plottingApp.data = plottingApp.allData.filter(d => d.series == plottingApp.selectedSeries);

    // only allow 1 reference series
    if (plottingApp.refSeries != "") {
      if (plottingApp.refSeries != plottingApp.selectedSeries) {
        document.getElementById("ref_selector").disabled = true;
      } else {
        document.getElementById("ref_selector").disabled = false;
      }
    }
    replot();
  });

  $("#labelSelect").change(function() {
    plottingApp.selectedLabel = $("#labelSelect option:selected").val();
    alert(plottingApp.selectedLabel);
  });

  $("#clearSeries").click(function() {
    plottingApp.quadtree.visit(function(node, quad_xmin, quad_ymin, quad_xmax, quad_ymax) {
      if (!node.length) {
        do {
          node.data.selected = 0;
        } while (node = node.next);
      }
      return false;
    });
    updateSelection();
  });

  $("#triggerReplot").click(function() {
    replot();
   });

  $("#export").click(function() {
    var csvContent = plottingApp.headerStr + "\n";

    plottingApp.allData.forEach(function(dataArray){
      var date = dataArray.actual_time.toISO();
      let row = dataArray.series + "," + date
                + "," + dataArray.val + "," + dataArray.label;
      csvContent += row + "\n";
    });
    var saveData = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (data, fileName) {
            var string = csvContent,
                blob = new Blob([string], {type: "text/csv, charset=UTF-8"}),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());
    var filename = plottingApp.filename;
    if (!filename.endsWith("-labeled")) {
      filename += "-labeled";
    }
    saveData(csvContent, filename + ".csv");
    $("#exportComplete").show();
  });

  d3.select(window).on("keydown", function(e) {
    plottingApp.shiftKey = d3.event.shiftKey;
    if (plottingApp.shiftKey) {
      plottingApp.shiftKey = true;
    } else {
      plottingApp.shiftKey = false;
    }
    var code = d3.event.keyCode;
    if (code == 38) {
      // handle up arrowkey
      transformContext(0, -2);
      d3.event.preventDefault();
    } else if (code == 40) {
      // handle down arrowkey
      transformContext(0, 2);
      d3.event.preventDefault();
    } else if (code === 37) {
      // handle left arrowkey
      if (plottingApp.shiftKey) {
        transformContext(-9, 0);
      } else {
        transformContext(-1, 0);
      }
    } else if (code === 39) {
      // handle right arrowkey
      if (plottingApp.shiftKey) {
        transformContext(9, 0);
      } else {
        transformContext(1, 0);
      }
    }
  });

  d3.select(window).on("keyup", function() {
    plottingApp.shiftKey = d3.event.shiftKey;
    if (plottingApp.shiftKey) {
      plottingApp.shiftKey = true;
    } else {
      plottingApp.shiftKey = false;
    }
  });
}
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
  margin-top: 90px;
}

#hoverbox {
  position: absolute;
  float: right;
  right: 20%;
}

#hoverinfo {
  position: absolute;
  margin-left: 100%;
  text-align: left;
  padding: 10px;
  padding-bottom: 0px;
  width: 260px;
}

#selector {
  float: left;
  position: relative;
  margin-bottom: 10px;
  text-align: left;
  padding: 10px;
  padding-top: 0px;
}

#labelSelector {
  float: left;
  margin-right: 20px;
}

#ref_selector {
  width: 25px;
  height: 25px;
  margin-left: 5px;
  float: right;
}

#ref_selector_text {
  font-size: 12px; 
  font-style: sans-serif;
}

#secondary_line {
  stroke: grey;
}

#plotbox {
  position: relative;
}

.mainChart {
  display: block;
  margin-left: -75px !important;
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

.point.selected {
  fill: #FF5500;
  fill-opacity: 0.75;
  stroke: #FF5500;
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

#chartTitle {
  color: #000000;
}

.bounds {
  width: 40%;
}

/*
.modalBox {
  padding: 5px 15px;
  border-radius: 15px;
  background: #D84800;
  width: 200px;
  position: fixed;
  top: 30%;
  left: 42%;
}

#exportComplete {
  background: #7E4C64;
}

.modalInfo {
  text-align: left;
  color: #f4f4f4;
}

.modalMsg {
  font-size: 13px;
}

#errorOk {
  margin: 10px 0px;
  padding: 6px 65px;
}

.exportBtn {
  margin: 8px 5px;
  padding: 5px 5px !important;
}

.clearbtn {
  margin: 10px 5px;
  padding: 6px 15px;
}
*/

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