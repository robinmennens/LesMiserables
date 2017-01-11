//Define the species and the traits
var species = ["White", "Red"],
    traits = ["fixed acidity","volatile acidity","citric acid","residual sugar","chlorides","free sulfur dioxide","total sulfur dioxide","density","pH","sulphates","alcohol","quality"
];

//get width of container
var container = d3.select(".panel-body");
var container_width = container.style("width").replace("px", "");

//margins: top, left, bottom, right
var m = [30, 75, 10, 50],
    w = container_width - m[1] - m[3],
    h = 650 - m[0] - m[2];

//define the x scale, domain are the traits and we map those to the width of the container
//the y scale is empty, we will fill it later (based on each trait)
var x = d3.scale.ordinal().domain(traits).rangePoints([0, w]),
    y = {};

//set up svg line element, axis element and the foreground
var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    foreground;

//add an svg to the container, set its width and height based on margins
//add a group element to the svg and translate it
var svg = d3.select(".panel-body").append("svg:svg")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
  .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

//now go through the dataset
d3.csv("wine/wine_red+white.csv", function(wine) {

  // Create a scale and brush for each trait.
  traits.forEach(function(d) {
    // Coerce values to numbers.
    wine.forEach(function(p) { p[d] = +p[d]; });

    //for the current trait, create a scale where the domain goes from the minimum value of this
    //trait until the maximum value of this trait. The range uses the heigh of the container
    y[d] = d3.scale.linear()
        .domain(d3.extent(wine, function(p) { return p[d]; }))
        .range([h, 0]);

    //add a brush to this "function" (i.e. trait scale)
    y[d].brush = d3.svg.brush()
        .y(y[d])
        .on("brush", brush);  //adds a listener for when the brush is moved
 });

  // Add a legend.
  var legend = svg.selectAll("g.legend")  //nothing found yet but this is required
      .data(species)                      //legend is based on the species
    .enter().append("svg:g")              //create a placeholder group
      .attr("class", "legend")            //set the class of the group to legend
      .attr("transform", function(d, i) { return "translate(0," + (i * 20 + 584) + ")"; });   //translate the legend

  //add a line to the legend
  legend.append("svg:line")
      .attr("class", String)
      .attr("x2", 8);

  //add text to the legend
  legend.append("svg:text")
      .attr("x", 12)
      .attr("dy", ".31em")
      .text(function(d) { return d + " Wine"; });

  // Add foreground lines.
  foreground = svg.append("svg:g")
      .attr("class", "foreground")
    .selectAll("path")
      .data(wine)
    .enter().append("svg:path")
      .attr("d", path)
      .attr("class", function(d) { return d.species; });

  // Add a group element for each trait.
  var g = svg.selectAll(".trait")
      .data(traits)
    .enter().append("svg:g")
      .attr("class", "trait")
      .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
      .call(d3.behavior.drag()
      .origin(function(d) { return {x: x(d)}; })
      .on("dragstart", dragstart)
      .on("drag", drag)
      .on("dragend", dragend));

  // Add an axis and title.
  g.append("svg:g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    .append("svg:text")
      .attr("text-anchor", "middle")
      .attr("y", -9)
      .text(String);

  // Add a brush for each axis.
  g.append("svg:g")
      .attr("class", "brush")
      .each(function(d) { d3.select(this).call(y[d].brush); })
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);

  function dragstart(d) {
    i = traits.indexOf(d);
  }

  function drag(d) {
    x.range()[i] = d3.event.x;
    traits.sort(function(a, b) { return x(a) - x(b); });
    g.attr("transform", function(d) { return "translate(" + x(d) + ")"; });
    foreground.attr("d", path);
  }

  function dragend(d) {
    x.domain(traits).rangePoints([0, w]);
    var t = d3.transition().duration(500);
    t.selectAll(".trait").attr("transform", function(d) { return "translate(" + x(d) + ")"; });
    t.selectAll(".foreground path").attr("d", path);
  }
});

// Returns the path for a given data point.
function path(d) {
  return line(traits.map(function(p) { return [x(p), y[p](d[p])]; }));
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = traits.filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  foreground.classed("fade", function(d) {
    return !actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    });
  });
}