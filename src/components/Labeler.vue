<template>
  <div class="container-fluid" id="plotBox">
    <nav class="navbar navbar-expand fixed-top"> 
      <h1 class="navbar-brand"><div class="homeLink" @click="newHome()">TRAINSET<img id="logo" src="../assets/trainset_logo.png"></div></h1>
      <ul class="navbar-nav ml-auto">
        <div class="nav-link" @click="newHelp()">Help</div>
        <li class="nav-item">
          <div class="nav-link" id="clear">Clear</div>
        </li>
        <!-- <li class="nav-item dropdown">
          <div class="nav-link dropdown-toggle" id="brush" data-toggle="dropdown">Brush</div>
          <div class="dropdown-menu">
            <div class="dropdown-item active">Invert</div>
            <div class="dropdown-item">Label True</div>
            <div class="dropdown-item">Label False</div>
          </div>
        </li> -->
        <div class="nav-link" id="export">Export</div>
      </ul>
    </nav>
    <div id="hoverbox" class="card"><div class="card-subtitle">Time: {{ time }}</div><div class="card-subtitle">Value: {{ val }}</div></div>
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
          <strong>Click</strong> on the bottom context bar to unfocus</br>
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
    <button id="updateHover" style="display: none;" v-on:click="updateHoverbox"></button>
  </div>
</template>

<script>
import * as d3 from 'd3'
import * as dc from 'dc'
import { largestTriangleThreeBucket } from 'd3fc-sample';

export default {
  name: 'labeler',
  props: {
    csvData: Array,
    minMax: Array,
    filename: String,
    headerStr: String,
    isValid: Boolean
  },
  data: function() {
    return {
      val: '',
      time: ''
    };
  },
    methods: {
      goHome() {
        this.$router.push({ name: 'home', params: {nextUp: false} });
      },
      newUpload() {
        this.$router.push({ name: 'home', params: {nextUp: true} });
      },
      newHelp() {
        let routeData = this.$router.resolve({ name: 'help' });
        window.open(routeData.href, '_blank');
      },
      newHome() {
        let routeData = this.$router.resolve({ name: 'home', params: {nextUp: false} });
        window.open(routeData.href, '_blank');
      },
      updateHoverbox() {
        this.time = window.time;
        this.val = window.val;
      },
      clearHoverbox() {
        this.time = '';
        this.val = '';
      },
      cancel() {
        $('#clearOk').hide();
        $('.navbar').css("opacity", "1");
        $('#maindiv').css("opacity", "1");
      },
      cancelUpload() {
        $('#exportComplete').hide();
        $('.navbar').css("opacity", "1");
        $('#maindiv').css("opacity", "1");
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
        $('#maindiv').css("padding", "0px 75px");
        $('#hoverbox').hide();
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
  var main_margin = {top: 10, right: 10, bottom: 100, left: 40},
  context_margin = {top: 430, right: 40, bottom: 20, left: 40},
  maindiv_width = $('#maindiv').width(),
  width = maindiv_width - main_margin.left - main_margin.right,
  main_height = 500 - main_margin.top - main_margin.bottom,
  context_height = 500 - context_margin.top - context_margin.bottom;

  //scales
  var main_xscale = d3.scaleTime().range([0, width]),
  context_xscale = d3.scaleTime().range([0, width]),
  main_yscale = d3.scaleLinear().range([main_height, 0]),
  context_yscale = d3.scaleLinear().range([context_height, 0]);

  //axes
  //can adjust multiscale time ticks: http://bl.ocks.org/mbostock/4149176
  var main_xaxis = d3.axisBottom(main_xscale),
  context_xaxis = d3.axisBottom(context_xscale),
  yaxis = d3.axisLeft(main_yscale);

  //plotting areas
  var svg = d3.select("#maindiv").append("svg")
  .classed("container-fluid", true)
  .classed("mainChart", true)
  .attr("id", "mainChart")
  .attr("width", width + main_margin.left + main_margin.right)
  .attr("height", main_height + main_margin.top + main_margin.bottom)
  .attr("viewBox", "0 0 " + (width + main_margin.left + main_margin.right) + " " + (main_height + main_margin.top + main_margin.bottom))
  .attr("perserveAspectRatio", "xMinYMid meet");

  d3.select("#maindiv")
      .insert("text", "#mainChart")
        .attr("id", "chartTitle")
        .attr("x", (width / 2))             
        .attr("y", 0)
        .attr("padding-bottom", "-300px")
        .attr("padding", "inherit 150px")  
        .style("font-size", "25px")
        .text("Filename: " + window.filename)
        .attr("viewBox", "0 0 " + (width + main_margin.left + main_margin.right) + " " + (main_height + main_margin.top + main_margin.bottom))
      .attr("perserveAspectRatio", "xMinYMid meet");

  d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };

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
  var main_brush = d3.brush()
  .extent([[0,0], [width, main_height]])
  .on("end", brushed_main);

  main_brush.on("start.nokey", function() {
    d3.select(window).on("keydown.brush keyup.brush", null);
  });

  var context_brush = d3.brushX()
  .extent([[0,0],[width, context_height]])
  .on("end", brushed_context)
  .on("brush", limit_context);

  //lines
  var main_line = d3.line()
  .curve(d3.curveLinear)
  .x(function(d) { return main_xscale(d.time); })
  .y(function(d) { return main_yscale(d.val); });

  var context_line = d3.line()
  .curve(d3.curveLinear)
  .x(function(d) { return context_xscale(d.time); })
  .y(function(d) { return context_yscale(d.val); });

  //load data and adjust scales
  var shiftKey = false;
  var conBrush;
  var mainBrush;
  var data;
  var quadtree;
  var context_data;
  var brushSelector = 'Invert';
  var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S%Z");

  window.addEventListener("keydown", function(e) {
      // space and arrow keys
      if([40].indexOf(e.keyCode) > -1) {
          transform_context(0, 2);
          try  {
            e.preventDefault();
          } catch (e) {
            // do nothing
          }
      } else if ([38].indexOf(e.keyCode) > -1) {
          transform_context(0, -2);
          try  {
            e.preventDefault();
          } catch (e) {
            // do nothing
          }
      }
  }, false);

  d3.select(window).on("keydown", function(e) {
    shiftKey = d3.event.shiftKey;
    if (shiftKey) {
      shiftKey = true;
    } else {
      shiftKey = false;
    }
    var code = d3.event.keyCode;
    if (code === 37) {
      if (shiftKey) {
        transform_context(-9, 0);
      } else {
        transform_context(-1, 0);
      }
    } else if (code === 39) {
      if (shiftKey) {
        transform_context(9, 0);
      } else {
        transform_context(1, 0);
      }
    }
  });

  d3.select(window).on("keyup", function() {
    shiftKey = d3.event.shiftKey;
    if (shiftKey) {
      shiftKey = true;
    } else {
      shiftKey = false;
    }
  });
  
  function type(d) {
    d.time = parseDate(d.time);
    d.val = +d.val;
    d.selected = +d.selected;
    d.x = +d.time;
    d.y = d.val;
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
    
    // Build quadtree for fast brushing
    quadtree=d3.quadtree()
              .x(function(d) { return d.time; })
              .y(function(d) { return d.val; })
              .addAll(data);
    
    // Downsample context data for big datasets
    var sampler = largestTriangleThreeBucket();
    
    // Configure the x / y value accessors
    sampler.x(function (d) { return d.x; })
        .y(function (d) { return d.y; });

    // Configure the size of the buckets used to downsample the data.
    // Have at most 1000 context points
    var bucket_size = Math.max(Math.round(data.length/1000),1);
    sampler.bucketSize(bucket_size);
    
    context_data = sampler(data);

    // Set default focus
    var start_date = data[0].time
    if(window.view_or_label=="label"){
      if (data.length < 100) {
        var end_date = data[data.length-1].time;
      } else if (data.length < 1000) {
        var end_date = data[100].time;
      } else if (data.length > 10000) {
        var end_date = data[1000].time;
      } else {
        var end_date = data[Math.round((data.length - 1) / 10)].time;
      }
    } 

    var defaultExtent = [start_date,end_date];

    // set scales based on loaded data, default focus
    context_xscale.domain(pad_extent(d3.extent(data.map(function(d) { return d.time; }))));
    defaultExtent[0] = context_xscale.domain()[0];
    main_xscale.domain(defaultExtent);
    main_yscale.domain(pad_extent([window.y_min, window.y_max]));
    context_yscale.domain(pad_extent(main_yscale.domain()));
    
    // make the plots
    makeplot(data, context_data);
    $('.loader').css('display', 'none');
    // svg.select(".context_brush").call(context_brush.extent(defaultExtent));
    conBrush.call(context_brush.move, defaultExtent.map(context_xscale));
    
    // highlight selected points
    update_selection();

  }

  $(function () {
   init();
  });

  function createInView(domain) {
    function inView(d) {
      var dom = domain.map(function(d) { return context_xscale(d); });
      return context_xscale(d.x) >= dom[0] && context_xscale(d.x) <= dom[1];
    }
    return inView;
  }
  

  function update_main(data){
    
    
    // subset to only data in current domain
    var x_domain = main_xscale.domain()

    var  main_data = data.filter(function(d){
      return x_domain[0] <= d.time & d.time<=x_domain[1]
    })

    // redraw path
    var path = main.selectAll("path");
    path.remove();
    
    main.append("path")
      .datum(main_data)
      .attr("class","line")
      .attr("fill-opacity", "0.7")
      .attr("d", main_line);


    
    // redraw points
    var point = main.selectAll("circle").data(main_data);
    
    point.attr("class", "update");

    point.enter().append("circle")
    .attr("class", "enter")
    .attr("cx", function(d) { return main_xscale(d.time); })
    .attr("cy", function(d) { return main_yscale(d.val); })
    .attr("r", 5)
    .classed("selected", function(d) { return d.selected; })
    .merge(point)
    .attr("class", "point")
    .attr("cx", function(d) { return main_xscale(d.time); })
    .attr("cy", function(d) { return main_yscale(d.val); })
    .attr("r", 5)
    .classed("selected", function(d) { return d.selected; });
    
    point.exit().remove();

    var timer;
    
    main.selectAll(".point")
    .moveToFront()
    .attr("fill-opacity", "0.7")
    .on("click", function(point){
          //allow clicking on single points
          point.selected=1-point.selected;
          update_selection();
        })
    .on("mouseover", function(point) {
        timer = setTimeout(function() {
          update_hoverbox(point.time, point.val);
        }, 250);  
      })
    .on("mouseout", function() {
        clearTimeout(timer);
        update_hoverbox('', '');
      });

  }

  function update_hoverbox(time, val) {
    if (time === '' && val === '') {
      $('#hoverbox').hide();
      window.time = '';
      window.val = '';
      $('#updateHover').click();
    } else {
      $('#hoverbox').show();
      window.time = time.toString().split('GMT')[0];
      window.val = val.toFixed(2);
      $('#updateHover').click();
    }
  }
  
  //initial plotting function
  function makeplot(data, context_data) {
    //main plot
    
    mainBrush = main.append("g")
    .attr("class", "main_brush")
    .call(main_brush);
    //.call(main_brush.event);
    
    main.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + main_height + ")")
    .call(main_xaxis);

    main.append("g")
    .attr("class", "y axis")
    .call(yaxis);

    update_main(data);
    
    //context plot
    context.append("path")
    .datum(context_data)
    .attr("class", "line")
    .attr("d", context_line);


    context.selectAll(".point")
    .data(context_data)
    .enter().append("circle")
    .attr("class", "point")
    .attr("cx", function(d) { return context_xscale(d.time); })
    .attr("cy", function(d) { return context_yscale(d.val); })
    .attr("r", 2);

    context.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + context_height + ")")
    .call(context_xaxis);


    conBrush = context.append("g")
    .attr("class", "context_brush")
    .call(context_brush);


  }

  function limit_context() {
    var s = d3.brushSelection(conBrush.node()).map(context_xscale.invert, context_xscale);
    var brushData = data.filter(createInView(s));
    if (brushData.length >= 2000) {
      var firstIndex = data.map(function(d) { return d.time; }).indexOf(s[0]);
      // d3.selectAll(".context_brush").call(context_brush.move, [data[firstIndex], data[firstIndex+2000]].map(context_xscale));
    }
  }

  function brushed_context() {
    var s = d3.brushSelection(conBrush.node()) || context_xscale.range();
    main_xscale.domain(s.map(context_xscale.invert, context_xscale));

    update_main(data);
    main.select(".x.axis").call(main_xaxis);

    
    var limits=context_xscale.domain();
    if(context_brush.extent()[1]>=1*context_xscale.domain()[1]){
      console.log("far right");
    }
  }

  //keyboard functions to change the focus
  function transform_context(shift,scale) {
    var currentExtent=d3.brushSelection(conBrush.node());
    currentExtent = currentExtent.map(function(d) {
      return context_xscale.invert(d);
    });


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

    conBrush.call(context_brush.move, newExtent.map(function(d) { return context_xscale(d); }));

    brushed_context();
  }
  
  // Find the nodes within the specified rectangle.
  function search(quadtree, brush_xmin, brush_ymin, brush_xmax, brush_ymax) {
    quadtree.visit(function(node, quad_xmin, quad_ymin, quad_xmax, quad_ymax) {
      if (!node.length) {
        do {
          var d = node.data;
          // invert selection for points in brush
          if (!shiftKey) {
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

  function update_selection(){
    main.selectAll(".point").classed("selected", function(d) { return d.selected; });
    context.selectAll(".point").classed("selected", function(d) { return d.selected; });
  }

  function brushed_main(){
    var extent = d3.brushSelection(mainBrush.node());
    if (extent === null) {
      return;
    }
    
    // convert pixels defining brush into actual time, value scales
    var xmin = main_xscale.invert(extent[0][0])
    var xmax = main_xscale.invert(extent[1][0])
    var ymax = main_yscale.invert(extent[0][1])
    var ymin = main_yscale.invert(extent[1][1])
    
    
    
    search(quadtree, xmin, ymin, xmax, ymax);
    update_selection();
    mainBrush.call(main_brush.move, null);
  }

  $('#clear').click(function() {
    $('#clearOk').show();
    $('.navbar').css("opacity", "0.5");
    $('#maindiv').css("opacity", "0.5");
  });

  $('#ok').click(function() {
    $('#clearOk').hide();
    $('.navbar').css("opacity", "1");
    $('#maindiv').css("opacity", "1");
    quadtree.visit(function(node, quad_xmin, quad_ymin, quad_xmax, quad_ymax) {
      if (!node.length) {
        do {
          node.data.selected = 0;
        } while (node = node.next);
      }
      return false;
    });
    update_selection();
  });

  function toISOString(date) {
      var tzo = -date.getTimezoneOffset(),
          dif = tzo >= 0 ? '+' : '-',
          pad = function(num) {
              var norm = Math.floor(Math.abs(num));
              return (norm < 10 ? '0' : '') + norm;
          };
      return date.getFullYear() +
          '-' + pad(date.getMonth() + 1) +
          '-' + pad(date.getDate()) +
          'T' + pad(date.getHours()) +
          ':' + pad(date.getMinutes()) +
          ':' + pad(date.getSeconds()) +
          dif + pad(tzo / 60) + pad(tzo % 60);
  }

  $('#export').click(function() {
    var csvContent = window.headerStr + '\n';

    data.forEach(function(dataArray){
      var date = toISOString(new Date(dataArray.time));
      let row = window.filename + ',' + date
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
    var filename = window.filename;
    if (!filename.endsWith('-labeled')) {
      filename += '-labeled';
    }
    saveData(csvContent, filename + '.csv');
    $('#exportComplete').show();
    $('.navbar').css("opacity", "0.5");
    $('#maindiv').css("opacity", "0.5");
  });

  $('.dropdown-item').click(function() {
    $('.dropdown-item').not(this).removeClass('active');
    $(this).toggleClass('active');
    brushSelector = $('.dropdown-item.active').html();
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
  text-align: left;
  padding: 10px;
  padding-bottom: 0px;
  margin-left: 76%;
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
  fill: red;
  fill-opacity: 1;
  stroke: red;
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
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.1em 0.5em;
    margin: 0 0.2em;
    box-shadow: 0 1px 0px rgba(0, 0, 0, 0.2), 0 0 0 2px #fff inset;
    background-color: #f7f7f7;
    font-size: 0.75em;
    color:black;
}

#legend {
  margin-top: 550px;
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