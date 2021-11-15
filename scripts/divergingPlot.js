let dDivRect;
let dMargin;
let dWidth;
let dHeight;
let dXHeight;
let dTitleHeight;

function initDivergingPlot() {
    dDivRect = d3
        .select("#diverging_plot_container")
        .select(".idiom_background")
        .node()
        .getBoundingClientRect();

    dMargin = {
        top: 5,
        right: 20,
        bottom: 20,
        left: 130
    };

    dWidth = dDivRect.width - 2 - dMargin.left - dMargin.right; // 2 == padding
    dXHeight = 35;
    dTitleHeight = 30;
    dHeight = 410 - dMargin.top - dXHeight - dTitleHeight - dMargin.bottom;
}

function createDivergingPlot(update) {
    const pgdrGames = g_pgdr.slice();
    for (let selectedTag of g_selectedTags)
        for (let i = 0; i < pgdrGames.length; i++)
            if (!g_hasTag[pgdrGames[i]["appid"]][selectedTag]) {
                pgdrGames.splice(i, 1);
                continue;
            }

    pgdrGames.sort((pc1, pc2) => pc2["PGDR"] - pc1["PGDR"]);
    for (let row of pgdrGames){
        row["name"] = g_idToName[row["appid"]];
        //delete row["appid"];
    }


    const data = pgdrGames.slice()

    //console.log(data)

    const y = d3.scaleBand()
        .domain(data.map(d => d["name"]))
        .range([0,  dHeight / 10 * (Math.max(data.length, 10))])
        .paddingInner(0.5)
        .paddingOuter(0.25);
    
    const x = d3
        .scaleLinear()
        .domain([
            Math.min(...(d3.map(data, d => d["PGDR"]))), 
            Math.max(...(d3.map(data, d => d["PGDR"])))
        ])
        .range([0, dWidth]);

    const xAxis = d3
        .axisBottom()
        .scale(x)
        .tickSizeOuter(0)
        .tickFormat(d => d < 1000 ? d : (d / 1000) + "K");

    const yAxis = d3
        .axisLeft()
        .scale(y)
        .tickSizeOuter(0);

    if (!update) {
        d3
            .select("div#diverging_plot")
            .append("svg")
            .attr("class", "bars_and_y")
            .style("display", "block")
            .append("g");
        d3
            .select("div#diverging_plot")
            .append("svg")
            .attr("class", "x")
            .style("display", "block")
            .append("g");
    }

    const svg = d3
        .select("div#diverging_plot")
        .select("svg.bars_and_y")
        .attr("width", dWidth + dMargin.right + dMargin.left)
        .attr("height", dHeight + dMargin.top)
        .select("g")
        .attr("transform", "translate(" + dMargin.left + ", 0)");

    const svgX = d3
        .select("div#diverging_plot")
        .select("svg.x")
        .attr("width", dWidth + dMargin.right + dMargin.left)
        .attr("height", dXHeight)
        .select("g")
        .attr("transform", "translate(" + dMargin.left + ", 0.25)");
    
    if (!update)
    {
        d3
            .select("div#diverging_plot_title")
            .append("svg")
            .attr("width", dWidth + dMargin.left + dMargin.right)
            .attr("height", dTitleHeight)
            .append("text")
            .text("PGDR")
            .attr("transform", "translate(" + (dWidth + dMargin.left + dMargin.right) / 2 + "," + 25 + ")")
            .attr("text-anchor", "middle")
            .attr("text-decoration", "underline")
            .attr("font-size", "25")
            .attr("font-family", "Arial")
            .attr("font-weight", "bolder");
        
        svg
            .append("g")
            .attr("class", "yAxis")
            .attr("transform", "translate(" + x(0) + ",0)");  
        
        svg
            .append("rect")
            .attr("class", "drag_diverging");

        svgX
            .append("g")
            .attr("class", "xAxis");

        svg
            .append("g")
            .attr("class", "bars");    
        
    }

    const drag = d3.drag()
        .on("drag", dragmove)
        .on("start", dragstart);
    
    svg
        .select(".drag_diverging")
        .attr("width", dWidth)
        .attr("height", dHeight)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(drag);
    
    svg
        .select(".bars")
        .style("pointer-events", "all")
        .call(drag);
    
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
        .data(data)
        //.attr("x", x(0))
      	.attr("dx", function(d) {
        	return d["PGDR"] < 0 ? 22 : -10;
      	})
        .style("text-anchor", d => d["PGDR"] < 0 ? "start" : "end")
        .attr("font-family", "Arial")
        .attr("font-weight", "bolder")
        .attr("font-size", 12)
        .each(wrap)
        .append("title")
        .text(d => d["name"])
        
    svg.select("g.yAxis").selectAll("g.tick line")
        .data(data)
        .filter(d => d["PGDR"] < 0)
        .attr("x2", 6);

    svgX.select("g.xAxis")
        .call(xAxis)
        .selectAll("text")
        .attr("font-family", "Arial")
        .attr("font-weight", "bolder")
        .attr("font-size", 12);

    svg
        .select("g.bars")
        .selectAll("rect")
        .data(data, d => d["PGDR"])
        .join(
            enter => enter
                .append("rect")
                .attr("x", function(d){
                    var mini = Math.min(x(0), x(d["PGDR"]))
                    return mini
                })
                .attr("y", d => y(d["name"]))
                .attr("width", d => Math.abs(x(d["PGDR"]) - x(0)))
                .attr("height", y.bandwidth())
                .attr("fill", function(d){
                    if(d["PGDR"] < 0)
                        return "red"
                    return "green"
                })
                .append("title")
                .text(d => d["name"] + ": " + round(d["PGDR"], 2)),
            update => update
                .attr("x", function(d){
                    var mini = Math.min(x(0), x(d["PGDR"]))
                    return mini
                })
                .attr("y", d => y(d["name"]))
                .attr("width", d => Math.abs(x(d["PGDR"]) - x(0)))
                .attr("height", y.bandwidth())
                .attr("fill", function(d){
                    if(d["PGDR"] < 0)
                        return "red"
                    return "green"
                })
                .append("title")
                .text(d => d["name"] + ": " + round(d["PGDR"], 2)),
            exit => exit.remove()
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
        const dy = event.y - dragStartY;
        let y = dy + oldTranslateY;
        
        if (data.length > 10) {
            if (y > 0)
                y = 0;
            
            if (y < (- dHeight / 10 * data.length + dHeight)) { 
                y = - dHeight / 10 * data.length + dHeight;
            }
            moved = y;

            d3.select('.bars').attr("transform", "translate(0, " + y + ")");

            svg.select('.yAxis').attr("transform", "translate("+ x(0) +", " + y + ")");
        }
    }

    function resetDrag() {
        d3.select('.bars').attr("transform", "translate(0, " + moved + ")");
        svg.select('.yAxis').attr("transform", "translate("+ x(0) +", " + moved + ")")

    }
}