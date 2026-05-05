const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('247')
        .setDescription('Toggle 24/7 mode (stay in voice channel)'),
    async execute(interaction, client) {
        const player = client.kazagumo.players.get(interaction.guild.id);
        if (!player) return interaction.reply({ content: "There is no music playing!", ephemeral: true });

        const is247 = player.data.get("247");
        player.data.set("247", !is247);

        return interaction.reply(`24/7 mode is now **${!is247 ? "Enabled" : "Disabled"}**.`);
    },
};
