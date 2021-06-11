const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const userDB = require('../../utils/models/currency.js');
const humanizeDuration = require('humanize-duration');
const { response } = require('express');
const statsDB = require('../../utils/models/botstats.js');
const itemDB = require('../../utils/models/item.js');
let startingBossHealth;
module.exports = class RaidCommand extends BaseCommand {
  constructor() {
    super('raid', 'Currency', [], 'raid', 'Gather a party to raid the Skeleton King!');
  }

  async run(client, message, args) {
    let raidGroup = new Map();
    let starter = await getUser(message.author);
    let stats = await statsDB.findOne({});
    let items = await itemDB.find({});
    let cooldown = 60000 * 30;
    let raiderCooldown = 60000 * 5;
    let bosshealth = 1500;
    
    async function joinFilter(response) {
      if (response.content.toLowerCase() === 'join raid') {
        let raider = await getUser(response.author);
        if (raider === undefined)
          return console.log('this raider could not be found in the database');
        let lastRaid = raider.raidCD;
        if (lastRaid !== null && raiderCooldown - (Date.now() - lastRaid) > 0) {
          let timeObj = humanizeDuration(raiderCooldown - (Date.now() - lastRaid), { round: true });
          console.log(timeObj);
          return message.channel.send(`<@!${raider.userID}>, You've joined a raid in the last 5 minutes. You must wait ${timeObj} before running that command again.`);
        } else {
          raider.raidCD = Date.now();
          let inv = raider.inventory;
          let attack = 1;
          if (inv) {
            inv.forEach(item => {
              let current = items.find( ({itemID}) => itemID === item.itemID);
              if (current.attack) {
                attack += current.attack;
              }
            });
          }
          await raider.save().catch(err => console.log(err));
          return raidGroup.set(raider.userID, { raiderID: raider.userID, level: Math.floor(raider.commands / 100), hasAttacked: false, hasDefended: false, attack: attack });

        }
      }
    }
    const attFilter = response => raidGroup.has(response.author.id) && response.content.toLowerCase() === 'attack';
    const defFilter = response => raidGroup.has(response.author.id) && response.content.toLowerCase() === 'defend';
    
    
    if (starter) {
      let lastRaidStart = starter.raidStartCD;
      let lastRaid = starter.raidCD;
      if (lastRaidStart !== null && cooldown - (Date.now() - lastRaidStart) > 0) {
        let timeObj = humanizeDuration(cooldown - (Date.now() - lastRaidStart), { round: true });
        console.log(timeObj);
        return message.reply(`You've started a raid in the last 30 minutes. You must wait ${timeObj} before running that command again.`);
      } else if (lastRaid !== null && raiderCooldown - (Date.now() - lastRaid) > 0) {
        let timeObj = humanizeDuration(raiderCooldown - (Date.now() - lastRaid), { round: true });
        console.log(timeObj);
        return message.reply(`You've joined a raid in the last 5 minutes. You must wait ${timeObj} before running that command again.`);
      } else {
        let inv = starter.inventory;
        let attack = 1;
        if (inv) {
          inv.forEach(item => {
            let current = items.find( ({itemID}) => itemID === item.itemID);
            if (current.attack) {
              attack += current.attack;
            }
          });
        }
        raidGroup.set(starter.userID, { raiderID: starter.userID, level: Math.floor(starter.commands/100), hasAttacked: false, hasDefended: false, attack: attack });
        message.channel.send(`<@!${starter.userID}> is starting a Crypt Raid! type \`join raid\` to team up with them! **Warning: You can die here**`).then( () => {
          message.channel.awaitMessages(joinFilter, { max: 1000, time: 10000 * 3, errors: ['time'] }).then( collected => {
          }).catch( collected => {
            
            let raidText = '';
            // for (let [key,value] of raidGroup.entries()) {
            //   raidText += `${key}: ${value.raiderID}, ${value.level}\n`;
            // }
            // message.channel.send(`\`\`\`${raidText}\`\`\``);
            bosshealth = bosshealth * raidGroup.size;
            startingBossHealth = bosshealth;
            if (raidGroup.size <= 1) return message.channel.send('Nobody joined your raid... sed...');
            message.channel.send(`Time's up! \`${raidGroup.size}\` people have joined <@!${starter.userID}>'s raid! **GET READY!**`);
            starter.raidStartCD = Date.now();
            starter.raidCD = Date.now();
            starter.save();
            stats.raids += 1;
            stats.save();
            message.channel.send(`The Skeleton King has appeared! type \`attack\` to send him back to the grave!`).then(() => {
              message.channel.awaitMessages(attFilter, { max: 1000, time: 15000, error: ['time'] }).then(collected => {
                
                let groupDamage = '';
                let totalDamage = 0;
                collected.forEach(element => {
                  
                  let raider = raidGroup.get(element.author.id);
                  let damage = Math.floor(Math.random() * ((150 * (1 + (raider.attack * 0.1)) + raider.level) - (75 * (1 + (raider.attack * 0.1))) + 1) + 75);
                  totalDamage += damage;
                  groupDamage += `+ ${element.author.username} did ${damage} damage!\n`;
                }); 
                groupDamage += `+ The group did ${totalDamage.toLocaleString} damage!`;
                bosshealth -= totalDamage;
                message.channel.send(`\`\`\`diff\n${groupDamage}\`\`\``);
                if (bosshealth <= 0) {
                  reward(message, raidGroup);
                  return message.channel.send('Congratulations! You have defeated the Skeleton King!');
                }
                
                message.channel.send(`The Skeleton King has ${bosshealth.toLocaleString()} health left! Get ready to defend!`);
                message.channel.send(`The Skeleton King prepares to attack! type \`defend\` to avoid his strike!`).then(() => {
                  message.channel.awaitMessages(defFilter, { max: 1000, time: 15000, error: ['time'] }).then(collected => {
                    let groupDeaths = '';
                    collected.forEach(element => {
                      let raider = raidGroup.get(element.author.id);
                      raider.hasDefended = true;
                    });
                    raidGroup.forEach(async element => {
                      if (!element.hasDefended) {
                        let mentionedMember = message.guild.members.cache.get(element.raiderID);
                        groupDeaths += `- ${mentionedMember.user.username} has died!\n`;
                        let user = await getUser(mentionedMember.user);
                        await death(message, user);
                        raidGroup.delete(element.raiderID);
                      }
                      
                    });
                    if (groupDeaths !== '') message.channel.send(`\`\`\`diff\n${groupDeaths}\`\`\``);
                    message.channel.send('The Skeleton King takes a moment to rest... Now finish him off with `attack`!').then( () => {
                      message.channel.awaitMessages(attFilter, { max: 1000, time: 15000, error: ['time'] }).then(async collected => {
                        let groupDamage = '';
                        let totalDamage = 0;
                        collected.forEach(element => {
                          
                          let raider = raidGroup.get(element.author.id);
                          let damage = Math.floor(Math.random() * ((150 * (1 + (raider.attack * 0.1)) + raider.level) - (75 * (1 + (raider.attack * 0.1))) + 1) + 75);
                          totalDamage += damage;
                          groupDamage += `+ ${element.author.username} did ${damage} damage!\n`;
                        }); 
                        bosshealth -= totalDamage;
                        groupDamage += `+ The group did ${totalDamage.toLocaleString} damage!`;
                        if (bosshealth <= 0) {
                          message.channel.send(`\`\`\`diff\n${groupDamage}\`\`\``);
                          reward(message, raidGroup);
                          return message.channel.send('Congratulations! You have defeated the Skeleton King!');
                        } 
                        raidGroup.forEach(async element => {
                          let mentionedMember = message.guild.members.cache.get(element.raiderID);
                          groupDeaths += `- ${mentionedMember.user.username} has died!\n`;
                          let user = await getUser(mentionedMember.user);
                          await death(message, user);
                          raidGroup.delete(element.raiderID);
                        });

                        if (groupDeaths !== '') message.channel.send(`\`\`\`diff\n${groupDeaths}\`\`\``);
                        return message.channel.send('Welp... you failed. Better luck next time!');
                      })
                    })
                    
                  }).catch(err => console.log(err));
                });
                
                
              }).catch( collected => {
                console.log(collected);
                return message.channel.send(`Final Boss Health: ${bosshealth.toLocaleString()}`);
              });
            });
          });
        });
        
      }
    }
  }
}

async function getUser(user) {
  let u = await userDB.findOne({ userID: user.id });
  if (u === undefined) {
    console.log('user could not be found');
    return undefined;
  }
  console.log(u);
  return u;
}

async function getUserByID(id) {
  let u = await userDB.findOne({ userID: id });
  if (u === undefined) {
    console.log('user could not be found');
    return undefined;
  }
  console.log(u);
  return u;
}
async function death(msg, user) {
  msg.channel.send("A member of your team has been killed by the Skeleton King!");
  let userInv = user.inventory;
  let revivalID = 'revivalstone';
  let revivalCheck = userInv.find(({ itemID }) => itemID === revivalID);
  let revivalIndex = userInv.indexOf(revivalCheck);
  if (revivalCheck !== undefined) {
    revivalCheck.count -= 1;
    if (revivalCheck.count === 0)
      userInv.splice(revivalIndex, 1);
    msg.channel.send(`<@!${user.userID}> Your Revival Stone has resurrected you, destroying itself in the process.`);
    user.save();
    return;
  } else {
    user.wallet = 0;
    msg.channel.send(`<@!${user.userID}> You died! Congrats, you lost everything in your wallet. :)`);
    user.save();
    return;
  }
}

async function reward(msg, group) {
  let payout = Math.floor((startingBossHealth * 500) / group.size);
  group.forEach(async user => {
    let raider = await getUserByID(user.raiderID);
    if (raider.wallet === undefined) {
      raider.wallet = payout;
    } else {
      raider.wallet += payout;
    }
    await raider.save();
  });
  msg.channel.send(`Each remaining raider got a payout of **$${payout.toLocaleString()}!**`);
}