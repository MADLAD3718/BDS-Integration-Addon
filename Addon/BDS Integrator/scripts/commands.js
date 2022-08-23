import { BeforeChatEvent } from "mojang-minecraft";
import { variables } from "mojang-minecraft-server-admin";
import { http, HttpRequest, HttpRequestMethod } from "mojang-net";
import { messages } from "./messages";

/**
 * BeforeChat event callback. Used in `BeforeChatEventSignal.subscribe`
 * @param {BeforeChatEvent} event
 */
export function commands(event, validUUID) {
    // change all characters to lower case so it's not case sensitive
    if (event.message.toLowerCase().startsWith("!bds") === false) return;
    event.cancel = true;
    const sender = event.sender;
    if (validUUID === false) {
        sender.runCommand(`tellraw @s {"rawtext":[{"text":"${messages.invalidUUID}"}]}`);
        return;
    }
    // change all characters to lower case so it's not case sensitive
    const command = event.message.slice(4).trim().toLowerCase();
    switch (command) {
        case `link`:
            const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
            request.addHeader("Content-Type", "application/json")
            request.addHeader("mc-data-type", "account-link")
            request.addHeader("server-uuid", variables.get('server-uuid'))
            request.body = JSON.stringify({
                username: sender.name,
                hasTag: sender.hasTag('linked')
            })
            request.method = HttpRequestMethod.POST;

            http.request(request).then(response => {
                sender.runCommand(`tellraw "${sender.name}" {"rawtext":[{"text":"${JSON.parse(response.body)}"}]}`);
            });
            break;
        case `unlink`:
            const unlinkRequest = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
            unlinkRequest.addHeader("Content-Type", "application/json")
            unlinkRequest.addHeader("mc-data-type", "account-unlink")
            unlinkRequest.addHeader("server-uuid", variables.get('server-uuid'))
            unlinkRequest.body = JSON.stringify({
                username: sender.name
            })
            unlinkRequest.method = HttpRequestMethod.POST;

            http.request(unlinkRequest);
            break;
        case `status`:
            sender.runCommand(`tellraw @s {"rawtext":[{"text":"${messages.status(sender)}"}]}`);
            break;
        default:
            sender.runCommand(`tellraw @s {"rawtext":[{"text":"${messages.commands}"}]}`);
            break;
    }
}