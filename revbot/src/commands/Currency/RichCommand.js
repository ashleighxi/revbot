const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
const { remove } = require('../../utils/models/currency.js');
module.exports = class RichCommand extends BaseCommand {
  constructor() {
    super('rich', 'Currency', [], undefined, undefined);
  }

  async run(client, message, args) {
    let cDB = await curDB.find({});
    let wallets = [];
    cDB.forEach(element => {
      let removedMember = message.guild.members.cache.get(element.userID);
      if (element.wallet !== undefined) {
        if (removedMember !== undefined) wallets.push(element);
        
        if (removedMember) console.log(`removed ${removedMember.user.username}: ${element.wallet}`);
        if (!removedMember) console.log(`removed ${element.userID}: ${element.wallet}`);
      }
    })
    wallets.sort(function (a,b) {
      console.log(a.wallet,b.wallet);
      return b.wallet - a.wallet;
    });
    let topTen = wallets.slice(0,10);
    let leaderboard = '';
    topTen.forEach(element => {
      let member = message.guild.members.cache.get(element.userID);

      console.log(`${member.user.username}: $${element.wallet}\n`);
      leaderboard += `${topTen.indexOf(element) + 1}. ${member.user.username} - $${element.wallet.toLocaleString()}\n`;
    });
    const lbEmbed = new Discord.MessageEmbed()
      .setTitle('**revBucks Leaderboard**')
      .setDescription(leaderboard)
      .setFooter('imagine grinding //beg')
      .setTimestamp();
    await message.channel.send(lbEmbed).catch(err => console.log(err));
    
  }
}