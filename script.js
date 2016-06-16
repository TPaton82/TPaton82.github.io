const POSITIONS = {"GK": 0, "DF": 1, "MF": 2, "FW": 3};

const TYPES = {
  "Goal": {"GK": 10, "DF": 7, "MF": 6, "FW": 5},
  "Assist": {"GK": 3, "DF": 3, "MF": 3, "FW": 3},
  "Clean Sheet": {"GK": 6, "DF": 5},
  "Scored Penalty": {"GK": 3, "DF": 2, "MF": 2, "FW": 2},
  "Saved Penalty": {"GK": 2, "DF": 4, "MF": 4, "FW": 4},
  "Own Goal": {"GK": -1, "DF": -2, "MF": -2, "FW": -2},
  "Missed Penalty": {"GK": -2, "DF": -2, "MF": -2, "FW": -2},
  "Red Card": {"GK": -2, "DF": -2, "MF": -2, "FW": -2}
};

$.each(TYPES, function(type, positions) {
    $.each(positions, function(position, points) {
        $("#" + type.replace(" ", "") + "_" + position).text(points);
    });
});

$.getJSON("data/squads.json", function(squads) {
    
    var playerList = [];
    var playerDict = {};
    
    $.each(squads, function(undefined, squad) {
        $.each(squad["players"], function(undefined, player) {
            playerList.push(player["player"]);
            playerDict[player["player"]] = {
                "name": player["player"],
                "country": squad["country"],
                "points": 0,
                "position": player["position"],
                "manager": null};
        });
    });
    
    $.getJSON("data/actions.json", function(actions) {
        
        var managerList = [];
        var managerDict = {};
        
        $.each(actions, function(undefined, action) {
            $.each(action, function(type, data) {
                if (type == "Manager") {
                    managerList.push(data["manager"]);
                    managerDict[data["manager"]] = {
                        "name": data["manager"],
                        "country": data["country"],
                        "points": 0,
                        "drafts": 0,
                        "transfers": 0,
                        "players": []};
                } else {
                    var tr;
                    if (type == "Draft") {
                        var player = playerDict[data["player"]];
                        var manager = managerDict[data["manager"]];
                        player["manager"] = data["manager"];
                        tr = getRow();
                        tr.append($("<td>").append(getDescriptor(type, ++manager["drafts"])));
                        tr.append($("<td>").append(getPerson(player)));
                        tr.append($("<td>").append(getPerson(manager)));
                    } else if (type == "Transfer") {
                        var playerOut = playerDict[data["out"]];
                        var playerIn = playerDict[data["in"]];
                        var manager = managerDict[playerOut["manager"]];
                        playerIn["manager"] = playerOut["manager"];
                        playerOut["manager"] = null;
                        tr = getRow();
                        tr.append($("<td>").append(getDescriptor(type, ++manager["transfers"])));
                        tr.append($("<td>").append(getPerson(playerIn, "in")).append(getPerson(playerOut, "out")));
                        tr.append($("<td>").append(getPerson(manager)));
                    } else {
                        var player = playerDict[data];
                        var points = TYPES[type][player["position"]];
                        player["points"] += points;
                        var td = $("<td>");
                        if (player["manager"] != null) {
                            var manager = managerDict[player["manager"]];
                            manager["points"] += points;
                            td.append(getPerson(manager));
                        }
                        tr = getRow(points);
                        tr.append($("<td>").append(getDescriptor(type, points)));
                        tr.append($("<td>").append(getPerson(player)));
                        tr.append(td);
                    }
                    $("#table_actions").prepend(tr);
                }
            });
        });
        
        playerList.sort(function(a, b) {
            return sortPoints(playerDict[a], playerDict[b])
                || sortPosition(playerDict[a], playerDict[b])
                || sortName(a, b);
        });
        
        $.each(playerList, function(undefined, namePlayer) {
            var player = playerDict[namePlayer];
            var td = $("<td>");
            if (player["manager"] != null) {
                var manager = managerDict[player["manager"]];
                manager["players"].push(namePlayer);
                td.append(getPerson(manager));
            }
            var tr = getRow(player["points"]);
            tr.append($("<td>").append(getPerson(player)));
            tr.append(td);
            $("#table_players").append(tr);
        });
        
        managerList.sort(function(a, b) {
            return sortPoints(managerDict[a], managerDict[b])
                || sortName(a, b);
        });
        
        $.each(managerList, function(rank, nameManager) {
            var manager = managerDict[nameManager];
            manager["players"].sort(function(a, b) {
                return sortPosition(playerDict[a], playerDict[b]);
            });
            var td = $("<td>");
            $.each(manager["players"], function(undefined, namePlayer) {
                var player = playerDict[namePlayer];
                td.append(getPerson(player));
            });
            var tr = getRow(rank == 0 ? 1 : rank == managerList.length-1 ? -1 : 0);
            tr.append($("<td>").append(getPerson(manager)));
            tr.append(td);
            $("#table_managers").append(tr);
        });
    });
});

function sortPoints(a, b) {
    return b["points"] - a["points"];
}

function sortPosition(a, b) {
    return POSITIONS[a["position"]] - POSITIONS[b["position"]];
}

function sortName(a, b) {
    return a.localeCompare(b);
}

function getRow(value=0) {
    var tr = $("<tr>");
    if (value > 0) {
        tr.attr("class", "success");
    } else if (value < 0) {
        tr.attr("class", "danger");
    } else {
        tr.attr("class", "info");
    }
    return tr;
}

function getDescriptor(type, value) {
    var p = $("<p>");
    p.text(type + " (" + value + ")");
    return p;
}

function getPerson(data, sub=null) {
    var p = $("<p>");
    if (sub != null) {
        p.append(getArrow(sub));
    }
    try {
        p.append(data["position"]);
    } catch (err) {}
    p.append(getFlag(data["country"]));
    p.append(data["name"] + " (" + data["points"] + ")");
    return p;
}

function getFlag(country) {
    var img = $("<img>");
    img.attr("src", "images/flags/" + country + ".GIF");
    img.attr("style", "height: 16; width: 24; margin: 0 8");
    return img;
}

function getArrow(sub) {
    var img = $("<img>");
    img.attr("src", "images/arrows/" + sub + ".GIF");
    img.attr("style", "height: 16; width: 16; margin: 0 8");
    return img;
}
