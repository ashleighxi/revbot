const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
module.exports = class BalanceCommand extends BaseCommand {
  constructor() {
    super('balance', 'Currency', ['bal'], 'balance', 'Displays your revBucks balance.');
  }

  async run(client, message, args) {
    //user targetting:
    let target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (target) target = target.user;
    if (!target) target = message.author;
    let cDB = await curDB.findOne({ userID: target.id });
      if (cDB) {
        if (!cDB.wallet) cDB.wallet = 0;
        if (!cDB.bank) cDB.bank = 0;
        if (!cDB.bankLimit) cDB.bankLimit = 1000000;
        if (!cDB.balance) cDB.balance = 0;
        cDB.commands += 1;
        await cDB.save().catch(err => console.log(err));
        console.log(target.username, cDB.userID, cDB.wallet, cDB.balance, cDB.commands);
        const balanceEmbed = new Discord.MessageEmbed()
          .setTitle(`${target.username}'s Balance`)
          .setDescription(`Points Balance: \`${cDB.balance.toLocaleString()}\`\nWallet: \`$${cDB.wallet.toLocaleString()}\`\nBank: \`$${cDB.bank.toLocaleString()}/$${cDB.bankLimit.toLocaleString()}\``)
          .setFooter('pog')
          .setColor("RANDOM");
        await message.channel.send(balanceEmbed).catch(err => console.log(err));
      } else {
        cDB = new curDB({
          userID: target.id,
          wallet: 0,
          balance: 0,
          bank: 0,
          bankLimit: 1000000,
          commands: 1
        });
        await cDB.save().catch(err => console.log(err));
        console.log("New User:", target.username, cDB.userID, cDB.wallet, cDB.balance, cDB.commands);
        const balanceEmbed = new Discord.MessageEmbed()
          .setTitle(`${target.username}'s Balance`)
          .setDescription(`Points Balance: \`${cDB.balance.toLocaleString()}\`\nWallet: \`$${cDB.wallet.toLocaleString()}\`\nBank: \`$${cDB.bank.toLocaleString()}/$${cDB.bankLimit.toLocaleString()}\``)
          .setFooter('pog')
          .setColor("RANDOM");
        await message.channel.send(balanceEmbed).catch(err => console.log(err));
      }
  }
}