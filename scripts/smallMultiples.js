
let smMargin;
let smWidth;
let smHeight;
let smTitleHeight;

function initSmallMultiples() {
    const smDivRect = d3
        .select("#barcharts")
        .select(".idiom_background")
        .node()
        .getBoundingClientRect();

    smMargin = { top: 25, right: 40, bottom: 40, left: 180 };

    console.log(smDivRect.width)
    smWidth = smDivRect.width - 2 - smMargin.left - smMargin.right;
    smHeight = 180 - smMargin.top - smMargin.bottom;
    smTitleHeight = 30;
}

function createSmallMultiples(numAndPeakPlayersPerTag, playerCounts, update) {
    // Get top 5 tags by num players
    const topTagsByNumPlayers = getTopTagsByNumPlayers(numAndPeakPlayersPerTag, -1);

    const topTags = topTagsByNumPlayers.map(element => element["tag"]);

    // Create empty array for each of the 5 tags
    let tagsGames = {};
    topTags.forEach(tag => {
        tagsGames[tag] = [];
    });

    // Place in arrays the values for all games that have each of the 5 tags
    for (let id of getIdsToUse()) {
        topTags.forEach(tag => {
            if (g_hasTag[id][tag]) {
                tagsGames[tag].push({
                    "id": id,
                    "num": playerCounts[id]["num"] / playerCounts[id]["n"]
                });
            }
        });
    }

    // Sort games
    topTags.forEach(tag => 
        tagsGames[tag].sort((pc1, pc2) => pc2["num"] - pc1["num"])
    );

    let maxNumPlayers = 0;
    for (let i = 0; i < 5; i ++)
        if (tagsGames[topTags[i]] != undefined && tagsGames[topTags[i]].length > 0)
            maxNumPlayers = Math.max(maxNumPlayers, tagsGames[topTags[i]][0]["num"]);

    // Create bar charts
    for (let i = 0; i < 5; i ++) {
        console.log(tagsGames[topTags[i]]);
        if (i < topTags.length)
            createBarChart(tagsGames[topTags[i]], topTags[i], i + 1, update, maxNumPlayers);
        else
            createBarChart([], "", i + 1, update, 0);
    }

    if (!update)
        d3
            .select("div#barcharts_title")
            .append("svg")
            .attr("width", smWidth + smMargin.left + smMargin.right)
            .attr("height", smTitleHeight)
            .append("text")
            .text("Most Popular Games")
            .attr("transform", "translate(" + (smWidth + smMargin.left + smMargin.right) / 2 + "," + 25 + ")")
            .attr("text-anchor", "middle")
            .attr("text-decoration", "underline")
            .attr("font-size", "25")
            .attr("font-family", "Arial")
            .attr("font-weight", "bolder");
}

function createBarChart(data, tag, chartNum, update, maxNumPlayers) {
    for (let row of data)
        row["name"] = g_idToName[row["id"]];

    const x = d3.scaleLinear()
        .domain([0, 1.1 * maxNumPlayers])
        .range([0, smWidth]);
	
    const y = d3
        .scaleBand()
        .domain(data.map(d => d["name"]))
        .range([0, smHeight / 5 * (Math.max(data.length, 5))])
        .paddingInner(0.5)
        .paddingOuter(0.25);
		
    const yAxis = d3
        .axisLeft()
        .scale(y)
        .tickSizeOuter(0);
		
	const xAxis = d3
        .axisBottom()
        .scale(x)
        .tickSizeOuter(0)
        .ticks(5)
        .tickFormat(d => d < 1000 ? d : (d / 1000) + "K");

    d3
        .select("div#small" + chartNum)
        .style("position", "absolute")
        .style("transform", "translate(0," + (smTitleHeight + (smMargin.top + smHeight + smMargin.bottom) * (chartNum - 1)) + "px)");

    if (!update) {
        d3
            .select("div#small" + chartNum)
            .append("svg")
            .attr("class", "title" + chartNum)
            .append("g");
        d3
            .select("div#small" + chartNum)
            .append("svg")
            .attr("class", "bars_and_y" + chartNum)
            .append("g");
        d3
            .select("div#small" + chartNum)
            .append("svg")
            .attr("class", "x" + chartNum)
            .append("g");
    }

    const svgTitle = d3
        .select("div#small" + chartNum)
        .select("svg.title" + chartNum)
        .attr("width", smWidth + smMargin.left + smMargin.right)
        .attr("height", smMargin.top)
        .style("position", "absolute")
        .select("g")
        .attr("transform", "translate(" + smMargin.left + ", 0)");
    
	const svg = d3
        .select("div#small" + chartNum)
        .select("svg.bars_and_y" + chartNum)
        .attr("width", smWidth + smMargin.left + smMargin.right)
        .attr("height", smHeight)
        .style("position", "absolute")
        .style("transform", "translate(0, " + smMargin.top + "px)")
        .select("g")
        .attr("transform", "translate(" + smMargin.left + ", 0)");
    
    const svgX = d3
        .select("div#small" + chartNum)
        .select("svg.x" + chartNum)
        .attr("width", smWidth + smMargin.left + smMargin.right)
        .attr("height", smMargin.bottom)
        .style("position", "absolute")
        .style("transform", "translate(0, " + (smMargin.top + smHeight) + "px)")
        .select("g")
        .attr("transform", "translate(" + smMargin.left + ", 0.25)");
    

    if (!update) {
        svg
            .append("rect")
            .attr("class", "drag_small_multiples");
        svgTitle
            .append("text")
            .attr("class", "title");
        svgX
            .append("g")
            .attr("class", "xAxis");
        d3
            .select("div#small" + chartNum)
            .append("svg")
            .style("position", "absolute")
            .attr("transform", "translate(345, 136.5)")
            .append("path")
            .attr("d", "M0,0 L0,9 L6,4 L0,0");
            
        svgX
            .append("text")
            .text(typeToText("num"))
            .style("text-anchor", "middle")
            .attr("font-family", "Arial")
            .attr("font-weight", "bolder")
            .attr("font-size", 13)
            .attr("transform", "translate(130, 30)");
        svg
            .append("g")
            .attr("class", "yAxis");
        svg
            .append("g")
            .attr("class", "bars" + chartNum);    
    }

    const drag = d3.drag()
        .on("drag", dragmove)
        .on("start", dragstart);

    svg
        .select(".drag_small_multiples")
        .attr("width", smWidth)
        .attr("height", smHeight)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(drag);

    svg
        .select(".bars" + chartNum)
        .style("pointer-events", "all")
        .call(drag);

    svgTitle
        .select("text.title")
        .style("transform", "translateY(20px)")
        .data([tag])
        .text(tag)
        .attr("text-anchor", "middle")
        .attr("font-family", "Arial")
        .attr("font-weight", "bolder")
        .attr("font-size", 16)
        .style("fill", g_tagToColor[tag])
        .attr("x", smWidth / 2)   
        .on("click", handleClickSmallMultiplesTitle)
        .on("mouseover", handleMouseOverSmallMultiplesTitle)
        .on("mouseout", handleMouseOutSmallMultiplesTitle);

    function wrap() {
        const self = d3.select(this);
        let textLength = self.node().getComputedTextLength();
        let text = self.text();
        while (textLength > 150 && text.length > 0) {
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
        .each(wrap)
        .append("title")
        .text(d => d);
	
    svgX
        .select("g.xAxis")
        .call(xAxis)
        .selectAll("text")
        .attr("font-family", "Arial")
        .attr("font-weight", "bolder")
        .attr("font-size", 12);
	
	svg
		.select("g.bars" + chartNum)
		.selectAll("rect")
		.data(data, d => d["num"])
        .join(
            enter => enter
                .append("rect")
                .attr("x", 0)
                .attr("y", d => y(d["name"]))
                .attr("width", d => x(d["num"]))
                .attr("height", y.bandwidth())
                .attr("fill", g_tagToColor[tag])
                .append("title")
                .text(d => d["name"] + ": " + round(d["num"], 2)),
            update => update
                .attr("x", 0)
                .attr("y", d => y(d["name"]))
                .attr("width", d => x(d["num"]))
                .attr("height", y.bandwidth())
                .attr("fill", g_tagToColor[tag])
                .select("title")
                .text(d => d["name"] + ": " + round(d["num"], 2)),
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
        
        if (data.length > 5) {
            if (y > 0)
                y = 0;
            
            if (y < (- smHeight / 5 * data.length + smHeight)) { 
                y = - smHeight / 5 * data.length + smHeight;
            }
            moved = y;

            d3.select('.bars' + chartNum).attr("transform", "translate(0, " + y + ")");

            svg.select('.yAxis').attr("transform", "translate(0, " + y + ")");
        }
    }

    function resetDrag() {
        d3.select('.bars' + chartNum).attr("transform", "translate(0, " + moved + ")");
        svg.select('.yAxis').attr("transform", "translate(0, " + moved + ")")

    }
}

function handleClickSmallMultiplesTitle(_, d) {
    if (!g_selectedTags.includes(d)){
        g_selectedTags.push(d);
        updateTagBox(d);
        updatePlots();
        removeShineFromTag();
        updateSuggestedTags(d, false, false);
    }
}

function handleMouseOverSmallMultiplesTitle(_, d) {
    addShineToTag(d);
}

function handleMouseOutSmallMultiplesTitle() {
    removeShineFromTag();
}