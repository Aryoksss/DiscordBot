require("dotenv").config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Connectors } = require("shoukaku");
const { Kazagumo, Plugins } = require("kazagumo");
const play = require("play-dl");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const Nodes = [
    {
        name: "MainNode",
        url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`,
        auth: process.env.LAVALINK_PASS,
        secure: false,
    },
];

const kazagumo = new Kazagumo({
    defaultSearchEngine: "youtube",
    plugins: [
        new Plugins.PlayerMoved(client),
    ],
    send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
    },
}, new Connectors.DiscordJS(client), Nodes);

client.commands = new Collection();
client.kazagumo = kazagumo;

// Load Commands
require("./utils/commandHandler")(client);

client.on("clientReady", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    // Set default status from .env
    client.user.setActivity({
        name: process.env.STATUS || "/play",
        type: 0 // Playing
    });
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        // Check if Lavalink Node is connected
        if (!client.kazagumo.shoukaku.nodes.size || [...client.kazagumo.shoukaku.nodes.values()].every(node => node.state !== 1)) {
            return interaction.reply({ content: "⚠️ Lavalink is not ready yet. Please wait a few seconds and try again.", flags: [64] });
        }

        try {
            // Early defer for play command to prevent timeout
            if (interaction.commandName === "play") await interaction.deferReply();
            
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            const errorMessage = { content: 'There was an error while executing this command!', flags: [64] }; // 64 is Ephemeral
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    } else if (interaction.isButton()) {
        const player = client.kazagumo.players.get(interaction.guild.id);
        if (!player) return interaction.reply({ content: "No player found.", ephemeral: true });

        if (interaction.customId === "pause") {
            player.pause(!player.paused);
            await interaction.reply({ content: player.paused ? "Paused the music." : "Resumed the music.", ephemeral: true });
        } else if (interaction.customId === "skip") {
            player.skip();
            await interaction.reply({ content: "Skipped the song.", ephemeral: true });
        } else if (interaction.customId === "repeat") {
            const mode = player.loop === "track" ? "none" : "track";
            player.setLoop(mode);
            await interaction.reply({ content: `Loop mode set to **${mode}**.`, ephemeral: true });
        } else if (interaction.customId === "stop") {
            player.destroy();
            await interaction.reply({ content: "Stopped the music.", ephemeral: true });
        } else if (interaction.customId === "autoplay") {
            const mode = !player.data.get("autoplay");
            player.data.set("autoplay", mode);
            await interaction.reply({ content: `Autoplay is now **${mode ? "enabled" : "disabled"}**.`, ephemeral: true });
        } else if (interaction.customId === "247") {
            const mode = !player.data.get("247");
            player.data.set("247", mode);
            await interaction.reply({ content: `24/7 mode is now **${mode ? "enabled" : "disabled"}**.`, ephemeral: true });
        }
    }
});

client.on("voiceStateUpdate", (oldState, newState) => {
    const player = client.kazagumo.players.get(oldState.guild.id);
    if (!player) return;

    const voiceChannel = oldState.guild.channels.cache.get(player.voiceId);
    if (voiceChannel && voiceChannel.members.filter(m => !m.user.bot).size === 0) {
        if (player.data.get("247")) return;

        setTimeout(() => {
            const currentSubPlayer = client.kazagumo.players.get(oldState.guild.id);
            if (!currentSubPlayer) return;
            const currentVC = oldState.guild.channels.cache.get(currentSubPlayer.voiceId);
            if (currentVC && currentVC.members.filter(m => !m.user.bot).size === 0 && !currentSubPlayer.data.get("247")) {
                currentSubPlayer.destroy();
                const channel = client.channels.cache.get(currentSubPlayer.textId);
                if (channel) channel.send("👋 Meninggalkan voice channel karena kosong.");
            }
        }, 30000);
    }
});

kazagumo.shoukaku.on("ready", (name) => console.log(`Lavalink Node: [${name}] is now connected.`));
kazagumo.shoukaku.on("error", (name, error) => console.log(`Lavalink Node: [${name}] has an error: ${error}`));
kazagumo.shoukaku.on("close", (name, code, reason) => console.log(`Lavalink Node: [${name}] closed with code [${code}], reason: [${reason}]`));
kazagumo.shoukaku.on("disconnect", (name, players, moved) => {
    if (moved) return;
    players.map((player) => player.connection.disconnect());
    console.log(`Lavalink Node: [${name}] disconnected.`);
});

kazagumo.on("playerStart", (player, track) => {
    const channel = client.channels.cache.get(player.textId);
    if (!channel) return;

    // Delete previous now playing message if exists
    const prevMsg = player.data.get("nowPlayingMsg");
    if (prevMsg) prevMsg.delete().catch(() => {});

    const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎶 Now Playing")
        .setDescription(`[${track.title}](${track.uri})`)
        .addFields(
            { name: "Duration", value: `\`${formatTime(track.length)}\``, inline: true },
            { name: "Author", value: `\`${track.author}\``, inline: true }
        )
        .setThumbnail(track.thumbnail)
        .setFooter({ text: `Requested by ${track.requester.tag}`, iconURL: track.requester.displayAvatarURL() });

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId("pause").setEmoji("⏯️").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger),
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId("repeat").setEmoji("🔁").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("autoplay").setEmoji("📻").setStyle(player.data.get("autoplay") ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("247").setEmoji("⏳").setStyle(player.data.get("247") ? ButtonStyle.Success : ButtonStyle.Secondary),
        );

    channel.send({ embeds: [embed], components: [row1, row2] }).then(msg => {
        player.data.set("nowPlayingMsg", msg);
    });
    
    // Update Dynamic Status
    client.user.setActivity({
        name: track.title,
        type: 2 // Listening
    });

    // Save for Autoplay
    player.data.set("lastTrack", track);
});

kazagumo.on("playerEmpty", async (player) => {
    const channel = client.channels.cache.get(player.textId);
    
    // Ultra-Smart Autoplay Logic (Using YouTube Mix RD Algorithm)
    if (player.data.get("autoplay")) {
        const lastTrack = player.data.get("lastTrack");
        if (lastTrack && lastTrack.identifier) {
            try {
                // Search for YouTube Mix (RD Playlist) - This is what YouTube uses for "Up Next"
                const mixUrl = `https://www.youtube.com/watch?v=${lastTrack.identifier}&list=RD${lastTrack.identifier}`;
                const result = await client.kazagumo.search(mixUrl, { requester: client.user });
                
                if (result.tracks.length > 1) {
                    // Filter out the last track if it's the first in the mix
                    let nextTrack = result.tracks.find(t => t.identifier !== lastTrack.identifier);
                    
                    // If not found or only 1 track, pick a random one from the mix (excluding first)
                    if (!nextTrack) nextTrack = result.tracks[Math.floor(Math.random() * (result.tracks.length - 1)) + 1];

                    player.queue.add(nextTrack);
                    player.play();
                    return;
                }
            } catch (e) {
                console.error("Autoplay Mix Error:", e);
                // Ultra Fallback: Search for Artist + "related" on YouTube Music
                const fallbackResult = await client.kazagumo.search(`ytmsearch:${lastTrack.author} related`, { requester: client.user });
                if (fallbackResult.tracks.length > 2) {
                    player.queue.add(fallbackResult.tracks[Math.floor(Math.random() * 3) + 1]);
                    player.play();
                    return;
                }
            }
        }
    }

    if (channel) channel.send("📭 The queue is empty.");
    
    // Check 24/7 mode (handle undefined/null as false)
    if (player.data.get("247") === true) return;
    
    player.destroy();
    
    // Back to default status
    client.user.setActivity({
        name: process.env.STATUS || "/play",
        type: 0
    });
});

function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return `${hours > 0 ? `${hours}:` : ""}${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
}

client.login(process.env.DISCORD_TOKEN);
