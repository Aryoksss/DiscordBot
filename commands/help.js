const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show all available commands and controls"),
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle("🎵 Kaleg Music Bot - Help Menu")
            .setDescription("Welcome! Here are the commands you can use to control the music.")
            .addFields(
                { name: "🚀 Main Commands", value: "`/play` - Play music from YT/Spotify\n`/stop` - Stop and leave\n`/skip` - Skip current track\n`/queue` - View track list" },
                { name: "⚙️ Settings", value: "`/autoplay` - Toggle auto-recommendations\n`/247` - Toggle 24/7 mode" },
                { name: "🎮 Quick Controls", value: "Use the buttons below for fast access!" }
            )
            .setFooter({ text: "Powered by Kaleg Music", iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("autoplay")
                    .setLabel("Toggle Autoplay")
                    .setEmoji("📻")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("247")
                    .setLabel("Toggle 24/7")
                    .setEmoji("⏳")
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
