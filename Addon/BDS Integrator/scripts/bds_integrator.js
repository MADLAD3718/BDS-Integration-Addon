import { world } from "mojang-minecraft";
import { http, HttpRequest, HttpRequestMethod } from "mojang-net";
import { variables } from "mojang-minecraft-server-admin";
import { chat } from "./chat";
import { commands } from "./commands";
import { voice } from "./voice";
import { queueCheck } from "./queue";

world.events.worldInitialize.subscribe(() => {
    const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
    request.addHeader("Content-Type", "application/json")
    request.addHeader("mc-data-type", "server-init")
    request.addHeader("server-uuid", variables.get('server-uuid'))
    request.body = JSON.stringify({
        chat: variables.get("enable-chat"),
        voice: variables.get("enable-voice"),
        horizontal_range: variables.get("horizontal-range"),
        vertical_range: variables.get("vertical-range"),
        leave_threshold: variables.get("leave-threshold")
    })
    request.method = HttpRequestMethod.POST;

    http.request(request);
})

if (variables.get("enable-chat") === true) {
    chat();
}

if (variables.get("enable-voice") === true) {
    voice();
}

commands();
queueCheck(1);