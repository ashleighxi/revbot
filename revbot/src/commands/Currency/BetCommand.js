const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
const statsDB = require('../../utils/models/botstats.js');
const itemDB = require('../../utils/models/item.js');
module.exports = class BetCommand extends BaseCommand {
  constructor() {
    super('bet', 'Currency', ['gamble','roll'], 'gamble', 'Roll the dice and test your luck against revBot!');
  }

  async run(client, message, args) {
    let target = message.author;
    let bet = args[0];
    let cooldown = 4000;
    let maximumWallet = 10000000;
    let baseMulti = 0.35;
    let skull = 'revsskull';
    let hasSkull = false;
    let crown = 'revscrown';
    let hasCrown = false;
    const items = await itemDB.find({});
    
    if (bet === 0) return message.channel.send("You can't bet nothing idiot.");
    let cDB = await curDB.findOne({ userID: target.id });
    let stats = await statsDB.findOne({});
    if (cDB) {
      let lastBet = cDB.betCD;
      if (lastBet !== null && cooldown - (Date.now() - lastBet) > 0) {
        let timeObj = humanizeDuration(cooldown - (Date.now() - lastBet), { round: true });
        console.log(timeObj);
        return message.channel.send(`You must wait ${timeObj} before running that command again.`);
      } else {
        if (cDB.gamble === undefined) {
          cDB.gamble = {wins: 0, losses: 0, gained: 0, lost: 0};
        }
        stats.timesBet += 1;
        let userInv = cDB.inventory;
        let skullCheck = userInv.find( ({ itemID }) => itemID === skull);
        if (skullCheck !== undefined) hasSkull = true;
        if (hasSkull) baseMulti += 0.1;
        let crownCheck = userInv.find( ({ itemID }) => itemID === crown);
        if (crownCheck !== undefined) hasCrown = true;
        if (hasCrown) baseMulti += 0.15;
        let natureCheck = userInv.find( ({itemID}) => itemID === 'essenceofnature');
        if (natureCheck) baseMulti += 0.05;
        let sackCheck = userInv.find( ({itemID}) => itemID === 'greedysack');
        if (sackCheck) maximumWallet += 10000000;
        let wisdom = 1;
        userInv.forEach(item => {
          let current = items.find( ({itemID}) => itemID === item.itemID);
          if (current.wisdom) {
            wisdom += current.wisdom;
          }
        });
        baseMulti += (wisdom * 0.01);
        let walletBalance = cDB.wallet;
        if (walletBalance === undefined) return message.channel.send("You don't have any money to bet.");
        if (Number(walletBalance) >= maximumWallet) return message.channel.send("You're too loaded to gamble bro. Why don't you spend some of that money instead of being a hoarder?");
        if (parseInt(walletBalance) === 0) return message.channel.send("You can't bet nothing idiot.");
        console.log(walletBalance);
        if (bet === 'max' && Number(walletBalance) > 500000) {
          bet = 500000;
        } else if  (bet === 'max') {
          bet = Number(walletBalance);
        } 
        
        if (bet !== 'max') bet = Number(bet);
        if (bet > 500000 || bet <= 0) {
          return message.channel.send('You tryna break me :sob:');
        } 
        console.log(bet);
        console.log(isNaN(bet));
        if (isNaN(bet)) return message.channel.send('Please provide an amount to bet `(p)gamble <amount>`');
        bet = Math.ceil(bet);
        if (bet > walletBalance) return message.channel.send("You don't have that much money to bet. Poor xD.");
        if (bet < 50) return message.channel.send("You must bet at least $50.");
        let userRoll = Math.floor((Math.random() * 12) + 1);
        let revBotRoll = Math.floor((Math.random() * 12) + 1);
        let result;
        
        if (userRoll > revBotRoll) {
          result = 'won';
          let randMulti = (Math.random() * (2.5-0.5) ) + 0.5;
          const finalMulti = baseMulti * randMulti;
          const winAmount = Math.floor(finalMulti * bet)
          cDB.wallet += Number(winAmount);
          if (cDB.gamble.wins === undefined) {
            cDB.gamble.gained = Number(winAmount);
            cDB.gamble.wins = 1;
            stats.overallWins += 1;
            stats.overallGained += Number(winAmount);
            stats.overallNet += Number(winAmount);
          } else {
            cDB.gamble.gained += Number(winAmount);
            cDB.gamble.wins += 1;
            stats.overallWins += 1;
            stats.overallGained += Number(winAmount);
            stats.overallNet += Number(winAmount);
          }
          
          const winEmbed = new Discord.MessageEmbed()
            .setAuthor(`${target.username}'s gambling game`, target.displayAvatarURL({dynamic: true}))
            .setTitle(`You won $${winAmount.toLocaleString()}`)
            .setDescription(`\n\n**Percent won:** ${Math.floor(finalMulti * 100)}%\n**New Balance:** $${cDB.wallet.toLocaleString()}`)
            .addField(`${target.username}`, `Rolled \`${userRoll}\``, true)
            .addField(`revBot`, `Rolled \`${revBotRoll}\``, true)
            .setFooter(`Current Multiplier: ${Math.round(baseMulti * 100)}%`)
            .setColor('#03fc6b')
            .setTimestamp();
          
          message.channel.send(winEmbed);
        } else if (userRoll === revBotRoll) {
          result = 'tied'
          const tieAmount = Math.floor(bet/4);
          cDB.wallet -= Number(tieAmount);
          if (cDB.gamble.lost === undefined) {
            cDB.gamble.lost = Number(tieAmount);
            cDB.gamble.losses = 1;
            stats.overallLosses += 1;
            stats.overallLost += Number(tieAmount);
            stats.overallNet -= Number(tieAmount);
          } else {
            cDB.gamble.lost += Number(tieAmount);
            cDB.gamble.losses += 1;
            stats.overallLosses += 1;
            stats.overallLost += Number(tieAmount);
            stats.overallNet -= Number(tieAmount);
          }
          
          const tieEmbed = new Discord.MessageEmbed()
            .setAuthor(`${target.username}'s gambling game`, target.displayAvatarURL({dynamic: true}))
            .setTitle(`Tie! You lost $${tieAmount.toLocaleString()}`)
            .setDescription(`\n\n**New Balance:** $${cDB.wallet.toLocaleString()}`)
            .addField(`${target.username}`, `Rolled \`${userRoll}\``, true)
            .addField(`revBot`, `Rolled \`${revBotRoll}\``, true)
            .setFooter(`Current Multiplier: ${Math.round(baseMulti * 100)}%`)
            .setColor('#fff345')
            .setTimestamp();
          
          message.channel.send(tieEmbed);
        } else {
          result = 'lost';
          cDB.wallet -= bet;
          if (cDB.gamble.lost === undefined) {
            cDB.gamble.lost = Number(bet);
            cDB.gamble.losses = 1;
            stats.overallLosses += 1;
            stats.overallLost += Number(bet);
            stats.overallNet -= Number(bet);
          } else {
            cDB.gamble.lost += Number(bet);
            cDB.gamble.losses += 1;
            stats.overallLosses += 1;
            stats.overallLost += Number(bet);
            stats.overallNet -= Number(bet);
          }
          
          const loseEmbed = new Discord.MessageEmbed()
            .setAuthor(`${target.username}'s gambling game`, target.displayAvatarURL({dynamic: true}))
            .setTitle(`You Lost!`)
            .setDescription(`Bet amount: $${(bet).toLocaleString()}\n\n**New Balance:** $${cDB.wallet.toLocaleString()}`)
            .addField(`${target.username}`, `Rolled \`${userRoll}\``, true)
            .addField(`revBot`, `Rolled \`${revBotRoll}\``, true)
            .setFooter(`Current Multiplier: ${Math.round(baseMulti * 100)}%`)
            .setColor('#fc0303')
            .setTimestamp();
          
          message.channel.send(loseEmbed);
        }
        
        cDB.commands += 1;
        cDB.betCD = Date.now();
        await cDB.save().catch(err => console.log(err));
        await stats.save().catch(err => console.log(err));
      }
    }
  }
}