<template>
  <div class="container-fluid" id="plotBox">
    <nav class="navbar navbar-expand-lg fixed-top"> 
      <h1 class="navbar-brand"><router-link class="homeLink" v-bind:to="'/'">TRAINSET</router-link></h1>
      <div class="navbar-nav ml-auto">
        <router-link class="nav-link" v-bind:to="'/help'">Help</router-link>
      </div>
    </nav>
    <div id="plot"></div>
  </div>
</template>

<script>
import Plotly from 'plotly.js/dist/plotly'

var uid = 1;

export default {
	name: 'upload',
	props: {
		csvData: Array,
		filename: String,
		isValid: Boolean
	},
	mounted() {
		var trace1 = {
		    x: this.csvData[0],
		    y: this.csvData[1],
		    mode: 'markers',
		    opacity: 1,
		    marker: {
		        color: 'black'
		    },
		    name: 'plotData',
		    uid: 0
		};
		var data = [trace1];
		var layout = {
	        title: this.filename,
	        xaxis: {
	            rangeslider: {}
	        },
	        yaxis: {
	            fixedrange: true
	        },
	        showlegend: false
		};

		Plotly.newPlot('plot', data, layout);
		var plot = document.getElementById('plot');
		var dragLayer = document.getElementsByClassName('nsewdrag')[0];

		plot.on('plotly_hover', function(data){
		  	dragLayer.style.cursor = 'pointer'
		});

		plot.on('plotly_unhover', function(data){
		  	dragLayer.style.cursor = 'crosshair'
		});

		plot.on('plotly_click', function(data) {
		    var x, y;
		    for(var i=0; i < data.points.length; i++){
		    	x = data.points[i].x;
		    	y = data.points[i].y.toPrecision(4);
		    }
		    var xT = [x], yT = [y];

		    if (data.points[data.points.length - 1].data.uid == 0) {
		      	Plotly.addTraces(plot, {
				    x: xT,
			        y: yT,
			        type: 'scatter',
			        mode: 'markers',
			        marker: {'color': 'red'},
				    name: 'marker_trace',
				    uid: uid
		      	});
		      	uid++;
		    } else {
		    	Plotly.deleteTraces('plot', data.points[data.points.length - 1].curveNumber);
		    }
		});
	}
};
</script>

<style>
#plotBox { padding: 100px 15px; }
</style>