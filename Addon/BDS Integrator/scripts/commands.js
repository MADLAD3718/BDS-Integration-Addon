<<<<<<< Updated upstream
import { BeforeChatEvent, world } from "mojang-minecraft";
=======
import { world } from "mojang-minecraft";
import { variables } from "mojang-minecraft-server-admin";
>>>>>>> Stashed changes
import { http, HttpRequest, HttpRequestMethod } from "mojang-net";

/**
 * BeforeChat event callback. Used in `BeforeChatEventSignal.subscribe`
 * @param {BeforeChatEvent} event
 */
export function commands(event) {
        if (event.message.startsWith("!bds") === false) return
        event.cancel = true;
        const command = event.message.slice(4).trim();
        switch (command) {
            case `link`:
                const code = `${Math.round(Math.random() * 9999)}`.padStart(4, '0');
                const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
                request.addHeader("Content-Type", "application/json")
                request.addHeader("mc-data-type", "account-link")
                request.addHeader("server-uuid", variables.get('server-uuid'))
                request.body = JSON.stringify({
                    username: event.sender.name,
                    code: code
                })
                request.method = HttpRequestMethod.POST;

                http.request(request);

                event.sender.runCommand(`tellraw @s {"rawtext":[{"text":"Use §d/link§r in DMs with the BDS Integration bot using code §a${code}§r to link your Minecraft account with Discord."}]}`);
                break;
            case `unlink`:
                const unlinkRequest = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
                unlinkRequest.addHeader("Content-Type", "application/json")
                unlinkRequest.addHeader("mc-data-type", "account-unlink")
                unlinkRequest.addHeader("server-uuid", variables.get('server-uuid'))
                unlinkRequest.body = JSON.stringify({
                    username: event.sender.name
                })
                unlinkRequest.method = HttpRequestMethod.POST;

                http.request(unlinkRequest);
                break;
            default:
                event.sender.runCommand(`tellraw @s {"rawtext":[{"text":"§fList of !bds commands:\n§r§7!bds link§r\n§8Generates a code to link your Minecraft account with discord.§r\n§r§7!bds unlink§r\n§8Unlinks your Minecraft account from discord.§r"}]}`);
                break;
        }
}