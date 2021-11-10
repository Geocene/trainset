import * as d3 from 'd3'
import { largestTriangleThreeBucket } from 'd3fc-sample'
const { DateTime } = require('luxon')

d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this)
  })
}

d3.selection.prototype.moveToBack = function () {
  return this.each(function () {
    var firstChild = this.parentNode.firstChild
    if (firstChild) {
      this.parentNode.insertBefore(this, firstChild)
    }
  })
}

d3.selection.prototype.first = function () {
  return d3.select(this.nodes()[0])
}

d3.selection.prototype.last = function () {
  return d3.select(this.nodes()[this.size() - 1])
}

export function drawLabeler (plottingApp) {
  // margins
  plottingApp.main_margin = {top: 10, right: 120, bottom: 100, left: 90}
  plottingApp.context_margin = {top: 430, right: 140, bottom: 20, left: 90}
  plottingApp.maindiv_width = $('#maindiv').width()
  plottingApp.width = plottingApp.maindiv_width - plottingApp.main_margin.left - plottingApp.main_margin.right
  plottingApp.main_height = 500 - plottingApp.main_margin.top - plottingApp.main_margin.bottom
  plottingApp.context_height = 500 - plottingApp.context_margin.top - plottingApp.context_margin.bottom
  plottingApp.label_margin = {small: 10, large: 20}

  // scales
  plottingApp.main_xscale = d3.scaleTime().range([0, plottingApp.width])
  plottingApp.context_xscale = d3.scaleTime().range([0, plottingApp.width])
  plottingApp.main_yscale = d3.scaleLinear().range([plottingApp.main_height, 0])
  plottingApp.secondary_yscale = d3.scaleLinear().range([plottingApp.main_height, 0])
  plottingApp.context_yscale = d3.scaleLinear().range([plottingApp.context_height, 0])

  // axes
  // can adjust multiscale time ticks: http://bl.ocks.org/mbostock/4149176
  plottingApp.main_xaxis = d3.axisBottom(plottingApp.main_xscale)
  plottingApp.context_xaxis = d3.axisBottom(plottingApp.context_xscale)
  plottingApp.y_axis = d3.axisLeft(plottingApp.main_yscale)
  plottingApp.ref_axis = d3.axisRight(plottingApp.secondary_yscale)

  var viewBox_width = plottingApp.width + plottingApp.main_margin.left + plottingApp.main_margin.right
  var viewBox_height = plottingApp.main_height + plottingApp.main_margin.top + plottingApp.main_margin.bottom

  // plotting areas
  plottingApp.svg = d3.select('#maindiv').append('svg')
    .classed('container-fluid', true)
    .classed('mainChart', true)
    .attr('id', 'mainChart')
    .attr('width', viewBox_width)
    .attr('height', viewBox_height + 50)
    .attr('viewBox', '0 0 ' + viewBox_width + ' ' + viewBox_height)
    .attr('perserveAspectRatio', 'xMinYMid meet')

  d3.select('#maindiv')
    .insert('text', '#mainChart')
    .attr('id', 'chartTitle')
    .attr('class', 'chartText')
    .attr('x', (plottingApp.width / 2))
    .attr('y', 0)
    .style('padding-left', '3.57%')
    .style('font-size', '20px')
  // .text("Filename: " + plottingApp.filename)
    .attr('viewBox', '0 0 ' + viewBox_width + ' ' + viewBox_height)
    .attr('perserveAspectRatio', 'xMinYMid meet')

  // set instrSelect top margin
  $('#instrSelect').css('margin-top', viewBox_height + 50)

  plottingApp.svg.append('text')
    .text('Filename: ' + plottingApp.filename)
    .attr('class', 'chartText')
    .attr('transform', 'translate(' + plottingApp.main_margin.left + ',' + (-plottingApp.main_margin.top) + ')')

  // create clipPath for svg elements (prevents svg elements outside of main window)
  plottingApp.svg.append('defs').append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', plottingApp.width)
    .attr('height', plottingApp.main_height)

  // main window
  plottingApp.main = plottingApp.svg.append('g')
    .attr('class', 'main')
    .attr('transform', 'translate(' + plottingApp.main_margin.left + ',' + plottingApp.main_margin.top + ')')

  // smaller context window
  plottingApp.context = plottingApp.svg.append('g')
    .attr('class', 'context')
    .attr('transform', 'translate(' + plottingApp.context_margin.left + ',' + plottingApp.context_margin.top + ')')

  // d3 brushes
  plottingApp.main_brush = d3.brush()
    .extent([[0, 0], [plottingApp.width, plottingApp.main_height]])
    .on('end', brushedMain)

  // disable default d3 brush key modifiers
  plottingApp.main_brush.keyModifiers(false)

  plottingApp.context_brush = d3.brushX()
    .extent([[0, 0], [plottingApp.width, plottingApp.context_height]])
    .on('end', brushedContext)
    .on('brush', limitContext)

  // d3 lines
  plottingApp.main_line = d3.line()
    .curve(d3.curveLinear)
    .x(function (d) { return plottingApp.main_xscale(d.time) })
    .y(function (d) { return plottingApp.main_yscale(d.val) })

  plottingApp.secondary_line = d3.line()
    .curve(d3.curveLinear)
    .x(function (d) { return plottingApp.main_xscale(d.time) })
    .y(function (d) { return plottingApp.secondary_yscale(d.val) })

  plottingApp.context_line = d3.line()
    .curve(d3.curveLinear)
    .x(function (d) { return plottingApp.context_xscale(d.time) })
    .y(function (d) { return plottingApp.context_yscale(d.val) })

  // load data format and brushes
  plottingApp.shiftKey = false
  plottingApp.brushSelector = 'Invert'
  plottingApp.selectedSeries = $('#seriesSelect option:selected').val()
  plottingApp.refSeries = $('#referenceSelect option:selected').val()
  // plot namespace (for svg selections associated with d3 objects)
  plottingApp.plot = {}
  // axis bounds & hoverinfo dict
  plottingApp.axisBounds = {}
  plottingApp.hoverinfo = {}

  $(function () {
    init()
  })

  /* initialize plots with default series data */
  function init () {
    plottingApp.allData = plottingApp.csvData.map(type)
    plottingApp.data = plottingApp.allData.filter(d => d.series === plottingApp.selectedSeries)

    // get default focus
    var defaultExtent = getDefaultExtent()
    // set scales based on loaded data, default focus
    plottingApp.context_xscale.domain(padExtent(d3.extent(
      plottingApp.allData.map(function (d) { return d.time })))) // xaxis set according to allData

    defaultExtent[0] = plottingApp.context_xscale.domain()[0]
    plottingApp.main_xscale.domain(defaultExtent)

    initPlot(defaultExtent)
    updateBrushData()
    updateYAxis()
    updateMain()
    plotContext()

    // color points
    updateSelection()

    // remove loading bar
    $('.loader').css('display', 'none')
  }

  /* initialize plot brushes, axes to default extent */
  function initPlot (defaultExtent) {
    // create context and main x axes
    plottingApp.main.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + plottingApp.main_height + ')')
      .call(plottingApp.main_xaxis)

    plottingApp.context.append('g')
      .attr('transform', 'translate(0,' + plottingApp.context_height + ')')
      .attr('class', 'x axis')
      .call(plottingApp.context_xaxis)

    // create main and context brushes
    plottingApp.plot.main_brush = plottingApp.main.append('g')
      .attr('class', 'main_brush')
      .call(plottingApp.main_brush)

    plottingApp.plot.context_brush = plottingApp.context.append('g')
      .attr('class', 'context_brush')
      .call(plottingApp.context_brush)

    // move brushes to back
    plottingApp.plot.main_brush.moveToBack()
    plottingApp.plot.context_brush.moveToBack()

    // disable click selection clear on context brush

    // store the reference to the original handler
    var oldMousedown = plottingApp.plot.context_brush.on('mousedown.brush')

    // and replace it with our custom handler
    plottingApp.plot.context_brush.on('mousedown.brush', function () {
      plottingApp.plot.context_brush.on('mouseup.brush', function () {
        clearHandlers()
      })

      plottingApp.plot.context_brush.on('mousemove.brush', function () {
        clearHandlers()
        oldMousedown.call(this)
      })

      function clearHandlers () {
        plottingApp.plot.context_brush.on('mousemove.brush', null)
        plottingApp.plot.context_brush.on('mouseup.brush', null)
      }
    })

    // set context brush to default extent
    plottingApp.plot.context_brush.call(plottingApp.context_brush.move,
      defaultExtent.map(plottingApp.context_xscale))
  }

  /* plot context graph line */
  function plotContext () {
    // if context line already exists, delete it
    if (plottingApp.plot.context_line) {
      plottingApp.plot.context_line.remove()
    }

    // context plot
    plottingApp.plot.context_line = plottingApp.context.append('path')
      .datum(plottingApp.context_data)
      .attr('class', 'line')
      .attr('d', plottingApp.context_line)
      .moveToBack()

    plottingApp.context_points = plottingApp.context.selectAll('.point')
      .data(plottingApp.context_data)
      .join('circle')
      .attr('class', 'point')
      .attr('cx', function (d) { return plottingApp.context_xscale(d.time) })
      .attr('cy', function (d) { return plottingApp.context_yscale(d.val) })
      .attr('pointer-events', 'none')
      .attr('r', 2)
  }

  /* update yaxes bounds based on selected and reference series */
  function updateYAxis () {
    // set y-axis based on selected series
    var minMax
    if (plottingApp.axisBounds[plottingApp.selectedSeries]) {
      minMax = plottingApp.axisBounds[plottingApp.selectedSeries]
    } else {
      minMax = getMinMax(plottingApp.selectedSeries)
      plottingApp.axisBounds[plottingApp.selectedSeries] = minMax
    }

    plottingApp.main_yscale.domain(minMax)
    plottingApp.context_yscale.domain(padExtent(getMinMax(plottingApp.selectedSeries)))

    // redraw / draw primary y axis
    if (plottingApp.plot.y_axis) {
      plottingApp.plot.y_axis.remove()
    }

    plottingApp.plot.y_axis = plottingApp.main.append('g')
      .attr('class', 'y axis primary')
      .call(plottingApp.y_axis)
      .call(g => g.select('.domain').remove())

    // add primary y axis label
    var axisBox = plottingApp.plot.y_axis.node().getBBox()
    plottingApp.main.select('.y.axis.primary').append('text')
      .attr('class', 'y label primary')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - axisBox.width - plottingApp.label_margin.small)
      .attr('x', 0 - plottingApp.main_height / 2)
      .attr('fill', 'currentColor')
      .text(plottingApp.selectedSeries)

    // handle editable primary y axis
    var lastTick = plottingApp.main.selectAll('.y.axis.primary .tick').last()
    var translateY = Number(lastTick.attr('transform').split(',')[1].slice(0, -1)) // drop Edit button to highest tick

    var p_editBtn = plottingApp.main.select('.y.axis.primary').append('g')
      .attr('class', 'button y primary editBtn')
      .attr('transform', 'translate(' + (0 - axisBox.width - plottingApp.label_margin.small) + ',' + translateY + ')')

    p_editBtn.append('rect')
      .attr('class', 'editRect')
      .attr('stroke', 'currentColor')
      .attr('rx', '2px')
      .attr('stroke-width', '0.75px')
      .attr('width', '26px')
      .attr('height', '16px')
      .attr('transform', 'translate(-21, -8)')

    p_editBtn.append('text')
      .text('Edit')
      .attr('dy', '0.32em')
      .attr('cursor', 'pointer')
      .attr('fill', 'currentColor')
      .on('click', function (d, i) { return updateMainY(plottingApp.selectedSeries) })

    // handle redraw reference y axis
    if (plottingApp.plot.ref_axis) {
      plottingApp.plot.ref_axis.remove()
    }

    // handle ref series
    if (plottingApp.refSeries !== '' && plottingApp.selectedSeries !== plottingApp.refSeries) {
      if (plottingApp.axisBounds[plottingApp.refSeries]) {
        minMax = plottingApp.axisBounds[plottingApp.refSeries]
      } else {
        minMax = getMinMax(plottingApp.refSeries)
        plottingApp.axisBounds[plottingApp.refSeries] = minMax
      }

      plottingApp.secondary_yscale.domain(minMax)

      plottingApp.plot.ref_axis = plottingApp.main.append('g')
        .attr('class', 'y axis secondary')
        .attr('transform', 'translate(' + plottingApp.width + ',0)')
        .call(plottingApp.ref_axis)
        .call(g => g.select('.domain').remove())

      // add reference y axis label
      axisBox = plottingApp.plot.ref_axis.node().getBBox()
      plottingApp.main.select('.y.axis.secondary').append('text')
        .attr('class', 'y label secondary')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 + axisBox.width + plottingApp.label_margin.large)
        .attr('x', 0 - plottingApp.main_height / 2)
        .attr('fill', 'currentColor')
        .text(plottingApp.refSeries)

      // handle editable primary y axis
      lastTick = plottingApp.main.selectAll('.y.axis.secondary .tick').last()
      translateY = lastTick.attr('transform').split(',')[1].slice(0, -1) // drop Edit button to highest tick

      var r_editBtn = plottingApp.main.select('.y.axis.secondary').append('g')
        .attr('class', 'button y secondary editBtn')
        .attr('transform', 'translate(' + (axisBox.width + plottingApp.label_margin.small) + ',' + translateY + ')')

      r_editBtn.append('rect')
        .attr('class', 'editRect')
        .attr('stroke', 'currentColor')
        .attr('stroke-width', '0.75px')
        .attr('rx', '2px')
        .attr('width', '26px')
        .attr('height', '16px')
        .attr('transform', 'translate(-4, -8)')

      r_editBtn.append('text')
        .text('Edit')
        .attr('dy', '0.32em')
        .attr('cursor', 'pointer')
        .attr('fill', 'currentColor')
        .on('click', function (d, i) { return updateMainY(plottingApp.refSeries) })
    }
  }

  /* redraw main graph with new points and color them */
  function updateMain () {
    // subset to only data in current domain
    var x_domain = plottingApp.main_xscale.domain()

    var main_data = plottingApp.data.filter(function (d) {
      return x_domain[0] <= d.time & d.time <= x_domain[1]
    })

    // handles ref series
    var secondary_data = plottingApp.refSeries === '' ||
      plottingApp.refSeries === plottingApp.selectedSeries ? null : plottingApp.allData
        .filter(d => d.series === plottingApp.refSeries)
        .filter(function (d) {
          return x_domain[0] <= d.time & d.time <= x_domain[1]
        })

    var total_data = secondary_data === null ? main_data : [...main_data, ...secondary_data]

    // redraw path
    var path = plottingApp.main.selectAll('path')
    path.remove()

    // add primary series data line
    plottingApp.main.append('path')
      .datum(main_data)
      .attr('class', 'line')
      .attr('fill-opacity', '0.7')
      .attr('d', plottingApp.main_line)

    // redraw points
    var point = plottingApp.main.selectAll('circle').data(total_data)

    point.join('circle')
      .attr('class', 'point')
      .attr('cx', function (d) { return plottingApp.main_xscale(d.time) })
      .attr('cy', function (d) { return selectYScale(d) })
      .attr('r', 5)

    // add secondary line and update secondary point styling if there is reference
    if (secondary_data) {
      plottingApp.main.append('path')
        .datum(secondary_data)
        .attr('class', 'line')
        .attr('id', 'secondary_line')
        .attr('fill-opacity', '0.4')
        .attr('d', plottingApp.secondary_line)
        .moveToBack()

      plottingApp.main.selectAll('.point')
        .filter((d, i) => d.series === plottingApp.refSeries)
        .attr('fill-opacity', '0.4')
        .attr('r', 2)
        .attr('pointer-events', 'none')
        .moveToBack()
    }

    /* add hover and click-label functionality for primary series points */
    /* eslint-disable no-unused-vars */
    var timer
    /* eslint-enable no-unused-vars */

    plottingApp.main.selectAll('.point')
      .filter((d, i) => d.series === plottingApp.selectedSeries)
      .moveToFront()
      .attr('fill-opacity', '0.7')
      .attr('pointer-events', 'all')
      .on('click', function (point) {
        // allow clicking on single points
        toggleSelected(point)
        updateSelection()
      })

    toggleHoverinfo(true)
    updateSelection()

    // update xAxis svg element
    plottingApp.main.select('.x.axis').call(plottingApp.main_xaxis)
  }

  /* toggle label of point using selected label */
  function toggleSelected (point) {
    if (point.label !== plottingApp.selectedLabel) {
      point.label = plottingApp.selectedLabel
    } else {
      point.label = ''
    }
  }

  /* replot svg after changing series */
  function replot () {
    updateBrushData()
    updateYAxis()
    plotContext()
    updateMain()
  }

  /* downsample context points using largest triangle three buckets algorithm
     and build quadtree for main brushing */
  function updateBrushData () {
    // Build quadtree for fast brushing
    plottingApp.quadtree = d3.quadtree()
      .x(function (d) { return d.time })
      .y(function (d) { return d.val })
      .addAll(plottingApp.data)

    // Downsample context data for big datasets
    var sampler = largestTriangleThreeBucket()

    // Configure the x / y value accessors
    sampler.x(function (d) { return d.x })
      .y(function (d) { return d.y })

    // Configure the size of the buckets used to downsample the data.
    // Have at most 1000 context points
    var bucket_size = Math.max(Math.round(plottingApp.data.length / 1000), 1)

    // bump bucket size if 2 (doesn't preserve outliers)
    // bucket_size = (bucket_size === 2) ? bucket_size + 1 : bucket_size;

    sampler.bucketSize(bucket_size)

    plottingApp.context_data = sampler(plottingApp.data)
  }

  function createInView (domain) {
    function inView (d) {
      var dom = domain.map(function (d) { return plottingApp.context_xscale(d) })
      return plottingApp.context_xscale(d.x) >= dom[0] && plottingApp.context_xscale(d.x) <= dom[1]
    }
    return inView
  }

  function brushedMain () {
    var extent = d3.brushSelection(plottingApp.plot.main_brush.node())
    if (extent === null) {
      return
    }

    // convert pixels defining brush into actual time, value scales
    var xmin = plottingApp.main_xscale.invert(extent[0][0])
    var xmax = plottingApp.main_xscale.invert(extent[1][0])
    var ymax = plottingApp.main_yscale.invert(extent[0][1])
    var ymin = plottingApp.main_yscale.invert(extent[1][1])

    search(plottingApp.quadtree, xmin, ymin, xmax, ymax)
    updateSelection()
    plottingApp.plot.main_brush.call(plottingApp.main_brush.move, null)
  }

  function limitContext () {
    var s = d3.brushSelection(plottingApp.plot.context_brush.node()).map(plottingApp.context_xscale.invert, plottingApp.context_xscale)
    var brushData = plottingApp.data.filter(createInView(s))
    if (brushData.length >= 2000) {
      /* eslint-disable no-unused-vars */
      var firstIndex = plottingApp.data.map(function (d) { return d.time }).indexOf(s[0])
      /* eslint-enable no-unused-vars */
    }
  }

  function brushedContext () {
    var s = d3.brushSelection(plottingApp.plot.context_brush.node()) || plottingApp.context_xscale.range()
    plottingApp.main_xscale.domain(s.map(plottingApp.context_xscale.invert, plottingApp.context_xscale))

    updateMain()

    /* eslint-disable no-unused-vars */
    var limits = plottingApp.context_xscale.domain()
    /* eslint-enable no-unused-vars */
    if (plottingApp.context_brush.extent()[1] >= 1 * plottingApp.context_xscale.domain()[1]) {
      console.log('far right')
    }
  }

  // keyboard functions to change the focus
  function transformContext (shift, scale) {
    var currentExtent = d3.brushSelection(plottingApp.plot.context_brush.node())
    currentExtent = currentExtent.map(function (d) {
      return plottingApp.context_xscale.invert(d)
    })

    var offset0 = ((1 - Math.pow(1.1, scale)) + 0.1 * shift) * (currentExtent[1] - currentExtent[0])
    var offset1 = ((Math.pow(1.1, scale) - 1) + 0.1 * shift) * (currentExtent[1] - currentExtent[0])

    // don't shift past the ends of the scale
    var limits = plottingApp.context_xscale.domain()

    // if we go off the left edge, don't allow us to move left
    if ((1 * currentExtent[0]) + offset0 < limits[0]) {
      shift = 0
      offset0 = limits[0] - currentExtent[0]
      offset1 = offset0 + ((Math.pow(1.1, scale) - 1) + 0.1 * shift) * (currentExtent[1] - currentExtent[0])
    }

    // if we go off the right edge, don't allow us to move right
    if ((1 * currentExtent[1]) + offset1 > limits[1]) {
      shift = 0
      offset1 = limits[1] - currentExtent[1]
      offset0 = offset1 + ((1 - Math.pow(1.1, scale)) + 0.1 * shift) * (currentExtent[1] - currentExtent[0])
    }

    // double check that the last bit didn't push us too far left
    if ((1 * currentExtent[0]) + offset0 < limits[0]) {
      shift = 0
      offset0 = limits[0] - currentExtent[0]
    }

    // do shift and update brushing
    var newExtent = [(1 * currentExtent[0]) + offset0, (1 * currentExtent[1]) + offset1]

    // disable mouseover info while shifting
    toggleHoverinfo(false)

    plottingApp.plot.context_brush.call(plottingApp.context_brush.move,
      newExtent.map(function (d) { return plottingApp.context_xscale(d) }))

    // re-enable mouseover info
    toggleHoverinfo(true)

    // re color points
    updateSelection()
  }

  // Find the nodes within the specified rectangle.
  function search (quadtree, brush_xmin, brush_ymin, brush_xmax, brush_ymax) {
    // use quadtree to brush points in defined rectangle
    plottingApp.quadtree.visit(function (node, quad_xmin, quad_ymin, quad_xmax, quad_ymax) {
      if (!node.length) {
        do {
          var d = node.data
          // change selected property of points in brush
          if (!plottingApp.shiftKey) {
            d.label = ((d.time >= brush_xmin) && (d.time <= brush_xmax) && (d.val >= brush_ymin) && (d.val <= brush_ymax)) ? plottingApp.selectedLabel : d.label
          } else {
            d.label = ((d.time >= brush_xmin) && (d.time <= brush_xmax) && (d.val >= brush_ymin) && (d.val <= brush_ymax)) ? '' : d.label
          }
        } while (node = node.next) // eslint-disable-line no-cond-assign
      }

      // return true if current quadtree rectangle intersects with brush (looks deeper in tree if true)
      return quad_xmin >= brush_xmax || quad_ymin >= brush_ymax || quad_xmax < brush_xmin || quad_ymax < brush_ymin
    })
  }

  /* if b === true, enable mouseover info modal
     else, disable mouseover info modal */
  function toggleHoverinfo (b) {
    if (b) {
      // enable mouseover/mouseout hoverinfo
      plottingApp.main.selectAll('.point')
        .on('mouseover', function (point) {
          plottingApp.hoverTimer = setTimeout(function () {
            updateHoverinfo(point.actual_time, point.val, point.label)
          }, 250)
        })
        .on('mouseout', function () {
          clearTimeout(plottingApp.hoverTimer)
          plottingApp.hoverTimer = null
          updateHoverinfo('', '', '')
        })
    } else {
      // clear hoverinfo and timeout
      if (plottingApp.hoverTimer) {
        clearTimeout(plottingApp.hoverTimer)
        updateHoverinfo('', '', '')
      }

      // replace handler
      plottingApp.main.selectAll('.point')
        .on('mouseover', function (e) {
          e.preventDefault()
        })
        .on('mouseout', function (e) {
          e.preventDefault()
        })
    }
  }

  /* format csv data with data structure */
  function type (d) {
    d.actual_time = DateTime.fromISO(d.time, {setZone: true})
    var d2 = d.time.toISO({ includeOffset: false })
    d.time = DateTime.fromISO(d2)
    d.val = +d.val
    d.series = d.series
    d.label = d.label
    d.x = +d.time
    d.y = d.val
    return d
  }

  /* format luxon datetime obj to hoverbox time */
  function formatHover (datetime) {
    var hoverdate = datetime.toISO()
    hoverdate = hoverdate.match(/(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+)([+-][0-2]\d:[0-5]\d|Z)/)
    var dateArr = hoverdate[1].split('.')
    if (dateArr[1] === '000') {
      return dateArr[0]
    } else {
      return hoverdate
    }
  }

  /* update hoverbox info with point data */
  function updateHoverinfo (time, val, label) {
    if (time === '' && val === '' && label === '') {
      $('#hoverinfo').hide()
      plottingApp.hoverinfo.time = ''
      plottingApp.hoverinfo.val = ''
      plottingApp.hoverinfo.label = ''
      $('#updateHover').click()
    } else {
      $('#hoverinfo').show()
      plottingApp.hoverinfo.time = formatHover(time)
      plottingApp.hoverinfo.val = val.toFixed(2)
      plottingApp.hoverinfo.label = label.toString()
      $('#updateHover').click()
    }
  }

  /* return true if label is not null */
  function isSelected (d) {
    if (d.label === '') {
      return false
    }
    return true
  }

  /* set reference series on checkbox change
     1 == checked; 0 == unchecked */
  // function setReference(b) {
  //   if (b == 1) {
  //     plottingApp.refSeries = plottingApp.selectedSeries;
  //   } else {
  //     if (plottingApp.refSeries == plottingApp.selectedSeries) {
  //       plottingApp.refSeries = "";
  //     }
  //   }
  // }

  function setReference (series) {
    plottingApp.refSeries = series
  }

  /* return appropriate yscale applied to val of d
     based on whether primary or reference series */
  function selectYScale (d) {
    if (d.series === plottingApp.selectedSeries) {
      return plottingApp.main_yscale(d.val)
    }
    if (d.series === plottingApp.refSeries) {
      return plottingApp.secondary_yscale(d.val)
    }
  }

  /* increase extent by padding */
  function padExtent (extent, padding) {
    padding = (typeof padding === 'undefined') ? 0.01 : padding
    var range = extent[1] - extent[0]
    // 1*x is quick hack to handle date/time axes
    return [(1 * extent[0]) - padding * range, (1 * extent[1]) + padding * range].map(d => d.toFixed(3))
  }

  /* manually update main Y axis with user input */
  function updateMainY (axis) {
    // handle dynamic data
    plottingApp.editSeries = axis
    $('#updateEdit').click()
  }

  function updateSelection () {
    plottingApp.main.selectAll('.point')
      .attr('style', function (d) { return getPointStyle(d) })
    plottingApp.context.selectAll('.point')
      .attr('style', function (d) { return getPointStyle(d) })
  }

  /* calculate default extent based on data length */
  function getDefaultExtent () {
    var start_date = plottingApp.data[0].time
    var d_len = plottingApp.data.length; var end_date
    if (d_len <= 100) {
      end_date = plottingApp.data[d_len - 1].time
    } else if (d_len <= 1000) {
      end_date = plottingApp.data[100].time
    } else if (d_len >= 10000) {
      end_date = plottingApp.data[1000].time
    } else {
      end_date = plottingApp.data[Math.round((d_len - 1) / 10)].time
    }
    return [start_date, end_date]
  }

  /* return the bounds of the given y axis */
  function getMinMax (axis) {
    var y_vals = plottingApp.allData.filter(d => d.series === axis).map(d => d.val)
    var minMax = [Math.min.apply(Math, y_vals), Math.max.apply(Math, y_vals)]
    return padExtent(minMax, 0.1)
  }

  /* return the css style string for point based on label->color mapping */
  function getPointStyle (d) {
    if (isSelected(d)) {
      var color = plottingApp.labelList.find(l => l.name === d.label).color
      return 'fill: ' + color + '; stroke: ' + color + '; opacity: 0.75;'
    } else {
      return 'fill: black; stroke: none; opacity: 1;'
    }
  }

  $('#seriesSelect').change(function () {
    plottingApp.selectedSeries = $('#seriesSelect option:selected').val()
    plottingApp.data = plottingApp.allData.filter(d => d.series === plottingApp.selectedSeries)
    replot()
  })

  $('#referenceSelect').change(function () {
    setReference($('#referenceSelect option:selected').val())
    replot()
  })

  $('#labelSelect').change(function () {
    plottingApp.selectedLabel = $('#labelSelect option:selected').attr('name')
  })

  $('#clearSeries').click(function () {
    plottingApp.quadtree.visit(function (node, quad_xmin, quad_ymin, quad_xmax, quad_ymax) {
      if (!node.length) {
        do {
          node.data.label = ''
        } while (node = node.next) // eslint-disable-line no-cond-assign
      }
      return false
    })
    updateSelection()
  })

  $('#triggerReplot').click(function () {
    replot()
  })

  $('#triggerRecolor').click(function () {
    updateSelection()
  })

  $('#export').click(function () {
    var csvContent = plottingApp.headerStr + '\n'

    plottingApp.allData.forEach(function (dataArray) {
      var date = dataArray.actual_time.toISO()
      let row = dataArray.series + ',' + date +
                ',' + dataArray.val + ',' + dataArray.label
      csvContent += row + '\n'
    })
    var saveData = (function () {
      var a = document.createElement('a')
      document.body.appendChild(a)
      a.style = 'display: none'
      return function (data, fileName) {
        var string = csvContent
        var blob = new Blob([string], {type: 'text/csv, charset=UTF-8'})
        var url = window.URL.createObjectURL(blob)
        a.href = url
        a.download = fileName
        a.click()
        window.URL.revokeObjectURL(url)
      }
    }())
    var filename = plottingApp.filename
    if (!filename.endsWith('-labeled')) {
      filename += '-labeled'
    }
    saveData(csvContent, filename + '.csv')
    $('#exportComplete').show()
  })

  d3.select(window).on('keydown', function (e) {
    plottingApp.shiftKey = d3.event.shiftKey
    if (plottingApp.shiftKey) {
      plottingApp.shiftKey = true
    } else {
      plottingApp.shiftKey = false
    }
    var code = d3.event.keyCode
    if (code === 38) {
      // handle up arrowkey
      transformContext(0, -2)
      d3.event.preventDefault()
    } else if (code === 40) {
      // handle down arrowkey
      transformContext(0, 2)
      d3.event.preventDefault()
    } else if (code === 37) {
      // handle left arrowkey
      if (plottingApp.shiftKey) {
        transformContext(-9, 0)
      } else {
        transformContext(-1, 0)
      }
    } else if (code === 39) {
      // handle right arrowkey
      if (plottingApp.shiftKey) {
        transformContext(9, 0)
      } else {
        transformContext(1, 0)
      }
    } else if (code === 76) {
      // handle 'l' press over hoverinfo
      if (plottingApp.hoverTimer && plottingApp.hoverinfo.label) {
        if (plottingApp.selectedLabel !== plottingApp.hoverinfo.label) {
          plottingApp.selectedLabel = plottingApp.hoverinfo.label
          $('#updateSelectedLabel').click()
        }
      }
    }
  })

  d3.select(window).on('keyup', function () {
    plottingApp.shiftKey = d3.event.shiftKey
    if (plottingApp.shiftKey) {
      plottingApp.shiftKey = true
    } else {
      plottingApp.shiftKey = false
    }
  })
}
