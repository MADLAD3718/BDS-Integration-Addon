import { ChatEvent } from "@minecraft/server";
import { DBRequests } from "./requests";

/**
 * Chat event callback. Used in `ChatEventSignal.subscribe`
 * @param {ChatEvent} event 
 */
export function chat(event) {
    DBRequests.Message(event.sender.name, event.message);
}