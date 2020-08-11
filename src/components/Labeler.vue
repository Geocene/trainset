<template>
  <div class="container-fluid" id="plotBox">
    <nav class="navbar navbar-expand fixed-top"> 
      <h1 class="navbar-brand"><div class="homeLink" @click="newHome()">TRAINSET<img id="logo" src="../assets/trainset_logo.png"></div></h1>
      <ul class="navbar-nav ml-auto">
        <div class="nav-link" @click="newHelp()">Help</div>
        <div class="nav-link" @click="newLicense()">License</div>
        <li class="nav-item">
          <div class="nav-link" id="clear">Clear</div>
        </li>
        <div class="nav-link" id="export">Export</div>
      </ul>
    </nav>
    <div id="hoverbox">
      <div id="selector">
        <select id="seriesSelect"></select><input type=checkbox id="ref_selector"/>
      </div>
      <div id="hoverinfo" class="card">
        <div class="card-subtitle">Time: {{ time }}</div>
        <div class="card-subtitle">Value: {{ val }}</div>
        <div class="card-subtitle">Series: {{ hoverseries }}</div>
      </div>
    </div>
    <div id="maindiv"></div>
    <div id="rangeContext"></div>

    <div id='legend' class='container'>
      <div class='row'>
        <div class="col">
          <strong>How to Label Points</strong></br>
          <strong>Click</strong> a point to toggle it as labeled</br>
          <strong>Click & Drag</strong> over a selection of points to label them</br>
          <strong><kbd>SHIFT</kbd> + Click & Drag </strong> over a selection of points to unlabel them</br>
        </div>
        <div class='col'>
          <strong>How to Navigate the Graph</strong></br>
          <kbd>→</kbd> or <kbd>←</kbd> : pan</br>
          <kbd>SHIFT</kbd> + <kbd>→</kbd> or <kbd>←</kbd> : fast pan</br>
          <kbd>↑</kbd> or <kbd>↓</kbd>: zoom</br>
          <strong>Click & Drag</strong> the bottom context bar to adjust focus region</br>
        </div>
      </div>
    </div>
    <div id="error" style="display: none;">
      <h5 class="failInfo">Upload Failed</h5>
      <hr>
      <div class="failInfo" id="errorMsg">Make sure data is in the TRAINSET format. See help.</div>
      <button type="button" class="btn btn-light" id="errorOk" @click="goHome()">Ok</button>
    </div>
    <div id="clearOk" style="display: none;">
      <h5 class="failInfo">Clear all labels?</h5>
      <hr>
      <div class="failInfo" id="errorMsg">All labels from this set will be erased. This cannot be undone</div>
      <button type="button" class="btn btn-light clearbtn" id="cancel" @click="cancel()">Cancel</button>
      <button type="button" class="btn btn-light clearbtn" id="ok">Ok</button>
    </div>
    <div id="exportComplete" style="display: none;">
      <h5 class="failInfo">Export complete</h5>
      <hr>
      <div class="failInfo" id="errorMsg">Upload new data set or continue labeling this one?</div>
      <button type="button" class="btn btn-light exportBtn" id="continue" @click="cancelUpload()">Continue</button>
      <button type="button" class="btn btn-light exportBtn" id="newUpload" @click="newUpload()">Upload</button>
    </div>
    <button id="updateHover" style="display: none;" v-on:click="updateHoverinfo"></button>
  </div>
</template>

<script>
import * as d3 from 'd3'
import * as dc from 'dc'
import { largestTriangleThreeBucket } from 'd3fc-sample';
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

// plotting app namespace
var plottingApp = {};

export default {
  name: 'labeler',
  props: {
    csvData: Array,
    filename: String,
    headerStr: String,
    seriesList: Array,
    isValid: Boolean
  },
  data: function() {
    return {
      val: '',
      time: '',
      hoverseries: ''
    };
  },
    methods: {
      // return to Index.vue
      goHome() {
        this.$router.push({ name: 'home', params: {nextUp: false} });
      },
      // return to Index.vue and trigger file upload selection
      newUpload() {
        this.$router.push({ name: 'home', params: {nextUp: true} });
      },
      // open Help.vue in new window
      newHelp() {
        let routeData = this.$router.resolve({ name: 'help' });
        window.open(routeData.href, '_blank');
      },
      // open License.vue in new window
      newLicense() {
        let routeData = this.$router.resolve({ name: 'license' });
        window.open(routeData.href, '_blank');
      },
      // open Index.vue in new window
      newHome() {
        let routeData = this.$router.resolve({ name: 'home', params: {nextUp: false} });
        window.open(routeData.href, '_blank');
      },
      // update #hoverinfo data
      updateHoverinfo() {
        this.time = window.time;
        this.val = window.val;
        this.hoverseries = window.hoverseries;
      },
      // cancel clear all series labels
      cancel() {
        $('#clearOk').hide();
        $('.navbar').css("opacity", "1");
        $('#maindiv').css("opacity", "1");
      },
      // hide export modal and continue labeling
      cancelUpload() {
        $('#exportComplete').hide();
        $('.navbar').css("opacity", "1");
        $('#maindiv').css("opacity", "1");
      },
      // build series selector using seriesList
      handleSelector() {
        var select = document.getElementById("seriesSelect");
        $.each(plottingApp.seriesList, function(i, p) {
          $('#seriesSelect').append($('<option></option>').val(p).html(p));
        });
        window.selectorWidth = $('#selector').width();
      }
    },
  mounted() {
      if (this.isValid) {
        plottingApp.headerStr = this.headerStr;
        plottingApp.filename = this.filename;
        plottingApp.csvData = this.csvData;
        plottingApp.seriesList = this.seriesList;
        $('#maindiv').append('<div class="loader"></div>');
        $('#maindiv').css("padding", "0px 75px");

        // populate selector & fix selector width
        this.handleSelector();

        if (plottingApp.seriesList.length == 1) {
          $('#selector').hide();
        }

        $('#hoverinfo').hide();
        labeller();
        // this.newlabeller();

      } else {
        $('#clear').hide();
        $('#export').hide();
        $('.navbar').css("opacity", "0.5");
        $('#error').show();
        $('#hoverbox').hide();
      }
  }
}

function labeller () {

  // main -- main plot
  // context -- smaller context plot for zooming, scrolling

  //margins
  plottingApp.main_margin = {top: 10, right: 10, bottom: 100, left: 40},
  plottingApp.context_margin = {top: 430, right: 40, bottom: 20, left: 40},
  plottingApp.maindiv_width = $('#maindiv').width(),
  plottingApp.width = plottingApp.maindiv_width - plottingApp.main_margin.left - plottingApp.main_margin.right,
  plottingApp.main_height = 500 - plottingApp.main_margin.top - plottingApp.main_margin.bottom,
  plottingApp.context_height = 500 - plottingApp.context_margin.top - plottingApp.context_margin.bottom;

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
  plottingApp.yaxis = d3.axisLeft(plottingApp.main_yscale),
  plottingApp.refaxis = d3.axisRight(plottingApp.secondary_yscale);

  var viewBox_width = plottingApp.width + plottingApp.main_margin.left + plottingApp.main_margin.right,
  viewBox_height = plottingApp.main_height + plottingApp.main_margin.top + plottingApp.main_margin.bottom;

  //plotting areas
  plottingApp.svg = d3.select("#maindiv").append("svg")
  .classed("container-fluid", true)
  .classed("mainChart", true)
  .attr("id", "mainChart")
  .attr("width", plottingApp.width + plottingApp.main_margin.left + plottingApp.main_margin.right)
  .attr("height", plottingApp.main_height + plottingApp.main_margin.top + plottingApp.main_margin.bottom)
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

  //main window
  plottingApp.main = plottingApp.svg.append("g")
  .attr("class", "main")
  .attr("transform", "translate(" + plottingApp.main_margin.left + "," + plottingApp.main_margin.top + ")");

  // smaller context window
  plottingApp.context = plottingApp.svg.append("g")
  .attr("class", "context")
  .attr("transform", "translate(" + plottingApp.context_margin.left + "," + plottingApp.context_margin.top + ")");

  //brushes
  plottingApp.main_brush = d3.brush()
  .extent([[0,0], [plottingApp.width, plottingApp.main_height]])
  .on("end", brushed_main);

  plottingApp.context_brush = d3.brushX()
  .extent([[0,0],[plottingApp.width, plottingApp.context_height]])
  .on("end", brushed_context)
  .on("brush", limit_context);

  //lines
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
    $('#ref_selector').on("change", function() {
      if (this.checked) {
        setReference(1);
      } else {
        setReference(0);
      }
    });
  }

  // load data format and brushes
  plottingApp.shiftKey = false,
  plottingApp.brushSelector = 'Invert',
  plottingApp.selectedSeries = $('#seriesSelect option:selected').val(),
  plottingApp.refSeries = '';

  $(function () {
   init();
  });

  /* initialize plots with default series data */
  function init() {
    plottingApp.allData = plottingApp.csvData.map(type);
    plottingApp.data = plottingApp.allData.filter(d => d.series == plottingApp.selectedSeries);

    
    // Build quadtree for fast brushing
    plottingApp.quadtree = d3.quadtree()
              .x(function(d) { return d.time; })
              .y(function(d) { return d.val; })
              .addAll(plottingApp.data);
    
    downsampleContext();

    // Set default focus
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

    var defaultExtent = [start_date,end_date];

    // set scales based on loaded data, default focus
    plottingApp.context_xscale.domain(pad_extent(d3.extent(
      plottingApp.allData.map(function(d) { return d.time; })))); // xaxis set according to allData
    
    defaultExtent[0] = plottingApp.context_xscale.domain()[0];
    plottingApp.main_xscale.domain(defaultExtent);

    updateYAxis();
    
    // make the plots
    plotMain();

    plottingApp.conBrush.call(plottingApp.context_brush.move, 
      defaultExtent.map(plottingApp.context_xscale));
    plottingApp.conBrush.moveToBack();
    
    // highlight selected points
    update_selection();

    // remove loading bar
    $('.loader').css('display', 'none');
  }

  /* set reference series on checkbox change
     1 == checked; 0 == unchecked */
  function setReference(b) {
    if (b == 1) {
      plottingApp.refSeries = plottingApp.selectedSeries;
    } else {
      if (plottingApp.refSeries == plottingApp.selectedSeries) {
        plottingApp.refSeries = '';
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
  
  /* format csv data with data structure */ 
  function type(d) {
    d.actual_time = DateTime.fromISO(d.time, {setZone: true});
    var d2 = d.time.toISO({ includeOffset: false });
    d.time = DateTime.fromISO(d2);;
    d.val = +d.val;
    d.series = d.series;
    d.selected = +d.selected;
    d.x = +d.time;
    d.y = d.val;
    return d;
  }

  /* increase extent by padding */
  function pad_extent(extent,padding) {
    padding = (typeof padding === "undefined") ? 0.01 : padding;
    var range = extent[1]-extent[0];
    // 1*x is quick hack to handle date/time axes
    return [(1 * extent[0]) - padding * range, (1 * extent[1]) + padding * range];

  }

  /* update yaxes bounds based on selected and reference series */
  function updateYAxis() {
    // set y-axis based on selected series
    var y_vals = plottingApp.data.map(d => d.val);
    var minMax = [Math.min.apply(Math, y_vals), Math.max.apply(Math, y_vals)];
    plottingApp.main_yscale.domain(pad_extent(minMax, 0.1));
    plottingApp.context_yscale.domain(pad_extent(plottingApp.main_yscale.domain()));

    // redraw / draw primary y axis
    if (plottingApp.y_axis) {
      plottingApp.y_axis.remove();
    }
    

    plottingApp.y_axis = plottingApp.main.append("g")
    .attr("class", "y axis primary")
    .call(plottingApp.yaxis)
    .call(g => g.select(".domain").remove());

    // add primary y axis label
    plottingApp.main.select('.y.axis.primary').append("text")
    .attr("class", "y label primary")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - plottingApp.main_margin.left)
    .attr("x", 0 - plottingApp.main_height / 2)
    .attr("fill", "currentColor")
    .text(plottingApp.selectedSeries);

    // handle redraw reference y axis
    if (plottingApp.ref_axis) {
      plottingApp.ref_axis.remove();
    }

    // handle ref series
    if (plottingApp.refSeries != '' && plottingApp.selectedSeries != plottingApp.refSeries) {

      var ref_vals = plottingApp.allData.filter(d => d.series == plottingApp.refSeries).map(d => d.val);
      minMax = [Math.min.apply(Math, ref_vals), Math.max.apply(Math, ref_vals)];
      plottingApp.secondary_yscale.domain(pad_extent(minMax, 0.1));

      plottingApp.ref_axis = plottingApp.main.append("g")
      .attr("transform", "translate(" + plottingApp.width + ",0)")
      .attr("class", "y axis secondary")
      .call(plottingApp.refaxis)
      .call(g => g.select(".domain").remove());

      // add reference y axis label
      plottingApp.main.select('.y.axis.secondary').append("text")
          .attr("class", "y label secondary")
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 + plottingApp.main_margin.left)
          .attr("x", 0 - plottingApp.main_height / 2)
          .attr("fill", "currentColor")
          .text(plottingApp.refSeries);
    }


    // handle editable y axis
    // plottingApp.main.select(".y.axis").each(function(d, i) {
    //   var firstChild = this.firstChild,
    //     lastChild = this.lastChild;
    //   var firstTick = d3.select(firstChild).select("text").text(),
    //     lastTick = d3.select(lastChild).select("text").text();
    //   var width = d3.select(firstChild).select("text").node().getBoundingClientRect().width,
    //     height = d3.select(firstChild).select("text").node().getBoundingClientRect().height;
    //   d3.select(firstChild).select("text").remove();
    //   // d3.select(firstChild).append("foreignObject")
    //   //   .attr("width", width)
    //   //   .attr("height", height)
    //   //   .append("xhtml:body")
    //   //   .append("text")
    //   //   .attr("fill", "currentColor")
    //   //   .attr("width", width)
    //   //   .attr("height", height)
    //   //   .attr("x", -9)
    //   //   .attr("dy", "0.32em")
    //   //   .text("hello");

    // });
  }

  /* manually update main Y axis with user input */
  function updateMainY() {

  }

  /* downsample datapoints using largest triangle three buckets algorithm */
  function downsampleContext() {
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

  /* replot svg after changing series */
  function replot() {
    // Build quadtree for fast brushing
    plottingApp.quadtree = d3.quadtree()
              .x(function(d) { return d.time; })
              .y(function(d) { return d.val; })
              .addAll(plottingApp.data);
    
    downsampleContext();

    updateYAxis();

    plottingApp.context_plot.remove();
    plottingApp.context_points.remove();

    plotContext();

    // replot the plots
    updateMain(plottingApp.data);

    update_selection();

  }

  /*  */
  function plotContext() {
    //context plot
    plottingApp.context_plot = plottingApp.context.append("path")
    .datum(plottingApp.context_data)
    .attr("class", "line")
    .attr("d", plottingApp.context_line);


    plottingApp.context_points = plottingApp.context.selectAll(".point")
    .data(plottingApp.context_data)
    .enter().append("circle")
    .attr("class", "point")
    .attr("cx", function(d) { return plottingApp.context_xscale(d.time); })
    .attr("cy", function(d) { return plottingApp.context_yscale(d.val); })
    .attr("r", 2);

    // create x axis and brush elm if doesn't exist (on first plot)
    if (!plottingApp.conBrush) {
      plottingApp.context.append("g")
      .attr("transform", "translate(0," + plottingApp.context_height + ")")
      .attr("class", "x axis")
      .call(plottingApp.context_xaxis);


      plottingApp.conBrush = plottingApp.context.append("g")
      .attr("class", "context_brush")
      .call(plottingApp.context_brush);
    }
  }

  function createInView(domain) {
    function inView(d) {
      var dom = domain.map(function(d) { return plottingApp.context_xscale(d); });
      return plottingApp.context_xscale(d.x) >= dom[0] && plottingApp.context_xscale(d.x) <= dom[1];
    }
    return inView;
  }

  /* redraw main graph with new points */
  function updateMain(data) {
    // subset to only data in current domain
    var x_domain = plottingApp.main_xscale.domain();

    var  main_data = plottingApp.data.filter(function(d){
      return x_domain[0] <= d.time & d.time<=x_domain[1]
    });

    // handles ref series
    var secondary_data = plottingApp.refSeries == '' || 
      plottingApp.refSeries == plottingApp.selectedSeries ? null : plottingApp.allData
        .filter(d => d.series == plottingApp.refSeries)
        .filter(function(d) {
          return x_domain[0] <= d.time & d.time<=x_domain[1]
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
    
    point.attr("class", "update");

    point.enter().append("circle")
    .attr("class", "enter")
    .attr("cx", function(d) { return plottingApp.main_xscale(d.time); })
    .attr("cy", function(d) { return selectYScale(d); })
    .attr("r", 5)
    .classed("selected", function(d) { return d.selected; })
    .merge(point)
    .attr("class", "point")
    .attr("cx", function(d) { return plottingApp.main_xscale(d.time); })
    .attr("cy", function(d) { return selectYScale(d); })
    .attr("r", 5)
    .classed("selected", function(d) { return d.selected; });
    
    point.exit().remove();

    // add secondary line and update secondary point styling if there is reference
    if (secondary_data) {
      plottingApp.main.append("path")
        .datum(secondary_data)
        .attr("class","line")
        .attr("id", "secondary_line")
        .attr("fill-opacity", "0.4")
        .attr("d", plottingApp.secondary_line);

      plottingApp.main.selectAll(".point")
      .filter((d, i) => d.series == plottingApp.refSeries)
      .attr("fill-opacity", "0.4")
      .attr("r", 2)
      .attr("pointer-events", "none");
    }

    /* add hover and click-label functionality for primary series points */
    var timer;

    plottingApp.main.selectAll(".point")
    .filter((d, i) => d.series == plottingApp.selectedSeries)
    .moveToFront()
    .attr("fill-opacity", "0.7")
    .on("click", function(point){
        //allow clicking on single points
        point.selected=1-point.selected;
        update_selection();
      })
    .on("mouseover", function(point) {
        timer = setTimeout(function() {
          update_hoverinfo(point.actual_time, point.val, point.series);
        }, 250);  
      })
    .on("mouseout", function() {
        clearTimeout(timer);
        update_hoverinfo('', '', '');
    });

    // update xAxis svg element
    plottingApp.main.select(".x.axis").call(plottingApp.main_xaxis);
  }

  function update_hoverinfo(time, val, series) {
    if (time === '' && val === '' && series == '') {
      $('#hoverinfo').hide();
      window.time = '';
      window.val = '';
      $('#updateHover').click();
    } else {
      $('#hoverinfo').show();
      window.time = time.toString();
      window.val = val.toFixed(2);
      window.hoverseries = series.toString();
      $('#updateHover').click();

      // fix autosizing selector width
      $('#selector').width(selectorWidth);
    }
  }
  
  // plot graph
  function plotMain() {
    // main plot
    plottingApp.mainBrush = plottingApp.main.append("g")
    .attr("class", "main_brush")
    .call(plottingApp.main_brush);
    
    plottingApp.main.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + plottingApp.main_height + ")")
    .call(plottingApp.main_xaxis);

    updateMain(plottingApp.data);
    
    plotContext();

    // store the reference to the original handler
    var oldMousedown = plottingApp.conBrush.on('mousedown.brush');

    // and replace it with our custom handler
    plottingApp.conBrush.on('mousedown.brush', function () {
        plottingApp.conBrush.on('mouseup.brush', function () {
            clearHandlers();
        });

        plottingApp.conBrush.on('mousemove.brush', function () {
            clearHandlers();
            oldMousedown.call(this);
            // conBrush.on('mousemove.brush').call(this);
        });

        function clearHandlers() {
            plottingApp.conBrush.on('mousemove.brush', null);
            plottingApp.conBrush.on('mouseup.brush', null);
        }
    });
  }

  function limit_context() {
    var s = d3.brushSelection(plottingApp.conBrush.node()).map(plottingApp.context_xscale.invert, plottingApp.context_xscale);
    var brushData = plottingApp.data.filter(createInView(s));
    if (brushData.length >= 2000) {
      var firstIndex = plottingApp.data.map(function(d) { return d.time; }).indexOf(s[0]);
    }
  }

  function brushed_context() {
    var s = d3.brushSelection(plottingApp.conBrush.node()) || plottingApp.context_xscale.range();
    plottingApp.main_xscale.domain(s.map(plottingApp.context_xscale.invert, plottingApp.context_xscale));

    updateMain(plottingApp.data);

    
    var limits = plottingApp.context_xscale.domain();
    if (plottingApp.context_brush.extent()[1] >= 1 * plottingApp.context_xscale.domain()[1]) {
      console.log("far right");
    }
  }

  //keyboard functions to change the focus
  function transform_context(shift,scale) {
    var currentExtent = d3.brushSelection(plottingApp.conBrush.node());
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

    plottingApp.conBrush.call(plottingApp.context_brush.move, 
      newExtent.map(function(d) { return plottingApp.context_xscale(d); }));

    brushed_context();
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

  function update_selection() {
    plottingApp.main.selectAll(".point").classed("selected", function(d) { return d.selected; });
    plottingApp.context.selectAll(".point").classed("selected", function(d) { return d.selected; });
  }

  function brushed_main() {
    var extent = d3.brushSelection(plottingApp.mainBrush.node());
    if (extent === null) {
      return;
    }
    
    // convert pixels defining brush into actual time, value scales
    var xmin = plottingApp.main_xscale.invert(extent[0][0]),
    xmax = plottingApp.main_xscale.invert(extent[1][0]),
    ymax = plottingApp.main_yscale.invert(extent[0][1]),
    ymin = plottingApp.main_yscale.invert(extent[1][1]);
    
    search(plottingApp.quadtree, xmin, ymin, xmax, ymax);
    update_selection();
    plottingApp.mainBrush.call(plottingApp.main_brush.move, null);
  }

  $('#seriesSelect').change(function() {
    plottingApp.selectedSeries = $('#seriesSelect option:selected').val();
    plottingApp.data = plottingApp.allData.filter(d => d.series == plottingApp.selectedSeries);

    // only allow 1 reference series
    if (plottingApp.refSeries != '') {
      if (plottingApp.refSeries != plottingApp.selectedSeries) {
        document.getElementById("ref_selector").disabled = true;
      } else {
        document.getElementById("ref_selector").disabled = false;
      }
    }

    replot(plottingApp.data);


  });

  $('#clear').click(function() {
    $('#clearOk').show();
    $('.navbar').css("opacity", "0.5");
    $('#maindiv').css("opacity", "0.5");
  });

  $('#ok').click(function() {
    $('#clearOk').hide();
    $('.navbar').css("opacity", "1");
    $('#maindiv').css("opacity", "1");
    plottingApp.quadtree.visit(function(node, quad_xmin, quad_ymin, quad_xmax, quad_ymax) {
      if (!node.length) {
        do {
          node.data.selected = 0;
        } while (node = node.next);
      }
      return false;
    });
    update_selection();
  });

  $('#export').click(function() {
    var csvContent = plottingApp.headerStr + '\n';

    plottingApp.allData.forEach(function(dataArray){
      var date = dataArray.actual_time.toISO();
      let row = dataArray.series + ',' + date
                + ',' + dataArray.val + ',' + dataArray.selected;
      csvContent += row + '\n';
    });
    var saveData = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (data, fileName) {
            var string = csvContent,
                blob = new Blob([string], {type: 'text/csv, charset=UTF-8'}),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());
    var filename = plottingApp.filename;
    if (!filename.endsWith('-labeled')) {
      filename += '-labeled';
    }
    saveData(csvContent, filename + '.csv');
    $('#exportComplete').show();
    $('.navbar').css("opacity", "0.5");
    $('#maindiv').css("opacity", "0.5");
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
      transform_context(0, -2);
      d3.event.preventDefault();
    } else if (code == 40) {
      // handle down arrowkey
      transform_context(0, 2);
      d3.event.preventDefault();
    } else if (code === 37) {
      // handle left arrowkey
      if (plottingApp.shiftKey) {
        transform_context(-9, 0);
      } else {
        transform_context(-1, 0);
      }
    } else if (code === 39) {
      // handle right arrowkey
      if (plottingApp.shiftKey) {
        transform_context(9, 0);
      } else {
        transform_context(1, 0);
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
  margin-left: 76%;
}

#hoverinfo {
  text-align: left;
  padding: 10px;
  padding-bottom: 0px;
}

#selector {
  position: relative;
  margin-bottom: 10px;
  text-align: left;
  padding: 10px;
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

#error {
  padding: 5px 15px;
  border-radius: 15px;
  background: #D84800;
  width: 200px;
  position: fixed;
  top: 30%;
  left: 42%;
}

#clearOk {
  padding: 5px 15px;
  border-radius: 15px;
  background: #D84800;
  width: 200px;
  position: fixed;
  top: 30%;
  left: 42%;
}

#exportComplete {
  padding: 5px 15px;
  border-radius: 15px;
  background: #7E4C64;
  width: 200px;
  position: fixed;
  top: 30%;
  left: 42%;
}

.failInfo {
  text-align: left;
  color: #f4f4f4;
}

#errorMsg {
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