var url =
  'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'

// main svg sizing
var paddingTop = 110
var paddingBottom = 70
var paddingLeft = 110
var paddingRight = 60
var area = 1048
var w = paddingLeft + paddingRight + area
var h = 520

// create main svg
var svg = d3
  .select('body')
  .append('svg')
  .attr('id', 'main-svg')
  .attr('width', w)
  .attr('height', h)

// create tooltip element
var tooltip = d3
  .select('body')
  .append('div')
  .attr('id', 'tooltip')
  .style('opacity', 0)

// add title
svg
  .append('text')
  .attr('id', 'title')
  .text('Monthly Global Land-Surface Temperature')
  .attr('x', paddingLeft + area)
  .attr('y', paddingTop / 2)
  .attr('text-anchor', 'end')

// load in data
var req = new XMLHttpRequest()
req.open('GET', url, true)
req.send()
req.onload = function() {
  var dataset = JSON.parse(req.responseText)
  var baseTemp = dataset.baseTemperature
  var data = dataset.monthlyVariance

  var months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  // create a scale to map data values to color
  // using the d3.scale.cluster library for better data grouping
  // and therefore better color representation
  var numColors = 9
  var color = d3
    .scaleCluster()
    .domain(
      data.map(function(d) {
        return d.variance
      })
    )
    .range(d3.schemeRdBu[numColors].reverse()) // flipping the color scheme

  // extending the data object for easy access later on
  data.forEach(function(d) {
    d.month = d.month - 1 // mainly to make fCC test suite pass
    d.monthName = months[d.month]
    d.color = color(d.variance)
  })

  // add description
  svg
    .append('text')
    .attr('id', 'description')
    .text(
      data[0].year +
        ' - ' +
        data[data.length - 1].year +
        ' | base temperature: ' +
        baseTemp +
        '\xB0C'
    )
    .attr('x', paddingLeft + area)
    .attr('y', paddingTop / 2 + 25)
    .attr('text-anchor', 'end')

  // create scales for x data (years) and  y data (months)
  var xScale = d3
    .scaleLinear()
    .domain([data[0].year, data[data.length - 1].year])
    .rangeRound([paddingLeft, w - paddingRight])

  var yScale = d3
    .scaleBand()
    .domain(months) // the string array containing all month names
    .range([paddingTop, h - paddingBottom])

  // add representation for data points
  svg
    .selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('x', function(d) {
      return xScale(d.year)
    })
    .attr('y', function(d) {
      return yScale(d.monthName)
    })
    .attr('width', (w - (paddingLeft + paddingRight)) / (data.length / 12))
    .attr('height', (h - (paddingTop + paddingBottom)) / 12)
    .attr('data-year', function(d) {
      return d.year
    })
    .attr('data-month', function(d) {
      return d.month
    })
    .attr('data-temp', function(d) {
      return d.variance + baseTemp
    })
    .style('fill', function(d) {
      return d.color
    })
    // add event listeners
    .on('mouseover', function(d) {
      tooltip.style('opacity', 0.75).attr('data-year', d.year)
      var posX = d3.event.pageX;
      var screenWidth = window.innerWidth;
        return posX < screenWidth - 220 ? posX + 25 + "px" : posX - 190 + "px"
      }
      tooltip
        .html(formatDataHTML(d))
        .style('top', d3.event.pageY - 70 + 'px')
        .style('left', getTooltipLeftValue())
        .style('border', '4px solid ' + d.color)
    })
    .on('mouseout', function(d) {
      tooltip.style('opacity', 0)
    })

  // create HTML for the tooltip
  function formatDataHTML(d) {
    var fTemp = d3.format('.2f')
    var fVar = d3.format('+.2f')
    return (
      '<table class="tooltip-table">\n              <tr><td>' +
      d.monthName +
      ' ' +
      d.year +
      '</td><th>\xB0C</th></tr>\n              <tr><th>temperature:</th><td>' +
      fTemp(d.variance + baseTemp) +
      '</td></tr>\n              <tr><th>deviation:</th><td style="color:' +
      getColor(d.variance) +
      '">' +
      fVar(d.variance) +
      '</td></tr>\n            </table>'
    )

    function getColor(val) {
      var v = Number(val)
      return v > 0 ? 'orange' : v < 0 ? '#3399FE' : 'black'
    }
  }

  // create x and y axes
  var xAxis = d3
    .axisBottom(xScale)
    .ticks(20)
    .tickFormat(d3.format('d'))
    .tickPadding(6)

  var yAxis = d3.axisLeft(yScale).tickPadding(8)

  svg
    .append('g')
    .attr('transform', 'translate(0, ' + (h - paddingBottom) + ')')
    .attr('id', 'x-axis')
    .call(xAxis)

  svg
    .append('g')
    .attr('transform', 'translate(' + paddingLeft + ', 0)')
    .attr('id', 'y-axis')
    .call(yAxis)

  // legend setup
  var limits = color.clusters()
  var colors = color.range()
  var legendX = paddingLeft
  var legendY = 30
  var legendWidth = 480
  var legendHeight = 55
  var colorWidth = legendWidth / colors.length
  var stripeHeight = 12
  var fLimit = d3.format('.2f')

  // create svg element to contain legend elements
  var legend = svg
    .append('svg')
    .attr('id', 'legend')
    .attr('x', legendX)
    .attr('y', legendY)
    .attr('w', legendWidth)
    .attr('h', legendHeight)

  // create color stripe, marks and legend info
  for (var i = 0; i < numColors; i++) {
    legend
      .append('rect')
      .attr('x', colorWidth * i)
      .attr('y', 30)
      .attr('width', colorWidth)
      .attr('height', stripeHeight)
      .style('fill', d3.color(colors[i]))
      .style('stroke', 'black')
    /* `limits` holds one less item than `numColors`
    which is okay since the last color of the strip 
    doesn't need an upper boundary */
    if (i < limits.length) {
      legend
        .append('text')
        .attr('class', 'legend-marks')
        .attr('x', colorWidth * i + colorWidth)
        .attr('y', legendHeight)
        .attr('text-anchor', 'middle')
        .text(fLimit(limits[i]))
    }
  }
  legend
    .append('text')
    .attr('class', 'legend-info')
    .attr('x', legendWidth / 2)
    .attr('y', 16)
    .attr('text-anchor', 'middle')
    .html('deviation from base temperature (' + baseTemp + '\xB0C)')
}
