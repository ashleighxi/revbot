const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
module.exports = class WithdrawCommand extends BaseCommand {
  constructor() {
    super('withdraw', 'Currency', ['with'], 'withdraw', 'Withdraw funds from your bank account.');
  }

  async run(client, message, args) {
    if (!args[0]) return message.channel.send('You must state an amount of revBucks to withdraw `(p)withdraw <amount>`');
    
    //if (giveVal > 10000 || giveVal < -10000) return message.channel.send('You cannot give or take more than 10000 points at a time.');
    let giver = message.author;
    let bankLimit = 1000000;

    let giverDB = await curDB.findOne({ userID: giver.id });
    if (giverDB) {
      let giveVal = args[0];
      let giverBank = giverDB.bank;
      if (giveVal === 'max' || giveVal === 'all') {
        giveVal = Number(giverBank);
      }
      if (isNaN(giveVal)) return message.channel.send('This is not a valid amount of revBucks. `(p)withdraw <amount>`');
      giveVal = Math.floor(giveVal);
      if(giveVal <= 0) return message.channel.send('This is not a valid amount to withdraw');
      
      if (Number(giveVal) > Number(giverBank)) return message.channel.send("You don't even have that much bro.");
      

      giverDB.bank -= Number(giveVal);
      giverDB.wallet += Number(giveVal);
      giverDB.commands += 1;
      await giverDB.save().catch(err => console.log(err));
      console.log(giver.username,giverDB.userID , giverDB.balance, giverDB.commands);
      const giveEmbed = new Discord.MessageEmbed()
        .setTitle(`Withdrawal Complete!`)
        .setDescription(`**Amount withdrawn:** $${Number(giveVal).toLocaleString()}\n${giver.username}'s Wallet: \`$${Number(giverDB.wallet).toLocaleString()}\`\n${giver.username}'s bank: \`$${Number(giverDB.bank).toLocaleString()}\``)
        .setFooter('pog')
        .setColor("RANDOM");
      await message.channel.send(giveEmbed).catch(err => console.log(err));
    } else {
      return message.channel.send('Use some commands before trying to withdraw money');
    }
  }
}