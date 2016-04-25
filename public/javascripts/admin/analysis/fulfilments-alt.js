<!-- Example based on http://bl.ocks.org/mbostock/3887118 -->
<!-- Tooltip example from http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html -->

function drawFulfilmentsAltGraph(selector, width, height) {
  width = width || 960;
  height = height || 500;

  var margin = {top: 20, right: 40, bottom: 100, left: 80},
      width = width - margin.left - margin.right,
      height = height - margin.top - margin.bottom;

  /*
   * value accessor - returns the value to encode for a given data object.
   * scale - maps value to a visual display encoding, such as a pixel position.
   * map function - maps from data value to display value
   * axis - sets up axis
   */

   // Human-readable time
   var timeFormat = function(d) {
     var date = new Date(d);
     return d3.time.format('%x')(date);
   };

  // setup x
  var xValue = function(d) { return d.unix; }, // data -> value
      xScale = d3.scale.linear().range([0, width]), // value -> display
      xMap = function(d) { return xScale(xValue(d));}, // data -> display
      xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(timeFormat).ticks(34);

  // setup y
  var yValue = function(d) { return d.Username; }, // data -> value
      yScale = d3.scale.ordinal().rangeRoundBands([0, height], .1), // value -> display
      yMap = function(d) { return yScale(yValue(d));}, // data -> display
      yAxis = d3.svg.axis().scale(yScale).orient("left");

  // dot sizes
  var dotValue = function(d) { return d.Duration }, // data -> value
      dotScale = d3.scale.linear().range([3, 10]), // value -> display
      dotMap = function(d) { return dotScale(dotValue(d)); }; // data -> display

  // setup fill colors
  var cValue = function(d) { return d.Groups; },
      color = d3.scale.category10();

  // add the graph canvas to the body of the webpage
  var svg = d3.select(selector).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // add the tooltip area to the webpage
  var tooltip = d3.select(selector).append("div")
      .attr("id", "ttfulfilments")
      .attr("class", "tooltip")
      .style("opacity", 0);

  // load data
  d3.csv("/admin/analysis/data/fulfilments", function(error, data) {

    // change string (from CSV) into correct format
    data.forEach(function(d) {
      d.Duration = +d.Duration; // Format as number
      d.unix = +moment(d.Timestamp).format('X'); // Format as Unix Timestamp
    });

    var sort = true;
    if (sort) {
      data = data.sort(function(a, b){
          if (a.Groups > b.Groups) return -1;
          if (a.Groups < b.Groups) return 1;
          return 0;
      });
    }

    // don't want dots overlapping axis, so add in buffer to data domain
    xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
    yScale.domain(data.map(function(d) { return d.Username; }));
    dotScale.domain([d3.min(data, dotValue), d3.max(data, dotValue)]);

    // x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)" )
      .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Fulfilment Start Time (Unix Timestamp)");

    // y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Participant Username")
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)" );

    // draw dots
    svg.selectAll(".dot")
        .data(data)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", dotMap)
        .attr("cx", xMap)
        .attr("cy", yMap)
        .style("fill", function(d) { return color(cValue(d));})
        .style("opacity", 0.85)
        .on("mouseover", function(d) {
            tooltip.transition()
                 .duration(200)
                 .style("opacity", .9);
            tooltip.html(d.Username + " logged a fulfilment of " + (d.Duration / 1000 / 60) + " minutes<br/> (" + d.Timestamp
  	        + ", " + yValue(d) + ")")
                 .style("left", (d3.event.pageX + 5) + "px")
                 .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                 .duration(500)
                 .style("opacity", 0);
        });

    // draw legend
    var legend = svg.selectAll(".legend")
        .data(color.domain())
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    // draw legend colored rectangles
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    // draw legend text
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d;})
  });
}
