import { world } from "@minecraft/server";
import { variables } from "@minecraft/server-admin";
import { http, HttpRequest, HttpRequestMethod } from "@minecraft/server-net";
import { chat } from "./chat";
import { commands } from "./commands";
import { setupVoice } from "./voice";
import { queueCheck } from "./queue";
import { messages } from "./messages";

world.events.worldInitialize.subscribe(() => {
    const request = new HttpRequest(`http://localhost:8081/api`);
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
            world.getDimension('overworld').runCommandAsync(`tellraw @a {"rawtext":[{"text":"${messages.invalidUUID}"}]}`);
            return;
        }

        world.getDimension('overworld').runCommandAsync(`tellraw @a {"rawtext":[{"text":"${messages.validUUID}"}]}`);
        world.getDimension('overworld').runCommandAsync(`tag @a remove grouped`);

        if (variables.get("enable-chat") === true) {
            world.events.chat.subscribe(chat);
        }

        if (variables.get("enable-voice") === true) {
            setupVoice();
        }

        queueCheck(0.5);
    });
});