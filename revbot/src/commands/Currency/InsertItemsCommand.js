const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const usersDB = require('../../utils/models/currency.js');
module.exports = class InsertItemsCommand extends BaseCommand {
  constructor() {
    super('insertItems', 'Currency', ['updateUsers'], undefined, undefined);
  }

  async run(client, message, args) {
    if (message.author.id !== '206982524021243914') return message.channel.send('This is a rev only command.');
    let allUsers = await usersDB.find({}); 
    allUsers.forEach(async function (element) {
        console.log(element);
        element.stats = { attack: 1, wisdom: 1, dexterity: 1, experience: element.commands };
    });
    await allUsers.save().catch(err => console.log(err));
    message.channel.send(`User stats updated.`);
  }
}