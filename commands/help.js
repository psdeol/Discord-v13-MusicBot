const { MessageEmbed }= require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['h', 'commands'],
    cooldown: 0,
    description: 'sends bot commands',
    async execute(message) {

        let embed = new MessageEmbed()
        .setTitle('MUSIC BOT COMMANDS')
        .addFields(
            { 
                name: '!play <Search|YouTubeLink>',
                value: 'search YouTube for a song or play from a link' 
            },
            { 
                name: '!playnow <Search|YouTubeLink>',
                value: 'skips current song and plays input song' 
            },
            { 
                name: '!skip', 
                value: 'skips to next song in queue' 
            },
            { 
                name: '!stop',
                value: 'stops playing music and disconnects bot' 
            },
            { 
                name: '!queue', 
                value: 'shows next 10 songs in queue' 
            },
            { 
                name: '!join', 
                value: 'connects bot to voice channel' 
            },
        )
        .setColor('LUMINOUS_VIVID_PINK');

        return message.channel.send({ embeds: [embed] });
    }
}