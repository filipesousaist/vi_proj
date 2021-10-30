var topTags;

function init(){

    Promise
    .all([
        d3.csv("data/tags.csv"), 
        d3.csv("data/playerCountHistory.csv")
    ])
    .then(([tags, playerCountHistory]) => {
        createWordCloud(tags);
        createDotPlot(tags, playerCountHistory);
        createSmallMultiples(tags, playerCountHistory)
    })
    .catch((error) => {
        console.log(error);
    });

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

function createDotPlot2(tags, playerCountHistory) {
    const tag_names = Object.getOwnPropertyNames(tags[0]);
    tag_names.splice(tag_names.indexOf("id"), 1);

    const data = [];

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
        data.push({"tag": tag, "value": num_players / n, "type": "num"});
        data.push({"tag": tag, "value": peak_players / n, "type": "peak"});
    }

    data
        .sort((pc1, pc2) => pc2["value"] - pc1["value"])
        .splice(10);

    console.log(data);
    
    var
        x = d => d["value"], // given d in data, returns the (quantitative) value x
        y = d => d["tag"], // given d in data, returns the (categorical) value y
        z = d => d["type"], // given d in data, returns the (categorical) value z
        r = 3.5, // (fixed) radius of dots, in pixels
        xFormat, // a format specifier for the x-axis
        marginTop = 30, // top margin, in pixels
        marginRight = 30, // right margin, in pixels
        marginBottom = 10, // bottom margin, in pixels
        marginLeft = 30, // left margin, in pixels
        width = 640, // outer width, in pixels
        height, // outer height, in pixels, defaults to heuristic
        xType = d3.scaleLinear, // type of x-scale
        xDomain, // [xmin, xmax]
        xRange = [marginLeft, width - marginRight], // [left, right]
        xLabel, // a label for the x-axis
        yDomain, // an array of (ordinal) y-values
        yRange, // [top, bottom]
        yPadding = 1, // separation for first and last dots from axis
        zDomain, // array of z-values
        colors, // color scheme
        stroke = "currentColor", // stroke of rule connecting dots
        strokeWidth, // stroke width of rule connecting dots
        strokeLinecap, // stroke line cap of rule connecting dots
        strokeOpacity, // stroke opacity of rule connecting dots
        duration = 250, // duration of transition, if any
        delay = (_, i) => i * 10; // delay of transition, if any
    
    // Compute values.
    const X = d3.map(data, x);
    const Y = d3.map(data, y);
    const Z = d3.map(data, z);
  
    // Compute default domains, and unique them as needed.
    if (xDomain === undefined) xDomain = d3.extent(X);
    if (yDomain === undefined) yDomain = Y;
    if (zDomain === undefined) zDomain = Z;
    yDomain = new d3.InternSet(yDomain);
    zDomain = new d3.InternSet(zDomain);
    
    // Omit any data not present in the y- and z-domains.
    const I = d3.range(X.length).filter(i => yDomain.has(Y[i]) && zDomain.has(Z[i]));
  
    // Compute the default height.
    if (height === undefined) height = Math.ceil((yDomain.size + yPadding) * 16) + marginTop + marginBottom;
    if (yRange === undefined) yRange = [marginTop, height - marginBottom];
  
    // Chose a default color scheme based on cardinality.
    if (colors === undefined) colors = d3.schemeSpectral[zDomain.size];
    if (colors === undefined) colors = d3.quantize(d3.interpolateSpectral, zDomain.size);
  
    // Construct scales and axes.
    const xScale = xType(xDomain, xRange);
    const yScale = d3.scalePoint(yDomain, yRange).round(true).padding(yPadding);
    const color = d3.scaleOrdinal(zDomain, colors);
    const xAxis = d3.axisTop(xScale).ticks(width / 80, xFormat);
  
    const svg = d3.select("div#dot_plot")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
    svg.append("g")
        .attr("transform", `translate(0,${marginTop})`)
        .call(xAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("y2", height - marginTop - marginBottom)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", width - marginRight)
            .attr("y", -22)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(xLabel));
  
    const g = svg.append("g")
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
      .selectAll()
      .data(d3.group(I, i => Y[i]))
      .join("g")
        .attr("transform", ([y]) => `translate(0,${yScale(y)})`);
  
    g.append("line")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-linecap", strokeLinecap)
        .attr("stroke-opacity", strokeOpacity)
        .attr("x1", ([, I]) => xScale(d3.min(I, i => X[i])))
        .attr("x2", ([, I]) => xScale(d3.max(I, i => X[i])));
  
    g.selectAll("circle")
      .data(([, I]) => I)
      .join("circle")
        .attr("cx", i => xScale(X[i]))
        .attr("fill", i => color(Z[i]))
        .attr("r", r);
  
    g.append("text")
        .attr("dy", "0.35em")
        .attr("x", ([, I]) => xScale(d3.min(I, i => X[i])) - 6)
        .text(([y]) => y);
    
  
    return Object.assign(svg.node(), {
      color,
      update(yDomain, {
        duration = initialDuration, // duration of transition
        delay = initialDelay, // delay of transition
      } = {}) {
        yScale.domain(yDomain);
        const t = g.transition().duration(duration).delay(delay);
        t.attr("transform", ([y]) => `translate(0,${yScale(y)})`);
      }
    });
  }

function createDotPlot3(tags, playerCountHistory) {
    const tag_names = Object.getOwnPropertyNames(tags[0]);
    tag_names.splice(tag_names.indexOf("id"), 1);

    const data = [];

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
        data.push({"tag": tag, "value": num_players / n, "type": "num"});
        data.push({"tag": tag, "value": peak_players / n, "type": "peak"});
    }

    data
        .sort((pc1, pc2) => pc2["value"] - pc1["value"])
        .splice(10);

    console.log(data);
    
    var
        x = d => d["tag"], // given d in data, returns the (quantitative) value x
        y = d => d["value"], // given d in data, returns the (categorical) value y
        z = d => d["type"], // given d in data, returns the (categorical) value z
        r = 3.5, // (fixed) radius of dots, in pixels
        yFormat = "", // a format specifier for the y-axis
        marginTop = 30, // top margin, in pixels
        marginRight = 10, // right margin, in pixels
        marginBottom = 30, // bottom margin, in pixels
        marginLeft = 30, // left margin, in pixels
        width = 800, // outer width, in pixels
        height = 400, // outer height, in pixels, defaults to heuristic
        xDomain, // [xmin, xmax]
        xRange , // [left, right]
        xPadding = 1, // separation for first and last dots from axis
        yType = d3.scaleLinear, // type of y-scale
        yDomain, // an array of (ordinal) y-values
        yRange = [marginTop, height - marginBottom], // [top, bottom]
        yLabel, // a label for the x-axis  
        zDomain, // array of z-values
        colors, // color scheme
        stroke = "currentColor", // stroke of rule connecting dots
        strokeWidth, // stroke width of rule connecting dots
        strokeLinecap, // stroke line cap of rule connecting dots
        strokeOpacity, // stroke opacity of rule connecting dots
        duration = 250, // duration of transition, if any
        delay = (_, i) => i * 10; // delay of transition, if any
    
    // Compute values.
    const X = d3.map(data, x);
    const Y = d3.map(data, y);
    const Z = d3.map(data, z);
  
    // Compute default domains, and unique them as needed.
    if (xDomain === undefined) xDomain = X;
    if (yDomain === undefined) yDomain = d3.extent(Y);
    if (zDomain === undefined) zDomain = Z;
    xDomain = new d3.InternSet(xDomain);
    zDomain = new d3.InternSet(zDomain);
    
    // Omit any data not present in the x- and z-domains.
    const I = d3.range(Y.length).filter(i => xDomain.has(X[i]) && zDomain.has(Z[i]));
    
    if (xRange === undefined) xRange = [marginLeft, width - marginRight];

    // Chose a default color scheme based on cardinality.
    if (colors === undefined) colors = d3.schemeSpectral[zDomain.size];
    if (colors === undefined) colors = d3.quantize(d3.interpolateSpectral, zDomain.size);
  
    // Construct scales and axes.
    const xScale = d3.scalePoint(xDomain, xRange).round(true).padding(xPadding);
    const yScale = yType(yDomain, yRange);
    const color = d3.scaleOrdinal(zDomain, colors);
    const yAxis = d3.axisLeft(yScale).ticks(height / 80, yFormat);
  
    const svg = d3.select("div#dot_plot")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-height: 100%; width: auto; width: intrinsic;");
  
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("y", height - marginBottom)
            .attr("x", -22)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(yLabel));
  
    const g = svg.append("g")
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
      .selectAll()
      .data(d3.group(I, i => X[i]))
      .join("g")
        .attr("transform", ([x]) => `translate(${xScale(x)},0)`);
  
    g.append("line")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-linecap", strokeLinecap)
        .attr("stroke-opacity", strokeOpacity)
        .attr("y1", ([, I]) => yScale(d3.min(I, i => Y[i])))
        .attr("y2", ([, I]) => yScale(d3.max(I, i => Y[i])));
  
    g.selectAll("circle")
      .data(([, I]) => I)
      .join("circle")
        .attr("cy", i => yScale(Y[i]))
        .attr("fill", i => color(Z[i]))
        .attr("r", r);
  
    g.append("text")
        .attr("dx", "0.35em")
        .attr("y", ([, I]) => yScale(d3.min(I, i => Y[i])) - 6)
        .text(([x]) => x);
    
  
    return Object.assign(svg.node(), {
      color,
      update(xDomain, {
        duration = initialDuration, // duration of transition
        delay = initialDelay, // delay of transition
      } = {}) {
        xScale.domain(xDomain);
        const t = g.transition().duration(duration).delay(delay);
        t.attr("transform", ([x]) => `translate(0,${xScale(x)})`);
      }
    });
  }

function createDotPlot(tags, playerCountHistory) {
    const tag_names = Object.getOwnPropertyNames(tags[0]);
    tag_names.splice(tag_names.indexOf("id"), 1);

    let data = [];

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
        data.push({"tag": tag, "value": num_players / n, "type": "num"});
        data.push({"tag": tag, "value": peak_players / n, "type": "peak"});
    }

    const data_num = data.filter(d => d["type"] == "num");

    data_num
        .sort((pc1, pc2) => pc2["value"] - pc1["value"])
        .splice(10);
    
    data = data.filter(d => {
        for (let d_num of data_num) {
            if (d["tag"] == d_num["tag"])
                return true;
        }
        return false;
    });

    data.sort((pc1, pc2) => pc2["value"] - pc1["value"]);

    //tags para os small multiples
    topTags = data_num;

    const margin = {
            top: 30,
            right: 20,
            bottom: 80,
            left: 50
        },
        width = 360 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

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
        .scaleOrdinal(d3.schemeCategory10)
        .domain(["value", "peak"]);

    const xAxis = d3
        .axisBottom()
        .scale(x);

    const yAxis = d3
        .axisLeft()
        .scale(y);

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

function createSmallMultiples(tags, playerCountHistory){
    const tag_names = Object.getOwnPropertyNames(tags[0]);
    tag_names.splice(tag_names.indexOf("id"), 1);

    let tagsGames = {};
    
    topTags.forEach(element => {
        tagsGames[element["tag"]] = []
    });

    let data = [];

    const playerCounts = {};
    
    for (let row of tags) {
        const id = row["id"];
        Object.keys(tagsGames).forEach(tag => {
            if(row[tag] === 'True'){
                tagsGames[tag].push(id)
                playerCounts[id] = 0
            }
        });
    }

    //console.log(tagsGames)

    //somar mean values dos ids de cada tag
    for (let row of playerCountHistory) {
        const id = row["appid"];
        if(id in playerCounts){
            playerCounts[id] += parseFloat(row["mean"]);
        }
    }

    Object.keys(playerCounts).forEach(id => playerCounts[id] /= 33)

   // console.log(playerCounts)

    //associar mean values aos ids nas listas das tags & sort
    Object.keys(tagsGames).forEach(tag => {
        for(let i = 0; i < tagsGames[tag].length; i++) {
            tagsGames[tag][i] = {"id" : tagsGames[tag][i], "num": playerCounts[tagsGames[tag][i]]};
        }
        tagsGames[tag].sort((pc1, pc2) => pc2["num"] - pc1["num"]);
    });
    console.log(tagsGames)
    console.log(topTags)

    //criar barcharts
    createBarChart(tagsGames[Object.keys(tagsGames)[0]], "1");
    createBarChart(tagsGames[Object.keys(tagsGames)[1]], "2");
    createBarChart(tagsGames[Object.keys(tagsGames)[2]], "3");
    createBarChart(tagsGames[Object.keys(tagsGames)[3]], "4");
    createBarChart(tagsGames[Object.keys(tagsGames)[4]], "5");
}

function createBarChart(data, chartNum){
    data.splice(5);
	console.log(data)

	margin = { top: 20, right: 20, bottom: 20, left: 40 };

    width = 400 - margin.left - margin.right;
    height = 170 - margin.top - margin.bottom;

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
        .scale(x);
		
	const yAxis = d3
        .axisLeft()
        .scale(y);
		
	const svg = d3
        .select("div#small" + chartNum)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

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
		.data(data, function (d) {
				return d["num"];
		})
		.enter()
		.append("rect")
        .attr("x", function(d) {return x(d["id"]); })
        .attr("y", function(d) {return y(d["num"]); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d["num"]); })
		.style("fill", "steelblue");
}

}
