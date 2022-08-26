import { ChatEvent } from "mojang-minecraft";
import { variables } from "mojang-minecraft-server-admin";
import { http, HttpRequest, HttpRequestMethod } from "mojang-net";

/**
 * Chat event callback. Used in `ChatEventSignal.subscribe`
 * @param {ChatEvent} event 
 */
export function chat(event) {
    const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
    request.addHeader("Content-Type", "application/json")
    request.addHeader("mc-data-type", "chat-message")
    request.addHeader("server-uuid", variables.get('server-uuid'))
    request.body = JSON.stringify({
        username: event.sender.name,
        message: event.message
    })
    request.method = HttpRequestMethod.POST;

    http.request(request);
}