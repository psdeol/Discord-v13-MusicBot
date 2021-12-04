const { MessageEmbed, MessageButton, MessageActionRow, MessageComponentInteraction }= require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

module.exports = {
    name: 'play',
    aliases: ['p'],
    cooldown: 0,
    description: '',
    async execute(message, args, queue) {
        
        let song = await getSong(message, args);

        playSong(message, song);
    }
}

const getSong = async (message, args) => {
    let song = {};
    
    if (ytdl.validateURL(args[0])) {
        try {
            const song_info = await ytdl.getBasicInfo(args[0]).catch(err => console.log(err));
            song = { 
                title: song_info.videoDetails.title, 
                url: song_info.videoDetails.video_url,
                duration: fmtMSS(song_info.videoDetails.lengthSeconds), 
                channel: song_info.videoDetails.ownerChannelName,
                thumbnail: song_info.videoDetails.thumbnails[0].url
            }
        } catch (err) {
            console.log(err);
        }

    } else {
        const video_finder = async (query) => {
            const video_result = await ytSearch(query);
            return (video_result.videos.length > 1) ? video_result.videos[0] : null;
        }

        const video = await video_finder(args.join(' '));

        if (video) {
            song = { 
                title: video.title, 
                url: video.url,
                duration: video.duration.timestamp, 
                channel: video.author.name,
                thumbnail: video.thumbnail
            }
        }
    }

    return song;
}

const playSong = async (message, song) => {
    if (!song) return message.channel.send("Song not found");

    const stream = ytdl(song.url, {
        filter: 'audioonly' ,
        highWaterMark: 1<<25
    })

    const connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.channel.guild.id,
        adapterCreator: message.channel.guild.voiceAdapterCreator,
    })

    const audioPlayer = createAudioPlayer()
    const resource = createAudioResource(stream)
    audioPlayer.play(resource);

    const subscription = connection.subscribe(audioPlayer);

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
                .setCustomId('play')
                .setEmoji('▶️')
                .setLabel('PLAY')
                .setStyle('PRIMARY')
        )
        .addComponents(
            new MessageButton()
                .setCustomId('pause')
                .setEmoji('⏸️')
                .setLabel('PAUSE')
                .setStyle('SECONDARY')
        )

    message.channel.send({ embeds: [embed], components: [buttons] });

    const collector = message.channel.createMessageComponentCollector({ time: 1000 * 120 })
    collector.on('collect', async (i) => {
        if (i.customId === 'play') {
            console.log('play clicked');
            audioPlayer.unpause();
        } else if (i.customId === 'pause') {
            console.log('pause clicked');
            audioPlayer.pause();
        }
    })
}

const fmtMSS = (s) => {
    return (s - (s %= 60)) / 60 + (9 < s ? ":" : ":0") + s;
}