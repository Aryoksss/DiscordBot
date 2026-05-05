const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current music queue'),
    async execute(interaction, client) {
        const player = client.kazagumo.players.get(interaction.guild.id);
        if (!player) return interaction.reply({ content: "There is no music playing!", ephemeral: true });

        const queue = player.queue;
        const embed = new EmbedBuilder()
            .setTitle("Current Queue")
            .setColor("#5865F2");

        const tracks = queue.slice(0, 10).map((track, i) => `${i + 1}. [${track.title}](${track.uri})`);
        embed.setDescription(tracks.length ? tracks.join("\n") : "The queue is empty.");

        if (queue.length > 10) {
            embed.setFooter({ text: `And ${queue.length - 10} more songs...` });
        }

        return interaction.reply({ embeds: [embed] });
    },
};
