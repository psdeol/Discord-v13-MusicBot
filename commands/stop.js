const { MessageEmbed } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice')

module.exports = {
    name: 'stop',
    aliases: ['st'],
    permission: [],
    cooldown: 0,
    description: 'destroys queue and connection',
    async execute(message, queues) {
        
        if (!message.member.voice.channel) {
            let embed = new MessageEmbed()
                .setDescription('❌ You need to join a voice channel to use this command')
                .setColor('RED');

            return message.channel.send({ embeds: [embed] });
        }

        const connection = getVoiceConnection(message.guild.id);

        connection.destroy();
        queues.delete(message.guild.id);
    }
}