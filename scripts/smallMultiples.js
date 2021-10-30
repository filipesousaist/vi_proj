
function createSmallMultiples(tags, numAndPeakPlayersPerTag, playerCounts) {
    // Get top 5 tags by num players
    const topTagsByNumPlayers = getTopTagsByNumPlayers(numAndPeakPlayersPerTag, 5);

    const topTags = topTagsByNumPlayers.map(element => element["tag"]);

    // Create empty array for each of the 5 tags
    let tagsGames = {};
    topTags.forEach(tag => {
        tagsGames[tag] = [];
    });

    // Place in arrays the values for all games that have each of the 5 tags
    for (let row of tags) {
        const id = row["id"];
        topTags.forEach(tag => {
            if (row[tag] == 'True') {
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
    for (let i = 0; i < 5; i ++)
        createBarChart(tagsGames[topTags[i]], i + 1);
}

function createBarChart(data, chartNum){
    data.splice(5);

	margin = { top: 10, right: 20, bottom: 40, left: 40 };

    width = 300 - margin.left - margin.right;
    height = 150 - margin.top - margin.bottom;

	const x = d3
        .scaleBand()
        .domain(data.map(d => d["id"]))
        .range([0, width])
        .padding(0.4);

    const y = d3.scaleLinear()
        .domain([0, 1.1 * d3.max(d3.map(data, d => d["num"]))])
        .range([ height, 0]);
		
    const xAxis = d3
        .axisBottom()
        .scale(x)
        .tickSizeOuter(0);
		
	const yAxis = d3
        .axisLeft()
        .scale(y)
        .tickSizeOuter(0);
		
	const svg = d3
        .select("div#small" + chartNum)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg
        .append("g")
        .attr("class", "bars");
	
    svg
        .append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");
	
    svg
        .append("g")
        .attr("class", "y axis")
        .call(yAxis);
	
	svg
		.select("g.bars")
		.selectAll("rect")
		.data(data, d => d["num"])
		.enter()
		.append("rect")
        .attr("x", d => x(d["id"]))
        .attr("y", d => y(d["num"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["num"]))
		.style("fill", "steelblue");
}