import { world, Location } from "mojang-minecraft";
import { variables } from "mojang-minecraft-server-admin";
import { DBRequests } from "./requests";

const groups = new Set();
const groupedPlayers = new Set();

/**
 * Calculate 3D distance
 * @typedef {{x: number, y: number, z: number}} XYZcoordinates
 * @param {XYZcoordinates} x 
 * @param {XYZcoordinates} y 
 */
function CalculateDistance(x, y) {
    const xDist = Math.abs(x.x - y.x);
    const yDist = Math.abs(x.y - y.y);
    const zDist = Math.abs(x.z - y.z);
    const hDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(zDist, 2));
    return { xDist, yDist, zDist, hDist };
};

export function voice() {
    world.events.tick.subscribe(() => {
        // Update Groups:
        groups.forEach(group => group.update());
        // Ungrouped Players:
        const query = {
            'tags': [`linked`]
        };
        // For all players that have linked their accounts and aren't in a group
        for (const player of world.getPlayers(query)) {
            if (groupedPlayers.has(player.name) === true) continue;
            query.excludeNames = [`${player.name}`];
            // For the other player that isn't in a group
            for (const otherPlayer of world.getPlayers(query)) {
                if (groupedPlayers.has(otherPlayer.name) === true) continue;
                const { xDist, yDist, zDist, hDist } = CalculateDistance(otherPlayer.location, player.location);
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
            for (let group of groups) {
                const { xDist, yDist, zDist, hDist } = CalculateDistance(group.center, player.location);
                const inRange = hDist <= group.range.h && yDist <= group.range.v && player.dimension.id === group.dimension ? true : false;
                if (inRange === true) group.addPlayer(player.name);
            }
        }

        // Group Merging:
        groups.forEach(group => {
            groups.forEach(otherGroup => {
                if (otherGroup.id === group.id) return;
                const { xDist, yDist, zDist, hDist } = CalculateDistance(otherGroup.center, group.center);

                if ((hDist <= (group.range.h + otherGroup.range.h) / 2) && (yDist <= (group.range.v + otherGroup.range.v) / 2)) {
                    otherGroup.players.forEach(playerName => {
                        group.players.add(playerName);
                    })
                    group.getCenter();
                    DBRequests.Merge(group.id, otherGroup.id);
                    groups.delete(otherGroup);
                    return;
                }
            })
        })
    })
    world.events.playerLeave.subscribe(event => {
        groupedPlayers.delete(event.playerName);
        groups.forEach(group => {
            group.removePlayer(event.playerName);
        })
    })
}

class Group {
    range = {
        h: variables.get("horzontal-range"),
        v: variables.get("vertical-range")
    }
    dimension = '';
    players = new Set();
    constructor(playerArray) {
        let x = 0;
        let y = 0;
        let z = 0;
        playerArray.forEach((player, i) => {
            this.players.add(player.name);
            if (i === 0) {
                this.dimension = player.dimension.id;
            }
            x += player.location.x;
            y += player.location.y;
            z += player.location.z;
        })
        this.center = new Location(x / 2, y / 2, z / 2);
        this.id = Math.round(Math.random() * 99999999).toString().padStart(8, '0');
        this.getRange();
        DBRequests.Create(this.id, [...this.players]);
    }
    addPlayer(playername) {
        groupedPlayers.add(playername);
        this.players.add(playername);
        this.getCenter();
        this.getRange();
        DBRequests.Add(this.id, playername);
    }
    removePlayer(playername) {
        groupedPlayers.delete(playername);
        this.players.delete(playername);
        if (this.players.size <= 1) {
            this.players.forEach(player => {
                groupedPlayers.delete(player);
            })
            DBRequests.Disband(this.id);
            groups.delete(this);
        } else {
            this.getRange();
            this.getCenter();
            DBRequests.Remove(this.id, playername);
        }
    }
    outOfBounds(player) {
        const { xDist, yDist, zDist, hDist } = CalculateDistance(player.location, this.center);
        const outsideRange = hDist <= this.range.h && yDist <= this.range.v && player.dimension.id === this.dimension ? false : true;
        if (outsideRange === true || player.hasTag('linked') === false) {
            // world.getDimension('overworld').runCommand(`say ${player.name} was outside group range (hDist: ${hDist}).`);
            this.removePlayer(player.name);
        }
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
                    modifier++;
                }
            }
        })
        x /= (this.players.size - modifier);
        y /= (this.players.size - modifier);
        z /= (this.players.size - modifier);
        try {
            const { xDist, yDist, zDist, hDist } = CalculateDistance({ x, y, z }, this.center);
            const outsideRange = hDist <= this.range.h / 2 && yDist <= this.range.v / 2 ? false : true;
            if (outsideRange === false) {
                this.center = new Location(x, y, z);
            }
        } catch {}
    }
    getRange() {
        const addition = (this.players.size - 1) * variables.get("player-addition");
        this.range.h = variables.get("horizontal-range") / 2 + addition;
        this.range.v = variables.get("vertical-range") / 2 + addition;
    }
    update() {
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