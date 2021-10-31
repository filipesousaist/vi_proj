function createDotPlot(numAndPeakPlayersPerTag, update) {
    const topTagsByNumPlayers = getTopTagsByNumPlayers(numAndPeakPlayersPerTag, 10);
    
    const data = numAndPeakPlayersPerTag.filter(d => {
        for (let d_num of topTagsByNumPlayers)
            if (d["tag"] == d_num["tag"])
                return true;
        return false;
    });

    data.sort((pc1, pc2) => pc2["value"] - pc1["value"]);
    
    const margin = {
        top: 30,
        right: 20,
        bottom: 80,
        left: 50
    };
    const width = 360 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const x = d3
        .scalePoint()
        .domain(data.map(d => d["tag"]))
        .range([0, width])
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
            ["#00ABFF", "#FF0000"]
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


    if (!update)
        d3
            .select("div#dot_plot")
            .append("svg")
            .append("g");

    const svg = d3
        .select("div#dot_plot")
        .select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    if (!update) {
        svg
            .append("g")
            .attr("class", "xAxis");

        svg
            .append("g")
            .attr("class", "yAxis");
        
        legend = d3.select("#dot_plot_legend")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", (height + margin.top + margin.bottom) / 5)

        legend
            .append("circle")
            .attr("r", 6)
            .attr("cx", 40)
            .attr("cy", 9)
            .attr("fill", "#00ABFF")
            
        legend
            .append("text")
            .attr("dx", 48)
            .attr("dy", 15)
            .style("font-family", "sans-serif")
            .text("No. players (avg.)")
        
        legend
            .append("circle")
            .attr("r", 6)
            .attr("cx", 200)
            .attr("cy", 9)
            .attr("fill", "#FF0000")
            
        legend
            .append("text")
            .attr("dx", 208)
            .attr("dy", 15)
            .style("font-family", "sans-serif")
            .text("Peak players (avg.)")


    }
    
    svg
        .select("g.xAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    svg
        .select("g.yAxis")
        .call(yAxis);

    svg
        .selectAll("circle")
        .data(data)
        .join(
            (enter) => {
                return enter
                .append("circle")
                .attr("class", "dot")
                .attr("r", 3.5)
                .attr("cx", d => x(d["tag"]))
                .attr("cy", d => y(d["value"]))
                .style("fill", d => color(d["type"]))
                .append("title")
                .text(d => d["type"] + ": " + Math.round(d["value"] * 100) / 100);
            },
            (update) => {
                update
                .attr("class", "dot")
                .attr("r", 3.5)
                .attr("cx", d => x(d["tag"]))
                .attr("cy", d => y(d["value"]))
                .style("fill", d => color(d["type"]))
                .append("title")
                .text(d => d["type"] + ": " + Math.round(d["value"] * 100) / 100);
            },
            (exit) => {
                return exit.remove();
            }
        );

    
}