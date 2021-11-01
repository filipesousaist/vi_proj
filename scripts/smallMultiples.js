
const margin = { top: 20, right: 10, bottom: 20, left: 320 };

const width = 520 - margin.left - margin.right;
const height = 140 - margin.top - margin.bottom;
const titleHeight = 50;

function createSmallMultiples(numAndPeakPlayersPerTag, playerCounts, update) {
    // Get top 5 tags by num players
    const topTagsByNumPlayers = getTopTagsByNumPlayers(numAndPeakPlayersPerTag, 5);

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
    data.splice(Math.min(5, data.length));

    for (let row of data)
        row["name"] = g_idToName[row["id"]];


    const x = d3.scaleLinear()
        .domain([0, 1.1 * d3.max(d3.map(data, d => d["num"]))])
        .range([0, width]);
	
    const y = d3
        .scaleBand()
        .domain(data.map(d => d["name"]))
        .range([0, height])
        .padding(0.4);
		
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

    if (!update)
        d3
            .select("div#small" + chartNum)
            .append("svg")
            .append("g");
		
	const svg = d3
        .select("div#small" + chartNum)
        .select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    if (!update) {
        svg
            .append("text")
            .attr("class", "title");
        svg
            .append("g")
            .attr("class", "xAxis");
        svg
            .append("g")
            .attr("class", "yAxis");
        svg
            .append("g")
            .attr("class", "bars");   
    }

    svg
        .select("text.title")
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
	
    svg
        .select("g.xAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
	
	svg
		.select("g.bars")
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
}

function handleClickSmallMultiplesTitle(_, d) {
    if (!g_selectedTags.includes(d)){
        g_selectedTags.push(d);
        updateTagBox(d);
        updatePlots();
        removeShineFromTag();
    }
}

function handleMouseOverSmallMultiplesTitle(_, d) {
    addShineToTag(d);
}

function handleMouseOutSmallMultiplesTitle() {
    removeShineFromTag();
}