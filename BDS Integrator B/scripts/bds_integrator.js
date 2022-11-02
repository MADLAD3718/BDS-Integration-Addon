import { world } from "@minecraft/server";
import { variables } from "@minecraft/server-admin";
import { DBRequests } from "./requests";
import { chat } from "./chat";
import { commands } from "./commands";
import { setupVoice } from "./voice";
import { queueCheck } from "./queue";
import { messages } from "./messages";
import { announceKills } from "./announcements";

world.events.worldInitialize.subscribe(() => {
    DBRequests.Initialize().then(response => {
        const validUUID = JSON.parse(response.body);
        world.events.beforeChat.subscribe(event => commands(event, validUUID));
        if (validUUID === false) {
            world.say(messages.invalidUUID);
            return;
        }

        world.say(messages.validUUID);
        if (variables.get("enable-chat") === true) world.events.chat.subscribe(chat);
        if (variables.get("announce-kills") === true && variables.get("enable-chat") === true) world.events.entityHurt.subscribe(announceKills);
        if (variables.get("enable-voice") === true) setupVoice();
        queueCheck(0.5);
    });
});