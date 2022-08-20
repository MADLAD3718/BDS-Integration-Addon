import { world, Location, EntityQueryOptions } from "mojang-minecraft";
import { variables } from "mojang-minecraft-server-admin";
import { http, HttpRequest, HttpRequestMethod } from "mojang-net";

const groups = new Set();
const groupedPlayers = new Set();

export function voice() {
    world.events.tick.subscribe(() => {
        // Update Groups:
        groups.forEach(group => {
            group.update();
        })

        // Ungrouped Players:
        const query = new EntityQueryOptions();
        query.tags = [`linked`];
        // For all players that have linked their accounts and aren't in a group
        for (const player of world.getPlayers(query)) {
            if (groupedPlayers.has(player.name)) continue;
            query.excludeNames = [`${player.name}`];
            // For the other player that isn't in a group
            for (const otherPlayer of world.getPlayers(query)) {
                if (groupedPlayers.has(otherPlayer.name)) continue;
                const xDist = Math.abs(otherPlayer.location.x - player.location.x);
                const yDist = Math.abs(otherPlayer.location.y - player.location.y);
                const zDist = Math.abs(otherPlayer.location.z - player.location.z);

                const hDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(zDist, 2));
                const inRange = hDist <= variables.get("horizontal-range") && yDist <= variables.get("vertical-range") && player.dimension.id === otherPlayer.dimension.id ? true : false;

                if (inRange === true) {
                    groupedPlayers.add(player.name)
                    groupedPlayers.add(otherPlayer.name);
                    groups.add(
                        new Group([player, otherPlayer])
                    )
                    world.getDimension('overworld').runCommand(`say Grouped ${player.name} & ${otherPlayer.name}`);
                    exportGroups();
                }
            }
            if (groupedPlayers.has(player.name)) continue;
            // If no other players that were groupless were found, look for groups to join instead
            groups.forEach(group => {
                const xDist = Math.abs(group.center.x - player.location.x);
                const yDist = Math.abs(group.center.y - player.location.y);
                const zDist = Math.abs(group.center.z - player.location.z);

                const hDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(zDist, 2));
                const inRange = hDist <= group.range.h && yDist <= group.range.v && player.dimension.id === group.dimension ? true : false;
                if (inRange === true) {
                    group.addPlayer(player.name);
                }
            })
        }

        // Group Merging
        groups.forEach(group => {
            groups.forEach(otherGroup => {
                if (otherGroup.center === group.center) return;
                const xDist = Math.abs(otherGroup.center.x - group.center.x);
                const yDist = Math.abs(otherGroup.center.y - group.center.y);
                const zDist = Math.abs(otherGroup.center.z - group.center.z);
                const hDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(zDist, 2));
                if ((hDist <= group.range.h || hDist <= otherGroup.range.h) && (yDist <= group.range.v || yDist <= otherGroup.range.v)) {
                    world.getDimension('overworld').runCommand(`say Group ${[...group.players]} is in range of ${[...otherGroup.players]}`);
                    const newPlayers = [];
                    [...group.players, ...otherGroup.players].forEach(playerName => {
                        world.getDimension('overworld').runCommand(`say Group has: ${playerName}`);
                        const query = new EntityQueryOptions();
                        query.name = playerName;
                        for (const player of world.getPlayers(query)) {
                            newPlayers.push(player);
                        }
                    })
                    groups.add(
                        new Group(newPlayers)
                    );
                    groups.delete(group);
                    groups.delete(otherGroup);
                    groups.forEach(group => {
                        world.getDimension('overworld').runCommand(`say The ONE GROUP is ${[...group.players]}`);
                    })
                    return;
                }
            })
        })
    })
    world.events.playerLeave.subscribe(event => {
        groups.forEach(group => {
            group.removePlayer(event.playerName);
        })
    })
}

function exportGroups() {
    const groupExport = {};
    groups.forEach(group => {
        if (group.players.size > 1) groupExport[group.id] = {
            members: [...group.players]
        }
        // world.getDimension('overworld').runCommand(`say Added ${groupExport} to groupExport[]`);
    })
    // world.getDimension('overworld').runCommand(`say Sent ${JSON.stringify(groupExport)}`);
    const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
    request.addHeader("Content-Type", "application/json")
    request.addHeader("mc-data-type", "voice-groups")
    request.addHeader("server-uuid", variables.get('server-uuid'))
    request.body = JSON.stringify({
        groups: groupExport
    })
    request.method = HttpRequestMethod.POST;

    http.request(request).then(response => {
        world.getDimension('overworld').runCommand(`say Groups Response: ${response.body}`);
    });
}

class Group {
    range = {
        h: variables.get("horzontal-range") / 2,
        v: variables.get("vertical-range")
    }
    center = new Location(0, 0, 0);
    dimension = '';
    players = new Set();
    constructor(playerArray) {
        try {
            playerArray.forEach((player, i) => {
                this.players.add(player.name);
                if (i === 0) this.dimension = player.dimension.id;
            })
            this.id = Math.round(Math.random() * 99999999).toString().padStart(8, '0');
            this.update();            
        } catch (error) {
            world.getDimension('overworld').runCommand(`say ${error}${error.stack}`);
        }
    }
    addPlayer(playername) {
        // world.getDimension('overworld').runCommand(`say Added ${playername} to group.`)
        groupedPlayers.add(playername);
        this.players.add(playername);
        this.getCenter();
        exportGroups();
    }
    removePlayer(playername) {
        // world.getDimension('overworld').runCommand(`say Removed ${playername} from group.`)
        groupedPlayers.delete(playername);
        this.players.delete(playername);
        if (this.players.size >= 1) {
            this.getCenter();
        }
        exportGroups();
    }
    outOfBounds(player) {
        const xDist = Math.abs(player.location.x - this.center.x);
        const yDist = Math.abs(player.location.y - this.center.y);
        const zDist = Math.abs(player.location.z - this.center.z);

        const hDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(zDist, 2));
        // world.getDimension('overworld').runCommand(`say ${player.name} hDist: ${hDist}.`)
        // eventually increase this by amount of players
        const outsideRange = hDist <= this.range.h && yDist <= this.range.v && player.dimension.id === this.dimension ? false : true;
        if (outsideRange === true) {
            this.removePlayer(player.name);
            this.getRange();
        }
        return outsideRange;
    }
    getCenter() {
        let x = 0;
        let y = 0;
        let z = 0;
        this.players.forEach(playerName => {
            const query = new EntityQueryOptions();
            query.name = playerName;
            for (const player of world.getPlayers(query)) {
                x += player.location.x;
                y += player.location.y;
                z += player.location.z;
            }
        })
        x /= this.players.size;
        y /= this.players.size;
        z /= this.players.size;
        // world.getDimension('overworld').runCommand(`say Recalculated center to be at (${Math.round(x)}, ${Math.round(y)}, ${Math.round(z)})`);
        this.center = new Location(x, y, z);
    }
    getRange() {
        this.range.h = (variables.get("horizontal-range") + (this.players.size - 1) * variables.get("player-addition")) / 2;
        this.range.v = (variables.get("vertical-range") + (this.players.size - 1) * variables.get("player-addition") / 2) / 2;
    }
    update() {
        this.getCenter();
        this.getRange();
        this.players.forEach(playerName => {
            const query = new EntityQueryOptions();
            query.name = playerName;
            for (const player of world.getPlayers(query)) {
                this.outOfBounds(player);
            }
        })
        if (this.players.size <= 1) {
            this.players.forEach(player => {
                groupedPlayers.delete(player);
            })
            world.getDimension('overworld').runCommand(`say Disbanded Group`);
            groups.delete(this);
        }
        return this.center;
    }
}