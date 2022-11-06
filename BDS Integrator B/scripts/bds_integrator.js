import { announceJoins, announceDeaths, announceLeaves, announceDays, announceBossKills, announceWitherKills } from "./announcements";
import { variables } from "@minecraft/server-admin";
import { world } from "@minecraft/server";
import { DBRequests } from "./requests";
import { commands } from "./commands";
import { messages } from "./messages";
import { setupVoice } from "./voice";
import { queueCheck } from "./queue";
import { chat } from "./chat";

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
        if (variables.get("announcements").deaths === true) world.events.entityHurt.subscribe(announceDeaths);
        if (variables.get("announcements").days === true) world.events.tick.subscribe(announceDays);
        if (variables.get("announcements").connections === true) {
            world.events.playerJoin.subscribe(announceJoins);
            world.events.playerLeave.subscribe(announceLeaves);
        }
        if (variables.get("announcements").bosses === true) {
            world.events.entityHurt.subscribe(announceBossKills);
            world.events.entityHit.subscribe(announceWitherKills);
        }
    }
    if (variables.get("voice-chat").enabled === true) setupVoice();
    queueCheck(0.5);
}));