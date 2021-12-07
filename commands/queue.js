const { MessageEmbed }= require('discord.js');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    permissions: [],
    cooldown: 0,
    description: 'displays current server queue',
    async execute(message, args, queues) {
        
        if (!message.member.voice.channel) {
            let embed = new MessageEmbed()
                .setDescription('❌ You need to join a voice channel to use this command')
                .setColor('RED');

            return message.channel.send({ embeds: [embed] });
        }

        const serverQueue = queues.get(message.guild.id);

        let index = 1;
        let string = "";

        if(serverQueue.songs[0])
            string += `${serverQueue.songs.slice(0, 10).map(x => `**${index++})** ${x.title}`).join("\n")}`;

        if (serverQueue.songs.length > 10)
            string += `\n**${index++})** **. . .**\n`;

        let embed = new MessageEmbed()
            .setAuthor(`Current Queue for ${message.guild.name}`, message.guild.iconURL)
            .setDescription(string)
            .setColor('YELLOW');

        return message.channel.send({ embeds: [embed] });
    }
}