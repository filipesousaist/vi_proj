let pDivRect;
let pMargin;
let pWidth;
let pHeight;
let pXHeight;
let pTitleHeight;
let brushWidth;

function initParallelCoordinates() {
    pDivRect = d3
        .select("#parallel_container")
        .select(".idiom_background")
        .node()
        .getBoundingClientRect();

    pMargin = {
        top: 50,
        right: 20,
        bottom: 10,
        left: 40
    };

    pWidth = pDivRect.width - 2 - pMargin.left - pMargin.right; // 2 == padding
    pXHeight = 35;
    pTitleHeight = 30;
    pHeight = 410 - pMargin.top - pXHeight - pTitleHeight - pMargin.bottom;
    brushWidth = 20;
}

function createParallelCoordinates(playerCounts, update) {
    const data = [];
    
    d3.selectAll("div#parallel").selectAll("svg").remove();
    
    // Create new array with all necessary parallel information
    for(row in g_parallelInfo){
        let game = playerCounts[+g_parallelInfo[row]["id"]];
        if(game != null && !(game === undefined)){
            data.push({"id": g_parallelInfo[row]["id"], "name":  g_parallelInfo[row]["name"], "num_languages": g_parallelInfo[row]["num_languages"], "RPR": g_parallelInfo[row]["RPR"], "num": game["num"], "peak": game["peak"]});
        } 
    }

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
        
    }

    update = false;

    d3
        .select("div#parallel")
        .append("svg")
        .attr("class", "plot")
        .append("g");
        
    dimensions = Object.keys(data[0]).filter(function(d) { return d != "name" && d != "id" && d != "%_positive_reviews" })

    x = d3.scalePoint()
        .range([0, pWidth-pMargin.right])
        .padding(.1)
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


    if(!update){
        svg.append("g")
            .attr("class", "background")
        
        svg.append("g")
            .attr("class", "foreground")
    }
    // Add grey background lines for context.
    background = svg.select("g.background")
        .selectAll("path")
        .data(data)
        .join(
            enter =>
                enter
                .append("path")
                .attr("d", path),
            update =>
                update
                .select("path")
                .attr("d", path),
            exit =>
                exit.remove(),
        );

    // Add blue foreground lines for focus.
    foreground = svg.select("g.foreground")
        .selectAll("path")
        .data(data)
        .join(
            enter =>
                enter
                .append("path")
                .attr("d", path)
                .on("mouseover", handleMouseOverLine)
                .on("mouseout", handleMouseOutLine)
                .text(d => d["name"]),
            update =>
                update
                .select("path")
                .attr("d", path)
                .on("mouseover", handleMouseOverLine)
                .on("mouseout", handleMouseOutLine)
                .text(d => d["name"]),
            exit =>
                exit.remove(),
        );


    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
        .join(
            enter => enter
                .append("g")
                .attr("class", "dimension")
                .attr("transform", function(d) { console.log(x(d)) ;return "translate(" + x(d) + ")"; })
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
                            .attr("visibility", null)}
                    )
                ),
            update => update
                .select("g.dimension")
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
                            .attr("visibility", null)}
                    )
                ),
            exit => exit.remove()

        );

    if(!update){
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
    }
    else{
        g.select("g.axis")
            .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    }

    // Add an axis and title.
    /*g.select("g.axis")
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
        .call(wrap, 102);*/
    
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
        [-(brushWidth / 2), 0],
        [brushWidth / 2, pHeight]
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

    let selected = [];

    // Handles a brush event, toggling the display of foreground lines.
    function brush(i) {
        selected = [];
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
                if(active.extent[0] <= y[dim](d[dim]) && y[dim](d[dim]) <= active.extent[1]){
                    selected.push(d)
                    return true;
                }
                return false;
            }) ? null : 'none';
        });
        if(i.type === "end"){
            console.log(selected);
        }
    }
    
    function handleMouseOverLine(_, d){
        d3
            .select("div#parallel")
            .select("svg.plot")
            .select("g.foreground").selectAll("path").filter(function(i) {
                if(i["name"] == d["name"])
                    return i;
            })
            .style("stroke-width", 3)
            .style("stroke", "yellow");

        d3
            .select("div#barcharts")
            .selectAll(".yAxis")
            .selectAll("text")
            .filter(function(i){
                if(i == d["name"])
                    return i;
            })
            .classed("word-shine", true);

        d3.
            select("div#diverging_plot")
            .selectAll(".yAxis")
            .selectAll("text")
            .filter(function(i){
                console.log(i)
                if(i["name"] == d["name"])
                    return i;
            })
            .classed("word-shine", true);
    }

    function handleMouseOutLine(_, d){
        d3
            .select("div#parallel")
            .select("svg.plot")
            .select("g.foreground").selectAll("path").filter(function(i) {
                if(i["name"] == d["name"])
                    return i;
            })
            .style("stroke-width", 1)
            .style("stroke", "steelblue");

        d3
            .select("div#barcharts")
            .selectAll(".yAxis")
            .selectAll("text")
            .filter(function(i){
                if(i == d["name"])
                    return i;
            })
            .classed("word-shine", false);

        d3.
            select("div#diverging_plot")
            .selectAll(".yAxis")
            .selectAll("text")
            .filter(function(i){
                if(i["name"] == d["name"])
                    return i;
            })
            .classed("word-shine", false);
    }

}