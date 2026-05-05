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

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId("pause").setEmoji("⏯️").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("autoplay").setEmoji("📻").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("247").setEmoji("⏳").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger),
        );

    channel.send({ embeds: [embed], components: [row] }).then(msg => {
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
    
    // Smart Autoplay Logic (YouTube Recommendations)
    if (player.data.get("autoplay")) {
        const lastTrack = player.data.get("lastTrack");
        if (lastTrack && lastTrack.uri) {
            try {
                // Get real YouTube recommendations using play-dl
                const videoInfo = await play.video_info(lastTrack.uri);
                const related = videoInfo.related_videos;

                if (related && related.length > 0) {
                    // Pick a random song from top 5 recommendations for variety
                    const randomIndex = Math.floor(Math.random() * Math.min(related.length, 5));
                    const nextUrl = related[randomIndex];
                    
                    const result = await client.kazagumo.search(nextUrl, { requester: client.user });
                    
                    if (result.tracks.length) {
                        player.queue.add(result.tracks[0]);
                        player.play();
                        return;
                    }
                }
            } catch (e) {
                console.error("Autoplay Error:", e);
                if (channel) channel.send("⚠️ Autoplay failed to find recommendation.");
            }
        }
    }

    if (channel) channel.send("📭 The queue is empty.");
    
    // Check 24/7 mode
    if (player.data.get("247")) return;
    
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
