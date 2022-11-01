import { ChatEvent } from "@minecraft/server";
import { variables } from "@minecraft/server-admin";
import { http, HttpRequest, HttpRequestMethod } from "@minecraft/server-net";

/**
 * Chat event callback. Used in `ChatEventSignal.subscribe`
 * @param {ChatEvent} event 
 */
export function chat(event) {
    const request = new HttpRequest(`http://localhost:8081/api`);
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