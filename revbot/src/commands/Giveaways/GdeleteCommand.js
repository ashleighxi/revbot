const BaseCommand = require('../../utils/structures/BaseCommand');
const ms = require('ms');
module.exports = class GdeleteCommand extends BaseCommand {
  constructor() {
    super('gdelete', 'Giveaways', ['gdel'], 'gdelete', 'Delete a giveaway from the database.');
  }

  async run(client, message, args) {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("You do not have permission to reroll a giveaway. Requires `ADMINISTRATOR`.");
    let messageID = args[0];
    client.giveawaysManager.delete(messageID).then( () => {
      message.channel.send('Giveaway deleted successfully!');
    }).catch( (err) => {
      message.channel.send('No giveaways found for ' + messageID + ', check the ID and try again.')
    });
  }
}