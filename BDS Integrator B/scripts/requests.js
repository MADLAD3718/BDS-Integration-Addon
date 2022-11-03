import { Player } from "@minecraft/server";
import { variables } from "@minecraft/server-admin";
import { http, HttpRequest, HttpRequestMethod } from "@minecraft/server-net";

/**
 * Includes template methods for discord integration based HTTP requests.
 */
export class DBRequests {
    /**
     * Makes a request to the database to merge a group with another.
     * @param {number} mergedGroupId The ID of the group to move players to.
     * @param {number} deletedGroupId The ID of the group to remove players from and delete.
     * @returns
     */
    static Merge(mergedGroupId, deletedGroupId) {
        const request = new HttpRequest(variables.get("webserver-address"));
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "voice-group-merge")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            merged: mergedGroupId,
            deleted: deletedGroupId
        })
        request.method = HttpRequestMethod.POST;
        return http.request(request);
    }
    /**
     * Makes a request to the database to create a new group with the given players.
     * @param {number} groupId The ID of the group to create.
     * @param {string[]} members The members to add to the group.
     * @returns
     */
    static Create(groupId, members) {
        const request = new HttpRequest(variables.get("webserver-address"));
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "voice-group-create")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            group: groupId,
            members: members
        })
        request.method = HttpRequestMethod.POST;

        return http.request(request);
    }
    /**
     * Makes a request to the database to add a player to a group.
     * @param {number} groupId The ID of the group to add the player to.
     * @param {string} playerName The player to add to the group.
     * @returns
     */
    static Add(groupId, playerName) {
        const request = new HttpRequest(variables.get("webserver-address"));
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "voice-group-add")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            group: groupId,
            newMember: playerName
        })
        request.method = HttpRequestMethod.POST;

        return http.request(request);
    }
    /**
     * Makes a request to the database to disband a group.
     * @param {number} groupId The ID of the group to delete.
     * @returns
     */
    static Disband(groupId) {
        const request = new HttpRequest(variables.get("webserver-address"));
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "voice-group-disband")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            group: groupId
        })
        request.method = HttpRequestMethod.POST;

        return http.request(request);
    }
    /**
     * Makes a request to the database to remove a player from a group.
     * @param {number} groupId The ID of the group to remove the player from.
     * @param {string} playerName The player to remove from the group.
     * @returns
     */
    static Remove(groupId, playerName) {
        const request = new HttpRequest(variables.get("webserver-address"));
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "voice-group-remove")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            group: groupId,
            removedMember: playerName
        })
        request.method = HttpRequestMethod.POST;

        return http.request(request);
    }
    /**
     * Makes a request to the database to display a chat message.
     * @param {string} author The message author's name.
     * @param {string} message The chat message contents.
     * @returns
     */
    static Message(author, message) {
        const request = new HttpRequest(variables.get("webserver-address"));
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "chat-message")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            username: author,
            message: message
        })
        request.method = HttpRequestMethod.POST;

        return http.request(request);
    }
    /**
     * Makes a request to the database to announce something to the integrated discord text channel.
     * @param {string} announcement The announcement message.
     * @returns
     */
    static Announce(announcement) {
        if (variables.get("enable-chat") === false) throw new Error("Chat integration is not enabled on the server!");
        const request = new HttpRequest(variables.get("webserver-address"));
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "announcement")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            announcement: announcement
        })
        request.method = HttpRequestMethod.POST;

        return http.request(request);
    }
    /**
     * Makes a server initialization/reload request to the database.
     */
    static Initialize() {
        const request = new HttpRequest(variables.get("webserver-address"));
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "server-init")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            chat: variables.get("enable-chat"),
            voice: variables.get("enable-voice")
        })
        request.method = HttpRequestMethod.POST;

        return http.request(request)
    }
    /**
     * Makes a request to get the server's queue from the database.
     * @returns
     */
    static GetQueue() {
        const request = new HttpRequest(variables.get("webserver-address"));
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "server-queue")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.method = HttpRequestMethod.GET;

        return http.request(request);
    }
    /**
     * Makes a request to the database to link a Minecraft player with a discord account.
     * @param {Player} player The player linking with a discord account.
     * @returns
     */
    static Link(player) {
        const request = new HttpRequest(variables.get("webserver-address"));
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "account-link")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            username: player.name,
            hasTag: player.hasTag('linked')
        })
        request.method = HttpRequestMethod.POST;

        return http.request(request)
    }
    /**
     * Makes a request to the database to unlink a Minecraft player from their discord account.
     * @param {Player} player The player unlinking from their discord account.
     * @returns
     */
    static Unlink(player) {
        const unlinkRequest = new HttpRequest(variables.get("webserver-address"));
        unlinkRequest.addHeader("Content-Type", "application/json")
        unlinkRequest.addHeader("mc-data-type", "account-unlink")
        unlinkRequest.addHeader("server-uuid", variables.get('server-uuid'))
        unlinkRequest.body = JSON.stringify({
            username: player.name
        })
        unlinkRequest.method = HttpRequestMethod.POST;

        return http.request(unlinkRequest);
    }
}