const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
module.exports = class LeaderboardCommand extends BaseCommand {
  constructor() {
    super('leaderboard', 'Currency', ['lb'], undefined, undefined);
  }

  async run(client, message, args) {
    let cDB = await curDB.find({});
    cDB.sort(function (a,b) {
      return b.balance - a.balance;
    });
    let topTen = cDB.slice(0,10);
    let leaderboard = '';
    topTen.forEach(element => {
      let member = message.guild.members.cache.get(element.userID);
      if (member) {
        console.log(`${member.user.username}: ${element.balance}\n`);
        leaderboard += `${topTen.indexOf(element) + 1}. ${member.user.username} - ${element.balance} points\n`;
      }
      
    });
    const lbEmbed = new Discord.MessageEmbed()
      .setTitle('**Dank Revival Season 1 Leaderboard**')
      .setDescription(leaderboard)
      .setFooter('Who will take the top spot?')
      .setTimestamp();
    await message.channel.send(lbEmbed).catch(err => console.log(err));
    
  }
}