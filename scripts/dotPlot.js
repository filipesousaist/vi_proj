const NUM_PLAYERS_COLOR = "#00ABFF";
const PEAK_PLAYERS_COLOR = "#EE6666";

function createDotPlot(numAndPeakPlayersPerTag, update) {
    const topTagsByNumPlayers = getTopTagsByNumPlayers(numAndPeakPlayersPerTag, -1);
    
    const data = numAndPeakPlayersPerTag.filter(d => {
        for (let d_num of topTagsByNumPlayers)
            if (d["tag"] == d_num["tag"])
                return true;
        return false;
    });

    data.sort((pc1, pc2) => pc2["value"] - pc1["value"]);
    
    const margin = {
        top: 5,
        right: 20,
        bottom: 80,
        left: 40
    };
    const width = 450 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    const titleHeight = 50;

    console.log(data.length)

    const x = d3
        .scalePoint()
        .domain(data.map(d => d["tag"]))
        .range([0, 20 * (data.length)])
        .padding(1);
    
    const y = d3
        .scaleLinear()
        .domain([
            0, 
            1.1 * d3.max(d3.map(data, d => d["value"]))
        ])
        .range([height, 0]);

    const color = d3
        .scaleOrdinal(
            ["value", "peak"], 
            [NUM_PLAYERS_COLOR, PEAK_PLAYERS_COLOR]
        );

    const xAxis = d3
        .axisBottom()
        .scale(x)
        .tickSizeOuter(0);

    const yAxis = d3
        .axisLeft()
        .scale(y)
        .tickSizeOuter(0)
        .tickFormat(d => d < 1000 ? d : (d / 1000) + "K");


    if (!update) {
        d3
            .select("div#dot_plot")
            .append("svg")
            .attr("class", "y")
            .append("g");
        d3
            .select("div#dot_plot")
            .append("svg")
            .attr("class", "dots_and_x")
            .append("g");

    }




    const svg = d3
        .select("div#dot_plot")
        .attr("transform", "translate(0," + titleHeight + ")")
        .select("svg.dots_and_x")
        .attr("width", width + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .select("g")
        .attr("transform", "translate(" + 0 + "," + margin.top + ")")

    const svg2 = d3
        .select("div#dot_plot")
        .select("svg.y")
        .attr("width", margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    if (!update) {
        d3
            .select("div#dot_plot_title")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", titleHeight)
            .append("text")
            .text("Most Popular Tags")
            .attr("transform", "translate(" + (width + margin.left + margin.right) / 2 + "," + titleHeight / 2 + ")")
            .attr("text-anchor", "middle")
            .attr("text-decoration", "underline")
            .attr("font-size", "25")
            .attr("font-family", "Arial")
            .attr("font-weight", "bolder");
        
        svg
            .append("g")
            .attr("class", "xAxis");

        svg2
            .append("g")
            .attr("class", "yAxis");
        
        legend = d3.select("#dot_plot_legend")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", 30);

        legend
            .append("circle")
            .attr("r", 6)
            .attr("cx", 75)
            .attr("cy", 9)
            .attr("fill", NUM_PLAYERS_COLOR);
            
        legend
            .append("text")
            .attr("dx", 83)
            .attr("dy", 15)
            .style("font-family", "Arial")
            .style("font-weight", "bolder")
            .text(typeToText("num"));
        
        legend
            .append("circle")
            .attr("r", 6)
            .attr("cx", 245)
            .attr("cy", 9)
            .attr("fill", PEAK_PLAYERS_COLOR);
            
        legend
            .append("text")
            .attr("dx", 253)
            .attr("dy", 15)
            .style("font-family", "Arial")
            .style("font-weight", "bolder")
            .text(typeToText("peak"));
    }
    


    svg
        .select("g.xAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")  
        .style("text-anchor", "end")
        .attr("font-family", "Arial")
        .attr("font-weight", "bolder")
        .attr("fill", t => g_tagToColor[t])
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .on("click", handleClickDotPlotTags)
        .on("mouseover", handleMouseOverDotPlotTags)
        .on("mouseout", handleMouseOutDotPlotTags);

    svg2
        .select("g.yAxis")
        .call(yAxis)
        .attr("transform", "translate(-1, 0)");

    var drag = d3.drag()
        .on("drag", dragmove)
        .on("start", dragstart);

    if (!update) {
        svg
            .append("rect")
            .attr("class", "drag")
        
        svg
            .append("g")
            .attr("class", "dots")

            
        }
    
    svg
        .select(".drag")
        .attr("width", width + margin.right)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(drag)
        
    svg
        .select(".dots")
        .style("pointer-events", "all")
        .call(drag)
        .selectAll("circle")
        .data(data)
        .join(
            enter =>
                enter
                    .append("circle")
                    .attr("class", "dot")
                    .attr("r", 3.5)
                    .attr("cx", d => x(d["tag"]))
                    .attr("cy", d => y(d["value"]))
                    .style("fill", d => color(d["type"]))
                    .append("title")
                    .text(d => d["tag"] + "\n" + typeToText(d["type"]) + ": " + round(d["value"], 2)),
            update =>
                update
                    .attr("class", "dot")
                    .attr("r", 3.5)
                    .attr("cx", d => x(d["tag"]))
                    .attr("cy", d => y(d["value"]))
                    .style("fill", d => color(d["type"]))
                    .select("title")
                    .text(d => d["tag"] + "\n" + typeToText(d["type"]) + ": " + round(d["value"], 2)),
            exit =>
                exit.remove()
        );

    
 

    var moved = 0;
    var dragStartX = 0;
    var oldTranslateX = 0;

    function dragstart(event) {
        dragStartX = event.sourceEvent.clientX - width;
        oldTranslateX = moved;
    }

    function dragmove(event) {
        if (data.length > 20) {
            var x = event.x;
            var dx = x-dragStartX 
            x = dx + oldTranslateX + 286;
            if (x > 0)
                x = 0;
            
            if (x < (-20 * (data.length) + 420)) { 
                x = -20 * (data.length) + 420
            }

            console.log(data.length)

            moved = x;

            d3.select('.dots').attr("transform", "translate(" + x + "," + 0 + ")");

            d3.select('.xAxis').attr("transform", "translate("+x +" ," + height + ")")
        }   
    }
}

function typeToText(type) {
    return (type == "num") ? "No. players (avg.)" : "Peak players (avg.)"
}

function handleClickDotPlotTags(_, d) {
    if (!g_selectedTags.includes(d)){
        g_selectedTags.push(d);
        updateTagBox(d);
        updatePlots();
        removeShineFromTag();
        updateSuggestedTags(d, false, false);
    }
}

function handleMouseOverDotPlotTags(_, d) {
    addShineToTag(d);
}

function handleMouseOutDotPlotTags() {
    removeShineFromTag();
}