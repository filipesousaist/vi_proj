const NUM_PLAYERS_COLOR = "#00ABFF";
const PEAK_PLAYERS_COLOR = "#EE6666";

let dpDivRect;
let dpMargin;
let dpWidth;
let dpHeight;
let dpTitleHeight;

function initDotPlot() {
    dpDivRect = d3
        .select("#dot_plot_container")
        .select(".idiom_background")
        .node()
        .getBoundingClientRect();

    dpMargin = {
        top: 5,
        right: 20,
        bottom: 20,
        left: 130
    };

    dpWidth = dpDivRect.width - 2 - dpMargin.left - dpMargin.right; // 2 == padding
    dpXHeight = 25;
    dpHeight = 410 - dpMargin.top - 50 - dpMargin.bottom;
    dpTitleHeight = 30;
}

function createDotPlot(numAndPeakPlayersPerTag, update) {
    const topTagsByNumPlayers = getTopTagsByNumPlayers(numAndPeakPlayersPerTag, -1);
    
    const data = numAndPeakPlayersPerTag.filter(d => {
        for (let d_num of topTagsByNumPlayers)
            if (d["tag"] == d_num["tag"])
                return true;
        return false;
    });

    data.sort(function(pc1, pc2) {
        if (pc1.tag == pc2.tag || pc1.type != pc2.type)
            return (pc1.type == "num") ? -1 : 1;
        return pc2["value"] - pc1["value"];
    });

    const y = d3
        .scalePoint()
        .domain(data.map(d => d["tag"]))
        .range([0, dpHeight / 20 * (Math.max(data.length, 20))])
        .padding(1);
    
    const x = d3
        .scaleLinear()
        .domain([
            0, 
            1.1 * d3.max(d3.map(data, d => d["value"]))
        ])
        .range([0, dpWidth]);

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
            .style("display", "block")
            .append("g");
        d3
            .select("div#dot_plot")
            .append("svg")
            .attr("class", "x")
            .style("display", "block")
            .append("g");
    }

    const svg = d3
        .select("div#dot_plot")
        .select("svg.dots_and_y")
        .attr("width", dpWidth + dpMargin.right + dpMargin.left)
        .attr("height", dpHeight + dpMargin.top)
        .select("g")
        .attr("transform", "translate(" + dpMargin.left + ", 0)");
 
    const svgX = d3
        .select("div#dot_plot")
        .select("svg.x")
        .attr("width", dpWidth + dpMargin.right + dpMargin.left)
        .attr("height", dpXHeight)
        .select("g")
        .attr("transform", "translate(" + dpMargin.left + ", 0.25)");

    if (!update) {
        d3
            .select("div#dot_plot_title")
            .append("svg")
            .attr("width", dpWidth + dpMargin.left + dpMargin.right)
            .attr("height", dpTitleHeight)
            .append("text")
            .text("Most Popular Tags")
            .attr("transform", "translate(" + (dpWidth + dpMargin.left + dpMargin.right) / 2 + "," + 25 + ")")
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

        d3
            .select("div#dot_plot")
            .append("svg")
            .style("position", "absolute")
            .attr("transform", "translate(515, -28.5)")
            .append("path")
            .attr("d", "M0,0 L0,9 L6,4 L0,0");

        svgX
            .append("text")
            .text("Players")
            .style("text-anchor", "middle")
            .attr("font-family", "Arial")
            .attr("font-weight", "bolder")
            .attr("font-size", 13)
            .attr("transform", "translate(420, 35)");
        
        const blueCircleX = dpMargin.left + 0.1 * dpWidth;
        const redCircleX = dpMargin.left + 0.55 * dpWidth;

        legend = d3.select("#dot_plot_legend")
            .append("svg")
            .attr("width", dpWidth + dpMargin.left + dpMargin.right)
            .attr("height", dpMargin.bottom);
        
        legend
            .append("circle")
            .attr("r", 6)
            .attr("cx", blueCircleX)
            .attr("cy", 9.5)
            .attr("fill", NUM_PLAYERS_COLOR);
            
        legend
            .append("text")
            .attr("dx", blueCircleX + 10)
            .attr("dy", 15)
            .style("font-family", "Arial")
            .style("font-weight", "bolder")
            .style("font-size", 14)
            .text(typeToText("num"));
        
        legend
            .append("circle")
            .attr("r", 6)
            .attr("cx", redCircleX)
            .attr("cy", 9.5)
            .attr("fill", PEAK_PLAYERS_COLOR);
            
        legend
            .append("text")
            .attr("dx", redCircleX + 10)
            .attr("dy", 15)
            .style("font-family", "Arial")
            .style("font-weight", "bolder")
            .style("font-size", 14)
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
        .on("click", handleClickDotPlotTags)
        .on("mouseover", handleMouseOverDotPlotTags)
        .on("mouseout", handleMouseOutDotPlotTags)
        .each(wrap)
        .append("title")
        .text(d => d);

    svgX
        .select("g.xAxis")
        .call(xAxis)
        .attr("font-family", "Arial")
        .attr("font-weight", "bolder")
        .attr("font-size", 12);

    const drag = d3.drag()
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
        .attr("width", dpWidth + dpMargin.right)
        .attr("height", dpHeight)
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

        resetDrag();
        
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
            
            if (y < (-dpHeight / 20 * data.length + dpHeight)) 
                y = -dpHeight / 20 * data.length + dpHeight;
                
            moved = y;

            d3.select('.dots').attr("transform", "translate(0, " + y + ")");

            d3.select('.yAxis').attr("transform", "translate(0, " + y + ")")
        }   
    }

    function resetDrag() {
        d3.select('.dots').attr("transform", "translate(0, " + moved + ")");
        svg.select('.yAxis').attr("transform", "translate(0, " + moved + ")")
    }
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