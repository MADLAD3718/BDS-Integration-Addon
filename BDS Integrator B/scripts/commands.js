import { BeforeChatEvent } from "@minecraft/server";
import { variables } from "@minecraft/server-admin";
import { DBRequests } from "./requests";
import { messages } from "./messages";

/**
 * BeforeChat event callback. Used in `BeforeChatEventSignal.subscribe`
 * @param {BeforeChatEvent} event
 */
export function commands(event, validUUID) {
    // change all characters to lower case so it's not case sensitive
    if (event.message.toLowerCase().startsWith(variables.get("command-prefix")) === false) return;
    event.cancel = true;
    const sender = event.sender;
    if (validUUID === false) {
        sender.runCommandAsync(`tellraw @s {"rawtext":[{"text":"${messages.invalidUUID}"}]}`).catch();
        return;
    }
    // change all characters to lower case so it's not case sensitive
    const command = event.message.slice(4).trim().toLowerCase();
    switch (command) {
        case `link`:
            DBRequests.link(sender).then(response => {
                sender.runCommandAsync(`tellraw "${sender.name}" {"rawtext":[{"text":"${JSON.parse(response.body)}"}]}`).catch();
            });
            break;
        case `unlink`:
            DBRequests.unlink(sender);
            break;
        case `status`:
            sender.runCommandAsync(`tellraw @s {"rawtext":[{"text":"${messages.status(sender)}"}]}`).catch();
            break;
        default:
            sender.runCommandAsync(`tellraw @s {"rawtext":[{"text":"${messages.commands}"}]}`).catch();
            break;
    }
}