const { MessageEmbed, MessageButton, MessageActionRow, MessageComponentInteraction, ButtonInteraction }= require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

module.exports = {
    name: 'play',
    aliases: ['p'],
    cooldown: 0,
    description: 'adds input song to current server queue',
    async execute(message, args, queues) {
        
        if (!message.member.voice.channel) {
            let embed = new MessageEmbed()
                .setDescription('❌ You need to join a voice channel to use this command')
                .setColor('RED');

            return message.channel.send({ embeds: [embed] });
        }

        if (!args.length) {
            let embed = new MessageEmbed()
                .setDescription('❌ Enter the video to search for and play')
                .setColor('RED');

            return message.channel.send({ embeds: [embed] });
        }

        const serverQueue = queues.get(message.guild.id);
        const song = await findSong(message, args);

        if (song) {
            if (!serverQueue) {
                createQueue(message, queues, song);

            } else {
                serverQueue.songs.push(song);
                sendQueueEmbed(message, song, serverQueue);
            }
        }

    }
}

const findSong = async (message, args) => {
    let song = {};
    
    if (ytdl.validateURL(args[0])) {
        try {
            const songInfo = await ytdl.getBasicInfo(args[0]).catch(err => console.log(err));
            song = { 
                title: songInfo.videoDetails.title, 
                url: songInfo.videoDetails.video_url,
                duration: fmtMSS(songInfo.videoDetails.lengthSeconds), 
                channel: songInfo.videoDetails.ownerChannelName,
                thumbnail: songInfo.videoDetails.thumbnails[0].url
            }
        } catch (err) {
            let embed = new Discord.MessageEmbed()
                .setTitle('❗ ERROR ❗')
                .setDescription('An error occurred while trying to find the video')
                .setColor('RED')
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        }

    } else {
        const videoResults = await ytSearch(args.join(' '));
        const video = (videoResults.videos.length > 1) ? videoResults.videos[0] : null;

        if (video) {
            song = { 
                title: video.title, 
                url: video.url,
                duration: video.duration.timestamp, 
                channel: video.author.name,
                thumbnail: video.thumbnail
            }

        } else {
            let embed = new Discord.MessageEmbed()
                .setTitle('❗ ERROR ❗')
                .setDescription('An error occurred while trying to find the video')
                .setColor('RED')
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        }
    }

    return song;
}

const createQueue = async (message, queues, song) => {
    const queueConstructor =  {
        voiceChannel: message.member.voice.channel,
        textChannel: message.channel,
        player: createAudioPlayer(),
        connection: null,
        songs: []
    }

    queues.set(message.guild.id, queueConstructor);
    queueConstructor.songs.push(song);

    try {
        let connection = await getVoiceConnection(message.guild.id);
    
        if (!connection) {
            connection = await joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.channel.guild.id,
                adapterCreator: message.channel.guild.voiceAdapterCreator,
            })
        }

        queueConstructor.connection = connection;
        playSong(message, queues);

    } catch (error) {
        queues.delete(message.guild.id);
        
        let embed = new MessageEmbed()
            .setTitle('❗ ERROR ❗')
            .setDescription('An error occurred while trying to connect')
            .setColor('RED')
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }
}

const playSong = async (message, queues) => {
    const queue = queues.get(message.guild.id);

    if (queue.songs.length === 0) {
        queue.connection.destroy();
        queues.delete(message.guild.id);
    }

    let song = queue.songs.shift();

    let stream = ytdl(song.url, {
        filter: 'audioonly' ,
        highWaterMark: 1<<25
    });

    queue.player.play(createAudioResource(stream, { inputType: StreamType.Arbitrary }));
    queue.connection.subscribe(queue.player);
    sendPlayingEmbed(message, song, queue);

    queue.player.on(AudioPlayerStatus.Idle, () => {
        song = queue.songs.shift();

        if (!song) {
            queue.connection.destroy();
            queues.delete(message.guild.id);

        } else {
            stream = ytdl(song.url, {
                filter: 'audioonly' ,
                highWaterMark: 1<<25
            });

            queue.player.play(createAudioResource(stream, { inputType: StreamType.Arbitrary }));
            sendPlayingEmbed(message, song, queue);
        }
    })
    
}

const sendPlayingEmbed = async (message, song, queue) => {
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
                .setCustomId('pause' + song.url)
                .setEmoji('⏸️')
                .setLabel('PAUSE')
                .setStyle('SECONDARY')
        )
        .addComponents(
            new MessageButton()
                .setCustomId('play' + song.url)
                .setEmoji('▶️')
                .setLabel('PLAY')
                .setStyle('SECONDARY')
        )
        .addComponents(
            new MessageButton()
                .setCustomId('skip'+ song.url)
                .setEmoji('⏭️')
                .setLabel('SKIP')
                .setStyle('SECONDARY')
        )

    message.channel.send({ embeds: [embed], components: [buttons] });

    const collector = message.channel.createMessageComponentCollector({ time: 1000 * 60 * 20 })

    collector.on('collect', async (button) => {
        button.deferUpdate();

        if (button.customId === 'play') {
            queue.player.unpause();

        } else if (button.customId === 'pause') {
            queue.player.pause();

        } else if (button.customId === 'skip') {

        }
    });
}

const sendQueueEmbed = async (message, song, queue) => {
    let queuePosition = queue.songs.length.toString();

    let embed = new MessageEmbed()
        .setTitle(song.title)
        .setThumbnail(song.thumbnail)
        .setAuthor('👍 Added to queue')
        .setURL(song.url)
        .addFields(
            { name: 'Channel', value: song.channel, inline: true },
            { name: 'Duration', value: song.duration, inline: true },
            { name: 'Queue Position', value: queuePosition, inline: true }
        )
        .setColor('GREEN');

    return message.channel.send({ embeds: [embed] });
}

const fmtMSS = (s) => {
    return (s - (s %= 60)) / 60 + (9 < s ? ":" : ":0") + s;
}