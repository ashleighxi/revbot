const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const vouchDB = require('../../utils/models/vouch.js');
module.exports = class VouchCommand extends BaseCommand {
  constructor() {
    super('vouches', 'Trading', []);
  }

  async run(client, message, args) {
    let userID;
    let user;
    if (!args[0]) {
      userID = message.author.id;
    } else {
      user = message.mentions.members.first() || await client.users.fetch(args[0]);
      userID = user.id;
    }
    
    
    let vDB = await vouchDB.findOne({ userID: userID });
    if (vDB) {
      const vMember = message.guild.members.cache.get(userID);
      console.log(vMember.user.username,vDB.userID , vDB.vouches);
      
      const vouchEmbed = new Discord.MessageEmbed()
        .setTitle(`${vMember.user.username}'s vouches`)
        .setDescription(`vouches: \`${vDB.vouches}\``)
        .setFooter('Thanks for trading safely!')
        .setColor("RANDOM");
      await message.channel.send(vouchEmbed).catch(err => console.log(err));
      return vDB;
    } else {
      vDB = new vouchDB({
        userID: userID,
        vouches: 0
      });
      await vDB.save().catch(err => console.log(err));
      const vMember = message.guild.members.cache.get(userID);
      const vouchEmbed = new Discord.MessageEmbed()
        .setTitle(`${vMember.user.username}'s vouches`)
        .setDescription(`vouches: \`${vDB.vouches}\``)
        .setFooter('Thanks for trading safely!')
        .setColor("RANDOM");
      await message.channel.send(vouchEmbed).catch(err => console.log(err));
      return vDB;
    }
  }
}