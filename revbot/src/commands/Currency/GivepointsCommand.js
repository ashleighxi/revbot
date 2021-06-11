const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
module.exports = class GivepointsCommand extends BaseCommand {
  constructor() {
    super('givepoints', 'Currency', ['sharepoints'], undefined, undefined);
  }

  async run(client, message, args) {
    if (!message.member.roles.cache.has('811065353776922664')) return message.channel.send('You do not have the required role to use this command.');
    let target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (target) target = target.user;
    if (!target) return message.channel.send('You must state a user to give points to. `//give @user <amount>`');
    if (!args[1]) return message.channel.send('You must state an amount of points to give `//give @user <amount>`');
    let giveVal = parseInt(args[1]);
    if (isNaN(giveVal)) return message.channel.send('This is not a valid amount of points. `//give @user <amount>`');
    if (giveVal > 10000 || giveVal < -10000) return message.channel.send('You cannot give or take more than 10000 points at a time.');
    let giver = message.author;

    let cDB = await curDB.findOne({ userID: target.id });
    let giverDB = await curDB.findOne({ userID: giver.id });
    if (cDB) {
      cDB.balance += giveVal;
      await cDB.save().catch(err => console.log(err));
      console.log(target.username,cDB.userID , cDB.balance, cDB.commands);
      const giveEmbed = new Discord.MessageEmbed()
        .setTitle(`Transaction Complete!`)
        .setDescription(`${target.username}'s Balance: \`${cDB.balance}\``)
        .setFooter('pog')
        .setColor("RANDOM");
      await message.channel.send(giveEmbed).catch(err => console.log(err));
    } else {
      cDB = new curDB({
        userID: target.id,
        balance: giveVal,
        commands: 0
      });
      await cDB.save().catch(err => console.log(err));
      console.log("New User:", target.username, cDB.userID , cDB.balance, cDB.commands);
      const giveEmbed = new Discord.MessageEmbed()
        .setTitle(`Transaction Complete!`)
        .setDescription(`${target.username}'s Balance: \`${cDB.balance}\``)
        .setFooter('pog')
        .setColor("RANDOM");
      await message.channel.send(giveEmbed).catch(err => console.log(err));
    }
    if (giverDB) {
      giverDB.commands += 1;
      await giverDB.save().catch(err => console.log(err));
    } else {
      giverDB = new curDB({
        userID: giver.id,
        balance: 0,
        commands: 1
      })
      await giverDB.save().catch(err => console.log(err));
      console.log("New User:", giver.username, giverDB.userID , giverDB.balance, giverDB.commands);
    }
  }
}