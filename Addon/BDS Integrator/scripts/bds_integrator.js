import { world } from "mojang-minecraft";
import { variables } from "mojang-minecraft-server-admin";
import { chat } from "./chat";
import { commands } from "./commands";
import { voice } from "./voice";
import { queueCheck } from "./queue";
import { http, HttpRequest, HttpRequestMethod } from "mojang-net";
import { messages } from "./messages";

world.events.worldInitialize.subscribe(() => {
    const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
    request.addHeader("Content-Type", "application/json")
    request.addHeader("mc-data-type", "server-init")
    request.addHeader("server-uuid", variables.get('server-uuid'))
    request.body = JSON.stringify({
        chat: variables.get("enable-chat"),
        voice: variables.get("enable-voice")
    })
    request.method = HttpRequestMethod.POST;
    http.request(request).then(response => {
        const validUUID = JSON.parse(response.body);

        world.events.beforeChat.subscribe(event => commands(event, validUUID));

        if (validUUID === false) {
            try {
                world.getDimension('overworld').runCommand(`tellraw @a {"rawtext":[{"text":"${messages.invalidUUID}"}]}`);                
            } catch {}
            return;
        }

        try {
            world.getDimension('overworld').runCommand(`tellraw @a {"rawtext":[{"text":"${messages.validUUID}"}]}`);
            world.getDimension('overworld').runCommand(`tag @a remove grouped`);
        } catch {}


        if (variables.get("enable-chat") === true) {
            world.events.chat.subscribe(chat);
        }

        if (variables.get("enable-voice") === true) {
            voice();
        }

        queueCheck(1);
    });
});


