import { world } from "@minecraft/server";
import { DBRequests } from "./requests";

export function queueCheck(interval) {
    world.events.tick.subscribe(event => {
        // Run this every interval seconds
        if (event.currentTick % (20 * interval) === 0) DBRequests.GetQueue().then(response => {
            JSON.parse(response.body).forEach(op => {
                world.getDimension('overworld').runCommandAsync(op).catch();
            })
        })
    })
}