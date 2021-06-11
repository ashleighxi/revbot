const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const itemDB = require('../../utils/models/item.js');
const userDB = require('../../utils/models/currency.js');
const FuzzySearch = require('fuzzy-search');
module.exports = class ItemCommand extends BaseCommand {
  constructor() {
    super('item', 'Currency', [], 'item', 'Check the description of an item.');
  }

  async run(client, message, args) {
    let target = message.author;
    let itemID = args[0].toLowerCase();
    let itemName = '';
    let itemDescription = '';
    let itemEffect;
    let buyPrice;
    let sellPrice;
    let itemIcon;
    let itemType;
    const items = await itemDB.find({});
    const searcher = new FuzzySearch(items, ['itemID'], {caseSensitive: false, sort: true});
    const result = searcher.search(itemID);
    console.log(result);
    console.log(result[0].itemID);
    let item = await itemDB.findOne({ itemID: result[0].itemID });
    let user = await userDB.findOne({ userID: target.id });
    if (itemID.length < 2) return message.channel.send('I could\'nt find this item.');
    if (item) {
      let userInv = user.inventory;
      let hasItem;
      let itemCount = '';
      if (userInv) {
        hasItem = userInv.find( ({itemID}) => itemID === result[0].itemID);
        if (hasItem) itemCount += `(${hasItem.count.toLocaleString()} owned)`;
      }
      itemName = item.itemName;
      itemDescription = item.description;
      itemEffect = item.effect;
      buyPrice = Number(item.buyPrice);
      sellPrice = Number(item.itemPrice);
      itemIcon = item.icon;
      itemType = item.type;
      if (buyPrice === undefined || isNaN(buyPrice)) buyPrice = 'Cannot be bought'
      if (sellPrice === undefined || isNaN(sellPrice)) sellPrice = 'Cannot be sold';
      if (itemEffect === undefined) itemEffect = 'None';

      const itemEmbed = new Discord.MessageEmbed()
        .setTitle(`**${itemIcon} ${itemName}** ${itemCount}`)
        .setDescription(`${itemDescription}`)
        .addField('Effect:', `${itemEffect}`)
        .addField(`**BUY - ${buyPrice.toLocaleString()}**`, `**SELL - ${sellPrice.toLocaleString()}**`)
        .setFooter(`item ID: ${result[0].itemID}`)
        .setColor('RANDOM')
        .setTimestamp();
      
      await message.channel.send(itemEmbed).catch(err => console.log(err));
        
    } else {
      return message.channel.send('This item could not be found.');
    }

  }
}