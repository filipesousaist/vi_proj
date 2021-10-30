// Global variables

let g_selectedTags = [];

let g_tags;
let g_playerCountHistory;

// Functions

function init() {

    Promise
    .all([
        d3.csv("data/tags.csv"), 
        d3.csv("data/playerCountHistory.csv")
    ])
    .then(([tags, playerCountHistory]) => {
        g_tags = tags;
        g_playerCountHistory = playerCountHistory;
        
        updatePlots(false);
    })
    .catch((error) => {
        console.log(error);
    });
}

function getNumAndPeakPlayersPerTag(tags, playerCounts) {
    const tag_names = Object.getOwnPropertyNames(tags[0]);
    tag_names.splice(tag_names.indexOf("id"), 1);

    const data = [];

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

    return data;

}

function getTopTagsByNumPlayers(numAndPeakPlayersPerTag, n) {
    const data_num = numAndPeakPlayersPerTag.filter(d => d["type"] == "num");

    data_num
        .sort((pc1, pc2) => pc2["value"] - pc1["value"])
        .splice(n);

    return data_num;
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

function handleClick(_, d) {
    if (!g_selectedTags.includes(d.text)){
        g_selectedTags.push(d.text);

        updatePlots();
    }
}

function reset() {
    g_selectedTags = [];

    updatePlots();
}

function updatePlots(update = true) {
    const playerCounts = computePlayerCounts(g_playerCountHistory);
    const numAndPeakPlayersPerTag = getNumAndPeakPlayersPerTag(g_tags, playerCounts);

    createWordCloud(g_tags, update);
    createDotPlot(numAndPeakPlayersPerTag, update);
    createSmallMultiples(g_tags, numAndPeakPlayersPerTag, playerCounts);
}

