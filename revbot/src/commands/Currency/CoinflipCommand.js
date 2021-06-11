const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
module.exports = class CoinflipCommand extends BaseCommand {
  constructor() {
    super('coinflip', 'Currency', ['cf']);
  }

  async run(client, message, args) {
    let target = message.author;
    let choice = args[0];
    let cooldown = 3000;
    let bet = args[1];
    if (choice !== 'h' && choice !== 't') return message.channel.send('Please provide a coin side and amount `//coinflip <h/t> <amount>`');
    if (isNaN(bet) && bet !== 'max') return message.channel.send('Please provide a coin side and amount `//coinflip <h/t> <amount>`');
    if (parseInt(bet) === 0) return message.channel.send("You can't bet nothing idiot.");
    let cDB = await curDB.findOne({ userID: target.id });
    if (cDB) {
      let lastCF = cDB.cfCD;
      if (lastCF !== null && cooldown - (Date.now() - lastCF) > 0) {
        let timeObj = humanizeDuration(cooldown - (Date.now() - lastCF), { round: true });
        console.log(timeObj);
        return message.channel.send(`You must wait ${timeObj} before running that command again.`);
      }
      let walletBalance = cDB.wallet;
      if (walletBalance === undefined) return message.channel.send("You don't have any money to bet.");
      if (parseInt(walletBalance) === 0) return message.channel.send("You can't bet nothing idiot.");
      if (bet === 'max' && parseInt(walletBalance) > 500000) {
        bet = 500000;
      } else if (bet === 'max') {
        bet = walletBalance;
      } 
      
      if (bet > walletBalance) return message.channel.send("You don't have that much money to bet. Poor xD.");
      let coinflip = Math.floor(Math.random() * 2);
      let result;
      let choiceText;
      if (choice === 'h') {
        choiceText = 'heads';
      } else {
        choiceText = 'tails';
      }
      if (coinflip >= 1 && choice === 'h') {
        result = 'won';
        cDB.wallet += parseInt(bet);
      } else if (coinflip < 1 && choice === 't') {
        result = 'won'
        cDB.wallet += parseInt(bet);
      } else {
        result = 'lost';
        cDB.wallet -= parseInt(bet);
      }
      let color;
      if (result === 'won') {
        color = '#03fc6b';
      } else {
        color = '#fc0303';
      }
      const resultEmbed = new Discord.MessageEmbed()
      .setAuthor(`${target.username} chose ${choiceText}`, target.displayAvatarURL())
      .setTitle(`You ${result}!`)
      .setDescription(`Bet amount: $${parseInt(bet)}`)
      .addField('New Balance:', `$${parseInt(cDB.wallet).toLocaleString()}`)
      .setFooter('You have an addiction')
      .setColor(color)
      .setTimestamp();
      cDB.cfCD = Date.now();
      await cDB.save().catch(err => console.log(err));
      message.channel.send(resultEmbed);
    }
  }
}