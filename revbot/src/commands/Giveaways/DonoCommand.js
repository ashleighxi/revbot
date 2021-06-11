const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const donationDB = require('../../utils/models/donations');
const guildDB = require('../../utils/models/guilds');
module.exports = class DonoCommand extends BaseCommand {
  constructor() {
    super('dono', 'Giveaways', []);
  }

  async run(client, message, args) {
    let choice = args[0].toLowerCase();
    let target = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    const donoEmbed = new Discord.MessageEmbed();
    let user;
    if (!target && choice !== 'setup') {
      donoEmbed.setTitle('Oops!');
      donoEmbed.setDescription("That's not a valid option - Usage is `(prefix)dono <add/remove/check> <user> (amount)`");
      return message.channel.send(donoEmbed);
    } else {
      if (target) {
        target = target.user;
        user = await donationDB.findOne({ id: target.id });
      }
    }
    
    if (!user && choice !== 'setup') {
      const user = new donationDB({
        id: target.id,
        donations: [],
        roles: []
      })
      await user.save();
    }
    donoEmbed.setColor('RANDOM');
      if (choice === 'add') {
        const gawManagerRole = message.guild.roles.cache.get(guild.guildGiveawayManagerRole);
        let hasGAW;
        if (gawManagerRole) {
          hasGAW = message.member.roles.cache.has(`${gawManagerRole.id}`);
        }
        const eventManagerRole = message.guild.roles.cache.get(guild.guildEventManagerRole);
        let hasEvents;
        if (eventManagerRole) {
          hasEvents = message.member.roles.cache.has(`${eventManagerRole.id}`);
        }
        const heistManagerRole = message.guild.roles.cache.get(guild.guildHeistManagerRole);
        let hasHeists;
        if (heistManagerRole) {
          hasHeists = message.member.roles.cache.has(`${heistManagerRole.id}`);
        }
        if(!message.member.hasPermission("ADMINISTRATOR") && !hasGAW && !hasEvents && !hasHeists) return message.channel.send("You do not have permission to use this command. Requires `ADMINISTRATOR` or the giveaway manager role setup with `(p)setgawmanager`");
        let amount = args[2];
        if (isNaN(amount)) {
          let multiplier = amount.slice(-1);
          if (multiplier.toLowerCase() === 'b') {
            amount = amount.slice(0, -1) * 1000000000;
          } else if (multiplier.toLowerCase() === 'm') {
            amount = amount.slice(0, -1) * 1000000;
          } else if (multiplier.toLowerCase() === 'k') {
            amount = amount.slice(0, -1) * 1000;
          } else {
            donoEmbed.setTitle('Oops!');
            donoEmbed.setDescription("That's not a valid amount - Usage is `(prefix)dono <add/remove/check> <user> (amount)`");
            return message.channel.send(donoEmbed);
          }
        } 
        let guildCheck = user.donations.find( ({guild}) => guild === message.guild.id);
        if (guildCheck) {
          guildCheck.amount = Number(guildCheck.amount) + Number(amount);
        } else {
          await user.donations.push({
            guild: message.guild.id,
            amount: amount
          });
        }
        guildCheck = user.donations.find( ({guild}) => guild === message.guild.id);
        guild.donationRoles.forEach(async role => {
          if (guildCheck.amount >= role.amount) {
            let member = await message.guild.members.cache.get(target.id);
            member.roles.add(role.id);
          }
        })
        await user.save();
        await message.react('796815507297796156');
  
      } else if (choice === 'remove') {
        let amount = args[2];
        const gawManagerRole = message.guild.roles.cache.get(guild.guildGiveawayManagerRole);
        let hasGAW;
        if (gawManagerRole) {
          hasGAW = message.member.roles.cache.has(`${gawManagerRole.id}`);
        }
        const eventManagerRole = message.guild.roles.cache.get(guild.guildEventManagerRole);
        let hasEvents;
        if (eventManagerRole) {
          hasEvents = message.member.roles.cache.has(`${eventManagerRole.id}`);
        }
        const heistManagerRole = message.guild.roles.cache.get(guild.guildHeistManagerRole);
        let hasHeists;
        if (heistManagerRole) {
          hasHeists = message.member.roles.cache.has(`${heistManagerRole.id}`);
        }
        if(!message.member.hasPermission("ADMINISTRATOR") && !hasGAW && !hasEvents && !hasHeists) return message.channel.send("You do not have permission to use this command. Requires `ADMINISTRATOR` or the giveaway manager role setup with `(p)setgawmanager`");
        if (isNaN(amount)) {
          let multiplier = amount.slice(-1);
          if (multiplier.toLowerCase() === 'b') {
            amount = amount.slice(0, -1) * 1000000000;
          } else if (multiplier.toLowerCase() === 'm') {
            amount = amount.slice(0, -1) * 1000000;
          } else if (multiplier.toLowerCase() === 'k') {
            amount = amount.slice(0, -1) * 1000;
          } else {
            donoEmbed.setTitle('Oops!');
            donoEmbed.setDescription("That's not a valid amount - Usage is `(prefix)dono <add/remove/check> <user> (amount)`");
            return message.channel.send(donoEmbed);
          }
        } 
        let guildCheck = user.donations.find( ({guild}) => guild === message.guild.id);
        if (guildCheck) {
          guildCheck.amount = Number(guildCheck.amount) - Number(amount);
        } else {
          donoEmbed.setTitle('Oops!');
          donoEmbed.setDescription("This user hasn't donated in this guild - Usage is `(prefix)dono <add/remove/check> <user> (amount)`");
          return message.channel.send(donoEmbed);
        }
        if (guildCheck.amount < 0) {
          guildCheck.amount = 0;
        }
        guildCheck = user.donations.find( ({guild}) => guild === message.guild.id);
        guild.donationRoles.forEach(async role => {
          if (guildCheck.amount < role.amount) {
            let member = await message.guild.members.cache.get(target.id);
            member.roles.remove(role.id);
          }
        })
        await user.save();
        await message.react('796815507297796156');
      } else if (choice === 'check') {
        let guildCheck = user.donations.find( ({guild}) => guild === message.guild.id);
        let localDonations = 0;
        let globalDonations = 0;
        if (guildCheck) {
          localDonations = guildCheck.amount;
        }
        user.donations.forEach(donation => {
          globalDonations += donation.amount;
        });
        donoEmbed.setTitle(`${target.username}'s Donations`);
        donoEmbed.setDescription(`Local Donations: \`${localDonations.toLocaleString()}\`\nGlobal Donations: \`${globalDonations.toLocaleString()}\``);
        message.channel.send(donoEmbed);
      } else if (choice === 'setup') {
        let loop = true;
        let donoRole = {
          id: '',
          amount: 0
        };
        if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("You do not have permission to use this command. Requires `ADMINISTRATOR` or the giveaway manager role setup with `(p)setgawmanager`");
        while(loop) {
          donoEmbed.setTitle('Donation Setup');
          donoEmbed.setDescription('Add a donation role to automate role distribution. Please provide a role to associate (use role id). Type `done` to exit setup.');
          await message.channel.send(donoEmbed);
          const filter = response => response.author.id === message.author.id;
          const res = await message.channel.awaitMessages(filter, {max: 1, time: 30000 });
          if (res.size > 0) {
            let element;
            res.forEach(response => {
              element = response.content.toLowerCase();
            })
            if (element === 'done') return message.channel.send('Setup Complete.');
            let role = message.guild.roles.cache.get(element);
            if (!role) return message.channel.send("That isn't a valid role.");
            donoRole.id = role.id;
            donoEmbed.setDescription('What amount would you like this role to be associated with?');
            await message.channel.send(donoEmbed);
            const amountRes = await message.channel.awaitMessages(filter, { max: 1, time: 30000 });
            if (amountRes.size > 0) {
              let element;
              amountRes.forEach(response => {
                element = response.content.toLowerCase();
              })
              if (isNaN(element)) {
                return message.channel.send("That isn't a valid number.");
              } else {
                donoRole.amount = Number(element);
                await guild.donationRoles.push(donoRole);
                donoEmbed.setDescription(`<@&${role.id}>: ${donoRole.amount.toLocaleString()}`);
                await guild.save();
                await message.channel.send(donoEmbed);
              }
            } else {
              return message.channel.send('Action timed out.');
            }
          } else {
            return message.channel.send('Action timed out.');
          }
        }
       } else {
        donoEmbed.setTitle('Oops!');
        donoEmbed.setDescription("That's not a valid option - Usage is `(prefix)dono <add/remove/check> <user> (amount)`");
        return message.channel.send(donoEmbed);
      }
    
    
  }
}