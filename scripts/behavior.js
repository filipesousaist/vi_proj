var width = 1920,
    height = 1080;

function init(){
    d3
        .csv("data/h_data.csv")
        .then((data) => {
            createTreeMap(data);
        })
        .catch((error) => {
            console.log(error);
        });
}

function createTreeMap(data) {
    var format = d3.format(",d");

    var color = d3.scaleOrdinal()
        .range(d3.schemeCategory10
            .map(function(c) { c = d3.rgb(c); c.opacity = 0.6; return c; }));

    var stratify = d3.stratify()
        .id(d => d.child)
        .parentId(function(d) { return d.parent });

    var treemap = d3.treemap()
        .size([width, height])
        .padding(1)
        .round(true);


  var root = stratify(data)
        .sum(function(d) { return d.danceability; })
        .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

  treemap(root)

  d3
    .select("div")
    .selectAll(".node")
    .data(root.leaves())
    .enter().append("div")
    .attr("class", "node")
    .attr("title", function(d) { return d.id + "\n" + format(d.value); })
    .style("left", function(d) { return d.x0 + "px"; })
    .style("top", function(d) { return d.y0 + "px"; })
    .style("width", function(d) { return d.x1 - d.x0 + "px"; })
    .style("height", function(d) { return d.y1 - d.y0 + "px"; })
    .style("background", function(d) { while (d.depth > 1) d = d.parent; return color(d.id); })
    .append("div")
    .attr("class", "node-label")
    .text(function(d) { return d.id.split(/(?=[A-Z][^A-Z])/g).join("\n"); })
    .append("div")
    .attr("class", "node-value")
    .text(function(d) { return d.value; });

}