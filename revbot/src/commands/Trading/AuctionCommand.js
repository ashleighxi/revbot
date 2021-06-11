const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
let timeout;
let isActive; 
module.exports = class AuctionCommand extends BaseCommand {
  constructor() {
    super('auction', 'Trading', ['auc']);
  }

  async run(client, message, args) {
    let option = args[0];
    let seller = message.mentions.members.first() || message.guild.members.cache.get(option);
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    let auctioneer = guild.guildAuctioneerRole;
    if (auctioneer === undefined) return message.channel.send('You must set the auctioneer role. `//setauctioneer <role_id>`');
    if (!message.member.roles.cache.has(auctioneer)) return message.channel.send('Only Auctioneers can run these commands.');
    if (seller) {
      let quantity = args[1];
      let item = args[2];
      let startingPrice = args[3];
      if (quantity === undefined || isNaN(Number(quantity))) return message.channel.send('Please format auctions like so: `//auction <seller> <quantity> <item> <starting_price>`');
      if (item === undefined) return message.channel.send('Please format auctions like so: `//auction <seller> <quantity> <item> <starting_price>`');
      if (startingPrice === undefined || startingPrice.slice(startingPrice.length - 1).toLowerCase() !== 'm') return message.channel.send('Please format auctions like so: `//auction <seller> <quantity> <item> <starting_price>`');
      let startingPriceNum = Number(startingPrice.slice(0, startingPrice.length - 1) * 1000000);
      let auctions = guild.guildAuctions;
      if (auctions === undefined) guild.guildAuctions = [];
      let auctionID = 0;
      let auctionCheck = guild.guildAuctions.find( ({ active }) => active === true);
      if (auctionCheck !== undefined) return message.channel.send('There is already an active auction');
      auctions = guild.guildAuctions;
      auctionID = auctions.length;
      auctions.push({ 
        bids: [], 
        auctionID: auctionID + 1, 
        active: false, 
        moderator: message.author.id,
        seller: seller.user.id, 
        startingBid: startingPriceNum,
        highestBid: startingPriceNum,
        item: item,
        winner: null
      });
      await guild.save().catch(err => console.log(err));
      const createEmbed = new Discord.MessageEmbed()
      .setTitle(`${quantity} ${item} Auction`)
      .setDescription(`Starting Price: \`${startingPriceNum.toLocaleString()}\`\nSeller: <@!${seller.user.id}>\nModerator: <@!${message.author.id}>\nAuctionID: \`${auctionID + 1}\``)
      .addField('Moderator Commands:', '`//auction start <auctionID>` - start the auction')
      .setFooter('Auction will begin at 3 reactions')
      .setColor("RANDOM")

      let msg = await message.channel.send(createEmbed).catch(err => console.log(err));
      msg.react('796815507297796156');
    } else if (option === 'start') {
      let aID = args[1];
      if (aID === undefined) return message.channel.send('You must enter a valid auction ID. `//auction start <auction_id>`');
      let auctions = guild.guildAuctions;
      if (auctions === undefined) return message.channel.send('This guild does not have any auctions');
      let auction = auctions.find( ({auctionID}) => auctionID === aID);
      if (auction === undefined) return message.channel.send("This auction doesn't exist.");
      auction.active = true;
      isActive = true;
      await guild.save().catch(err => console.log(err));
      let currentHighestBid = auction.highestBid;
      let updatedHighestBid;
      await message.channel.send('The auction has begun! Use `//bid <amount>` to bid, default is by million. (example: type `//bid 1` to bid 1million, `//bid 1.5` to bid 1.5million)');
      unlock(message);
      
      countdown(message);
      while (isActive === true) {
        let guildUpdate = await guildDB.findOne({ guildID: message.guild.id });
        let updatedAuctions = guildUpdate.guildAuctions;
        let updatedAuction = await updatedAuctions.find( ({auctionID}) => auctionID === aID);
        updatedHighestBid = updatedAuction.highestBid;
        
        if (updatedHighestBid > currentHighestBid) {
          currentHighestBid = updatedHighestBid;
          clearTimeout(timeout);
          
          countdown(message);
          console.log('Cleared Timeout.');
        }
      }
      console.log('made it here');
      let guildUpdate = await guildDB.findOne({ guildID: message.guild.id });
      let updatedAuctions = guildUpdate.guildAuctions;
      let updatedAuction = await updatedAuctions.find( ({auctionID}) => auctionID === aID);
      let winner = updatedAuction.bids.find( ({bid}) => bid === updatedHighestBid);
      if (winner === undefined) {
        updatedAuction.active = false;
        await guildUpdate.save().catch(err => console.log(err));
        lock(message);
        return message.channel.send('There were no bids. This auction has been canceled.');
      } 
      updatedAuction.active = false;
      updatedAuction.winner = winner.userID;
      lock(message);
      message.channel.send(`Sold to <@!${winner.userID}> for \`${Number(winner.bid).toLocaleString()}\`! Please go to the tradeout channel.`);
      await guildUpdate.save().catch(err => console.log(err));
      
    } else if (option === 'cancel') {
      return message.channel.send('TODO');
    } else if (option === 'list') {
      return message.channel.send('TODO');
    } else {
      return message.channel.send('TODO');
    }
  }
}


const countdown = (msg) => {
  timeout = setTimeout(async function () {
    msg.channel.send('Going once!');
    timeout = setTimeout(async function () {
      msg.channel.send('Going Twice!');
      timeout = setTimeout(async function() {
        msg.channel.send('Sold!');
        isActive = false;
        return false;
      }, 10000);
    }, 10000);
  }, 10000);
  return true;
}

const unlock = msg => {
  let role = msg.guild.roles.everyone;
  let channel = msg.channel;
  channel.updateOverwrite(role, { "SEND_MESSAGES": null}).catch(err => console.log(err));
  return msg.channel.send('Channel unlocked.');
}

const lock = msg => {
  let role = msg.guild.roles.everyone;
  let channel = msg.channel;
  channel.updateOverwrite(role, { "SEND_MESSAGES": false}).catch(err => console.log(err));
  return msg.channel.send('Channel locked.');
}