import { world, Location, EntityQueryOptions } from "mojang-minecraft";
import { variables } from "mojang-minecraft-server-admin";
import { http, HttpRequest, HttpRequestMethod } from "mojang-net";

const groups = new Set();
const groupedPlayers = new Set();

export function voice() {
    world.events.tick.subscribe(event => {
        // Update player db for server once every (interval) seconds
        const interval = 5;
        if (event.currentTick % (interval * 20) === 0) {

            // Update Groups and export them
            groups.forEach(group => {
                group.update();
            })

            // Groups
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
                    const inRange = hDist <= variables.get("horizontal-range") && yDist <= variables.get("vertical-range") ? true : false;

                    if (inRange === true) {
                        groupedPlayers.add(player.name)
                        groupedPlayers.add(otherPlayer.name);
                        groups.add(
                            new Group(player, otherPlayer)
                        )
                        world.getDimension('overworld').runCommand(`say Grouped ${player.name} & ${otherPlayer.name}`);
                    }
                }
                if (groupedPlayers.has(player.name)) continue;
                // If no other players that were groupless were found, look for groups to join instead
                groups.forEach(group => {
                    const xDist = Math.abs(group.center.x - player.location.x);
                    const yDist = Math.abs(group.center.y - player.location.y);
                    const zDist = Math.abs(group.center.z - player.location.z);

                    const hDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(zDist, 2));
                    const inRange = hDist <= variables.get("horizontal-range") && yDist <= variables.get("vertical-range") ? true : false;
                    const groupPlayers = [...group.players];
                    if (inRange === true) {
                        world.getDimension('overworld').runCommand(`say Adding ${player.name} to group ${groupPlayers}`);
                        groupedPlayers.add(player.name);
                        group.players.add(player.name);
                    }
                })
            }
            exportGroups();
        }
    })
    world.events.playerLeave.subscribe(event => {
        groups.forEach(group => {
            group.players.delete(event.playerName);
        })
        groupedPlayers.delete(event.playerName);
    })
}

function exportGroups() {
    const groupExport = [];
    groups.forEach(group => {
        groupExport.push([...group.players]);
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
    center = new Location(0, 0, 0);
    dimension = '';
    players = new Set();
    constructor(...args) {
        args.forEach((player, i) => {
            this.players.add(player.name);
            if (i === 0) this.dimension = player.dimension.id;
        })
        this.update();
    }
    addPlayer(player) {
        this.players.add(player.name);
        this.update();
    }
    removePlayer(player) {
        this.players.delete(player.name);
        this.update();
    }
    outOfBounds(player) {
        const xDist = Math.abs(player.location.x - this.center.x);
        const yDist = Math.abs(player.location.y - this.center.y);
        const zDist = Math.abs(player.location.z - this.center.z);

        const hDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(zDist, 2));
        // world.getDimension('overworld').runCommand(`say ${player.name} hDist: ${hDist}.`)
        const outsideRange = hDist <= ((variables.get("horizontal-range") + variables.get("leave-threshold")) / 2) && yDist <= (variables.get("vertical-range") / 2) && player.dimension.id === this.dimension ? false : true;
        if (outsideRange === true) {
            world.getDimension('overworld').runCommand(`say Removed ${player.name} from group.`)
            groupedPlayers.delete(player.name);
            this.players.delete(player.name);
            this.getCenter();
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
    update() {
        this.getCenter();
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
            return;
        }
        return this.center;
    }
}