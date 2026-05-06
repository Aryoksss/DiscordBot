const { SlashCommandBuilder } = require('discord.js');
const { getDetails, getTracks } = require('spotify-url-info')(fetch);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube or Spotify')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The song name or URL')
                .setRequired(true)),
    async execute(interaction, client) {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.editReply({ content: "You need to be in a voice channel to play music!" });
        }

        let player = client.kazagumo.players.get(interaction.guild.id);

        if (!player) {
            player = await client.kazagumo.createPlayer({
                guildId: interaction.guild.id,
                textId: interaction.channel.id,
                voiceId: voiceChannel.id,
                deaf: true,
            });
        }

        let searchQuery = query;

        // Spotify Handling via spotify-url-info
        if (query.includes("spotify.com")) {
            try {
                if (query.includes("/track/")) {
                    const data = await getDetails(query);
                    searchQuery = `${data.preview.title} ${data.preview.artist}`;
                } else {
                    const tracks = await getTracks(query);
                    for (const track of tracks) {
                        const res = await client.kazagumo.search(`${track.name} ${track.artist || track.artists[0].name}`, { requester: interaction.user });
                        if (res.tracks.length) player.queue.add(res.tracks[0]);
                    }
                    if (!player.playing && !player.paused) player.play();
                    return interaction.editReply(`Added **${tracks.length}** tracks from Spotify.`);
                }
            } catch (e) {
                console.error(e);
                return interaction.editReply("Failed to load Spotify data. Make sure the link is public.");
            }
        }

        // 1. Try YouTube Music first (Best for VPS)
        let result = await client.kazagumo.search(searchQuery, { requester: interaction.user, engine: "youtube_music" });

        // 2. If YT Music is empty, try standard YouTube
        if (!result.tracks.length) {
            result = await client.kazagumo.search(searchQuery, { requester: interaction.user, engine: "youtube" });
        }

        // 3. If both are empty, fallback to SoundCloud
        if (!result.tracks.length && !searchQuery.startsWith("http")) {
            console.log(`YouTube/Music search failed for: ${searchQuery}. Trying SoundCloud...`);
            result = await client.kazagumo.search(searchQuery, { requester: interaction.user, engine: "soundcloud" });
        }

        if (!result.tracks.length) {
            return interaction.editReply("No results found on YouTube or SoundCloud.");
        }

        if (result.type === "PLAYLIST") {
            for (const track of result.tracks) player.queue.add(track);
            interaction.editReply(`Added playlist **${result.playlistName}** with **${result.tracks.length}** tracks to the queue.`);
        } else {
            player.queue.add(result.tracks[0]);
            interaction.editReply(`Added **${result.tracks[0].title}** to the queue.`);
        }

        if (!player.playing && !player.paused) player.play();
    },
};
