// **** Constants ****

const TAG_COLORS = [
    "#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf", // Category10
    "#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666", // Dark2
    //"#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f", // Set3
    //"#4e79a7","#f28e2c","#e15759","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#9c755f","#bab0ab" // Tableau10
];

const NUM_TAG_COLORS = TAG_COLORS.length;

// **** Global variables ****

// Currently selected tags in the word cloud
let g_selectedTags = [];

// For each tag, whether there is at least 1 game with that tag and all of the selected tags
let g_useTag;
// For each id, whether that game has all of the selected tags
let g_useId;


// **** Global constants ****

// Datasets (without any changes or filters)
let g_tags;
let g_playerCountHistory;
let g_info;

// Array with all tags
let g_allTags;
// Array with all ids
let g_allIds;

// For each id, whether or not it has each tag
let g_hasTag;

// For each id, its name
let g_idToName;

// For each tag, its color
let g_tagToColor;

// **** Functions ****

function init() {
    Promise
    .all([
        d3.csv("data/tags.csv"), 
        d3.csv("data/playerCountHistory.csv"),
        d3.csv("data/information.csv")
    ])
    .then(([tags, playerCountHistory, info]) => {
        g_tags = tags;
        g_playerCountHistory = playerCountHistory;
        g_info = info;
        [g_allTags, g_allIds] = getAllTagsAndIds();
        g_hasTag = createHasTagDict();
        g_idToName = createIdToNameDict();
        g_tagToColor = createTagToColorDict();
        
        updatePlots(false);
        //addPanning();
    })
    .catch((error) => {
        console.log(error);
    });
}

function getAllTagsAndIds() {
    const allTags = Object.getOwnPropertyNames(g_tags[0]);
    allTags.splice(allTags.indexOf("id"), 1);

    const allIds = [];
    g_tags.forEach(row => 
        allIds.push(row["id"])
    );

    return [allTags, allIds];
}

function createHasTagDict() {
    const hasTag = {};

    for (let row of g_tags) {
        const id = row["id"];
        hasTag[id] = {};
        for (let tag in row)
            if (tag != "id")
                hasTag[id][tag] = (row[tag] == "True");
    }

    return hasTag;
}

function createIdToNameDict() {
    const idToName = {};

    for (let row of g_info)
        idToName[row["appid"]] = row["name"];

    return idToName;
}

function createTagToColorDict() {
    const tagToColor = {};

    for (let i = 0; i < g_allTags.length; i ++)
        tagToColor[g_allTags[i]] = TAG_COLORS[i % NUM_TAG_COLORS];

    return tagToColor;
}

function getIdsToUse() {
    const idsToUse = [];
    g_allIds.forEach(ids => {
        if (g_useId[ids])
            idsToUse.push(ids);
    });
    return idsToUse;
}

function getTagsToUse() {
    const tagsToUse = [];
    g_allTags.forEach(tag => {
        if (g_useTag[tag])
            tagsToUse.push(tag);
    });
    return tagsToUse;
}

function filterBySelectedTags() {
    return g_playerCountHistory.filter(row => {
        const id = row["appid"];
        for (let tag of g_selectedTags)
            if (!g_hasTag[id][tag])
                return false;
        return true;
    });
}

function filterTagsAndIds(filteredPlayerCountHistory) {
    const useTag = {};
    const useId = {};

    for (let tag of g_allTags)
        useTag[tag] = false;

    for (let id of g_allIds)
        useId[id] = false;
    
    for (let row of filteredPlayerCountHistory) {
        useId[row["appid"]] = true;
        for (let tag of g_allTags)
            if (g_hasTag[row["appid"]][tag])
                useTag[tag] = true;
    }
        
    return [useTag, useId];
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

function getNumAndPeakPlayersPerTag(playerCounts) {
    const idsToUse = getIdsToUse();
    const tagsToUse = getTagsToUse().filter(tag => {
        for (let selectedTag of g_selectedTags)
            if (tag == selectedTag)
                return false;
        return true;
    });

    const data = [];

    for (let tag of tagsToUse) {
        let n = 0;
        let num_players = 0;
        let peak_players = 0;
        for (let id of idsToUse) {
            if (g_hasTag[id][tag]) {
                const playerCount = playerCounts[id];

                n += playerCount["n"];
                num_players += playerCount["num"];
                peak_players += playerCount["peak"];
            }
        }
        if (n > 0) {
            data.push({"tag": tag, "value": num_players / n, "type": "num"});
            data.push({"tag": tag, "value": peak_players / n, "type": "peak"});
        }
    }
        
    return data;
}

function getTopTagsByNumPlayers(numAndPeakPlayersPerTag, n) {
    const data_num = numAndPeakPlayersPerTag.filter(d => d["type"] == "num");

    data_num
        .sort((pc1, pc2) => pc2["value"] - pc1["value"]);

    if (n >= 0) {
        data_num.splice(n);
    }

    return data_num;
}

function handleClick(_, d) {
    if (!g_selectedTags.includes(d.text)){
        g_selectedTags.push(d.text);
        updateTagBox(d.text);
        updatePlots();
    }
}

function reset() {
    g_selectedTags = [];
    clearTags();
    clearTagBox();
    updatePlots();
}

function updatePlots(update = true) {
    const filteredPCH = filterBySelectedTags();
    [g_useTag, g_useId] = filterTagsAndIds(filteredPCH);
    const playerCounts = computePlayerCounts(filteredPCH);
    const numAndPeakPlayersPerTag = getNumAndPeakPlayersPerTag(playerCounts);

    createWordCloud(update);
    createDotPlot(numAndPeakPlayersPerTag, update);
    createSmallMultiples(numAndPeakPlayersPerTag, playerCounts, update);
}
/*
function addPanning() {
    d3.select("#dot_plot")
    .selectAll("svg")
    .selectAll("circle")
    .call(d3.zoom().on("zoom", zoomed));
}

function zoomed({ transform }) {
    d3.select("#dot_plot")
    .selectAll("svg")
    .selectAll("circle")
    .attr("transform", transform)
}*/