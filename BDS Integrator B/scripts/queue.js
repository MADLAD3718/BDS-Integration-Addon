import { world } from "@minecraft/server";
import { variables } from "@minecraft/server-admin";
import { http, HttpRequest, HttpRequestMethod } from "@minecraft/server-net";

export function queueCheck(interval) {
    world.events.tick.subscribe(event => {
        // Run this every interval seconds
        if (event.currentTick % (20 * interval) === 0) {
            const request = new HttpRequest(variables.get("webserver-address"));
            request.addHeader("Content-Type", "application/json")
            request.addHeader("mc-data-type", "server-queue")
            request.addHeader("server-uuid", variables.get('server-uuid'))
            request.method = HttpRequestMethod.GET;

            http.request(request).then(response => {
                // world.getDimension('overworld').runCommand(`say Response: ${response.body}`);
                JSON.parse(response.body).forEach(op => {
                    world.getDimension('overworld').runCommand(op);
                })
            });
        }
    })
}