import { world } from "mojang-minecraft";
import { variables } from "mojang-minecraft-server-admin";
import { http, HttpRequest, HttpRequestMethod } from "mojang-net";

export function queueCheck(interval) {
    world.events.tick.subscribe(event => {
        // Run this every interval seconds
        if (event.currentTick % (20 * interval) === 0) {
            const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
            request.addHeader("Content-Type", "application/json")
            request.addHeader("mc-data-type", "server-queue")
            request.addHeader("server-uuid", variables.get('server-uuid'))
            request.method = HttpRequestMethod.GET;

            http.request(request).then(response => {
                // world.getDimension('overworld').runCommand(`say Response: ${response.body}`);
                JSON.parse(response.body).forEach((op, i) => {
                    world.getDimension('overworld').runCommand(op);
                })
            });
        }
    })
}