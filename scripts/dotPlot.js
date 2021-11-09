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


    data.sort(function(pc1, pc2) {
        if(pc1.tag == pc2.tag || pc1.type != pc2.type){
            if(pc1.type == "num"){
                return -1;
            }
            else{
                return 1;
            }
        }
        return pc2["value"] - pc1["value"];
    });

    console.log(data)
    
    const margin = {
        top: 5,
        right: 20,
        bottom: 80,
        left: 150
    };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    const titleHeight = 50;

    console.log(data.length)

    const y = d3
        .scalePoint()
        .domain(data.map(d => d["tag"]))
        .range([0, height / 20 * (Math.max(data.length, 20))])
        .padding(1);
    
    const x = d3
        .scaleLinear()
        .domain([
            0, 
            1.1 * d3.max(d3.map(data, d => d["value"]))
        ])
        .range([0, width]);

    const color = d3
        .scaleOrdinal(
            ["value", "peak"], 
            [NUM_PLAYERS_COLOR, PEAK_PLAYERS_COLOR]
        );

    const xAxis = d3
        .axisBottom()
        .scale(x)
        .tickSizeOuter(0)
        .tickFormat(d => d < 1000 ? d : (d / 1000) + "K");;

    const yAxis = d3
        .axisLeft()
        .scale(y)
        .tickSizeOuter(0)
        

    if (!update) {
        d3
            .select("div#dot_plot")
            .append("svg")
            .attr("class", "dots_and_y")
            .append("g");
        d3
            .select("div#dot_plot")
            .append("svg")
            .attr("class", "x")
            .append("g");
    }

    const svg = d3
        .select("div#dot_plot")
        .select("svg.dots_and_y")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top)
        .select("g")
        .attr("transform", "translate(" + margin.left + ", 0)")
 
    const svgX = d3
        .select("div#dot_plot")
        .select("svg.x")
        .attr("width", width + margin.right + margin.left)
        .attr("height", margin.bottom)
        .select("g")
        .attr("transform", "translate(" + margin.left + "," + (margin.top) + ")")

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
            .attr("class", "yAxis");

        svgX
            .append("g")
            .attr("class", "xAxis");
        
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
    
    function wrap() {
        const self = d3.select(this);
        let textLength = self.node().getComputedTextLength();
        let text = self.text();
        while (textLength > 90 && text.length > 0) {
            text = text.slice(0, -1);
            self.text(text + '...');
            textLength = self.node().getComputedTextLength();
        }
    }

    svg
        .select("g.yAxis")
        .call(yAxis)
        .selectAll("text")  
        .style("text-anchor", "end")
        .attr("font-family", "Arial")
        .attr("font-weight", "bolder")
        .attr("font-size", 12)
        .attr("fill", t => g_tagToColor[t])
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        //.attr("transform", "rotate(-45)")
        .on("click", handleClickDotPlotTags)
        .on("mouseover", handleMouseOverDotPlotTags)
        .on("mouseout", handleMouseOutDotPlotTags)
        .each(wrap);
        


    svgX
        .select("g.xAxis")
        .call(xAxis)
        .attr("font-family", "Arial")
        .attr("font-weight", "bolder")
        .attr("font-size", 12);

    var drag = d3.drag()
        .on("drag", dragmove)
        .on("start", dragstart);

    if (!update) {
        svg
            .append("rect")
            .attr("class", "drag");
        svg
            .append("g")
            .attr("class", "dots");
    }
    
    svg
        .select(".drag")
        .attr("width", width + margin.right)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(drag);
        
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
                    .attr("cx", d => x(d["value"]))
                    .attr("cy", d => y(d["tag"]))
                    .style("fill", d => color(d["type"]))
                    .append("title")
                    .text(d => d["tag"] + "\n" + typeToText(d["type"]) + ": " + round(d["value"], 2)),
            update =>
                update
                    .attr("class", "dot")
                    .attr("r", 3.5)
                    .attr("cx", d => x(d["value"]))
                    .attr("cy", d => y(d["tag"]))
                    .style("fill", d => color(d["type"]))
                    .select("title")
                    .text(d => d["tag"] + "\n" + typeToText(d["type"]) + ": " + round(d["value"], 2)),
            exit =>
                exit.remove()
        );

        
        let moved = 0;
        let dragStartY = 0;
        let oldTranslateY = 0;
        resetDrag()
        
    function dragstart(event) {
        dragStartY = event.y;
        oldTranslateY = moved;
    }

    function dragmove(event) {
        if (data.length > 20) {   
            const dy = event.y - dragStartY;
            let y = dy + oldTranslateY;

            if (y > 0)
                y = 0;
            
            if (y < (-height / 20 * data.length + height)) 
                y = -height / 20 * data.length + height;
                
            moved = y;

            d3.select('.dots').attr("transform", "translate(" + 0 + "," + y + ")");

            d3.select('.yAxis').attr("transform", "translate(" + 0 +" ," + y + ")")
        }   
    }

    function resetDrag() {
        d3.select('.dots').attr("transform", "translate(" + 0 + "," + moved + ")");
        svg.select('.yAxis').attr("transform", "translate("+ 0 +" ," + moved + ")")
    }
}

function typeToText(type) {
    return (type == "num") ? "No. players (avg.)" : "Peak players (avg.)";
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