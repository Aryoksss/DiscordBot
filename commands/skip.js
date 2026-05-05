const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current song'),
    async execute(interaction, client) {
        const player = client.kazagumo.players.get(interaction.guild.id);
        if (!player) return interaction.reply({ content: "There is no music playing!", ephemeral: true });

        player.skip();
        return interaction.reply("Skipped the current song.");
    },
};
