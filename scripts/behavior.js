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

// Array with all tags
let g_allTags;
// Array with all ids
let g_allIds;

// For each id, whether or not it has each tag
let g_hasTag;

// **** Functions ****

function init() {
    Promise
    .all([
        d3.csv("data/tags.csv"), 
        d3.csv("data/playerCountHistory.csv")
    ])
    .then(([tags, playerCountHistory, gamesInfo]) => {
        g_tags = tags;
        g_playerCountHistory = playerCountHistory;
        [g_allTags, g_allIds] = getAllTagsAndIds(g_tags);
        g_hasTag = createHasTagDict(g_tags);
        
        updatePlots(false);
    })
    .catch((error) => {
        console.log(error);
    });
}

function getAllTagsAndIds(tags) {
    const allTags = Object.getOwnPropertyNames(tags[0]);
    allTags.splice(allTags.indexOf("id"), 1);

    const allIds = [];
    tags.forEach(row => 
        allIds.push(row["id"])
    );

    return [allTags, allIds];
}

function createHasTagDict(tags) {
    const hasTag = {};

    for (let row of tags) {
        const id = row["id"];
        hasTag[id] = {};
        for (let tag in row)
            if (tag != "id")
                hasTag[id][tag] = (row[tag] == "True") ? true : false;
    }

    return hasTag;
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

function filterBySelectedTags(playerCountHistory, hasTag, selectedTags) {
    return playerCountHistory.filter(row => {
        const id = row["appid"];
        for (let tag of selectedTags)
            if (!hasTag[id][tag])
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

    //console.log("idsToUse", idsToUse);
    //console.log("getTagsToUse", getTagsToUse());
    
    const data = [];

    const tagsToUse = getTagsToUse().filter(tag => {
        for (let selectedTag of g_selectedTags)
            if (tag == selectedTag)
                return false;
        return true;
    });

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
        .sort((pc1, pc2) => pc2["value"] - pc1["value"])
        .splice(n);

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
    const filteredPCH = filterBySelectedTags(g_playerCountHistory, g_hasTag, g_selectedTags);
    [g_useTag, g_useId] = filterTagsAndIds(filteredPCH);
    const playerCounts = computePlayerCounts(filteredPCH);
    const numAndPeakPlayersPerTag = getNumAndPeakPlayersPerTag(playerCounts);
    
    //console.log("numAndPeakPlayersPerTag", numAndPeakPlayersPerTag);

    createWordCloud(update);
    createDotPlot(numAndPeakPlayersPerTag, update);
    createSmallMultiples(numAndPeakPlayersPerTag, playerCounts, update);
}
