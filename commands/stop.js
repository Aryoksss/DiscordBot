const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and leave the voice channel'),
    async execute(interaction, client) {
        const player = client.kazagumo.players.get(interaction.guild.id);
        if (!player) return interaction.reply({ content: "There is no music playing!", ephemeral: true });

        player.destroy();
        return interaction.reply("Stopped the music and left the channel.");
    },
};
