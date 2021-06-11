const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const lotteryDB = require('../../utils/models/guilds.js');
module.exports = class LotteryCommand extends BaseCommand {
  constructor() {
    super('lottery', 'Fun', ['lotto'], 'lottery', 'Run a lottery for some amount of currency. Start a lottery with (p)lottery <min_amount> <max_amount>');
  }

  async run(client, message, args) {
    let param = args[0];
    let guild = await lotteryDB.findOne({ guildID: message.guild.id });
    if (param === 'start') {
      let minimumValue = Number(args[1]);
      let maximumValue = Number(args[2]);
      if (isNaN(minimumValue) || isNaN(maximumValue)) return message.channel.send('`//lottery start <minimum_value> <maximum_value>`');
      if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("You do not have permission to start a lottery. Requires `ADMINISTRATOR`");
      let lotteries = guild.guildLottery;
      if (lotteries === undefined) guild.guildLottery = [];
      let lottID = 0;
      let lotteryCheck = guild.guildLottery.find( ({active}) => active === true );
      if (lotteryCheck !== undefined) return message.channel.send('There is already an active lottery. Do `//lottery end` to end the current lottery.');
      if (lotteries === undefined) {
        guild.guildLottery.push({ lottery: [], lotteryID: lottID + 1, active: true, owner: message.author.id, minimumValue: minimumValue, maximumValue: maximumValue });
        lotteries = guild.guildLottery;
      }
      if (lotteries !== undefined) lottID = lotteries.length;
      
      if (lotteries !== undefined && lotteryCheck === undefined) {
        guild.guildLottery.push({ lottery: [], lotteryID: lottID + 1, active: true, owner: message.author.id, minimumValue: minimumValue, maximumValue: maximumValue });
      }
      await guild.save().catch(err => console.log(err));
      const startEmbed = new Discord.MessageEmbed()
      .setTitle('Lottery Created!')
      .setDescription(`Owner: ${message.author.tag}\nLotteryID: \`${lottID + 1}\`\nStatus: \`Active\``)
      .addField('Commands:', '`//lottery join` - Join the current lottery\n`//lottery end` - end the current lottery')
      .setFooter('Thanks for using revBot Lotteries')
      .setColor("RANDOM");
      await message.channel.send(startEmbed).catch(err => console.log(err));
    } else if (param === 'join') {
      let lotteries = guild.guildLottery;
      let lottID = 0;
      if (lotteries === undefined) return message.channel.send('There are no active lotteries at the moment.');
      if (lotteries !== undefined) lottID = lotteries.length;
      let lotteryCheck = lotteries.find( ({active}) => active === true );
      if (lotteryCheck === undefined) return message.channel.send('There are no active lotteries at the moment.');
      let userCheck = lotteryCheck.lottery.find( ({userID}) => userID === message.author.id );
      if (userCheck !== undefined) return message.channel.send("You've already joined this lottery.");
      lotteryCheck.lottery.push({ lotteryID: lottID, userID: message.author.id })
      await guild.save().catch(err => console.log(err));
      const joinEmbed = new Discord.MessageEmbed()
      .setTitle("Lottery joined!")
      .setDescription(`Entrant: ${message.author.tag}\nEntry Number: \`${lotteryCheck.lottery.length}\``)
      .addField('Commands:', '`//lottery` - check the status of the current lottery')
      .setColor("RANDOM")
      .setFooter('Thanks for using revBot Lotteries.');
      await message.channel.send(joinEmbed).catch(err => console.log(err));
    } else if (param === 'end') {
      if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("You do not have permission to end a lottery. Requires `ADMINISTRATOR`");
      let lotteries = guild.guildLottery;
      let lottID = 0;
      if (lotteries === undefined) return message.channel.send('There are no active lotteries at the moment.');
      if (lotteries !== undefined) lottID = lotteries.length;
      let lotteryCheck = lotteries.find( ({active}) => active === true );
      if (lotteryCheck === undefined) return message.channel.send('There are no active lotteries at the moment.');
      let entries = lotteryCheck.lottery.length;
      let index = Math.floor(Math.random() * (entries));
      let winner = lotteryCheck.lottery[index];
      let getWinner = message.guild.members.cache.get(winner.userID);
      if (getWinner === undefined) return message.channel.send('The winner could not be found in the guild. Try again.');
      let minValue = lotteryCheck.minimumValue;
      let maxValue = lotteryCheck.maximumValue;
      let amountWon = Math.floor(Math.random() * (maxValue - minValue + 1) + minValue);
      lotteryCheck.active = false;
      await guild.save().catch(err => console.log(err));
      const winnerEmbed = new Discord.MessageEmbed()
      .setTitle("Lottery ended!")
      .setDescription(`Winner: ${getWinner.user.tag}\nPrize: \`$${amountWon.toLocaleString()}\`\nTotal Entries: \`${entries.toLocaleString()}\``)
      .addField('Commands: ', '`//lottery start` - start another lottery')
      .setFooter('Thanks for using revBot Lotteries.')
      .setColor("RANDOM");
      await message.channel.send(winnerEmbed).catch(err => console.log(err));
    } else {
      let lotteries = guild.guildLottery;
      let lottID = 0;
      if (lotteries === undefined) return message.channel.send('There are no active lotteries at the moment.');
      if (lotteries !== undefined) lottID = lotteries.length;
      let lotteryCheck = lotteries.find( ({active}) => active === true );
      if (lotteryCheck === undefined) return message.channel.send('There are no active lotteries at the moment.');
      let entries = lotteryCheck.lottery.length;
      let userCheck = lotteryCheck.lottery.find( ({userID}) => userID === message.author.id );
      let joined = 'No'
      if (userCheck !== undefined) joined = 'Yes';
      const statusEmbed = new Discord.MessageEmbed()
      .setTitle("Lottery Status")
      .setDescription(`Entrants: ${entries}\nJoined: \`${joined}\``)
      .addField('Commands:', '`//lottery` - check the status of the current lottery\n`//lottery join` - Join the current lottery')
      .setColor("RANDOM")
      .setFooter('Thanks for using revBot Lotteries.');
      await message.channel.send(statusEmbed).catch(err => console.log(err));
    }
  }
}