<template>
  <div class="container-fluid" id="plotBox">
    <nav class="navbar navbar-expand-lg fixed-top"> 
      <h1 class="navbar-brand"><router-link class="homeLink" v-bind:to="'/'">TRAINSET</router-link></h1>
      <div class="navbar-nav ml-auto">
        <router-link class="nav-link" v-bind:to="'/help'">Help</router-link>
        <div class="nav-link" id="clear">Clear</div>
        <div class="nav-link" id="export">Export</div>
      </div>
    </nav>
    <div id="maindiv"></div>
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
      <button type="button" class="btn btn-light exportBtn" id="newUpload" @click="goHome()">Upload</button>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { keybinding } from '../assets/keybinding'

export default {
	name: 'labeler',
	props: {
		csvData: Array,
    minMax: Array,
		filename: String,
    headerStr: String,
		isValid: Boolean
	},
  methods: {
    goHome() {
      this.$router.push({ name: 'home' });
    },
    cancel() {
      $('#clearOk').hide();
      // make non transparent
    },
    cancelUpload() {
      $('#exportComplete').hide();
      // make non transparent
    }
  },
	mounted() {
    if (this.isValid) {
      window.headerStr = this.headerStr;
      window.filename = this.filename;
      window.PLOTDATA = this.csvData;
      window.view_or_label = "label";
      window.y_max = this.minMax[0];
      window.y_min = this.minMax[1];
      $('#maindiv').append('<div class="loader"></div>');    
      labeller();
    } else {
      $('#clear').hide();
      $('#export').hide();
      $('.navbar').css("opacity", "0.5");
      $('#error').show();
    }
	}
}

function labeller () {

  // main -- main plot
  // context -- smaller context plot for zooming, scrolling

  //margins
  var main_margin = {top: 10, right: 10, bottom: 100, left: 40},
  context_margin = {top: 430, right: 10, bottom: 20, left: 40},
  maindiv_width = $('#maindiv').width(),
  width = maindiv_width - main_margin.left - main_margin.right,
  main_height = 500 - main_margin.top - main_margin.bottom,
  context_height = 500 - context_margin.top - context_margin.bottom;

  //scales
  var main_xscale = d3.time.scale().range([0, width]),
  context_xscale = d3.time.scale().range([0, width]),
  main_yscale = d3.scale.linear().range([main_height, 0]),
  context_yscale = d3.scale.linear().range([context_height, 0]);

  //axes
  //can adjust multiscale time ticks: http://bl.ocks.org/mbostock/4149176
  var main_xaxis = d3.svg.axis().scale(main_xscale).orient("bottom"),
  context_xaxis = d3.svg.axis().scale(context_xscale).orient("bottom"),
  yaxis = d3.svg.axis().scale(main_yscale).orient("left");

  //plotting areas
  var svg = d3.select("#maindiv").append("svg")
  .attr("id", "mainChart")
  .attr("width", width + main_margin.left + main_margin.right)
  .attr("height", main_height + main_margin.top + main_margin.bottom)
  .attr("viewBox", "0 0 " + (width + main_margin.left + main_margin.right) + " " + (main_height + main_margin.top + main_margin.bottom))
  .attr("perserveAspectRatio", "xMinYMid");

  //something about clipping, not sure what this is doing yet
  svg.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", main_height);

  //main window
  var main = svg.append("g")
  .attr("class", "main")
  .attr("transform", "translate(" + main_margin.left + "," + main_margin.top + ")");

  // smaller context window
  var context = svg.append("g")
  .attr("class", "context")
  .attr("transform", "translate(" + context_margin.left + "," + context_margin.top + ")");

  //brushes
  var main_brush = d3.svg.brush()
  .x(main_xscale)
  .y(main_yscale)
  .on("brushend", brushed_main);

  var context_brush = d3.svg.brush()
  .x(context_xscale)
  .on("brush", brushed_context);

  //lines
  var main_line = d3.svg.line()
  .interpolate("monotone")
  .x(function(d) { return main_xscale(d.time); })
  .y(function(d) { return main_yscale(d.val); });

  var context_line = d3.svg.line()
  .interpolate("monotone")
  .x(function(d) { return context_xscale(d.time); })
  .y(function(d) { return context_yscale(d.val); });

  //load data and adjust scales
  var data;
  var quadtree
  var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

  function type(d) {
    d.time = parseDate(d.time);
    d.val = +d.val;
    d.selected = +d.selected;
    return d;
  }

  function pad_extent(extent,padding){
    padding = (typeof padding === "undefined") ? 0.01 : padding;
    var range=extent[1]-extent[0];
    //1*x is quick hack to handle date/time axes
    return [(1*extent[0])-padding*range,(1*extent[1])+padding*range];

  }

  function init () {

    data = window.PLOTDATA;
    data = data.map(type);

    //set scales based on loaded data
    main_xscale.domain(pad_extent(d3.extent(data.map(function(d) { return d.time; }))));
    main_yscale.domain(pad_extent([window.y_min, window.y_max]));

    context_xscale.domain(main_xscale.domain());
    context_yscale.domain(main_yscale.domain());

    //generate quadmap to handle brushing of the main plot
    data.map(function(d){d.x=main_xscale(d.time);
     d.y=main_yscale(d.val);
     return d;});

    quadtree=d3.geom.quadtree(data);

    //make the plots
    makeplot(data);
    $('.loader').css('display', 'none');

    //set default extent for context
    Date.prototype.addDays = function(days)
    {
      var dat = new Date(this.valueOf());
      dat.setDate(dat.getDate() + days);
      return dat;
    }

    var start_date = data[0].time
    if(window.view_or_label=="label"){
      var end_date = data[Math.round(data.length / 10)].time
    } else {
      var end_date = new Date(start_date).addDays(7)
    }


    var defaultExtent = [start_date,end_date]

    svg.select(".context_brush").call(context_brush.extent(defaultExtent));

    //run brushing functions to make sure everything highlighted right
    brushed_context();
    if(window.view_or_label=="label"){
      update_selection();
    } else {
      main.selectAll(".point").classed("training", function(d) { return d.training; });
      context.selectAll(".point").classed("training", function(d) { return d.training; });

      main.selectAll(".point").classed("cooking", function(d) { return d.cooking; });
      context.selectAll(".point").classed("cooking", function(d) { return d.cooking; });
    }

    window.view_or_label = "label";

  }

  $(function () {
   init();
  });

  //inital plotting function
  function makeplot(data) {
    //main plot
    main.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", main_line);
    if(window.view_or_label=="label"){
      main.append("g")
      .attr("class", "main_brush")
      .call(main_brush);
      //.call(main_brush.event);
    }

    main.selectAll(".point")
    .data(data)
    .enter().append("circle")
    .attr("class", "point")
    .attr("cx", function(d) { return main_xscale(d.time); })
    .attr("cy", function(d) { return main_yscale(d.val); })
    .attr("r", 4);
    if(window.view_or_label=="label"){
      main.selectAll(".point")
      .on("click", function(point){
          //allow clicking on single points
              point.selected=1-point.selected;
              post([point])
              update_selection();
          });

    }
    main.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + main_height + ")")
    .call(main_xaxis);

    main.append("g")
    .attr("class", "y axis")
    .call(yaxis);

    //context plot
    context.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", context_line);

    context.selectAll(".point")
    .data(data)
    .enter().append("circle")
    .attr("class", "point")
    .attr("cx", function(d) { return context_xscale(d.time); })
    .attr("cy", function(d) { return context_yscale(d.val); })
    .attr("r", 2);

    context.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + context_height + ")")
    .call(context_xaxis);


    context.append("g")
    .attr("class", "context_brush")
    .call(context_brush)
    .selectAll("rect")
    .attr("y", -6)
    .attr("height", context_height + 7);
  }



  function brushed_context() {
    main_xscale.domain(context_brush.empty() ? context_xscale.domain() : context_brush.extent());

    main.select(".line")
    .attr("d", main_line);

    main.selectAll(".point")
    .attr("cx", function(d) { return main_xscale(d.time); });

    main.select(".x.axis").call(main_xaxis);
    var limits=context_xscale.domain();
    if(context_brush.extent()[1]>=1*context_xscale.domain()[1]){
      console.log("far right")
      if(window.view_or_label=="label"){
        document.getElementById("next").style.display = 'block';
      }
    }
  }



  //keyboard functions to change the focus
  function transform_context(shift,scale) {
    var currentExtent=context_brush.extent();

    var offset0=((1-Math.pow(1.1,scale))+0.1*shift)*(currentExtent[1]-currentExtent[0]);
    var offset1=((Math.pow(1.1,scale)-1)+0.1*shift)*(currentExtent[1]-currentExtent[0]);

    //don't shift past the ends of the scale
    //still need to work on the limiting code : scroll right shrinks.
    var limits=context_xscale.domain();

    //if we go off the left edge, don't allow us to move left
    if((1*currentExtent[0])+offset0<limits[0]){
      shift=0;
      offset0=limits[0]-currentExtent[0];
      offset1=offset0+((Math.pow(1.1,scale)-1)+0.1*shift)*(currentExtent[1]-currentExtent[0]);
    }

    //if we go off the right edge, don't allow us to move right
    if((1*currentExtent[1])+offset1>limits[1]){
      shift=0;
      offset1=limits[1]-currentExtent[1];
      offset0=offset1+((1-Math.pow(1.1,scale))+0.1*shift)*(currentExtent[1]-currentExtent[0]);

    }

  //double check that the last bit didn't push us too far left
    if((1*currentExtent[0])+offset0<limits[0]){
      shift=0;
      offset0=limits[0]-currentExtent[0];
    }


    //do shift and update brushing
    var newExtent=[(1*currentExtent[0])+offset0,(1*currentExtent[1])+offset1];
    svg.select(".context_brush").call(context_brush.extent(newExtent));

    brushed_context();
  }

  function transform_wrapper(shift,scale){
     return function(event) {
          event.preventDefault();
          transform_context(shift,scale);
      };

  }

  d3.select('body').call(d3.keybinding()
      .on('←', transform_wrapper(-1,0))
      .on('→', transform_wrapper(1,0))
      .on('↑', transform_wrapper(0,-1))
      .on('↓', transform_wrapper(0,1)));

  // Find the nodes within the specified rectangle.
  function search(quadtree, brush_xmin, brush_ymin, brush_xmax, brush_ymax) {
    var brushed_points = [];
    quadtree.visit(function(node, rect_xmin, rect_ymin, rect_xmax, rect_ymax) {
      var p = node.point;
      if (p){
        //select based on xor (so brushing toggles all points under brush)
        p.selected = p.selected ^ ((p.x >= brush_xmin) && (p.x <= brush_xmax) && (p.y >= brush_ymin) && (p.y <= brush_ymax));
            brushed_points.push(p);
        //post(p);
      }
      //true if brush and quadtree rectangle don't over lap -- we didn't brush anything in here.
      //therefore, don't look at children of this node
      return rect_xmin > brush_xmax || rect_ymin > brush_ymax || rect_xmax < brush_xmin || rect_ymax < brush_ymin;
    });
  }

  function update_selection(){
    main.selectAll(".point").classed("selected", function(d) { return d.selected; });
    context.selectAll(".point").classed("selected", function(d) { return d.selected; });
  }

  function brushed_main(){
    var extent = main_brush.extent();
    console.log(extent)
    //point.each(function(d) { d.selected = false; });
    //convert based on context_xscale because this is what quadtree is defined on
    // search(quadtree, context_xscale(extent[0][0]), main_yscale(extent[0][1]), context_xscale(extent[1][0]), main_yscale(extent[1][1]));
    search(quadtree, context_xscale(extent[0][0]), main_yscale(extent[1][1]), context_xscale(extent[1][0]), main_yscale(extent[0][1]));

    update_selection();
    d3.selectAll(".main_brush").call(main_brush.clear());
  }

  $('#clear').click(function() {
    $('#clearOk').show();
    // make transparent and non functional links
  });

  $('#ok').click(function() {
    $('#clearOk').hide();
    main.selectAll(".point").classed("selected", function(d) { d.selected = 0; return d.selected; });
    context.selectAll(".point").classed("selected", function(d) { d.selected = 0; return d.selected; });
  });

  $('#export').click(function() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += window.headerStr + "\r\n";
    data.forEach(function(dataArray){
      let row = window.filename + ',' + new Date(dataArray.time).toISOString() + ',' + dataArray.val + ',' + dataArray.selected;
      csvContent += row + "\r\n";
    });
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", window.filename + "-lablr");
    document.body.appendChild(link); // Required for FF
    link.click();
    $('#exportComplete').show();
    // make transparent rent and inactive links
  });

}
</script>

<style>
svg {
  font: 10px sans-serif;
  display: block;
  margin: auto;
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
}

.point {
  fill: black;
  stroke: none;
  clip-path: url(#clip);
}

.point.selected {
  fill: red;
  fill-opacity: 1;
  stroke: red;
  clip-path: url(#clip);
}

.point.training {
  fill: blue;
  fill-opacity: 1;
  stroke: blue;
  clip-path: url(#clip);
}

.point.cooking {
  fill: #15d683;
  fill-opacity: 1;
  stroke: #15d683;
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
  background: #D84800;
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
  padding: 5px 5px;
}

.clearbtn {
  margin: 10px 5px;
  padding: 6px 15px;
}

hr {
  background: #f4f4f4;
  margin-top: 0px;
}
</style>