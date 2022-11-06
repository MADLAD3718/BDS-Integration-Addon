import { world } from "@minecraft/server";
import { variables } from "@minecraft/server-admin";
import { DBRequests } from "./requests";
import { announceJoins, announceDeaths, announceLeaves, announceDays } from "./announcements";
import { chat } from "./chat";
import { commands } from "./commands";
import { setupVoice } from "./voice";
import { queueCheck } from "./queue";
import { messages } from "./messages";

world.events.worldInitialize.subscribe(() => DBRequests.Initialize().then(response => {
    const validUUID = JSON.parse(response.body);
    world.events.beforeChat.subscribe(event => commands(event, validUUID));
    if (validUUID === false) {
        world.say(messages.invalidUUID);
        return;
    }

    world.say(messages.validUUID);
    if (variables.get("enable-chat") === true) {
        world.events.chat.subscribe(chat);
        if (variables.get("announce-deaths") === true) world.events.entityHurt.subscribe(announceDeaths);
        if (variables.get("announce-join-leave") === true) {
            world.events.playerJoin.subscribe(announceJoins);
            world.events.playerLeave.subscribe(announceLeaves);
        }
        if (variables.get("announce-days") === true) {
            world.events.tick.subscribe(announceDays)
        }
    }
    if (variables.get("enable-voice") === true) setupVoice();
    queueCheck(0.5);
}));