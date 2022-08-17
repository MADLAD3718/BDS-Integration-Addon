import { BeforeChatEvent, world } from "mojang-minecraft";
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
                request.body = JSON.stringify({
                    username: event.sender.name,
                    code: code
                })
                request.method = HttpRequestMethod.POST;

                http.request(request);

                event.sender.runCommand(`tellraw @s {"rawtext":[{"text":"Use §d/link§r in DMs with the BDS Integration bot using code §a${code}§r to link your Minecraft account with Discord."}]}`);
                break;
            case `unlink`:
                if (event.sender.hasTag('linked')) {
                    event.sender.runCommand(`tellraw @s {"rawtext":[{"text":"Your Minecraft account is now unlinked with Discord."}]}`);
                } else {
                    event.sender.runCommand(`tellraw @s {"rawtext":[{"text":"You haven't linked your Minecraft account with discord yet!"}]}`);
                }
                break;
            default:
                event.sender.runCommand(`tellraw @s {"rawtext":[{"text":"§fList of !bds commands:\n§r§7!bds link§r\n§8Generates a code to link your Minecraft account with discord.§r\n§r§7!bds unlink§r\n§8Unlinks your Minecraft account from discord.§r"}]}`);
                break;
        }
}