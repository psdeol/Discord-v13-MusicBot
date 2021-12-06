const { MessageEmbed, MessageButton, MessageActionRow }= require('discord.js');
const { createAudioResource} = require('@discordjs/voice');
const ytdl = require('ytdl-core');

module.exports = {
    name: 'skip',
    aliases: ['s'],
    permissions: [],
    cooldown: 0,
    description: 'stops playing current song, plays next song in queue',
    async execute(message, queues) {
        
        if (!message.member.voice.channel) {
            let embed = new MessageEmbed()
                .setDescription('❌ You need to join a voice channel to use this command')
                .setColor('RED');

            return message.channel.send({ embeds: [embed] });
        }

        const serverQueue = queues.get(message.guild.id);

        if (!serverQueue) {
            let embed = new MessageEmbed()
                .setDescription('❌ No songs are currently playing or in queue')
                .setColor('RED');

            return message.channel.send({ embeds: [embed] });
        }

        skipSong(message, queues)
    }
}

const skipSong = (message, queues) => {
    let queue = queues.get(message.guild.id);
    let song = queue.songs.shift();

    if (song) {
        let stream = ytdl(song.url, {
            filter: 'audioonly' ,
            highWaterMark: 1<<25
        });

        queue.player.play(createAudioResource(stream));
        sendPlayingEmbed(message, song, queues);

    } else {
        queue.connection.destroy();
        queues.delete(message.guild.id);
    }
}

const sendPlayingEmbed = async (message, song, queues) => {
    let queue = queues.get(message.guild.id);
    let videoID = song.url.split("=")[1];

    let embed = new MessageEmbed()
        .setTitle(song.title)
        .setThumbnail(song.thumbnail)
        .setAuthor('🎶 Now Playing')
        .setURL(song.url)
        .addFields(
            { name: 'Channel', value: song.channel, inline: true },
            { name: 'Duration', value: song.duration, inline: true },
            { name: 'Queue Position', value: 'Playing Now', inline: true }
        )
        .setColor('BLUE');
    
    let buttons = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('pause' + videoID)
                .setEmoji('⏸️')
                .setLabel('PAUSE')
                .setStyle('SECONDARY')
        )
        .addComponents(
            new MessageButton()
                .setCustomId('play' + videoID)
                .setEmoji('▶️')
                .setLabel('PLAY')
                .setStyle('SECONDARY')
        )
        .addComponents(
            new MessageButton()
                .setCustomId('skip' + videoID)
                .setEmoji('⏭️')
                .setLabel('SKIP')
                .setStyle('SECONDARY')
        )

    message.channel.send({ embeds: [embed], components: [buttons] });

    const collector = message.channel.createMessageComponentCollector({ time: 1000 * 60 * 20 })

    collector.on('collect', async (button) => {
        if (button.customId === 'play' + videoID) {
            button.deferUpdate();
            queue.player.unpause();

        } else if (button.customId === 'pause' + videoID) {
            button.deferUpdate();
            queue.player.pause();

        } else if (button.customId === 'skip' + videoID) {
            button.deferUpdate();
            skipSong(message, queues);
        }
    });
}