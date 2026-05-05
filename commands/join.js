const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join your voice channel'),
    async execute(interaction, client) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.reply({ content: "You need to be in a voice channel to use this command!", flags: [64] });

        let player = client.kazagumo.players.get(interaction.guild.id);
        
        if (!player) {
            player = await client.kazagumo.createPlayer({
                guildId: interaction.guild.id,
                textId: interaction.channel.id,
                voiceId: voiceChannel.id,
                deaf: true,
            });
            return interaction.reply(`Joined **${voiceChannel.name}**!`);
        } else {
            return interaction.reply({ content: "I'm already in a voice channel!", flags: [64] });
        }
    },
};
