import { world } from "@minecraft/server";
import { DBRequests } from "./requests";

export function queueCheck(interval) {
    world.events.tick.subscribe(event => {
        // Run this every interval seconds
        if (event.currentTick % (20 * interval) === 0) DBRequests.GetQueue().then(response => {
            JSON.parse(response.body).forEach(op => {
                if (op.startsWith('run:') === false) world.getDimension('overworld').runCommandAsync(op).catch();
                else world.getDimension('overworld').runCommandAsync(op.replace('run:', '')).then(
                    () => DBRequests.RespondCommand(`Successfully ran \`/${op.replace('run:', '')}\`.`)
                ).catch(
                    output => DBRequests.RespondCommand(output)
                )
            });
        })
    })
}