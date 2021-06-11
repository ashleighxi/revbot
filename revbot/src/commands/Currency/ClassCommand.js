const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const userDB = require('../../utils/models/currency.js');
const e = require('express');
module.exports = class ClassCommand extends BaseCommand {
  constructor() {
    super('class', 'Currency', [], 'class', 'Choose your class for participating in revBot Dungeons!');
  }

  async run(client, message, args) {
    let target = message.author;
    let user = await userDB.findOne({ userID: target.id });
    let classes = ['Mage (Wisdom)', 'Warrior (Attack)', 'Rogue (Dexterity)', 'Warlock (Wisdom)', 'Priest (Wisdom)', 'Paladin (Attack, Wisdom)'];
    let descriptions = [
      "A mage is a user of ancient spells and magick. They use their vast knowledge of the arcane elements to defeat enemies in combat.",
      "A warrior is a battle-hardened soldier at heart. They use sheer force and determination to deal with their enemies. Whether they win or lose, there will be blood.",
      "A rogue is a devious, cunning character. They use their agility and wit to outpace and outsmart their opponents. Never bet against a rogue.",
      "A warlock is a student of the Dark Arts. They devote their lives to death and destruction. This devotion has granted them powers that reach beyond the living.",
      "A priest is a follower of The Divine One. They pledge that every act they commit will be in service of The Divine One. In return, they have been granted the power to perform various miracles.",
      "A paladin is a warrior of The Divine One. They pledge their loyalty and military service to The Divine One. This devout loyalty has granted them abilities that exceed that of a normal warrior."
    ];
    const filter = res => res.author.id === target.id && (res.content.toLowerCase() === 'mage' || res.content.toLowerCase() === 'warrior' || res.content.toLowerCase() === 'rogue' || res.content.toLowerCase() === 'warlock' || res.content.toLowerCase() === 'priest' || res.content.toLowerCase() === 'paladin');
    const classEmbed = new Discord.MessageEmbed()
    .setTitle("Classes")
    .setDescription("Respond with the class of your choosing by typing either `Mage`, `Warrior`, `Rogue`, `Warlock`, `Priest`, or `Paladin`.")
    .addField(classes[0], descriptions[0])
    .addField(classes[1], descriptions[1])
    .addField(classes[2], descriptions[2])
    .addField(classes[3], descriptions[3])
    .addField(classes[4], descriptions[4])
    .addField(classes[5], descriptions[5])
    .setColor('#9803fc')
    .setFooter('Choose wisely...');

    await message.channel.send(classEmbed).catch(err => console.log(err));
    const msgs = await message.channel.awaitMessages(filter, { max: 1, time: 30000 });
    if (msgs.size > 0) {
      msgs.forEach( element => {
        user.class = element.content.toLowerCase();
      });
      if (user.stats === undefined) {
        user.stats = { attack: 1, wisdom: 1, dexterity: 1, experience: user.commands };
      }
      await user.save();
      return message.channel.send(`You've chosen \`${user.class}\`!`);
    } else {
      return message.channel.send('It seems that you did not respond in time.');
    }

  }
}