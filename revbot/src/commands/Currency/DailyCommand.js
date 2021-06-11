const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
module.exports = class DailyCommand extends BaseCommand {
  constructor() {
    super('daily', 'Currency', ['d'], 'daily', 'Get your free coins you freaks.');
  }

  async run(client, message, args) {
    let target = message.author
    let giveVal = 10;
    let cooldown = 24 * 3600000;
    if (message.member.roles.cache.has('811320047766863872')) giveVal += 10;
    if (message.member.roles.cache.has('797341195692277821')) giveVal += 5;
    
    let cDB = await curDB.findOne({ userID: target.id });
    if (cDB) {
      let lastDaily = cDB.dailyCD;
      if (lastDaily !== null && cooldown - (Date.now() - lastDaily) > 0) {
        let timeObj = humanizeDuration(cooldown - (Date.now() - lastDaily), { round: true });
        console.log(timeObj);
        return message.channel.send(`You must wait ${timeObj} before running that command again.`);
      } else {
        cDB.balance += giveVal;
        cDB.dailyCD = Date.now();
        await cDB.save().catch(err => console.log(err));
        console.log(`Points awarded: ${giveVal}`);
        console.log(target.username,cDB.userID , cDB.balance, cDB.commands);
        const dailyEmbed = new Discord.MessageEmbed()
          .setTitle(`Daily Claimed!`)
          .setDescription(`${target.username} has been awarded \`+${giveVal}\` points!`)
          .setFooter('pog')
          .setColor("RANDOM");
        await message.channel.send(dailyEmbed).catch(err => console.log(err));
      }
      
    } else {
      cDB = new curDB({
        userID: target.id,
        balance: giveVal,
        commands: 0,
        dailyCD: Date.now()
      });
      await cDB.save().catch(err => console.log(err));
      console.log("New User:", target.username, cDB.userID , cDB.balance, cDB.commands);
      console.log(`Points awarded: ${giveVal}`);
      const dailyEmbed = new Discord.MessageEmbed()
        .setTitle(`Daily Claimed!`)
        .setDescription(`${target.username} has been awarded \`+${giveVal}\` points!`)
        .setFooter('pog')
        .setColor("RANDOM");
      await message.channel.send(dailyEmbed).catch(err => console.log(err));
    }
  }
}