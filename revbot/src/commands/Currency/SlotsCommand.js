const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
const statsDB = require('../../utils/models/botstats.js');
const itemDB = require('../../utils/models/item.js');
module.exports = class SlotsCommand extends BaseCommand {
  constructor() {
    super('slots', 'Currency', [], 'slots', 'Test your luck on Rev\'s Slot Machine!');
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
    let items = await itemDB.find({});
    const emojis = ['😈','👀','🗿','🖕','🔥','🍑','🍆','🔮','☠️'];
    let slot1;
    let slot2;
    let slot3;
    if (isNaN(bet) && bet !== 'max') return message.channel.send('Please provide an amount to bet `(p)slots <amount>`');
    if (parseInt(bet) === 0) return message.channel.send("You can't bet nothing idiot.");
    let cDB = await curDB.findOne({ userID: target.id });
    let stats = await statsDB.findOne({});
    if (cDB) {
      let lastBet = cDB.slotsCD;
      if (lastBet !== null && cooldown - (Date.now() - lastBet) > 0) {
        let timeObj = humanizeDuration(cooldown - (Date.now() - lastBet), { round: true });
        console.log(timeObj);
        return message.channel.send(`You must wait ${timeObj} before running that command again.`);
      } else {
        stats.timesSlots += 1;
        if (cDB.gamble === undefined) {
          cDB.gamble = {wins: 0, losses: 0, gained: 0, lost: 0};
        }
        cDB.slotsCD = Date.now();
        await cDB.save().catch(err => console.log(err));
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
        if (bet === 'max' && parseInt(walletBalance) > 500000) {
          bet = 500000;
        } else if (bet === 'max') {
          bet = walletBalance;
        } 
        if (bet !== 'max') bet = Number(bet);
        if (bet > 500000 || bet <= 0) {
          return message.channel.send('You tryna break me :sob:');
        } 
        if (bet > walletBalance) return message.channel.send("You don't have that much money to bet. Poor xD.");
        bet = Math.ceil(bet);
        if (bet < 50) return message.channel.send("You must bet at least $50.");
        slot1 = emojis[Math.floor(Math.random() * 9)];
        slot2 = emojis[Math.floor(Math.random() * 9)];
        slot3 = emojis[Math.floor(Math.random() * 9)];
        const emojiEmbed = new Discord.MessageEmbed()
          .setAuthor(`${target.username}'s gambling game`, target.displayAvatarURL({dynamic: true}))
          .setTitle(`**>** ${slot1} ${slot2} ${slot3} **<**`)

        let msg = await message.channel.send(emojiEmbed);
        let result;
        setTimeout(async () => {
          if (slot1 === slot2 && slot1 === slot3) {
            result = 'won';
            let randMulti = (Math.random() * (5-1.5) ) + 1.5;
            const finalMulti = baseMulti * randMulti;
            const winAmount = Math.floor(finalMulti * bet)
            cDB.wallet += parseInt(winAmount);
            if (cDB.gamble.wins === undefined) {
              cDB.gamble.gained = parseInt(winAmount);
              cDB.gamble.wins = 1;
              stats.overallWins += 1;
              stats.overallGained += parseInt(winAmount);
              stats.overallNet += parseInt(winAmount);
            } else {
              cDB.gamble.gained += parseInt(winAmount);
              cDB.gamble.wins += 1;
              stats.overallWins += 1;
              stats.overallGained += parseInt(winAmount);
              stats.overallNet += parseInt(winAmount);
            }
            
            const winEmbed = new Discord.MessageEmbed()
              .setAuthor(`${target.username}'s gambling game`, target.displayAvatarURL({dynamic: true}))
              .setTitle(`You won $${winAmount.toLocaleString()}`)
              .setDescription(`\n\n**Percent won:** ${Math.floor(finalMulti * 100)}%\n**New Balance:** $${cDB.wallet.toLocaleString()}`)
              .addField(`Outcome`, `**>** ${slot1} ${slot2} ${slot3} **<**`)
              .setFooter(`Current Multiplier: ${Math.round(baseMulti * 100)}%`)
              .setColor('#03fc6b')
              .setTimestamp();
            cDB.commands += 1;
            await cDB.save().catch(err => console.log(err));
            msg.edit(winEmbed);
          } else if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
            result = 'won'
            let randMulti = (Math.random() * (4-1) ) + 1;
            const finalMulti = baseMulti * randMulti;
            const winAmount = Math.floor(finalMulti * bet)
            cDB.wallet += parseInt(winAmount);
            if (cDB.gamble.wins === undefined) {
              cDB.gamble.gained = parseInt(winAmount);
              cDB.gamble.wins = 1;
              stats.overallWins += 1;
              stats.overallGained += parseInt(winAmount);
              stats.overallNet += parseInt(winAmount);
            } else {
              cDB.gamble.gained += parseInt(winAmount);
              cDB.gamble.wins += 1;
              stats.overallWins += 1;
              stats.overallGained += parseInt(winAmount);
              stats.overallNet += parseInt(winAmount);
            }
            const winEmbed = new Discord.MessageEmbed()
              .setAuthor(`${target.username}'s gambling game`, target.displayAvatarURL({dynamic: true}))
              .setTitle(`You won $${winAmount.toLocaleString()}`)
              .setDescription(`\n\n**Percent won:** ${Math.floor(finalMulti * 100)}%\n**New Balance:** $${cDB.wallet.toLocaleString()}`)
              .addField(`Outcome`, `**>** ${slot1} ${slot2} ${slot3} **<**`)
              .setFooter(`Current Multiplier: ${Math.round(baseMulti * 100)}%`)
              .setColor('#03fc6b')
              .setTimestamp();
            cDB.commands += 1;
            await cDB.save().catch(err => console.log(err));
            msg.edit(winEmbed);
          } else {
            result = 'lost';
            cDB.wallet -= parseInt(bet);
            if(cDB.gamble.lost === undefined) {
              cDB.gamble.lost = parseInt(bet);
              cDB.gamble.losses = 1;
              stats.overallLosses += 1;
              stats.overallLost += parseInt(bet);
              stats.overallNet -= parseInt(bet);
            } else {
              cDB.gamble.lost += parseInt(bet);
              cDB.gamble.losses += 1;
              stats.overallLosses += 1;
              stats.overallLost += parseInt(bet);
              stats.overallNet -= parseInt(bet);
            }
            
            const loseEmbed = new Discord.MessageEmbed()
              .setAuthor(`${target.username}'s gambling game`, target.displayAvatarURL({dynamic: true}))
              .setTitle(`You Lost!`)
              .setDescription(`Bet amount: $${parseInt(bet).toLocaleString()}\n\n**New Balance:** $${cDB.wallet.toLocaleString()}`)
              .addField(`Outcome`, `**>**${slot1} ${slot2} ${slot3}**<**`)
              .setFooter(`Current Multiplier: ${Math.round(baseMulti * 100)}%`)
              .setColor('#fc0303')
              .setTimestamp();
            cDB.commands += 1;
            await cDB.save().catch(err => console.log(err));
            await stats.save().catch(err => console.log(err));
            msg.edit(loseEmbed);

          }
          
        },1000)
        
        
        
      }
    }
  }
}