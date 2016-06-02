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
                "country": squad["country"],
                "position": player["position"],
                "points": 0,
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
                        "country": data["country"],
                        "points": 0,
                        "players": []};
                    return true;
                }
                var points;
                try {
                    points = TYPES[type][playerDict[data]["position"]];
                } catch (err) {
                    points = 0;
                }
                var tr = getRow(points);
                tr.append($("<td>").text(type));
                if (type == "Draft") {
                    tr.append($("<td>").append(getFlag(playerDict[data["player"]])).append(data["player"]));
                    tr.append($("<td>"));
                    tr.append($("<td>").append(getFlag(managerDict[data["manager"]])).append(data["manager"]));
                    playerDict[data["player"]]["manager"] = data["manager"];
                } else if (type == "Transfer") {
                    tr.append($("<td>").append(getArrow("in")).append(getFlag(playerDict[data["in"]])).append(data["in"]).append($("<br>")).append(getArrow("out")).append(getFlag(playerDict[data["out"]])).append(data["out"]));
                    tr.append($("<td>"));
                    tr.append($("<td>").append(getFlag(managerDict[data["manager"]])).append(data["manager"]));
                    playerDict[data["out"]]["manager"] = null;
                    playerDict[data["in"]]["manager"] = data["manager"];
                } else {
                    tr.append($("<td>").append(getFlag(playerDict[data])).append(data));
                    tr.append($("<td>").text(points));
                    var td = $("<td>");
                    playerDict[data]["points"] += points;
                    if (playerDict[data]["manager"] != null) {
                        td.append(getFlag(managerDict[playerDict[data]["manager"]])).append(playerDict[data]["manager"]);
                        managerDict[playerDict[data]["manager"]]["points"] += points;
                    }
                    tr.append(td);
                }
                $("#table_actions").append(tr);
            });
        });
        
        playerList.sort(function(a, b) {
            return sortPoints(playerDict[a], playerDict[b])
                || sortPosition(playerDict[a], playerDict[b])
                || sortName(a, b);
        });
        
        $.each(playerList, function(undefined, player) {
            var tr = getRow(playerDict[player]["points"]);
            tr.append($("<td>").append(getFlag(playerDict[player])).append(player));
            tr.append($("<td>").text(playerDict[player]["position"]));
            tr.append($("<td>").text(playerDict[player]["points"]));
            var td = $("<td>");
            if (playerDict[player]["manager"] != null) {
                managerDict[playerDict[player]["manager"]]["players"].push(player);
                td.append(getFlag(managerDict[playerDict[player]["manager"]])).append(playerDict[player]["manager"]);
            }
            tr.append(td);
            $("#table_players").append(tr);
        });
        
        managerList.sort(function(a, b) {
            return sortPoints(managerDict[a], managerDict[b])
                || sortName(a, b);
        });
        
        $.each(managerList, function(rank, manager) {
            var tr = getRow(rank == 0 ? 1 : rank == managerList.length-1 ? -1 : 0);
            tr.append($("<td>").append(getFlag(managerDict[manager])).append(manager));
            tr.append($("<td>").text(managerDict[manager]["points"]));
            var td = $("<td>");
            managerDict[manager]["players"].sort(function(a, b) {
                return sortPosition(playerDict[a], playerDict[b])
            });
            $.each(managerDict[manager]["players"], function(undefined, player) {
                td.append($("<p>").append(playerDict[player]["position"]).append(getFlag(playerDict[player])).append(player));
            });
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

function getRow(value) {
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

function getFlag(person) {
    var img = $("<img>");
    img.attr("src", "images/flags/" + person["country"] + ".GIF");
    img.attr("style", "height: 16; width: 24; margin: 0 8");
    return img;
}

function getArrow(sub) {
    var img = $("<img>");
    img.attr("src", "images/arrows/" + sub + ".GIF");
    img.attr("style", "height: 16; width: 16; margin: 0 8");
    return img;
}
