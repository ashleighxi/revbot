const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
module.exports = class AdmingiveCommand extends BaseCommand {
  constructor() {
    super('admingive', 'Currency', [], 'admingive', 'Allows the bot owner to create currency from thin air.');
  }

  async run(client, message, args) {
    if (message.author.id !== '206982524021243914') return message.channel.send('This is a rev only command :eyes:');
    let target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (target) target = target.user;
    if (!target) return message.channel.send('You must state a user to give revBucks to. `//give @user <amount>`');
    if (!args[1]) return message.channel.send('You must state an amount of revBucks to give `//give @user <amount>`');
    let giveVal = Number(args[1]);
    if (isNaN(giveVal)) return message.channel.send('This is not a valid amount of revBucks. `//give @user <amount>`');
    if(giveVal <= 0) return message.channel.send('This is not a valid amount to give');
    //if (giveVal > 10000 || giveVal < -10000) return message.channel.send('You cannot give or take more than 10000 points at a time.');
    let giver = message.author;
    

    let cDB = await curDB.findOne({ userID: target.id });
    let giverDB = await curDB.findOne({ userID: giver.id });
    if (cDB && giverDB) {
      let giverBal = giverDB.wallet;
      
      cDB.wallet += giveVal;
      
      await cDB.save().catch(err => console.log(err));
      console.log(target.username,cDB.userID , cDB.balance, cDB.commands);
      const giveEmbed = new Discord.MessageEmbed()
        .setTitle(`Transaction Complete!`)
        .setDescription(`**Amount sent:** $${giveVal.toLocaleString()}\n${target.username}'s Wallet: \`$${Number(cDB.wallet).toLocaleString()}\``)
        .setFooter('pog')
        .setColor("RANDOM");
      await message.channel.send(giveEmbed).catch(err => console.log(err));
    } else if (giverDB && !cDB) {
      let giverBal = giverDB.wallet;
      if (giveVal > Number(giverBal)) return message.channel.send("You don't even have that much bro.");
      cDB = new curDB({
        userID: target.id,
        wallet: giveVal,
        commands: 0
      });
      await cDB.save().catch(err => console.log(err));
      console.log("New User:", target.username, cDB.userID , cDB.balance, cDB.commands);
      const giveEmbed = new Discord.MessageEmbed()
        .setTitle(`Transaction Complete!`)
        .setDescription(`**Amount sent:** $${giveVal.toLocaleString()}\n${target.username}'s Wallet: \`$${Number(cDB.wallet).toLocaleString()}\``)
        .setFooter('pog')
        .setColor("RANDOM");
      await message.channel.send(giveEmbed).catch(err => console.log(err));
    } else {
      return message.channel.send('Use some commands before trying to give money.');
    }
    if (giverDB) {
      giverDB.commands += 1;
      await giverDB.save().catch(err => console.log(err));
    } else {
      return message.channel.send('Use some commands before trying to give money.');
      
    }
  }
}