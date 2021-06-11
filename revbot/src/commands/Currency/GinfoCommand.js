const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const userDB = require('../../utils/models/currency.js');
module.exports = class GinfoCommand extends BaseCommand {
  constructor() {
    super('ginfo', 'Currency', [], 'Gamble Info', 'See your gambling statistics.');
  }

  async run(client, message, args) {
    let target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (target) target = target.user;
    if (!target) target = message.author;

    let user = await userDB.findOne({ userID: target.id });
    if (user) {
      let username = target.username;
      let pfp = target.displayAvatarURL();
      let points = Number(user.balance);
      let wallet = Number(user.wallet);
      let bank = Number(user.bank);
      let level = Math.floor(Number(user.commands) / 100);
      let experience = Number(user.commands);
      let commands = Number(user.commands);
      let inventory = user.inventory;
      let invValue = 0;
      if (user.gamble === undefined) return message.channel.send("You haven't gambled yet.");
      let wins = Number(user.gamble.wins);
      let losses = Number(user.gamble.losses);
      let amountWon = Number(user.gamble.gained);
      let amountLost = Number(user.gamble.lost);
      let totalGames = wins + losses;
      let winPercentage = Math.floor((wins / totalGames) * 100);
      let netGain = amountWon - amountLost;
      const gambleEmbed = new Discord.MessageEmbed()
      .setAuthor(`${username}'s gamble stats`, pfp)
      .addField('Games:', `Wins: \`${wins}\`\nLosses: \`${losses}\`\nTotal Games: \`${totalGames}\``)
      .addField('Amount Won:', `\`$${amountWon.toLocaleString()}\``)
      .addField('Amount Lost:', `\`$${amountLost.toLocaleString()}\``)
      .addField('Net Gain:', `\`$${netGain.toLocaleString()}\``)
      .addField('Win Percentage:', `\`${winPercentage.toLocaleString()}%\``)
      .setFooter('Thanks for using my bot :) - rev')
      .setColor("RANDOM")
      .setTimestamp();
      await message.channel.send(gambleEmbed).catch(err => console.log(err));
    }
  }
}