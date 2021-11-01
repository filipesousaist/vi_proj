function createWordCloud(update = false) {
    const width = 500;
    const height = 350;
    const titleHeight = 50;

    const tagsToUse = getTagsToUse();
    const counts = {};

    for (let id of getIdsToUse()) {
        for (let tag of tagsToUse)
            if (g_hasTag[id][tag]) {
                if (counts[tag] != undefined)
                    counts[tag] ++;
                else
                    counts[tag] = 1;
            }
    }

    const sorted_counts_pre_remove = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    for (let selectedTag of g_selectedTags)
        for (let i = 0; i < sorted_counts_pre_remove.length; i++)
            if (sorted_counts_pre_remove[i][0] == selectedTag) {
                sorted_counts_pre_remove.splice(i, 1);
                continue;
            }

    sorted_counts_pre_remove.splice(40);
    
    const sorted_counts = sorted_counts_pre_remove.filter(
        tag => tag[1] > 0
    );

    const layout = d3.layout
        .cloud()
        .size([width, height])
        .words(sorted_counts.map(
            d => ({text: d[0], size: d[1]})
        ))
        .padding(10)
        .rotate(0)
        .fontSize(d => Math.sqrt(d.size / sorted_counts[0][1]) * 30)
        .on("end", draw);
    layout.start();
    
    function draw(words) {
        if (!update) {
            d3
                .select("div#word_cloud")
                .append("svg")
                .append("g")
                .attr("class", "words");
        }
    
        const svg = d3
            .select("div#word_cloud")
            .select("svg")
            .attr("width", width)
            .attr("height", height);

        if (!update)
            d3
                .select("div#word_cloud_title")
                .append("svg")
                .attr("width", width)
                .attr("height", titleHeight)
                .append("text")
                .text("Most Frequent Tags")
                .attr("transform", "translate(" + width / 2 + "," + titleHeight / 2 + ")")
                .attr("text-anchor", "middle")
                .attr("text-decoration", "underline")
                .attr("font-size", "25")
                .attr("font-family", "Arial")
                .attr("font-weight", "bolder");

        svg
            .select("g.words")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
            .selectAll("text")
            .data(words)
            .join(
                enter => 
                    enter
                        .append("text")
                        .style("font-size", d => d.size)
                        .style("fill", d => g_tagToColor[d.text])
                        .attr("text-anchor", "middle")
                        .attr("font-family", "Arial")
                        .attr("font-weight", "bolder")
                        .attr("transform", d => "translate(" + [d.x, d.y] + ")")
                        .text(d => d.text)
                        .on("click", handleClick)
                        .transition()
                        .duration(2000),
                update =>
                    update
                        .transition()
                        .duration(1000)
                        .style("font-size", d => d.size)
                        .style("fill", _ => d => g_tagToColor[d.text])
                        .attr("text-anchor", "middle")
                        .attr("font-family", "Arial")
                        .attr("font-weight", "bolder")
                        .attr("transform", d => "translate(" + [d.x, d.y] + ")")
                        .text(d => d.text)
                        ,
                exit => 
                    exit.remove()
            );
    }
}