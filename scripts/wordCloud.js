function createWordCloud(data, update = false) {
    const width = 400;
    const height = 300;

    const counts = {};

    for (let row of data) {
        for (let tag in row) {
            if (tag != "id") {
                var noSelectedTags = false;
                for (let selectedTag in g_selectedTags){
                    if (row[g_selectedTags[selectedTag]] != "True"){
                        noSelectedTags = true;
                        break;
                    }
                }
                if (noSelectedTags) {
                    continue;
                }
                if (counts[tag] != undefined) {
                    counts[tag] += (row[tag] == "True") ? 1 : 0;
                }
                else {
                    counts[tag] = (row[tag] == "True") ? 1 : 0;
                }
            }
        }
    
    }

    const sorted_counts_pre_remove = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    for (let selectedTag of g_selectedTags) {
        console.log(selectedTag);
        for (var i = 0; i < sorted_counts_pre_remove.length; i++) {
            if (sorted_counts_pre_remove[i][0] === selectedTag) {
                sorted_counts_pre_remove.splice(i, 1);
                continue;
            }
        }
    }

    sorted_counts_pre_remove.splice(40)
    
    const sorted_counts = sorted_counts_pre_remove.filter(function (tag) {
        return tag[1] > 0;
    });

    console.log(sorted_counts);

    const layout = d3.layout
        .cloud()
        .size([width, height])
        .words(sorted_counts.map(
            (d) => { return {text: d[0], size: d[1]}; }
        ))
        .padding(5)
        .rotate(0)
        .fontSize(d => d.size / sorted_counts[0][1] * 49)
        .on("end", draw);
    layout.start();

    
    function draw(words) {
        if (!update){
            d3
                .select("div#word_cloud")
                .append("svg")
                .append("g")
        }
    
        const svg = d3
            .select("div#word_cloud")
            .select("svg")
            .attr("width", width)
            .attr("height", height);

        svg
            .select("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
            .selectAll("text")
            .data(words)
            .join(
                (enter) => {
                    return enter
                        .append("text")
                        .style("font-size", d => d.size)
                        .style("fill", _ => `rgb(${Math.random()*256}, ${Math.random()*256}, ${Math.random()*256})`)
                        .attr("text-anchor", "middle")
                        .style("font-family", "Impact")
                        .attr("transform", function(d) {
                            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                        })
                        .text(d => d.text)
                        .on("click", handleClick)
                        .transition()
                        .duration(2000);
                    
                },
                (update) => {
                    update
                        .transition()
                        .duration(1000)
                        .style("font-size", d => d.size)
                        .style("fill", _ => `rgb(${Math.random()*256}, ${Math.random()*256}, ${Math.random()*256})`)
                        .attr("text-anchor", "middle")
                        .style("font-family", "Impact")
                        .attr("transform", function(d) {
                            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                        })
                        .text(d => d.text);
                },
                (exit) => {
                    return exit.remove();
                }
            )
    }
}