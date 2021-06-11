const BaseEvent = require('../../utils/structures/BaseEvent');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
const afkDB = require('../../utils/models/afk.js');
module.exports = class MessageEvent extends BaseEvent {
  constructor() {
    super('message');
  }

  async run(client, message) {
    if (message.author.bot) return;
    if (!message.guild) {
      return message.channel.send('Stop dming me loser.');
    }
    let guildPrefix;
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (guild) {
      if (guild.guildPrefix !== undefined) guildPrefix = guild.guildPrefix;
    } else {
      guild = new guildDB({
        guildID: message.guild.id,
        guildName: message.guild.name,
        guildOwner: message.guild.owner
      });
      console.log(`New guild added to database!\nGuild Name: ${guild.guildName}\nGuild ID: ${guild.guildID}\nGuild Owner: ${guild.guildOwner}`);
      await guild.save().catch(err => console.log(err));
    }
    if (message.content.startsWith(client.prefix) && guildPrefix === undefined) {
      const [cmdName, ...cmdArgs] = message.content.toLowerCase()
      .slice(client.prefix.length)
      .trim()
      .split(/\s+/);
      const command = client.commands.get(cmdName);
      if (command) {
        command.run(client, message, cmdArgs);
      }
    } else if (guildPrefix && message.content.toLowerCase().startsWith(guildPrefix)) {
      
      const [cmdName, ...cmdArgs] = message.content.toLowerCase()
      .slice(guildPrefix.length)
      .trim()
      .split(/\s+/);
      const command = client.commands.get(cmdName);
      if (command) {
        command.run(client, message, cmdArgs);
      }
      
    }
    message.mentions.users.forEach(async (user) => {
      if (message.author.bot) return;
      if (message.content.includes('@here') || message.content.includes('@everyone')) return;
      const afkUser = await afkDB.findOne({ userID: user.id });
      if (afkUser) {
        if (afkUser.reason === undefined) afkUser.reason = '';
        const afkEmbed = new Discord.MessageEmbed()
          .setAuthor(`${user.username} is AFK`, user.displayAvatarURL())
          .setDescription(afkUser.reason)
          .setFooter(':)')
          .setColor("RANDOM")
          .setTimestamp();

        let msg = await message.channel.send(afkEmbed);
        msg.delete({ timeout: 5000 });
      }
    });
    if (message.content.startsWith('I love you revBot') || message.content.startsWith('I love you revbot') || message.content.startsWith('i love you revBot') || message.content.startsWith('i love you revbot') || message.content.startsWith('I LOVE YOU REVBOT')) {
      if (message.author.id === '769137810597871617') return message.channel.send("I love you too, mom <3");
      if (message.author.id === '564488861498081331') return message.channel.send("uwu i wuv u too, panda :3");
      if (message.author.id !== '206982524021243914') return message.channel.send(`I love you too, ${message.author.username}`);

      try {
        await message.channel.send('I love you too, dad <3');
      } catch (err) {
        console.log(err);
        message.channel.send('I am not able to send that message.');
      }
    }
    if (message.content.startsWith('I hate you revBot') || message.content.startsWith('I hate you revbot') || message.content.startsWith('i hate you revBot') || message.content.startsWith('i hate you revbot') || message.content.startsWith('I HATE YOU REVBOT')) {
      if (message.author.id === '769137810597871617') return message.channel.send("How could you say that, mom? :sob:");
      if (message.author.id !== '206982524021243914') return message.channel.send("Fuck off xD");

      try {
        await message.channel.send('How could you say that, dad? :sob:');
      } catch (err) {
        console.log(err);
        message.channel.send('I am not able to send that message.');
      }
    }
    if (message.content.startsWith('hi revBot') || message.content.startsWith('hi revbot') ||  message.content.startsWith('Hi revbot') ||  message.content.startsWith('Hi revBot') || message.content.startsWith('HI REVBOT')) {
      if (message.author.id === '769137810597871617') return message.channel.send("hi mom <3");
      if (message.author.id === '661377632591544340') return message.channel.send("sup bro :sunglasses:");
      if (message.author.id === '549128920243372034') return message.channel.send("you need help.");
      if (message.author.id === '791172063536480276') return message.channel.send("hi Godzilla The Best!");
      if (message.author.id !== '206982524021243914') return message.channel.send(`hi ${message.author.username}!`);

      try {
        await message.channel.send('hi dad <3');
      } catch (err) {
        console.log(err);
        message.channel.send('I am not able to send that message.');
      }
    }
  }
}
