const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
module.exports = class DepositCommand extends BaseCommand {
  constructor() {
    super('deposit', 'Currency', ['dep'], 'deposit', 'deposit your hard earned cash into your bank account.');
  }

  async run(client, message, args) {
    if (!args[0]) return message.channel.send('You must state an amount of revBucks to deposit `(p)deposit <amount>`');
    
    //if (giveVal > 10000 || giveVal < -10000) return message.channel.send('You cannot give or take more than 10000 points at a time.');
    let giver = message.author;
    let bankLimit = 1000000;

    let giverDB = await curDB.findOne({ userID: giver.id });
    if (giverDB) {
      let giverBal = giverDB.wallet;
      let giverBank = giverDB.bank;
      if (giverBank === undefined) {
        giverDB.bank = 0;
        giverBank = Number(giverDB.bank);
      }
      if (giverDB.bankLimit === undefined) {
        giverDB.bankLimit = bankLimit;
      } else {
        bankLimit = giverDB.bankLimit;
      }

      let giveVal = args[0];
      if (giveVal === 'max' || giveVal === 'all') {
        let availableSpace = bankLimit - giverBank;
        if (availableSpace >= giverBal) {
          giveVal = Number(giverBal);
        } else {
          giveVal = Number(availableSpace);
        }
      }
      if (isNaN(giveVal)) return message.channel.send('This is not a valid amount of revBucks. `(p)deposit <amount>`');
      giveVal = Math.floor(giveVal);
      if (Number(giveVal) <= 0) return message.channel.send('This is not a valid amount to deposit');
      if (Number(giveVal) > Number(giverBal)) return message.channel.send("You don't even have that much bro.");
      if (giverDB.bank + Number(giveVal) > bankLimit) return message.channel.send("You don't have enough bank space to deposit that amount.");
      
      giverDB.bank += Number(giveVal);
      giverDB.wallet -= Number(giveVal);
      giverDB.commands += 1;
      await giverDB.save().catch(err => console.log(err));
      console.log(giver.username,giverDB.userID , giverDB.balance, giverDB.commands);
      const giveEmbed = new Discord.MessageEmbed()
        .setTitle(`Deposit Complete!`)
        .setDescription(`**Amount deposited:** $${Number(giveVal).toLocaleString()}\n${giver.username}'s Wallet: \`$${Number(giverDB.wallet).toLocaleString()}\`\n${giver.username}'s bank: \`$${Number(giverDB.bank).toLocaleString()}\``)
        .setFooter('pog')
        .setColor("RANDOM");
      await message.channel.send(giveEmbed).catch(err => console.log(err));
    } else {
      return message.channel.send('Use some commands before trying to deposit money');
    }
  }
}