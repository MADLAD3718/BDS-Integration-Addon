import { variables } from "mojang-minecraft-server-admin";
import { chat } from "./chat";
import { commands } from "./commands";
import { voice } from "./voice";

if (variables.get("enable-chat") === true) {
    chat();
}

if (variables.get("enable-voice") === true) {
    voice();
}

commands();