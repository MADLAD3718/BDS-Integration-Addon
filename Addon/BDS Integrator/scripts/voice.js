import { world, Location } from "mojang-minecraft";
import { variables } from "mojang-minecraft-server-admin";
import { http, HttpRequest, HttpRequestMethod } from "mojang-net";

const groups = new Set();
const groupedPlayers = new Set();

export function voice() {
    const tickSub = world.events.tick.subscribe(event => {
        // if (event.currentTick % 5 !== 0) return;
        // Update Groups:
        groups.forEach(group => {
            group.update();
        })

        // Ungrouped Players:
        const query = {
            'tags': [`linked`]
        };
        // For all players that have linked their accounts and aren't in a group
        for (const player of world.getPlayers(query)) {
            if (groupedPlayers.has(player.name)) continue;
            query.excludeNames = [`${player.name}`];
            // For the other player that isn't in a group
            for (const otherPlayer of world.getPlayers(query)) {
                if (groupedPlayers.has(otherPlayer.name) === true) continue;
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
                }
            }
            if (groupedPlayers.has(player.name) === true) continue;
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
                if (otherGroup.id === group.id) return;
                const xDist = Math.abs(otherGroup.center.x - group.center.x);
                const yDist = Math.abs(otherGroup.center.y - group.center.y);
                const zDist = Math.abs(otherGroup.center.z - group.center.z);
                const hDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(zDist, 2));
                if ((hDist <= (group.range.h + otherGroup.range.h) / 1.5) && (yDist <= (group.range.v + otherGroup.range.v) / 1.5)) {
                    world.getDimension('overworld').runCommand(`say Group ${[...group.players]} is in range of ${[...otherGroup.players]}`);
                    otherGroup.players.forEach(playerName => {
                        group.players.add(playerName);
                    })
                    group.getCenter();

                    // Group merge request
                    const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
                    request.addHeader("Content-Type", "application/json")
                    request.addHeader("mc-data-type", "voice-group-merge")
                    request.addHeader("server-uuid", variables.get('server-uuid'))
                    request.body = JSON.stringify({
                        merged: group.id,
                        deleted: otherGroup.id
                    })
                    request.method = HttpRequestMethod.POST;
                    http.request(request).then(response => {
                        const restring = response.body;
                        // world.getDimension('overworld').runCommand(`say Groups Response: ${response.body}`);
                    });

                    groups.delete(otherGroup);
                    groups.forEach(group => {
                        // world.getDimension('overworld').runCommand(`say The merged group is ${[...group.players]}`);
                    })
                    return;
                }
            })
        })
    })
    world.events.playerLeave.subscribe(event => {
        world.events.playerLeave.unsubscribe(tickSub);
        groupedPlayers.delete(event.playerName);
        groups.forEach(group => {
            // world.getDimension('overworld').runCommand(`say Removing ${event.playerName} from ${[...group.players]}`);
            group.removePlayer(event.playerName);
        })
    })
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
        playerArray.forEach((player, i) => {
            this.players.add(player.name);
            if (i === 0) {
                this.dimension = player.dimension.id;
                this.center.x = player.location.x;
                this.center.y = player.location.y;
                this.center.z = player.location.z;
            };
        })
        this.id = Math.round(Math.random() * 99999999).toString().padStart(8, '0');
        this.update();

        // world.getDimension('overworld').runCommand(`say Group Created: ${[...this.players]}`);
        const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "voice-group-create")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            group: this.id,
            members: [...this.players]
        })
        request.method = HttpRequestMethod.POST;

        http.request(request).then(response => {
            const restring = response.body;
            // world.getDimension('overworld').runCommand(`say Create Group Response: ${response.body}`);
        });
    }
    addPlayer(playername) {
        // world.getDimension('overworld').runCommand(`say Added ${playername} to ${[...this.players]}`);
        groupedPlayers.add(playername);
        this.players.add(playername);
        this.getCenter();
        const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "voice-group-add")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            group: this.id,
            newMember: playername
        })
        request.method = HttpRequestMethod.POST;

        http.request(request).then(response => {
            const restring = response.body;
            // world.getDimension('overworld').runCommand(`say Add Player Response: ${response.body}`);
        });
    }
    removePlayer(playername) {
        // world.getDimension('overworld').runCommand(`say Removed ${playername} from ${[...this.players]}`);
        groupedPlayers.delete(playername);
        this.players.delete(playername);
        if (this.players.size <= 1 && this.deleted !== true) {
            // world.getDimension('overworld').runCommand(`say Deleted ${[...this.players]}`);
            this.deleted = true;
            this.players.forEach(player => {
                groupedPlayers.delete(player);
            })
            const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
            request.addHeader("Content-Type", "application/json")
            request.addHeader("mc-data-type", "voice-group-disband")
            request.addHeader("server-uuid", variables.get('server-uuid'))
            request.body = JSON.stringify({
                group: this.id
            })
            request.method = HttpRequestMethod.POST;

            http.request(request).then(response => {
                const restring = response.body;
                // world.getDimension('overworld').runCommand(`say Disband Group Response: ${response.body}`);
            });
            groups.delete(this);
        } else {
            this.getCenter();
            // world.getDimension('overworld').runCommand(`say Center ${[...this.players]} is now (${this.center.x}, ${this.center.y}, ${this.center.z})`);

            const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
            request.addHeader("Content-Type", "application/json")
            request.addHeader("mc-data-type", "voice-group-remove")
            request.addHeader("server-uuid", variables.get('server-uuid'))
            request.body = JSON.stringify({
                group: this.id,
                members: [...this.players],
                removedMember: playername
            })
            request.method = HttpRequestMethod.POST;

            http.request(request).then(response => {
                const restring = response.body;
                // world.getDimension('overworld').runCommand(`say Remove Player Response: ${response.body}`);
            });
        }
    }
    outOfBounds(player) {
        const xDist = Math.abs(player.location.x - this.center.x);
        const yDist = Math.abs(player.location.y - this.center.y);
        const zDist = Math.abs(player.location.z - this.center.z);
        const hDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(zDist, 2));
        const outsideRange = hDist <= this.range.h && yDist <= this.range.v && player.dimension.id === this.dimension ? false : true;
        if (outsideRange === true || player.hasTag('linked') === false) {
            this.removePlayer(player.name);
        }
        return outsideRange;
    }
    getCenter() {
        let x = 0;
        let y = 0;
        let z = 0;
        let modifier = 0;
        this.players.forEach(playerName => {
            const query = {
                'name': playerName
            };
            for (const player of world.getPlayers(query)) {
                if (player.location !== undefined) {
                    x += player.location.x;
                    y += player.location.y;
                    z += player.location.z;
                } else {
                    // world.getDimension('overworld').runCommand(`say found undefined player`);
                    modifier++;
                }
            }
        })
        x /= (this.players.size - modifier);
        y /= (this.players.size - modifier);
        z /= (this.players.size - modifier);
        try {
            const xDist = Math.abs(x - this.center.x);
            const yDist = Math.abs(y - this.center.y);
            const zDist = Math.abs(z - this.center.z);
            const hDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(zDist, 2));
            const outsideRange = hDist <= this.range.h && yDist <= this.range.v ? false : true;
            if (outsideRange === false) {
                this.center = new Location(x, y, z);
            }
            // world.getDimension('overworld').runCommand(`say New Center: ${x}, ${y} ${z}`);
        } catch (error) {
            // world.getDimension('overworld').runCommand(`say Center Error: ${error}${error.stack}`);
        }
    }
    getRange() {
        this.range.h = (variables.get("horizontal-range") / 2) + (this.players.size - 1) * variables.get("player-addition")
        this.range.v = (variables.get("vertical-range") + (this.players.size - 1) * variables.get("player-addition") / 2) / 2;
    }
    update() {
        this.getRange();
        this.getCenter();
        this.players.forEach(playerName => {
            const query = {
                'name': playerName
            };
            for (const player of world.getPlayers(query)) {
                if (this.players.size <= 1) return;
                this.outOfBounds(player);
            }
        });
    }
}