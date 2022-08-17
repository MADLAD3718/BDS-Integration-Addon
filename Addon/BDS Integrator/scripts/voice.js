import { world, TickEvent, Location, EntityQueryOptions } from "mojang-minecraft";
import { variables } from "mojang-minecraft-server-admin";
import { http, HttpRequest, HttpRequestMethod } from "mojang-net";

const groups = [];

/** 
 * TickEvent callback. Used in `TickEventSignal.subscribe`
 * @param {TickEvent} event 
 */
export function voice(event) {
    // Update player db for server once every (interval) seconds
    const interval = 5;
    if (event.currentTick % (interval * 20) === 0) {
        // Start Groups from nothing
        for (const player of world.getPlayers()) {
            const query = new EntityQueryOptions();
            query.excludeNames = [`${player.name}`];
            query.excludeTags = [`grouped`];
            for (const otherPlayer of world.getPlayers(query)) {
                const xDist = Math.abs(otherPlayer.location.x - player.location.x);
                const yDist = Math.abs(otherPlayer.location.y - player.location.y);
                const zDist = Math.abs(otherPlayer.location.z - player.location.z);

                const hDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(zDist, 2));
                const inRange = hDist <= variables.get("horizontal-range") && yDist <= variables.get("vertical-range") ? true : false;

                if (inRange === true) {
                    player.addTag(`grouped`)
                    otherPlayer.addTag(`grouped`)
                    groups.push(
                        new Group(player, otherPlayer)
                    )
                    world.getDimension('overworld').runCommand(`say Grouped ${player.name} & ${otherPlayer.name}`);
                }
            }
        }
        // Update Groups
        groups.forEach(group => {
            group.getCenter();
        })
    }
}


class Group {
    center = new Location(0, 0, 0);
    players = [];
    constructor(...args) {
        args.forEach(player => {
            this.players.push(player);
        })
        this.getCenter();
    }
    addPlayer(player) {
        this.players.push(player);
        this.getCenter();
    }
    removePlayer(player) {
        this.players.splice(this.players.indexOf(player));
        this.getCenter();
    }
    getCenter() {
        if (this.players.length === 0) {
            delete this;
            return;
        }
        let cx = 0;
        let cy = 0;
        let cz = 0;
        this.players.forEach(groupedPlayer => {
            const x = groupedPlayer.location.x;
            const y = groupedPlayer.location.y;
            const z = groupedPlayer.location.z;
            cx += x;
            cy += y;
            cz += z;
        })
        cx /= this.players.length;
        cy /= this.players.length;
        cz /= this.players.length;
        world.getDimension('overworld').runCommand(`say Recalculated center to be at (${Math.round(cx)}, ${Math.round(cy)}, ${Math.round(cz)})`);
        this.center = new Location(cx, cy, cz);
        return this.center;
    }
}