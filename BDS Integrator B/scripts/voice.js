import { world, Location } from "@minecraft/server";
import { variables } from "@minecraft/server-admin";
import { DBRequests } from "./requests";

const groups = new Set();
const groupedPlayers = new Set();

/**
 * Calculate the distance in blocks between two 3D points.
 * @typedef {{x: number, y: number, z: number}} Location
 * @param {Location} origin The first location.
 * @param {Location} comparison The second location.
 * @returns {number} The distance between both points.
 */
function CalculateDistance(origin, comparison) {
    const xDist = origin.x - comparison.x;
    const yDist = origin.y - comparison.y;
    const zDist = origin.z - comparison.z;
    return Math.sqrt(xDist*xDist + yDist*yDist + zDist*zDist);
}

export function setupVoice() {
    world.events.tick.subscribe(() => {
        // Update Groups:
        groups.forEach(group => group.update());
        // Ungrouped Players:
        const query = { 'tags': [`linked`] };
        // For all players that have linked their accounts and aren't in a group
        for (const player of world.getPlayers(query)) {
            if (groupedPlayers.has(player.name)) continue;
            query.excludeNames = [player.name];
            // For the other player that isn't in a group
            for (const otherPlayer of world.getPlayers(query)) {
                if (groupedPlayers.has(otherPlayer.name)) continue;
                const dist = CalculateDistance(otherPlayer.location, player.location);
                const inRange = dist <= variables.get("group-range") && player.dimension.id === otherPlayer.dimension.id;
                if (!inRange) continue;
                groups.add(new Group(player, otherPlayer));
                return;
            }
            // If no other players that were groupless were found, look for groups to join instead
            for (const group of groups) {
                const dist = CalculateDistance(group.center, player.location);
                const inRange = dist <= group.range && player.dimension.id === group.dimension;
                if (inRange) group.addPlayer(player.name);
            }
        }

        // Group Merging:
        groups.forEach(group => {
            groups.forEach(otherGroup => {
                if (otherGroup.id === group.id) return;
                const dist = CalculateDistance(otherGroup.center, group.center);
                if (dist <= (group.range + otherGroup.range) / 2) {
                    otherGroup.players.forEach(playerName => {
                        group.players.add(playerName);
                    })
                    DBRequests.Merge(group.id, otherGroup.id);
                    groups.delete(otherGroup);
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

class Group {
    players = new Set();
    constructor(...players) {
        let x = 0;
        let y = 0;
        let z = 0;
        players.forEach((player, i) => {
            groupedPlayers.add(player.name);
            this.players.add(player.name);
            x += player.location.x;
            y += player.location.y;
            z += player.location.z;
            if (i === 0) {
                this.dimension = player.dimension.id;
            }
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
        if (!this.players.has(playername) || this.players.size <= 1) return;
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
    outOfBoundsCheck() {
        this.players.forEach(playerName => {
            const query = { 'name': playerName };
            for (const player of world.getPlayers(query)) {
                const dist = CalculateDistance(player.location, this.center);
                const outsideRange = dist <= this.range && player.dimension.id === this.dimension ? false : true;
                if (outsideRange === true || player.hasTag('linked') === false) {
                    this.removePlayer(player.name);
                    if (this.players.size <= 1) return;
                }
            }
        })
    }
    getCenter() {
        let x = 0;
        let y = 0;
        let z = 0;
        let total = 0;
        this.players.forEach(playerName => {
            const query = { 'name': playerName };
            for (const player of world.getPlayers(query)) {
                if (player.location.x === undefined || player.location.y === undefined || player.location.z === undefined) continue;
                x += player.location.x * 1;
                y += player.location.y * 1;
                z += player.location.z * 1;
                total++;
            }
        })
        x /= total;
        y /= total;
        z /= total;
        try {
            const dist = CalculateDistance({ x, y, z }, this.center);
            if (dist <= this.range / 2) {
                this.center = new Location(x, y, z);
            }
        } catch { }
    }
    getRange() {
        const addition = (this.players.size - 2) * variables.get("player-addition") + variables.get("player-addition") / 2;
        this.range = variables.get("group-range") / 2 + addition;
    }
    update() {
        this.getCenter();
        this.outOfBoundsCheck();
    }
}