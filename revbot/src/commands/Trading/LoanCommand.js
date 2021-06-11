const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
module.exports = class LoanCommand extends BaseCommand {
  constructor() {
    super('loan', 'Trading', ['']);
  }

  async run(client, message, args) {
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    let user = message.author;
    let choice = args[0];
    let currentLoan = {
      loanType: '',
      loanUser: '',
      loanGiver: '',
      loanAmount: 0,
      loanLength: 0,
      loanStart: 0,
      loanEnd: 0,
      loanStatus: ''
    };
    const filter = response => response.author.id === user.id;
    
    if (choice === undefined || choice === '') {
      return message.channel.send('Please provide an option. (`(p)loan request`, `(p)loan status @user`)');
    } else if (choice === 'request') {
      message.channel.send('Will this be a cash or trophy loan? (reply with `cash` or `trophy`. Type `cancel` at any time to cancel the process.)');
      const responses = await message.channel.awaitMessages(filter, { max: 1, time: 30000 });
      if (responses.size > 0) {
        let response = responses[0].content.toLowerCase();
        currentLoan.loanUser = responses[0].author.id;
        if (response === 'trophy') {
          currentLoan.loanType = 'trophy';
        } else if (response === 'cash') {
          currentLoan.loanType = 'cash';
        } else if (response === 'cancel') {
          return message.channel.send('Loan request canceled.');
        } else {
          return message.channel.send('Not a valid response. Loan request canceled.');
        }
      } else {
        return message.channel.send('Loan request timed out.');
      }
      if (currentLoan.loanType === 'trophy') message.channel.send('How many trophies would you like to request?');
      if (currentLoan.loanType === 'cash') message.channel.send('How much cash would you like to request?');
      const reqAmountRes = await message.channel.awaitMessages(filter, { max: 1, time: 30000 });
      if (reqAmountRes.size > 0) {
        let response = reqAmountRes[0].content;
        if (response === 'cancel') {
          return message.channel.send('Loan request canceled.');
        } else if (isNaN(Number(response))) {
          return message.channel.send('Not a valid response. Loan request canceled.');
        } else {
          currentLoan.loanAmount = Number(response);
        }
      } else {
        return message.channel.send('Loan request timed out.');
      }
      message.channel.send('How long would you like this loan to last? *Note: Failure to pay in time puts you into debt, and you begin to accrue interest on your loan*');
      message.channel.send('Give a value such as: `1d` for 1 day, `1h` for 1 hour, etc');
      const timeRes = await message.channel.awaitMessages(filter, { max: 1, time: 30000 });
      if (timeRes.size > 0) {
        let time = ms(timeRes[0].content);
        if (timeRes[0].content === 'cancel') {
          return message.channel.send('Loan request canceled.');
        } else if (isNaN(time)) {
          return message.channel.send('Not a valid response. Loan request canceled.');
        } else {
          currentLoan.loanLength = time;
          currentLoan.loanStatus = 'requested';
        }
      } else {
        return message.channel.send('Loan request timed out.');
      }
      const loanEmbed = new Discord.MessageEmbed()
        .setTitle('Loan Successfully Requested')
        .addField('Requested By:', `<@!${currentLoan.loanUser}>`)
        .addField('Loan Type:', `${currentLoan.loanType}`)
        .addField('Loan Amount:', `\`${currentLoan.loanAmount}\``)
        .addField('Loan Length:', `${humanizeDuration(currentLoan.loanLength)}`)
        .setColor('RANDOM')
        .setTimestamp();
      await guild.guildLoan.push(currentLoan);
      await guild.save();
      await message.channel.send(loanEmbed);
    }
    
    
  }
}