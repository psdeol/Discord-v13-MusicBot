const { MessageEmbed }= require('discord.js');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

module.exports = {
    name: 'playnow',
    aliases: ['pn'],
    permissions: [],
    cooldown: 0,
    description: 'skips current song, add input song to head of queue',
    async execute(client, message, args, queues) {
        
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

        if (!serverQueue) {
            client.commands.get('play').execute(client, message, args, queues);
            return;

        } else {
            const song = await findSong(message, args);

            if (song) {
                await serverQueue.songs.unshift(song);
                client.commands.get('skip').execute(message, queues);
            }
        }
    }
}

const findSong = async (message, args) => {
    let song = {};
    
    if (ytdl.validateURL(args[0])) {
        try {
            const songInfo = await ytdl.getBasicInfo(args[0]).catch(err => console.log(err));
            let videoID = songInfo.videoDetails.video_url.split("=")[1] + Math.floor(Math.random() * 10000);

            song = { 
                title: songInfo.videoDetails.title, 
                url: songInfo.videoDetails.video_url,
                duration: fmtMSS(songInfo.videoDetails.lengthSeconds), 
                channel: songInfo.videoDetails.ownerChannelName,
                thumbnail: songInfo.videoDetails.thumbnails[0].url,
                id: videoID,
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
        let videoID = video.url.split("=")[1] + Math.floor(Math.random() * 10000);

        if (video) {
            song = { 
                title: video.title, 
                url: video.url,
                duration: video.duration.timestamp, 
                channel: video.author.name,
                thumbnail: video.thumbnail,
                id: videoID
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

const fmtMSS = (s) => {
    return (s - (s %= 60)) / 60 + (9 < s ? ":" : ":0") + s;
}