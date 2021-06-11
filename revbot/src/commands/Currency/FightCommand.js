const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');

module.exports = class FightCommand extends BaseCommand {
  constructor() {
    super('fight', 'Currency', []);
  }

  async run(client, message, args) {
    let target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    let playerOne = {
      user: undefined,
      health: 100,
      defense: 0
    }
    let playerTwo = {
      user: undefined,
      health: 100,
      defense: 0
    }
    
    const playerChoose = Math.random();
    if (playerChoose >= 0.5) {
      playerOne.user = message.author;
      playerTwo.user = target.user;
    } else {
      playerOne.user = target.user;
      playerTwo.user = message.author;
    }
    
    while(playerOne.health > 0 && playerTwo.health > 0) {
      let i = 0;
      let roundOne = 0;
      let roundTwo = 0;
      while(roundOne === 0 && i < 5) {
        roundOne = await fight(playerOne, playerTwo, message, i);
      }
      if (roundOne === 2) return;
      if (playerTwo.health === 0) {
        return message.channel.send(`**${playerOne.user.username}** has absolutely clobbered **${playerTwo.user.username}**, winning with \`${playerOne.health}\` HP remaining!`);
      }
      i = 0;
      while(roundTwo === 0 && i < 5) {
        roundTwo = await fight(playerTwo, playerOne, message, i);
      }
      if (roundTwo === 2) return;
      if (playerOne.health === 0) {
        return message.channel.send(`**${playerTwo.user.username}** has absolutely clobbered **${playerOne.user.username}**, winning with \`${playerTwo.health}\` HP remaining!`);
      }
    }
  }
}

const fight = async (playerOne, playerTwo, message, i) => {
  let attacks = [
    {
      attack: 'punch',
      maxDamage: 20,
      minDamage: 5
    },
    {
      attack: 'kick',
      maxDamage: 40,
      minDamage: 15
    },
    {
      attack: 'defend'
    },
    {
      attack: 'end'
    }
  ];
  let inc = i;
  const playerFilter = response => response.author.id === playerOne.user.id;
  message.channel.send(`<@!${playerOne.user.id}>, it's your turn to attack! Respond with \`punch\`, \`kick\`, or \`end\`.`);
  const playerOneMsg = await message.channel.awaitMessages(playerFilter, {max: 1, time: 30000});
  if (playerOneMsg.size > 0) {
    let res;
    playerOneMsg.forEach(element => {
      res = element.content.toLowerCase();
    });;
    console.log(res);
    if (res !== 'punch' && res !== 'kick' && res !== 'end' && res != undefined && res != '') {
      message.channel.send(`That was an incorrect response! Respond with \`punch\`, \`kick\`, or \`end\`.`);
      inc += 1;
      return 0;
    } else if (res === 'punch') {
      let damage = Math.floor(Math.random() * (attacks[0].maxDamage - attacks[0].minDamage + 1) + attacks[0].minDamage);
      playerTwo.health -= damage;
      if (playerTwo.health <= 0) {
        playerTwo.health = 0;
      }
      message.channel.send(`**${playerOne.user.username}** throws a vicious punch at **${playerTwo.user.username}**, doing **${damage}** damage!\n${playerTwo.user.username} has \`${playerTwo.health}\` health remaining.`);
      return 1;
    } else if (res === 'kick') {
      let damage = Math.floor(Math.random() * (attacks[1].maxDamage - attacks[1].minDamage + 1) + attacks[1].minDamage);
      let hitChance = Math.random();
      if (hitChance > 0.3) {
        playerTwo.health -= damage;
        if (playerTwo.health <= 0) {
          playerTwo.health = 0;
        }
        message.channel.send(`**${playerOne.user.username}** throws a wild kick at **${playerTwo.user.username}**, doing **${damage}** damage!\n${playerTwo.user.username} has \`${playerTwo.health}\` health remaining.`);
      } else {
        playerOne.health -= Math.floor(damage/2);
        if (playerOne.health <= 0) {
          playerOne.health = 0;
        }
        message.channel.send(`**${playerOne.user.username}** throws a wild kick at **${playerTwo.user.username}** but FELL DOWN, taking **${Math.floor(damage/2)}** damage!`);
      }
      
    } else if (res === 'end') {
      message.channel.send(`**${playerOne.user.username}** has ended the fight.`);
      return 2;
    }
  } else {
    message.channel.send(`**${playerOne.user.username}** did not reply in time. The fight has ended.`);
    return 2;
  }
}