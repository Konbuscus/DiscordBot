const Discord = require('discord.js');

const token = process.env.TOKEN;
const prefix = process.env.PREFIX;


const ytdl = require("ytdl-core");
const { executionAsyncResource } = require('async_hooks');

const client = new Discord.Client();
const queue = new Map();



client.once('ready', ()=> {
console.log("ready");
});

client.once('reconnecting', () => {
console.log("reconnecting++")
});

client.once("disconnect", () => {
console.log("disconnected")
});

client.on("message", async message => {
    if (message.author.bot){
        return;
    }

    if(!message.content.startsWith(prefix)){
        return;
    }   
    const serverQueue = queue.get(message.guild.id);

    if(message.content.startsWith(`${prefix}play`)){
        execute(message, serverQueue);
    }
    else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverQueue);
        return;
    }else if (message.content.startsWith(`${prefix}stop`)){
        leave();
    }
    else {
        message.channel.send("Commande invalide, apprends à écrire PD");
    }
});

async function execute(message, serverQueue) {
    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "Tu dois être dans une channel vocal pour jouer de la musique PD (PLUIE)"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "J'ai besoin des permissions pour vous rejoindre et gueuler de la merde bande de sous-race !"
      );
    }
  
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
      title: songInfo.title,
      url: songInfo.video_url
    };
  
    if (!serverQueue) {
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true
      };
  
      queue.set(message.guild.id, queueContruct);
  
      queueContruct.songs.push(song);
  
      try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message.guild, queueContruct.songs[0]);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
      }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`${song.title} a été ajoutée a ma queue (ISSOU) !`);
    }
  }
  

function play(guild, song){

    const serverQueue = queue.get(guild.id);
    if(!song){
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url)).on("finish", () => {
        serverQueue.songs.shift();
        play(guild,serverQueue.songs[0]);
    }).on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

function skip(message, serverQueue){

    if(!message.member.voice.channel){
        return message.channel.send("Tu dois être dans un channel vocal pour arrêter la musique PD");
    }
    if(!serverQueue){
        return message.channel.send("Aucune musique à skip PD");
    }
    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {

    if (!message.member.voice.channel)
        return message.channel.send(
        "Tu dois être dans un channel vocal pour arrêter la musique PD"
        );
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  }

function leave(){
  serverQueue.voiceChannel.leave();
} 

client.login(token);  
