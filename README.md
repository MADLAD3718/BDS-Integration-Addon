# BDS-Integration-Addon
A BDS add-on used to integrate bedrock servers with Discord. This add-on takes advantage of the HTTP protocol functions available in the `@minecraft/server-net` scripting module to interface with a Discord bot to achieve proximity voice chat and shared text communication.

## Proximity Voice Chat:
Proximity voice chat is achieved through organizing players into discrete groups, and sending the information to a Discord bot that manages a voice channel for every group. The bot creates and deletes voice channels according to the creation and deletion of player groups, and moves corresponding players into the voice channel of their current group.

I created a [custom clustering argorithm](./BDS%20Integrator%20B/scripts/voice.js#L24) for the add-on after exploring a few commonly used argorithms (including DBScan) and concluding that none of them could sufficiently fulfill my project goals.

    for each cluster:
        update cluster center;
        for each player in cluster:
            if player not in range of cluster:
                remove player;

    for each non-clustered player do:
        for every other non-clustered player:
            if player in range of other player:
                add both players to new cluster;
        for each cluster:
            if player in range of cluster:
                add player to cluster;

    for each cluster:
        for every other cluster:
            if cluster in range of other cluster:
                merge cluster into other cluster;

The cluster center is calcultated by taking the average position of all players within the cluster. Initially cluster ranges were cylindrical, but after various playtesting sessions I determined that spherical ranges led to a better experience with the add-on. Cluster ranges are increased for every player within them, to prevent players from being left behind after a cluster merge.

## Shared Text Communication:
Shared text communication is achieved through a [simple relay](./BDS%20Integrator%20B/scripts/chat.js#L8) to the Discord bot. Text messages written by players in game are sent to the webserver hosting the bot, where the bot relays the messages in a text channel.

This functionality is additionally used to [announce certain events](./BDS%20Integrator%20B/scripts/announcements.js#L9) that transpire in game, such as a player death or the defeat of a high-difficulty enemy.

Demo Video:
[![](https://img.youtube.com/vi/hPShwWwmTR4/maxresdefault.jpg)](http://www.youtube.com/watch?v=hPShwWwmTR4)