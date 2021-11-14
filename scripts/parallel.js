let pDivRect;
let pMargin;
let pWidth;
let pHeight;
let pXHeight;
let pTitleHeight;
let brushHeight;

function initParallelCoordinates() {
    pDivRect = d3
        .select("#parallel_container")
        .select(".idiom_background")
        .node()
        .getBoundingClientRect();

    pMargin = {
        top: 50,
        right: 30,
        bottom: 10,
        left: 65
    };

    pWidth = pDivRect.width - 2 - pMargin.left - pMargin.right; // 2 == padding
    pXHeight = 35;
    pTitleHeight = 30;
    pHeight = 410 - pMargin.top - pXHeight - pTitleHeight - pMargin.bottom;
    brushHeight = 50;
}

function createParallelCoordinates(playerCounts, update) {

    // Create new array with all necessary parallel information
    const data = g_parallelInfo.map(function(row){
        let game = playerCounts[+row["id"]];
        if(game != null){
            let newRow = Object.assign({}, row);
            newRow["num"] = game["num"];
            newRow["peak"] = game["peak"];
            return newRow;
        }
    });
    console.log(g_parallelInfo)
    console.log(playerCounts)

    // Create parallel coordinates chart
    var dragging = {};

    var line = d3.line(),
        axis = d3.axisLeft().tickFormat(d => d < 1000 ? d : (d / 1000) + "K"),
        background,
        foreground;

    if(!update){
        d3
            .select("div#parallel_title")
            .append("svg")
            .attr("width", pWidth + pMargin.left + pMargin.right)
            .attr("height", pTitleHeight)
            .append("text")
            .text("Random Title")
            .attr("transform", "translate(" + (pWidth + pMargin.left + pMargin.right) / 2 + "," + 25 + ")")
            .attr("text-anchor", "middle")
            .attr("text-decoration", "underline")
            .attr("font-size", "25")
            .attr("font-family", "Arial")
            .attr("font-weight", "bolder");
        
        d3
            .select("div#parallel")
            .append("svg")
            .attr("class", "plot")
            .append("g");
    }

    dimensions = Object.keys(data[0]).filter(function(d) { return d != "name" && d != "id" && d != "%_positive_reviews" })

    x = d3.scalePoint()
        .range([0, pWidth-pMargin.right])
        .padding(-.1)
        .domain(dimensions);

    var y = {}
    for (i in dimensions) {
        let label = dimensions[i]
        y[label] = d3.scaleLinear()
        .domain([
            d3.min(d3.map(data, p => +p[label])), 
            d3.max(d3.map(data, p => +p[label]))
        ])
        .range([pHeight, 0])
    }

    const svg = d3
        .select("div#parallel")
        .select("svg.plot")
        .attr("width", pWidth + pMargin.left + pMargin.right)
        .attr("height", pHeight + pMargin.top + pMargin.bottom)
        .select("g")
        .attr("transform", "translate(" + pMargin.left + "," + pMargin.top + ")");

    // Add grey background lines for context.
    background = svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("d", path);


    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        .call(d3.drag()
            .subject(function(d) { return {x: x(d)}; })
            .on("start", function(d, i) {
                dragging[i] = x(i);
                background.attr("visibility", "hidden");
            })
            .on("drag", function(d,i) {
                dragging[i] = Math.min(pWidth, Math.max(0, d.x));
                foreground.attr("d", path);
                dimensions.sort(function(a, b) { return position(a) - position(b); });
                x.domain(dimensions);
                g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
            })
            .on("end", function(d, i) {
                delete dragging[i];
                transition(d3.select(this)).attr("transform", "translate(" + x(i) + ")");
                transition(foreground).attr("d", path);
                background
                    .attr("d", path)
                    .transition()
                    .delay(500)
                    .duration(0)
                    .attr("visibility", null);
            })
        );

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .append("text")
        .attr("class", "title")
        .style("text-anchor", "middle")
        .attr("font-family", "Arial")
        .attr("font-weight", "bolder")
        .attr("font-size", 13)
        .style("fill", "black")
        .attr("y", -20)
        .text(function(d) { 
            if(d == "num_languages")
                return "No.Languages";
            if(d == "num")
                return "No.Players(avg.)";
            if(d == "peak")
                return "No.Peak Players(avg.)";
            return d;
        })
        .attr("dy", 0)
        .call(wrap, 102);
    
    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }

    // Add and store a brush for each axis.
    g.append("g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(y[d].brush = d3.brushY(y[d]).extent([
        [-(brushHeight / 2), 0],
        [brushHeight / 2, pHeight]
      ]).on("start", brushstart).on("brush end", brush));
      })
    .selectAll("rect")
    .attr("x", -8)
    .attr("width", 16);

    function position(d) {
        var v = dragging[d];
        return v == null ? x(d) : v;
    }

    function transition(g) {
        return g.transition().duration(500);
    }

    // Returns the path for a given data point.
    function path(d) {
        return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
    }

    function brushstart(d) {
        console.log()
        d.sourceEvent.stopPropagation();
    }

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        const actives = [];
        // filter brushed extents
        svg.selectAll('.brush')
            .filter(function(d){
            return d3.brushSelection(this);
            })
            .each(function(d) {
                actives.push({
                    dimension: d,
                    extent: d3.brushSelection(this)
                });
            });
        // set un-brushed foreground line disappear
        foreground.style('display', function(d) {
            return actives.every(function(active) {
                const dim = active.dimension;
                return active.extent[0] <= y[dim](d[dim]) && y[dim](d[dim]) <= active.extent[1];
            }) ? null : 'none';
        });
    }
}