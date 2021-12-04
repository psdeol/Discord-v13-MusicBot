require('dotenv').config();
const { Client, Intents, Collection }= require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs');

const client = new Client({ 
    partials: [
        'MESSAGE',
        'CHANNEL',
        'REACTION'
    ],
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ] 
});
const token = process.env.TOKEN;
const prefix = process.env.PREFIX;
const queue = new Map();
client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}


client.once('ready', () => {
    console.log('Ready!');
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    
    let args = message.content.slice(prefix.length).trim().split(/ +/);
    let command = args.shift().toLowerCase();

    console.log(client.commands);

    switch (command) {

        case 'join':
            /*
            const connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.channel.guild.id,
                adapterCreator: message.channel.guild.voiceAdapterCreator,
            })

            const audioPlayer = createAudioPlayer()
            const resource = createAudioResource('./bruh.mp3')
            audioPlayer.play(resource);

            const subscription = connection.subscribe(audioPlayer);

            */
            break;

        case 'play':
            client.commands.get('play').execute(message, args, queue);
            break;
    }
});

client.login(token);