<!-- Example based on http://bl.ocks.org/mbostock/3887118 -->
<!-- Tooltip example from http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html -->

function drawRegularityGraph (selector, sort, trim, width, height) {
  width = width || 960;
  height = height || 500;

  var margin = {top: 20, right: 40, bottom: 100, left: 80},
      width = width - margin.left - margin.right,
      height = height - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")

  var cValue = function(d) { return d.Groups; },
      color = d3.scale.category10();

  var yValue = function(d) { return d.Variance; };

  var svg = d3.select(selector).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var tooltip = d3.select(selector).append("div")
      .attr("class", "tooltip")
      .attr("id", "ttcounts")
      .style("opacity", 0);

  d3.csv("/admin/analysis/data/regularity", function(error, data) {
    if (error) throw error;

    data.forEach(function(d) {
      d.Variance = +d.Variance; // Format as number
    });

    // Trim users without any fulfilments
    if (trim) {
      data = data.filter(function(a, b){
          return a.Variance > 0;
      });
    }

    // Sort by count
    if (sort) {
      data = data.sort(function(a, b){
          if (a.Variance > b.Variance) return -1;
          if (a.Variance < b.Variance) return 1;
          return 0;
      });
    }

    // data.splice(0, 4 )

    x.domain(data.map(function(d) { return d.Username; }));
    y.domain([0, d3.max(data, yValue)+1]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)" );

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Regularity Metric");

    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .style("fill", function(d) { return color(cValue(d));})
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.Username); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.Variance); })
        .attr("height", function(d) { return height - y(d.Variance); })
        .on("mouseover", function(d) {
            tooltip.transition()
                 .duration(200)
                 .style("opacity", .9);
            tooltip.html(d.Username + "<br/> (" + yValue(d) + ")")
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
