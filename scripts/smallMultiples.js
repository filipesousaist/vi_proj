
const margin = { top: 25, right: 10, bottom: 20, left: 320 };

const width = 720 - margin.left - margin.right;
const height = 180 - margin.top - margin.bottom;
const titleHeight = 50;

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

    // Create bar charts
    for (let i = 0; i < 5; i ++) {
        if (i < topTags.length)
            createBarChart(tagsGames[topTags[i]], topTags[i], i + 1, update);
        else
            createBarChart([], "", i + 1, update)
    }

    if (!update)
        d3
            .select("div#barcharts_title")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", titleHeight)
            .append("text")
            .text("Most Popular Games")
            .attr("transform", "translate(" + (width + margin.left + margin.right) / 2 + "," + titleHeight / 2 + ")")
            .attr("text-anchor", "middle")
            .attr("text-decoration", "underline")
            .attr("font-size", "25")
            .attr("font-family", "Arial")
            .attr("font-weight", "bolder");
}

function createBarChart(data, tag, chartNum, update) {
    for (let row of data)
        row["name"] = g_idToName[row["id"]];


    const x = d3.scaleLinear()
        .domain([0, 1.1 * d3.max(d3.map(data, d => d["num"]))])
        .range([0, width]);
	
    const y = d3
        .scaleBand()
        .domain(data.map(d => d["name"]))
        .range([0, height / 5 * (Math.max(data.length, 5))])
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
        .style("transform", "translate(0," + (titleHeight + (margin.top + height + margin.bottom) * (chartNum - 1)) + "px)");

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
    const svg3 = d3
        .select("div#small" + chartNum)
        .select("svg.title" + chartNum)
        .attr("width", width + margin.left + margin.right)
        .attr("height", margin.top)
        .style("position", "absolute")
        .select("g")
        .attr("transform", "translate(" + margin.left + ", 0)");
    
	const svg = d3
        .select("div#small" + chartNum)
        .select("svg.bars_and_y" + chartNum)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height)
        .style("position", "absolute")
        .style("transform", "translate(0, " + margin.top + "px)")
        .select("g")
        .attr("transform", "translate(" + margin.left + ", 0)");
    
    const svg2 = d3
        .select("div#small" + chartNum)
        .select("svg.x" + chartNum)
        .attr("width", width + margin.left + margin.right)
        .attr("height", margin.bottom)
        .style("position", "absolute")
        .style("transform", "translate(0, " + (margin.top + height) + "px)")
        .select("g")
        .attr("transform", "translate(" + margin.left + ", 0)");
    

    if (!update) {
        svg
        .append("rect")
        .attr("class", "drag_small_multiples")
        svg3
        .append("text")
        .attr("class", "title");
        svg2
        .append("g")
        .attr("class", "xAxis");
        svg
        .append("g")
        .attr("class", "yAxis");
        svg
        .append("g")
        .attr("class", "bars" + chartNum);    
    }
    var drag = d3.drag()
        .on("drag", dragmove)
        .on("start", dragstart);

    svg
        .select(".drag_small_multiples")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(drag);

    svg
        .select(".bars" + chartNum)
        .style("pointer-events", "all")
        .call(drag);

    svg3
        .select("text.title")
        .style("transform", "translateY(20px)")
        .data([tag])
        .text(tag)
        .attr("text-anchor", "middle")
        .attr("font-family", "Arial")
        .attr("font-weight", "bolder")
        .style("fill", g_tagToColor[tag])
        .attr("x", width / 2)   
        .on("click", handleClickSmallMultiplesTitle)
        .on("mouseover", handleMouseOverSmallMultiplesTitle)
        .on("mouseout", handleMouseOutSmallMultiplesTitle);

    svg
        .select("g.yAxis")
        .call(yAxis)
        .selectAll("text")  
        .style("text-anchor", "end")
        .attr("font-family", "Arial")
        .attr("font-weight", "bolder");
	
    svg2
        .select("g.xAxis")
        .call(xAxis)
        .attr("transform", "translate(0, 0)")
	
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



    var moved = 0;
    var dragStartY = 0;
    var oldTranslateY = 0;

    function dragstart(event) {
        dragStartY = event.y;
        oldTranslateY = moved;
    }

    function dragmove(event) {
        console.log("event.y", event.y);
        if (data.length > 5) {
            const dy = event.y - dragStartY;
            let y = dy + oldTranslateY;
            if (y > 0)
                y = 0;

            if (y < (- height / 5 * data.length + height)) { 
                y = - height / 5 * data.length + height;
            }
            
            console.log(chartNum)
            moved = y;

            d3.select('.bars' + chartNum).attr("transform", "translate(" + 0 + "," + y + ")");

            svg.select('.yAxis').attr("transform", "translate("+ 0 +" ," + y + ")")
        }
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