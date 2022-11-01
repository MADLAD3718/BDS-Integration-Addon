import { variables } from "@minecraft/server-admin"

export const messages = {
    invalidUUID: `UUID §a${variables.get("server-uuid")}§r is not a valid V4 UUID! Be sure to set your server's UUID in §7config/default/variables§r to a valid one!`,
    validUUID: `Valid server UUID. Connected to the BDS Integration database.`,
    status: (sender) => {
        let message = `Server connected to the BDS Integration database.\n§7Chat: §a${variables.get("enable-chat")}§r\n§7Voice: §a${variables.get("enable-voice")}§r`;
        const linked = sender.hasTag('linked');
        const linkDisplay = linked ? `§atrue§r` : `§4false§r`;
        if (variables.get("enable-voice") === true) message += `\n§8Group Range: §a${variables.get("group-range")}\n§8Player Addition: §a${variables.get("player-addition")}§r`;
        message += `\nLink Status: ${linkDisplay}`;
        return message;
    },
    commands: `List of !bds commands:\n§7!bds link§r\n§8Generates a code to link your Minecraft account with discord.§r\n§7!bds unlink§r\n§8Unlinks your Minecraft account from discord.§r\n§7!bds status§r\n§8Displays the status of your connection with BDS Integration.§r`
}