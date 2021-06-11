const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const vouchDB = require('../../utils/models/vouch.js');
const talkedRecently = new Set();
module.exports = class VouchCommand extends BaseCommand {
  constructor() {
    super('vouch', 'Trading', []);
  }

  async run(client, message, args) {
    if (talkedRecently.has(message.author.id)) {
      message.channel.send("Please wait 5 minutes before typing this command again");

    } else {
      let target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
      if (!target) return message.channel.send('You must give a valid user to vouch.');
      if (target.user.id === message.author.id) return message.channel.send("You can't vouch yourself... cheater...");
      let vDB = await vouchDB.findOne({ userID: target.user.id });
      if (vDB) {
        let vAmount = vDB.vouches;
        vAmount++;
        console.log(vDB.userID, vAmount);
        vDB.vouches = vAmount;
        await vDB.save().catch(err => console.log(err)).then(() => message.react('✅'));
      } else {
        vDB = new vouchDB({
          userID: target.user.id,
          vouches: 1
        });
        await vDB.save().catch(err => console.log(err)).then(() => message.react('✅'));
      }
      talkedRecently.add(message.author.id);
      setTimeout(() => {
        // Removes the user from the set after 20 seconds
        talkedRecently.delete(message.author.id);
      }, 300000);
    }
  }
}