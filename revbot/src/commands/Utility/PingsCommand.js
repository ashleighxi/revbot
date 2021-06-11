const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class PingsCommand extends BaseCommand {
  constructor() {
    super('pings', 'Utility', []);
  }

  async run(client, message, args) {
    if (message.guild.id !== '796236163681091594') return;
    let roles = [];
    
    let otherHeist = message.guild.roles.cache.get('799847693382975518');
    let heist = message.guild.roles.cache.get('796277181277011978');
    let giveaways = message.guild.roles.cache.get('796236163681091595');
    let events = message.guild.roles.cache.get('797996261038096385');
    let partnership = message.guild.roles.cache.get('796935541152808980');
    let announcements = message.guild.roles.cache.get('796935413624602664');
    roles.push(otherHeist, heist, giveaways, events, partnership, announcements);
    const pingEmbed = new Discord.MessageEmbed()
      .setTitle('Dank Revival Pings');
    let description = '';
    roles.forEach( (role) => {
      description += `<@&${role.id}> - ${role.members.size} members\n\n`;
    });
    pingEmbed.setDescription(description).setTimestamp().setColor('RANDOM');
    message.channel.send(pingEmbed).catch( err => console.log(err));
    
    
  }
}