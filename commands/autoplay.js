const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoplay')
        .setDescription('Toggle autoplay mode'),
    async execute(interaction, client) {
        const player = client.kazagumo.players.get(interaction.guild.id);
        if (!player) return interaction.reply({ content: "There is no music playing!", ephemeral: true });

        const autoplay = player.data.get("autoplay");
        player.data.set("autoplay", !autoplay);

        return interaction.reply(`Autoplay mode is now **${!autoplay ? "Enabled" : "Disabled"}**.`);
    },
};
