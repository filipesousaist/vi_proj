

function init(){

    Promise
    .all([
        d3.csv("data/tags.csv"), 
        d3.csv("data/playerCountHistory.csv")
    ])
    .then(([tags, playerCountHistory]) => {
        createWordCloud(tags);
        createDotPlot(tags, playerCountHistory);
    })
    .catch((error) => {
        console.log(error);
    });
}


function createWordCloud(data) {
    const width = 400;
    const height = 300;

    d3
        .select("div#word_cloud")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const counts = {};
    for (let row of data) {
        for (let tag in row) {
            if (tag != "id") {
                if (counts[tag] != undefined) {
                    counts[tag] += (row[tag] == "True") ? 1 : 0;
                }
                else {
                    counts[tag] = (row[tag] == "True") ? 1 : 0;
                }
            }
        }
    }

    const sorted_counts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    sorted_counts.splice(40);

    const layout = d3.layout
        .cloud()
        .size([width, height])
        .words(sorted_counts.map(
            (d) => { return {text: d[0], size: d[1]}; }
        ))
        .padding(5)
        .rotate(0)
        .fontSize(d => d.size / 25)
        .on("end", draw);
    layout.start();

    function draw(words) {
        d3
            .select("div#word_cloud")
            .select("svg")
            .append("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
            .selectAll("text")
            .data(words)
            .enter()
            .append("text")
            .style("font-size", d => d.size)
            .style("fill", _ => `rgb(${Math.random()*256}, ${Math.random()*256}, ${Math.random()*256})`)
            .attr("text-anchor", "middle")
            .style("font-family", "Impact")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(d => d.text);
    }
}

function createDotPlot(tags, playerCountHistory) {
    const tag_names = Object.getOwnPropertyNames(tags[0]);
    tag_names.splice(tag_names.indexOf("id"), 1);

    const playerCounts = computePlayerCounts(playerCountHistory);
    const playerCountsList = []; 

    for (let tag of tag_names) {
        let n = 0;
        let num_players = 0;
        let peak_players = 0;
        for (let row of tags) {
            if (row[tag] == "True") {
                const id = row["id"];
                const playerCount = playerCounts[id];

                n += playerCount["n"];
                num_players += playerCount["num"];
                peak_players += playerCount["peak"];
            }
        }
        playerCountsList.push({"tag": tag, "value": num_players / n, "type": "num"});
        playerCountsList.push({"tag": tag, "value": peak_players / n, "type": "peak"});
    }

    const data_num = playerCountsList.filter(d => d["type"] == "num");

    data_num
        .sort((pc1, pc2) => pc2["value"] - pc1["value"])
        .splice(10);
    
    const data = playerCountsList.filter(d => {
        for (let d_num of data_num) {
            if (d["tag"] == d_num["tag"])
                return true;
        }
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
        .padding(0.5);
    
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
            ["#0000FF", "#FF0000"]
        );

    const xAxis = d3
        .axisBottom()
        .scale(x)
        .tickSizeOuter(0);

    const yAxis = d3
        .axisLeft()
        .scale(y)
        .tickSizeOuter(0);

    const svg = d3
        .select("div#dot_plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
        .selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", d => x(d["tag"]))
        .attr("cy", d => y(d["value"]))
        .style("fill", d => color(d["type"]))
        .style("opacity", .5)
        .append("title")
        .text(d => d["type"] + ": " + Math.round(d["value"] * 100) / 100);
}

function computePlayerCounts(playerCountHistory) {
    const playerCounts = {};

    for (let row of playerCountHistory) {
        const id = row["appid"];
        if (id in playerCounts) {
            playerCounts[id]["num"] += parseFloat(row["mean"]);
            playerCounts[id]["peak"] += parseFloat(row["max"]);
            playerCounts[id]["n"] ++;
        }
        else {
            playerCounts[id] = {
                "num": parseFloat(row["mean"]),
                "peak": parseFloat(row["max"]),
                "n": 1
            }
        }
    }

    return playerCounts;
}

