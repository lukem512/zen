<!-- Example based on http://bl.ocks.org/mbostock/3887118 -->
<!-- Tooltip example from http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html -->

function drawFulfilmentsUsersGraph(selector, width, height) {
  width = width || 960;
  height = height || 500;

  var margin = {top: 20, right: 40, bottom: 100, left: 40},
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
  var yValue = function(d) { return d.Duration / 1000 / 60 }, // data -> value
      yScale = d3.scale.linear().range([height, 0]), // value -> display
      yMap = function(d) { return yScale(yValue(d));}, // data -> display
      yAxis = d3.svg.axis().scale(yScale).orient("left");

  // setup fill colors
  var cValue = function(d) { return d.Username; },
      color = d3.scale.category20();

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
      d.unix = +moment(d.Timestamp).format('X'); // Format as Unix Timestamp
      d.Duration = +d.Duration; // Format as number
    });

    // don't want dots overlapping axis, so add in buffer to data domain
    xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
    yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);

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
        .text("Fulfilment Duration (minutes)");

    var SOCIAL = data.filter(function(d) {
      return d.Groups == "SOCIAL";
    });

    var CONTROL = data.filter(function(d) {
      return d.Groups == "CONTROL";
    });

    var SOCIALcolours = ["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#b30000","#7f0000"];

    var CONTROLcolours = ["#f7fcfd","#e5f5f9","#ccece6","#99d8c9","#66c2a4","#41ae76","#238b45","#006d2c","#00441b"];

    SOCIALcolours = d3.scale.ordinal()
      .domain(SOCIAL)
      .range(colorbrewer.OrRd[9]);

    CONTROLcolours = d3.scale.ordinal()
      .domain(CONTROL)
      .range(colorbrewer.BuGn[9]);

    // draw dots
    svg.selectAll(".dot")
        .data(SOCIAL)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", xMap)
        .attr("cy", yMap)
        .style("fill", function(d) { return color(cValue(d));})
        .style("opacity", 0.85)
        .on("mouseover", function(d) {
            tooltip.transition()
                 .duration(200)
                 .style("opacity", .9);
            tooltip.html(d.Username + "<br/> (" + d.Timestamp
  	        + ", " + yValue(d) + ")")
                 .style("left", (d3.event.pageX + 5) + "px")
                 .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                 .duration(500)
                 .style("opacity", 0);
        });

    svg.selectAll(".rect")
        .data(CONTROL)
      .enter().append("rect")
        .attr("class", "rect")
        .attr("x", xMap)
        .attr("y", yMap)
        .attr("width", 7)
        .attr("height", 7)
        .style("fill", function(d) { return color(cValue(d));})
        .style("opacity", 0.85)
        .on("mouseover", function(d) {
            tooltip.transition()
                 .duration(200)
                 .style("opacity", .9);
            tooltip.html(d.Username + "<br/> (" + d.Timestamp
  	        + ", " + yValue(d) + ")")
                 .style("left", (d3.event.pageX + 5) + "px")
                 .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                 .duration(500)
                 .style("opacity", 0);
        });
}
