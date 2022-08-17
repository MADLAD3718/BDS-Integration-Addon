import { world, TickEvent } from "mojang-minecraft";
import { variables } from "mojang-minecraft-server-admin";
import { http, HttpRequest, HttpRequestMethod } from "mojang-net";

/** 
 * TickEvent callback. Used in `TickEventSignal.subscribe`
 * @param {TickEvent} event 
 */
export function voice(event) {
        // Update player db for server once every (interval) seconds
        const interval = 5;
        if (event.currentTick % (interval * 20) === 0) {
            const players = {};
            for (const player of world.getPlayers()) {
                players[player.name] = {
                    dimension: player.dimension.id,
                    position: { x: player.location.x, y: player.location.y, z: player.location.z }
                }
            }

            const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
            request.addHeader("Content-Type", "application/json")
            request.addHeader("mc-data-type", "player-positions")
            request.addHeader("server-uuid", variables.get('server-uuid'))
            request.body = JSON.stringify(players)
            request.method = HttpRequestMethod.POST;

            http.request(request);
        }
}