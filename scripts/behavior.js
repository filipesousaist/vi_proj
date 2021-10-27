var width = 400,
    height = 300;

function init(){
    d3
        .csv("data/tags.csv")
        .then((data) => {
            createWordCloud(data);
        })
        .catch((error) => {
            console.log(error);
        });
}

function createWordCloud(data) {
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
    console.log(sorted_counts);

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


