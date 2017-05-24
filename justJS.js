var zoom = d3.zoom()
    .scaleExtent([1, 40])
    .translateExtent([[-100, -100], [width + 90, height + 100]])
    .on("zoom", zoomed);

function zoomed() {
  svg.attr("transform", d3.event.transform);
  gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
  gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
}

var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var divTwo = d3.select("body").append("div")
    .attr("class", "tooltipTwo")
    .style("opacity", 0);

var color = d3.scaleOrdinal(d3.schemeCategory20);
// var colorGoodBad
var width = 1200;
var height = 800;
var x = d3.scaleLinear()
    .domain([0, 5])
    .range([0, 5])
    .clamp(true);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.selectAll("#slideNum")
  .call(function(evt, value) {
    d3.select("#nRatings-value").text(value); })
  .on("change",draw);

var drawn = false;
draw();

function draw() {

  var slideVal = d3.select("#slideNum").property("value");
  d3.select("#nRatings-value").text(slideVal);

  if (drawn) {
    svg.remove();
  };
  svg = d3.selectAll("body")
      .append("svg")
      .attr("width", width)
      .attr("height", height);
  svg = d3.select("svg");

  d3.json("coratings.json", function(error, graph) {
    if (error) throw error;

    var linkData = graph.links
      .filter(function(d) {
        return d.numCrossReviews >= slideVal;
      });

    var graphData = graph.nodes
      .filter(function(d) {
        return d.maxCoratings >= slideVal;
      });

    var link = svg.append("g")
        .attr("class", "links")
      .selectAll("line")
      .data(linkData)
      .enter().append("line")
        // .attr("stroke", function(d) { return color(d.numCrossReviews); })
        .attr("stroke-width", function(d) { return Math.pow(d.numCrossReviews/30, 0.9); })
        .attr("stroke-opacity", function(d) { return 1 - 1/(1 + 50*Math.exp(-5*d.avgDiff)) })
      .on("mouseover", function(d) {
           divTwo.transition()
             .duration(200)
             .style("opacity", .9);
           divTwo.html("Num.<br>Co-Ratings: " + d.numCrossReviews +
                    "<br><br>Avg. Difference in Rating: " + d.avgDiff.toFixed(2))
             .style("left", (d3.event.pageX+10) + "px")
             .style("top", (d3.event.pageY - 28) + "px");
           })
         .on("mouseout", function(d) {
           divTwo.transition()
             .duration(500)
             .style("opacity", 0);
           });;

    var node = svg.append("g")
        .attr("class", "nodes")
      .selectAll("circle")
      .data(graphData)
      .enter().append("circle")
        .attr("fill", function(d) { return color(d.stars); })
        .attr("r", function(d) { return Math.sqrt(d.maxCoratings/3); })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("mouseover", function(d) {
           div.transition()
             .duration(200)
             .style("opacity", .9);
           div.html(d.name + "<br><br>Price Range: " +
                    d.priceRange + "<br>Avg. Rating: " + d.stars)
             .style("left", (d3.event.pageX+10) + "px")
             .style("top", (d3.event.pageY - 28) + "px");
           })
         .on("mouseout", function(d) {
           div.transition()
             .duration(500)
             .style("opacity", 0);
           });

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    simulation.alpha(1.8).restart();

    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });

    drawn = true;

    function ticked() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }
  });
}



function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}