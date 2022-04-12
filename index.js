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
const token = process.env.CM_TOKEN;
const prefix = process.env.PREFIX;
const queues = new Map();   // guild.id -> queue object
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

    switch (command) {
        case 'h':
        case 'help':
        case 'commands':
            client.commands.get('help').execute(message);
            break;

        case 'join':
            joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.channel.guild.id,
                adapterCreator: message.channel.guild.voiceAdapterCreator,
            });
            break;

        case 'p':
        case 'play':
            client.commands.get('play').execute(client, message, args, queues);
            break;

        case 'pn':
        case 'playnow':
            client.commands.get('playnow').execute(client, message, args, queues);
            break;

        case 's':
        case 'skip':
            client.commands.get('skip').execute(message, queues);
            break;

        case 'st':
        case 'stop':
            client.commands.get('stop').execute(message, queues);
            break;

        case 'q':
        case 'queue':
            client.commands.get('queue').execute(message, args, queues);
            break;

        /*
        default:
            let inChannel = '882030039829463153';
            let outChannel = '943947466498248705';
            if (message.channelId == inChannel) {
                let guild = message.guild;
                let user = message.member;
                await client.channels.cache
                    .get(outChannel)
                    .send({
                        content: message.content,
                        files: [message.attachments.first(1)[0].attachment]
                    });
                message.delete()
                    .then(async () => {
                        await guild.roles.fetch(); //optional - put it if the role is valid, but is not cached
                        let role = guild.roles.cache.find(
                          (role) => role.name === "new role"
                        );
                        user.roles.add(role);
                    });
                //client.channels.cache.get(outChannel).send(message.attachments.first(1)[0].attachment);
                //console.log(message.attachments.first(1)[0].attachment);
            }
        */
    }
});

client.login(token);