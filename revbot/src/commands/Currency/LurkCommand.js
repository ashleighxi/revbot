const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
const lurk = require('../../utils/data/lurk.json');
const statsDB = require('../../utils/models/botstats.js');
module.exports = class LurkCommand extends BaseCommand {
  constructor() {
    super('lurk', 'Currency', ['search','scout'], 'lurk', 'Lurk into the night to find riches.');
  }

  async run(client, message, args) {
    let target = message.author;
    let cooldown = 20000;
    const firstChoice = lurk[Math.floor(Math.random() * (3 - 0) + 0)];
    const secondChoice = lurk[Math.floor(Math.random() * (5 - 3) + 3)];
    const thirdChoice = lurk[Math.floor(Math.random() * (7 - 5) + 5)];
    let choice;
    const filter = response => {
      if (response.author.id !== target.id) {
        console.log('not the right person');
      } else if (response.content.toLowerCase() === firstChoice.option){
        choice = firstChoice;
        return firstChoice.answer.some(answer => answer.toLowerCase() === response.content.toLowerCase());
      } else if (response.content.toLowerCase() === secondChoice.option) {
        choice = secondChoice;
        return secondChoice.answer.some(answer => answer.toLowerCase() === response.content.toLowerCase());
      } else if (response.content.toLowerCase() === thirdChoice.option) {
        choice = thirdChoice;
        return thirdChoice.answer.some(answer => answer.toLowerCase() === response.content.toLowerCase());
      } else {
        choice = 'wrong';
        return true;
      }
      
    }
    //add cooldown here
    let userDB = await curDB.findOne({ userID: target.id });
    let lastLurk = userDB.lurkCD;
    console.log(`last lurk: ${lastLurk}`);
    if (lastLurk !== null && cooldown - (Date.now() - lastLurk) > 0) {
      let timeObj = humanizeDuration(cooldown - (Date.now() - lastLurk), { round: true });
      console.log(timeObj);
      return message.channel.send(`You must wait ${timeObj} before running that command again.`);
    } else {
      let stats = await statsDB.findOne({});
      if (stats) {
        stats.timesLurked += 1;
        await stats.save().catch(err => console.log(err));
      }
      message.channel.send(`You lurk into the graveyard in search of something valuable... (Choose One)\n\`${firstChoice.option}\`, \`${secondChoice.option}\`, \`${thirdChoice.option}\``).then(() => {
        message.channel.awaitMessages(filter, { max: 1, time: 10000, errors: ['time'] })
          .then(collected => {
            let success = Math.floor(Math.random() * 11);
            console.log(success);
            console.log(choice);
            if (choice === 'wrong') return message.channel.send("That's not even an option bro.");
            if (success >= 3 || choice.fail === undefined) {
              
              let moneyWon = Math.floor(Math.random() * (1500 - 500) + 500);
              if (userDB) {
                userDB.wallet += moneyWon;
                userDB.commands += 1;
                userDB.lurkCD = Date.now();
                userDB.save();
              } else {
                userDB = new curDB({
                  userID: target.id,
                  balance: 0,
                  wallet: moneyWon,
                  commands: 1,
                  lurkCD: Date.now()
                });
                userDB.save();
              }
              let string = choice.success[0].split(' ');
              let moneyIndex = string.findIndex((element) => element === 'money');
              string.splice(moneyIndex, 1, `$${moneyWon.toLocaleString()}`);
              let joined = string.join(' ');
              console.log(joined);
              message.channel.send(`${joined}`);
            } else {
              userDB.lurkCD = Date.now();
              message.channel.send(`${choice.fail}`);
              userDB.save();
            }
            
          })
          .catch(collected => {
            if (choice !== 'wrong') {
              
              message.channel.send("You didn't respond in time.");
            }
            userDB.lurkCD = Date.now();
            userDB.save();
          });
      });
      await userDB.save().catch(err => console.log(err));
    }
  }
}