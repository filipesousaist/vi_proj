let wcWidth;
let wcHeight;
let wcTitleHeight;

function initWordCloud() {
    const wcDivRect = d3
        .select("#word_cloud_container")
        .select(".idiom_background")
        .node()
        .getBoundingClientRect();
    
    wcWidth = wcDivRect.width - 2; // 2 == padding
    wcHeight = 350;
    wcTitleHeight = 30;
}

function createWordCloud(update = false) {
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
        .size([wcWidth, wcHeight])
        .words(sorted_counts.map(
            d => ({text: d[0], size: d[1]})
        ))
        .padding(10)
        .rotate(0)
        .fontSize(d => Math.round(Math.sqrt(d.size / sorted_counts[0][1]) * 30))
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
            .attr("width", wcWidth)
            .attr("height", wcHeight);

        if (!update)
            d3
                .select("div#word_cloud_title")
                .append("svg")
                .attr("width", wcWidth)
                .attr("height", wcTitleHeight)
                .append("text")
                .text("Most Frequent Tags")
                .attr("transform", "translate(" + wcWidth / 2 + "," + 25 + ")")
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
                        .call(() => {console.log(this);})
                        .on("click", handleClickWordCloud)
                        .on("mouseover", handleMouseOverWordCloud)
                        .on("mouseout", handleMouseOutWordCloud)
                        .transition()
                        .duration(500)
                        .attr("transform", "scale(0)")
                        .transition()
                        .duration(500)
                        .attr("transform", "scale(1)")
                        .attr("font-size", d => d.size)
                        .attr("fill", d => g_tagToColor[d.text])
                        .attr("text-anchor", "middle")
                        .attr("font-family", "Arial")
                        .attr("font-weight", "bolder")
                        .attr("transform", d => "translate(" + [d.x, d.y] + ")")
                        .text(d => d.text),
                update =>
                    update
                        .transition()
                        .duration(500)
                        .attr("transform", "scale(0)")
                        .transition()
                        .duration(500)
                        .attr("transform", "scale(1)")
                        .attr("font-size", d => d.size)
                        .attr("fill", d => g_tagToColor[d.text])
                        .attr("text-anchor", "middle")
                        .attr("font-family", "Arial")
                        .attr("font-weight", "bolder")
                        .attr("transform", d => "translate(" + [d.x, d.y] + ")")
                        .text(d => d.text),
                exit => 
                    exit
                        .transition()
                        .duration(500)
                        .attr("transform", "scale(0)")
                        .remove()
            );
    }
}

function handleClickWordCloud(_, d) {
    if (!g_selectedTags.includes(d.text)){
        g_selectedTags.push(d.text);
        updateTagBox(d.text);
        updatePlots();
        removeShineFromTag();
        updateSuggestedTags(d.text, false, false);
    }
}

function handleMouseOverWordCloud(_, d) {
    addShineToTag(d.text);
}

function handleMouseOutWordCloud() {
    removeShineFromTag();
}