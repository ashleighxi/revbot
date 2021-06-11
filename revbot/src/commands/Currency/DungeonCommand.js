const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const userDB = require('../../utils/models/currency.js');
const itemDB = require('../../utils/models/item.js');
const statsDB = require('../../utils/models/botstats.js');
const humanizeDuration = require('humanize-duration');
const FuzzySearch = require('fuzzy-search');
const { response } = require('express');
module.exports = class DungeonCommand extends BaseCommand {
  constructor() {
    super('dung', 'Currency', [], 'dungeon', 'Test your might in revBot Dungeons! Type `(p)dung grove` to try it out. There are more dungeons under the `(p)dung list` command!');
  }

  async run(client, message, args) {
    const target = message.author;
    const starter = await userDB.findOne({ userID: target.id });
    const stats = await statsDB.findOne({});
    const cooldown = 60000 * 1;
    const joinCooldown = 30000;
    const dungeons = ['The Blood Groves', 'The Goblin Fortress'];
    const choice = args[0].toLowerCase();
    const searcher = new FuzzySearch(dungeons);
    const result = searcher.search(choice);
    const dungeon = result[0];
    const mageAttacks = ['frost flare', 'arcane rush', 'ignite', 'earth bolt', 'lightning blast', 'ice beam', 'elemental overload', 'earthquake', 'fire bomb', 'tsunami'];
    const warriorAttacks = ['crushing blow', 'vicious strike', 'execute', 'charge', 'blade storm', 'howling slash', 'limb ripper', 'rend flesh', 'shield slam', 'overwhelm'];
    const rogueAttacks = ['eviscerate', 'back stab', 'poison', 'ambush', 'slice and dice', 'kidney shot', 'sinister strike', 'assassinate', 'riposte', 'precise incision'];
    const warlockAttacks = ['conflagrate', 'corruption', 'death taunt', 'chaos bolt', 'plague curse', 'hellfire', 'affliction', 'drain soul', 'viral outbreak', 'wither bones'];
    const paladinAttacks = ['consecration', 'judgement', 'repent', 'reckoning', 'hammer of light', 'divine intervention', 'sacred strike', 'holy prayer'];
    const priestAttacks = ['holy light', 'mend wounds', 'divination', 'heavenly smite', 'healing aura', 'sacred prayer', 'apocalypse', 'confession'];
    let dungeonGroup = [starter];
    async function joinFilter(res) {
      if (res.content.toLowerCase() === 'join dungeon') {
        let joiner = await userDB.findOne({ userID: res.author.id });
        if (!joiner || joiner.class === 'none'){
          message.channel.send(`<@!${res.author.id}>, you do not meet the requirements to join a dungeon group. \`(p)class\``);
        } else if (dungeonGroup.find( ({userID}) => userID === joiner.userID)) {
          message.channel.send(`<@!${res.author.id}>, you've already joined the group!`);
        } else if (dungeonGroup.length > 10) {
          message.channel.send(`<@!${res.author.id}>, the group is already full!`);
        } else {
          let lastDungeon = joiner.dungeonCD;
          if (lastDungeon !== null && cooldown - (Date.now() - lastDungeon) > 0) {
            let timeObj = humanizeDuration(cooldown - (Date.now() - lastDungeon), { round: true });
            console.log(timeObj);
            return message.channel.send(`You must wait ${timeObj} before running that command again.`);
          } else {
            dungeonGroup.push(joiner);
            joiner.dungeonCD = Date.now();
            await joiner.save();
            return true;
          }
          
        }
      }
    }
    console.log(result);
    if (!starter || starter.class === 'none') return message.channel.send('You must chose a class before participating in dungeons. `(p)class`');
    let lastDungeon = starter.dungeonCD;
    if (lastDungeon !== null && cooldown - (Date.now() - lastDungeon) > 0) {
      let timeObj = humanizeDuration(cooldown - (Date.now() - lastDungeon), { round: true });
      console.log(timeObj);
      return message.channel.send(`You must wait ${timeObj} before running that command again.`);
    } else {
      if (dungeon === dungeons[0]) {
        starter.dungeonStartCD = Date.now();
        starter.dungeonCD = Date.now();
        stats.dungeons += 1;
        await stats.save();
        await starter.save();
        const mobKeys = ['Orb Weaver', 'Ent']
        
        await message.channel.send(`<@!${starter.userID}> is calling for adventurers to join them in **${dungeon}**!\nType \`join dungeon\` to join them!`);
        const msgs = await message.channel.awaitMessages(joinFilter, { time: 30000 });
        let entryMessage = '';
        let groupMaxHealth = [];
        let groupCurrentHealth = [];
        let groupTurns = [];
        let groupTurnsReset = [];
        let totalLevel = 0;
        dungeonGroup.forEach( member => {
          entryMessage += `<@!${member.userID}> `;
          totalLevel += Math.floor(member.commands / 100);
          let memberHealth = member.health + Math.floor(0.5 * (member.commands / 100));
          let userInv = member.inventory;
          let breastPlate = userInv.find( ({itemID}) => itemID === 'kingsbreastplate')
          if (breastPlate) memberHealth += 75;
          groupMaxHealth.push(memberHealth);
          groupCurrentHealth.push(memberHealth);
          groupTurns.push(0);
          groupTurnsReset.push(0);
        });
        const mobs = await bloodGroveMobs(mobKeys, dungeonGroup, totalLevel);
        const boss = await bloodGroveBoss(dungeonGroup, totalLevel);
        await message.channel.send(`${entryMessage}\nPrepare to enter **${dungeon}**!`);
        setTimeout(async () => {
          //fight number 1
          let enemy = mobs.get(mobKeys[0]);
          let groupStatus = 'alive';
          while (groupStatus === 'alive') {
            let randomIndex = Math.floor(Math.random() * dungeonGroup.length);
            let currentFighter = dungeonGroup[randomIndex];
            let damageDone = 0;
            let keyword;
            let attackStyle;
            
            if (currentFighter.class === 'mage') { 
              keyword = mageAttacks[Math.floor(Math.random() * mageAttacks.length)];
              attackStyle = currentFighter.stats.wisdom * 1.35;
            }
            if (currentFighter.class === 'warlock') { 
              keyword = warlockAttacks[Math.floor(Math.random() * mageAttacks.length)];
              attackStyle = currentFighter.stats.wisdom * 1.35;
            }
            if (currentFighter.class === 'warrior') { 
              keyword = warriorAttacks[Math.floor(Math.random() * warriorAttacks.length)];
              attackStyle = currentFighter.stats.attack * 1.25;
            }
            if (currentFighter.class === 'rogue') { 
              keyword = rogueAttacks[Math.floor(Math.random() * rogueAttacks.length)];
              attackStyle = (currentFighter.stats.dexterity * 1.55) + (currentFighter.stats.attack * 0.35);
            }
            if (currentFighter.class === 'priest') { 
              keyword = priestAttacks[Math.floor(Math.random() * priestAttacks.length)];
              attackStyle = currentFighter.stats.wisdom * 1.35;
            }
            if (currentFighter.class === 'paladin') { 
              keyword = paladinAttacks[Math.floor(Math.random() * paladinAttacks.length)];
              attackStyle = (currentFighter.stats.wisdom * 0.75) + (currentFighter.stats.attack * 0.75);
            }
            const attackFilter = res => res.author.id === currentFighter.userID && res.content.toLowerCase() === keyword;
            if (currentFighter.stats.dexterity > enemy.dexterity) {
              await message.channel.send(`<@!${currentFighter.userID}>, you see an opening to attack!\nQuickly, type \`${keyword}\` to damage the ${enemy.name}!`);
              const attackInput = await message.channel.awaitMessages(attackFilter, { max: 1, time: 8000});
              if (attackInput.size > 0) damageDone = Math.floor(Math.random() * ((attackStyle * 10 + Math.floor(currentFighter.commands/100)) - (attackStyle * 5 + Math.floor(currentFighter.commands/100)) + 1) + (attackStyle * 5 + Math.floor(currentFighter.commands/100)));
              if (currentFighter.class === 'rogue' && groupTurns[randomIndex] === 0) damageDone += Math.floor(Math.random() * (45 - 20 + 1) + 20);
              enemy.health -= damageDone;
              message.channel.send(`<@!${currentFighter.userID}> does **${damageDone.toLocaleString()}** damage to the ${enemy.name}!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
              if (enemy.health <= 0) {
                enemy.status = 'dead';
                break;
              }
              let damageTaken = Math.random() * ((enemy.attack * 10) - (enemy.attack * 5) + 1) + (enemy.attack * 5);
              if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
              damageTaken = Math.floor(damageTaken);
              groupCurrentHealth[randomIndex] -= damageTaken;
              message.channel.send(`The ${enemy.name} does **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
              if (groupCurrentHealth[randomIndex] <= 0) {
                message.channel.send(`<@!${currentFighter.userID}> has been knocked unconscious! They can no longer help you...`);
                dungeonGroup.splice(randomIndex, 1);
                groupCurrentHealth.splice(randomIndex, 1);
                groupMaxHealth.splice(randomIndex, 1);
                if (currentFighter.class === 'mage' && dungeonGroup.length > 0) {
                  for (let i = 0; i < groupCurrentHealth.length; i++) {
                    let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
                    groupCurrentHealth[i] += toHeal;
                  }
                  message.channel.send(`As <@!${currentFighter.userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
                }
                if (dungeonGroup.length === 0) groupStatus = 'dead';
              } 
            } else {
              let damageTaken = Math.random() * ((enemy.attack * 10) - (enemy.attack * 5) + 1) + (enemy.attack * 5);
              if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
              damageTaken = Math.floor(damageTaken);
              groupCurrentHealth[randomIndex] -= damageTaken;
              message.channel.send(`The ${enemy.name} does **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
              if (groupCurrentHealth[randomIndex] <= 0) {
                message.channel.send(`<@!${currentFighter.userID}> has been knocked unconscious! They can no longer help you...`);
                
                dungeonGroup.splice(randomIndex, 1);
                groupCurrentHealth.splice(randomIndex, 1);
                groupMaxHealth.splice(randomIndex, 1);
                if (currentFighter.class === 'mage' && dungeonGroup.length > 0) {
                  for (let i = 0; i < groupCurrentHealth.length; i++) {
                    let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
                    groupCurrentHealth[i] += toHeal;
                  }
                  message.channel.send(`As <@!${currentFighter.userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
                }
                if (dungeonGroup.length === 0) groupStatus = 'dead';
              } else {
                await message.channel.send(`<@!${currentFighter.userID}>, you see an opening to attack!\nQuickly, type \`${keyword}\` to damage the ${enemy.name}!`);
                const attackInput = await message.channel.awaitMessages(attackFilter, { max: 1, time: 8000});
                if (attackInput.size > 0) damageDone = Math.floor(Math.random() * ((attackStyle * 10 + Math.floor(currentFighter.commands/100)) - (attackStyle * 5 + Math.floor(currentFighter.commands/100)) + 1) + (attackStyle * 5 + Math.floor(currentFighter.commands/100)));
                if (currentFighter.class === 'rogue' && groupTurns[randomIndex] === 0) damageDone += Math.floor(Math.random() * (45 - 20 + 1) + 20);
                enemy.health -= damageDone;
                message.channel.send(`<@!${currentFighter.userID}> does **${damageDone.toLocaleString()}** damage to the ${enemy.name}!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
                if (enemy.health <= 0) {
                  enemy.status = 'dead';
                  break;
                }
              }
            }
            groupTurns[randomIndex] += 1;
          }
          let healthStats = 'asciidoc\n';
          //TODO: SETUP HEALTH STATS BETWEEN FIGHTS
          // groupCurrentHealth.forEach(async member => {
          //   let u = message.guild.members.cache.get(member.userID);
          //   healthStats += `${u.user.username}: [${}]`;
          // })
          if (groupStatus === 'alive') {
            message.channel.send(`The mighty beast falls to the floor...\n\n**You defeated the ${enemy.name}!**`);
            for (let i = 0; i < dungeonGroup.length; i++) {
              await rewards(enemy, dungeonGroup[i], message);
            }
          } else {
            return message.channel.send('**Unfortunately.... you failed.**');
          }
          groupTurns = groupTurnsReset;
          message.channel.send('*You wander deeper into the Grove...*')
          //fight number 2
          setTimeout(async () => {
            let enemy = mobs.get(mobKeys[1]);
            let groupStatus = 'alive';
            while (groupStatus === 'alive') {
              let randomIndex = Math.floor(Math.random() * dungeonGroup.length);
              let currentFighter = dungeonGroup[randomIndex];
              let damageDone = 0;
              let keyword;
              let attackStyle;
              if (currentFighter.class === 'mage') { 
                keyword = mageAttacks[Math.floor(Math.random() * mageAttacks.length)];
                attackStyle = currentFighter.stats.wisdom * 1.35;
              }
              if (currentFighter.class === 'warlock') { 
                keyword = warlockAttacks[Math.floor(Math.random() * mageAttacks.length)];
                attackStyle = currentFighter.stats.wisdom * 1.35;
              }
              if (currentFighter.class === 'warrior') { 
                keyword = warriorAttacks[Math.floor(Math.random() * warriorAttacks.length)];
                attackStyle = currentFighter.stats.attack * 1.25;
              }
              if (currentFighter.class === 'rogue') { 
                keyword = rogueAttacks[Math.floor(Math.random() * rogueAttacks.length)];
                attackStyle = (currentFighter.stats.dexterity * 1.55) + (currentFighter.stats.attack * 0.35);
              }
              if (currentFighter.class === 'priest') { 
                keyword = priestAttacks[Math.floor(Math.random() * priestAttacks.length)];
                attackStyle = currentFighter.stats.wisdom * 1.35;
              }
              if (currentFighter.class === 'paladin') { 
                keyword = paladinAttacks[Math.floor(Math.random() * paladinAttacks.length)];
                attackStyle = (currentFighter.stats.wisdom * 0.75) + (currentFighter.stats.attack * 0.75);
              }
              const attackFilter = res => res.author.id === currentFighter.userID && res.content.toLowerCase() === keyword;
              if (currentFighter.stats.dexterity > enemy.dexterity) {
                await message.channel.send(`<@!${currentFighter.userID}>, you see an opening to attack!\nQuickly, type \`${keyword}\` to damage the ${enemy.name}!`);
                const attackInput = await message.channel.awaitMessages(attackFilter, { max: 1, time: 8000});
                if (attackInput.size > 0) damageDone = Math.floor(Math.random() * ((attackStyle * 10 + Math.floor(currentFighter.commands/100)) - (attackStyle * 5 + Math.floor(currentFighter.commands/100)) + 1) + (attackStyle * 5 + Math.floor(currentFighter.commands/100)));
                if (currentFighter.class === 'rogue' && groupTurns[randomIndex] === 0) damageDone += Math.floor(Math.random() * (45 - 20 + 1) + 20);
                enemy.health -= damageDone;
                message.channel.send(`<@!${currentFighter.userID}> does **${damageDone.toLocaleString()} damage** to the ${enemy.name}!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
                if (enemy.health <= 0) {
                  enemy.status = 'dead';
                  break;
                }
                let damageTaken = Math.random() * ((enemy.attack * 10) - (enemy.attack * 5) + 1) + (enemy.attack * 5);
                if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
                damageTaken = Math.floor(damageTaken);
                groupCurrentHealth[randomIndex] -= damageTaken;
                message.channel.send(`The ${enemy.name} does **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
                if (groupCurrentHealth[randomIndex] <= 0) {
                  message.channel.send(`<@!${currentFighter.userID}> has been knocked unconscious! They can no longer help you...`);
                  dungeonGroup.splice(randomIndex, 1);
                  groupCurrentHealth.splice(randomIndex, 1);
                  groupMaxHealth.splice(randomIndex, 1);
                  if (currentFighter.class === 'mage' && dungeonGroup.length > 0) {
                    for (let i = 0; i < groupCurrentHealth.length; i++) {
                      let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
                      groupCurrentHealth[i] += toHeal;
                    }
                    message.channel.send(`As <@!${currentFighter.userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
                  }
                  if (dungeonGroup.length === 0) groupStatus = 'dead';
                } 
              } else {
                let damageTaken = Math.random() * ((enemy.attack * 10) - (enemy.attack * 5) + 1) + (enemy.attack * 5);
                if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
                damageTaken = Math.floor(damageTaken);
                groupCurrentHealth[randomIndex] -= damageTaken;
                message.channel.send(`The ${enemy.name} does **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
                if (groupCurrentHealth[randomIndex] <= 0) {
                  message.channel.send(`<@!${currentFighter.userID}> has been knocked unconscious! They can no longer help you...`);
                  dungeonGroup.splice(randomIndex, 1);
                  groupCurrentHealth.splice(randomIndex, 1);
                  groupMaxHealth.splice(randomIndex, 1);
                  if (currentFighter.class === 'mage' && dungeonGroup.length > 0) {
                    for (let i = 0; i < groupCurrentHealth.length; i++) {
                      let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
                      groupCurrentHealth[i] += toHeal;
                    }
                    message.channel.send(`As <@!${currentFighter.userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
                  }
                  if (dungeonGroup.length === 0) groupStatus = 'dead';
                } else {
                  await message.channel.send(`<@!${currentFighter.userID}>, you see an opening to attack!\nQuickly, type \`${keyword}\` to damage the ${enemy.name}!`);
                  const attackInput = await message.channel.awaitMessages(attackFilter, { max: 1, time: 8000});
                  if (attackInput.size > 0) damageDone = Math.floor(Math.random() * ((attackStyle * 10 + Math.floor(currentFighter.commands/100)) - (attackStyle * 5 + Math.floor(currentFighter.commands/100)) + 1) + (attackStyle * 5 + Math.floor(currentFighter.commands/100)));
                  if (currentFighter.class === 'rogue' && groupTurns[randomIndex] === 0) damageDone += Math.floor(Math.random() * (45 - 20 + 1) + 20);
                  enemy.health -= damageDone;
                  message.channel.send(`<@!${currentFighter.userID}> does **${damageDone.toLocaleString()}** damage to the ${enemy.name}!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
                  if (enemy.health <= 0) {
                    enemy.status = 'dead';
                    break;
                  }
                }
              }
              groupTurns[randomIndex] += 1;
            }
            if (groupStatus === 'alive') {
              message.channel.send(`The mighty beast falls to the floor...\n\n**You defeated the ${enemy.name}!**`);
              for (let i = 0; i < dungeonGroup.length; i++) {
                await rewards(enemy, dungeonGroup[i], message);
              }
            } else {
              return message.channel.send('**Unfortunately.... you failed.**');
            }
            groupTurns = groupTurnsReset;
            message.channel.send('*You wander deeper into the Grove...*');
            setTimeout(async () => {
              message.channel.send('*You feel a sudden chill down your spine.*')
              setTimeout(async () => {
                //boss fight
                groupCurrentHealth = groupMaxHealth;
                let enemy = boss;
                let groupStatus = 'alive';
                await message.channel.send(`**THE MIGHTY __${enemy.name}__ APPEARS**!`);
                while (groupStatus === 'alive') {
                  let randomIndex = Math.floor(Math.random() * dungeonGroup.length);
                  let currentFighter = dungeonGroup[randomIndex];
                  let damageDone = 0;
                  let keyword;
                  let attackStyle;
                  if (currentFighter.class === 'mage') { 
                    keyword = mageAttacks[Math.floor(Math.random() * mageAttacks.length)];
                    attackStyle = currentFighter.stats.wisdom * 1.35;
                  }
                  if (currentFighter.class === 'warlock') { 
                    keyword = warlockAttacks[Math.floor(Math.random() * mageAttacks.length)];
                    attackStyle = currentFighter.stats.wisdom * 1.35;
                  }
                  if (currentFighter.class === 'warrior') { 
                    keyword = warriorAttacks[Math.floor(Math.random() * warriorAttacks.length)];
                    attackStyle = currentFighter.stats.attack * 1.25;
                  }
                  if (currentFighter.class === 'rogue') { 
                    keyword = rogueAttacks[Math.floor(Math.random() * rogueAttacks.length)];
                    attackStyle = (currentFighter.stats.dexterity * 1.55) + (currentFighter.stats.attack * 0.35);
                  }
                  if (currentFighter.class === 'priest') { 
                    keyword = priestAttacks[Math.floor(Math.random() * priestAttacks.length)];
                    attackStyle = currentFighter.stats.wisdom * 1.35;
                  }
                  if (currentFighter.class === 'paladin') { 
                    keyword = paladinAttacks[Math.floor(Math.random() * paladinAttacks.length)];
                    attackStyle = (currentFighter.stats.wisdom * 0.75) + (currentFighter.stats.attack * 0.75);
                  }
                  const attackFilter = res => res.author.id === currentFighter.userID && res.content.toLowerCase() === keyword;
                  if (currentFighter.stats.dexterity > enemy.dexterity) {
                    await message.channel.send(`<@!${currentFighter.userID}>, you see an opening to attack!\nQuickly, type \`${keyword}\` to damage the ${enemy.name}!`);
                    const attackInput = await message.channel.awaitMessages(attackFilter, { max: 1, time: 8000});
                    if (attackInput.size > 0) damageDone = Math.floor(Math.random() * ((attackStyle * 10 + Math.floor(currentFighter.commands/100)) - (attackStyle * 5 + Math.floor(currentFighter.commands/100)) + 1) + (attackStyle * 5 + Math.floor(currentFighter.commands/100)));
                    if (currentFighter.class === 'rogue' && groupTurns[randomIndex] === 0) damageDone += Math.floor(Math.random() * (45 - 20 + 1) + 20);
                    enemy.health -= damageDone;
                    message.channel.send(`<@!${currentFighter.userID}> does **${damageDone.toLocaleString()}** damage to the ${enemy.name}!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
                    if (enemy.health <= 0) {
                      enemy.status = 'dead';
                      break;
                    }
                    let specialRoll = (Math.random() * 101);
                    if (specialRoll <= 25) {
                      let damageTaken = Math.random() * ((enemy.attack * 10) - (enemy.attack * 5) + 1) + (enemy.attack * 5);
                      if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
                      damageTaken = Math.floor(damageTaken);
                      groupCurrentHealth[randomIndex] -= damageTaken;
                      message.channel.send(`The ${enemy.name} fires a **MASSIVE FIREBALL**, inflicting **${damageTaken}** damage on <@!${currentFighter.userID}>!`);
                    } else {
                      let damageTaken = Math.random() * ((enemy.attack * 10) - (enemy.attack * 5) + 1) + (enemy.attack * 5);
                      if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
                      damageTaken = Math.floor(damageTaken);
                      groupCurrentHealth[randomIndex] -= damageTaken;
                      message.channel.send(`The ${enemy.name} does **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
                    }
                    
                    if (groupCurrentHealth[randomIndex] <= 0) {
                      message.channel.send(`<@!${currentFighter.userID}> has been knocked unconscious! They can no longer help you...`);
                      dungeonGroup.splice(randomIndex, 1);
                      groupCurrentHealth.splice(randomIndex, 1);
                      groupMaxHealth.splice(randomIndex, 1);
                      if (currentFighter.class === 'mage' && dungeonGroup.length > 0) {
                        for (let i = 0; i < groupCurrentHealth.length; i++) {
                          let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
                          groupCurrentHealth[i] += toHeal;
                        }
                        message.channel.send(`As <@!${currentFighter.userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
                      }
                      if (dungeonGroup.length === 0) groupStatus = 'dead';
                    } 
                  } else {
                    let specialRoll = (Math.random() * 101);
                    if (specialRoll <= 25) {
                      let damageTaken = Math.random() * ((enemy.attack * 10) - (enemy.attack * 5) + 1) + (enemy.attack * 5);
                      if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
                      damageTaken = Math.floor(damageTaken);
                      groupCurrentHealth[randomIndex] -= damageTaken;
                      message.channel.send(`The ${enemy.name} fires a **MASSIVE FIREBALL**, inflicting **${damageTaken}** damage on <@!${currentFighter.userID}>!`);
                    } else {
                      let damageTaken = Math.random() * ((enemy.attack * 10) - (enemy.attack * 5) + 1) + (enemy.attack * 5);
                      if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
                      damageTaken = Math.floor(damageTaken);
                      groupCurrentHealth[randomIndex] -= damageTaken;
                      message.channel.send(`The ${enemy.name} does **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
                    }
                    if (groupCurrentHealth[randomIndex] <= 0) {
                      message.channel.send(`<@!${currentFighter.userID}> has been knocked unconscious! They can no longer help you...`);
                      dungeonGroup.splice(randomIndex, 1);
                      groupCurrentHealth.splice(randomIndex, 1);
                      groupMaxHealth.splice(randomIndex, 1);
                      if (currentFighter.class === 'mage' && dungeonGroup.length > 0) {
                        for (let i = 0; i < groupCurrentHealth.length; i++) {
                          let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
                          groupCurrentHealth[i] += toHeal;
                        }
                        message.channel.send(`As <@!${currentFighter.userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
                      }
                      if (dungeonGroup.length === 0) groupStatus = 'dead';
                    } else {
                      await message.channel.send(`<@!${currentFighter.userID}>, you see an opening to attack!\nQuickly, type \`${keyword}\` to damage the ${enemy.name}!`);
                      const attackInput = await message.channel.awaitMessages(attackFilter, { max: 1, time: 8000});
                      if (attackInput.size > 0) damageDone = Math.floor(Math.random() * ((attackStyle * 10 + Math.floor(currentFighter.commands/100)) - (attackStyle * 5 + Math.floor(currentFighter.commands/100)) + 1) + (attackStyle * 5 + Math.floor(currentFighter.commands/100)));
                      if (currentFighter.class === 'rogue' && groupTurns[randomIndex] === 0) damageDone += Math.floor(Math.random() * (45 - 20 + 1) + 20);
                      enemy.health -= damageDone;
                      message.channel.send(`<@!${currentFighter.userID}> does **${damageDone.toLocaleString()}** damage to the ${enemy.name}!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
                      if (enemy.health <= 0) {
                        enemy.status = 'dead';
                        break;
                      }
                    }
                  }
                  groupTurns[randomIndex] += 1;
                }
                if (groupStatus === 'alive') {
                  message.channel.send(`The mighty beast falls to the floor...\n\n**You defeated the ${enemy.name}!**`);
                  for (let i = 0; i < dungeonGroup.length; i++) {
                    await rewards(enemy, dungeonGroup[i], message);
                  }
                  message.channel.send(`**Congratulations! You have completed ${dungeon}!**`);
                } else {
                  return message.channel.send('**Unfortunately.... you failed.**');
                }
              }, 3000);
            }, 5000);
          }, 5000);
        }, 5000);
          
          















      // } else if (dungeon === dungeons[1]) {
      //   starter.dungeonStartCD = Date.now();
      //   starter.dungeonCD = Date.now();
      //   stats.dungeons += 1;
      //   await stats.save();
      //   await starter.save();
      //   const mobKeys = ['Hobgoblin', 'Goblin Shaman']
        
      //   await message.channel.send(`<@!${starter.userID}> is calling for adventurers to join them in **${dungeon}**!\nType \`join dungeon\` to join them!`);
      //   const msgs = await message.channel.awaitMessages(joinFilter, { time: 30000 });
      //   let entryMessage = '';
      //   let groupMaxHealth = [];
      //   let groupCurrentHealth = [];
      //   let groupTurns = [];
      //   let groupTurnsReset = [];
      //   let totalLevel = 0;
      //   dungeonGroup.forEach( member => {
      //     entryMessage += `<@!${member.userID}> `;
      //     totalLevel += Math.floor(member.health + Math.floor(0.5 * (member.commands / 100)));
      //     let memberHealth = member.health + Math.floor(0.5 * (member.commands / 100));
      //     let userInv = member.inventory;
      //     let breastPlate = userInv.find( ({itemID}) => itemID === 'kingsbreastplate')
      //     if (breastPlate) memberHealth += 75;
      //     groupMaxHealth.push(memberHealth);
      //     groupCurrentHealth.push(memberHealth);
      //     groupTurns.push(0);
      //     groupTurnsReset.push(0);
      //   });
      //   const mobs = await goblinFortressMobs(mobKeys, dungeonGroup, totalLevel);
      //   const boss = await goblinFortressBoss(dungeonGroup, totalLevel);
      //   await message.channel.send(`${entryMessage}\nPrepare to enter **${dungeon}**!`);
      //   setTimeout(async () => {
      //     //fight number 1
      //     let enemy = mobs.get(mobKeys[0]);
      //     let originalEnemyHealth = enemy.health;
      //     let groupStatus = 'alive';
      //     let battleScarred = Math.floor(Math.random() * (6 - 4 + 1) + 4);
      //     message.channel.send(`*A large goblin-like creature approaches you. You notice ${battleScarred} scars across it's chest...*`);
      //     while (groupStatus === 'alive') {
      //       let randomIndex = Math.floor(Math.random() * dungeonGroup.length);
      //       let currentFighter = dungeonGroup[randomIndex];
      //       let damageDone = 0;
      //       let keyword;
      //       let attackStyle;
            
            
      //       if (currentFighter.class === 'mage') { 
      //         keyword = mageAttacks[Math.floor(Math.random() * mageAttacks.length)];
      //         attackStyle = currentFighter.stats.wisdom * 1.8;
      //       }
      //       if (currentFighter.class === 'warlock') { 
      //         keyword = warlockAttacks[Math.floor(Math.random() * mageAttacks.length)];
      //         attackStyle = currentFighter.stats.wisdom * 1.8;
      //       }
      //       if (currentFighter.class === 'warrior') { 
      //         keyword = warriorAttacks[Math.floor(Math.random() * warriorAttacks.length)];
      //         attackStyle = currentFighter.stats.attack * 1.25;
      //       }
      //       if (currentFighter.class === 'rogue') { 
      //         keyword = rogueAttacks[Math.floor(Math.random() * rogueAttacks.length)];
      //         attackStyle = (currentFighter.stats.dexterity * 1.65) + (currentFighter.stats.attack * 0.55);
      //       }
      //       const attackFilter = res => res.author.id === currentFighter.userID && res.content.toLowerCase() === keyword;
      //       if (currentFighter.stats.dexterity > enemy.dexterity) {
      //         await message.channel.send(`<@!${currentFighter.userID}>, you see an opening to attack!\nQuickly, type \`${keyword}\` to damage the ${enemy.name}!`);
      //         const attackInput = await message.channel.awaitMessages(attackFilter, { max: 1, time: 8000});
      //         if (attackInput.size > 0) damageDone = Math.floor(Math.random() * ((attackStyle * 10 + Math.floor(currentFighter.commands/100)) - (attackStyle * 5 + Math.floor(currentFighter.commands/100)) + 1) + (attackStyle * 5 + Math.floor(currentFighter.commands/100)));
      //         if (currentFighter.class === 'rogue' && groupTurns[randomIndex] === 0) damageDone += Math.floor(Math.random() * (45 - 20 + 1) + 20);
      //         enemy.health -= damageDone;
      //         message.channel.send(`<@!${currentFighter.userID}> does **${damageDone.toLocaleString()}** damage to the ${enemy.name}!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
      //         if (enemy.health <= 0) {
      //           enemy.status = 'dead';
      //           break;
      //         }
      //         let damageTaken;
      //         if (battleScarred === 6) damageTaken = Math.floor(Math.random() * (100 - 80 + 1) + 80);
      //         if (battleScarred === 5) damageTaken = Math.floor(Math.random() * (70 - 60 + 1) + 60);
      //         if (battleScarred === 4) damageTaken = Math.floor(Math.random() * (50 - 40 + 1) + 40);
      //         if (enemy.health <= originalEnemyHealth/2) {
      //           damageTaken = damageTaken * 1.5;
      //           if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
      //           damageTaken = Math.floor(damageTaken);
      //           groupCurrentHealth[randomIndex] -= damageTaken;
      //           message.channel.send(`The ${enemy.name} **swings his spear wildly**, causing **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
      //           if (dungeonGroup.length > 1) {
      //             message.channel.send(`Everyone else in the group was caught in the whirlwind, taking **${Math.floor(damageTaken/groupCurrentHealth.length / 2)}** damage each!`);
      //             for (let i = 0; i < groupCurrentHealth.length; i++) {
      //               if (dungeonGroup[i].userID !== currentFighter.userID) {
      //                 groupCurrentHealth[i] -= Math.floor(damageTaken / groupCurrentHealth.length / 2);
      //                 if (groupCurrentHealth[i] <= 0) {
      //                   message.channel.send(`<@!${dungeonGroup[i].userID}> has been knocked unconscious! They can no longer help you...`);
                        
      //                   groupCurrentHealth.splice(i, 1);
      //                   groupMaxHealth.splice(i, 1);
      //                   if (dungeonGroup[i].class === 'mage' && dungeonGroup.length > 0) {
      //                     for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                       let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //                       groupCurrentHealth[i] += toHeal;
      //                     }
      //                     message.channel.send(`As <@!${dungeonGroup[i].userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //                   }
      //                   dungeonGroup.splice(i, 1);
      //                   if (dungeonGroup.length === 0) {
      //                     groupStatus = 'dead';
      //                     break;
      //                   }                              
      //                 }
      //               }
      //             }
      //           }
                
      //         } else {
      //           if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
      //           damageTaken = Math.floor(damageTaken);
      //           groupCurrentHealth[randomIndex] -= damageTaken;
      //           message.channel.send(`The ${enemy.name} does **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
      //         }
              
      //         if (groupCurrentHealth[randomIndex] <= 0) {
      //           message.channel.send(`<@!${currentFighter.userID}> has been knocked unconscious! They can no longer help you...`);
      //           dungeonGroup.splice(randomIndex, 1);
      //           groupCurrentHealth.splice(randomIndex, 1);
      //           groupMaxHealth.splice(randomIndex, 1);
      //           if (currentFighter.class === 'mage' && dungeonGroup.length > 0) {
      //             for (let i = 0; i < groupCurrentHealth.length; i++) {
      //               let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //               groupCurrentHealth[i] += toHeal;
      //             }
      //             message.channel.send(`As <@!${currentFighter.userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //           }
      //           if (dungeonGroup.length === 0) groupStatus = 'dead';
      //         } 
      //       } else {
      //         let damageTaken;
      //         if (battleScarred === 6) damageTaken = Math.floor(Math.random() * (100 - 80 + 1) + 80);
      //         if (battleScarred === 5) damageTaken = Math.floor(Math.random() * (70 - 60 + 1) + 60);
      //         if (battleScarred === 4) damageTaken = Math.floor(Math.random() * (50 - 40 + 1) + 40);
      //         if (enemy.health <= originalEnemyHealth/2) {
      //           damageTaken = damageTaken * 1.5;
      //           if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
      //           damageTaken = Math.floor(damageTaken);
      //           groupCurrentHealth[randomIndex] -= damageTaken;
      //           message.channel.send(`The ${enemy.name} **swings his spear wildly**, causing **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
      //           if (dungeonGroup.length > 1) {
      //             message.channel.send(`Everyone else in the group was caught in the whirlwind, taking **${Math.floor(damageTaken/groupCurrentHealth.length/2)}** damage each!`);
      //             for (let i = 0; i < groupCurrentHealth.length; i++) {
      //               if (dungeonGroup[i].userID !== currentFighter.userID) {
      //                 groupCurrentHealth[i] -= Math.floor(damageTaken / groupCurrentHealth.length / 2);
      //                 if (groupCurrentHealth[i] <= 0) {
      //                   message.channel.send(`<@!${dungeonGroup[i].userID}> has been knocked unconscious! They can no longer help you...`);
                        
      //                   groupCurrentHealth.splice(i, 1);
      //                   groupMaxHealth.splice(i, 1);
      //                   if (dungeonGroup[i].class === 'mage' && dungeonGroup.length > 0) {
      //                     for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                       let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //                       groupCurrentHealth[i] += toHeal;
      //                     }
      //                     message.channel.send(`As <@!${dungeonGroup[i].userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //                   }
      //                   dungeonGroup.splice(i, 1);
      //                   if (dungeonGroup.length === 0) {
      //                     groupStatus = 'dead';
      //                     break;
      //                   }                              
      //                 }
      //               }
      //             }
                  
      //           }
                
      //         } else {
      //           if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
      //           damageTaken = Math.floor(damageTaken);
      //           groupCurrentHealth[randomIndex] -= damageTaken;
      //           message.channel.send(`The ${enemy.name} does **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
      //         }
      //         if (groupCurrentHealth[randomIndex] <= 0) {
      //           message.channel.send(`<@!${currentFighter.userID}> has been knocked unconscious! They can no longer help you...`);
                
      //           dungeonGroup.splice(randomIndex, 1);
      //           groupCurrentHealth.splice(randomIndex, 1);
      //           groupMaxHealth.splice(randomIndex, 1);
      //           if (currentFighter.class === 'mage' && dungeonGroup.length > 0) {
      //             for (let i = 0; i < groupCurrentHealth.length; i++) {
      //               let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //               groupCurrentHealth[i] += toHeal;
      //             }
      //             message.channel.send(`As <@!${currentFighter.userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //           }
      //           if (dungeonGroup.length === 0) groupStatus = 'dead';
      //         } else {
      //           await message.channel.send(`<@!${currentFighter.userID}>, you see an opening to attack!\nQuickly, type \`${keyword}\` to damage the ${enemy.name}!`);
      //           const attackInput = await message.channel.awaitMessages(attackFilter, { max: 1, time: 8000});
      //           if (attackInput.size > 0) damageDone = Math.floor(Math.random() * ((attackStyle * 10 + Math.floor(currentFighter.commands/100)) - (attackStyle * 5 + Math.floor(currentFighter.commands/100)) + 1) + (attackStyle * 5 + Math.floor(currentFighter.commands/100)));
      //           if (currentFighter.class === 'rogue' && groupTurns[randomIndex] === 0) damageDone += Math.floor(Math.random() * (45 - 20 + 1) + 20);
      //           enemy.health -= damageDone;
      //           message.channel.send(`<@!${currentFighter.userID}> does **${damageDone.toLocaleString()}** damage to the ${enemy.name}!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
      //           if (enemy.health <= 0) {
      //             enemy.status = 'dead';
      //             break;
      //           }
      //         }
      //       }
      //       groupTurns[randomIndex] += 1;
      //     }
           
          
      //     if (groupStatus === 'alive') {
      //       message.channel.send(`A loud thud is heard as the beast falls backwards...\n\n**You defeated the ${enemy.name}!**`);
      //       for (let i = 0; i < dungeonGroup.length; i++) {
      //         await rewards(enemy, dungeonGroup[i], message);
      //       }
      //       let healthStats = 'css\n';
      //       //TODO: SETUP HEALTH STATS BETWEEN FIGHTS
      //       for (let i = 0; i < groupCurrentHealth.length; i++) {
      //         let u = message.guild.members.cache.get(dungeonGroup[i].userID);
      //         healthStats += `${u.user.username}: [${groupCurrentHealth[i]}/${groupMaxHealth[i]}]\n`;
      //         //healthStats += `=====\n`;
      //       }
      //       message.channel.send(`\`\`\`${healthStats}\`\`\``); 
      //     } else {
      //       return message.channel.send('**Unfortunately.... you failed.**');
      //     }
      //     groupTurns = groupTurnsReset;
      //     message.channel.send('*You proceed deeper into the fortress...*')
      //     //fight number 2
      //     setTimeout(async () => {
      //       let enemy = mobs.get(mobKeys[1]);
      //       let groupStatus = 'alive';
      //       message.channel.send(`*You hear chanting as you push on...*`);
      //       while (groupStatus === 'alive') {
      //         let randomIndex = Math.floor(Math.random() * dungeonGroup.length);
      //         let currentFighter = dungeonGroup[randomIndex];
      //         let damageDone = 0;
      //         let keyword;
      //         let attackStyle;
      //         let specialRoll;
      //         if (currentFighter.class === 'mage') { 
      //           keyword = mageAttacks[Math.floor(Math.random() * mageAttacks.length)];
      //           attackStyle = currentFighter.stats.wisdom * 1.8;
      //         }
      //         if (currentFighter.class === 'warlock') { 
      //           keyword = warlockAttacks[Math.floor(Math.random() * mageAttacks.length)];
      //           attackStyle = currentFighter.stats.wisdom * 1.8;
      //         }
      //         if (currentFighter.class === 'warrior') { 
      //           keyword = warriorAttacks[Math.floor(Math.random() * warriorAttacks.length)];
      //           attackStyle = currentFighter.stats.attack * 1.25;
      //         }
      //         if (currentFighter.class === 'rogue') { 
      //           keyword = rogueAttacks[Math.floor(Math.random() * rogueAttacks.length)];
      //           attackStyle = (currentFighter.stats.dexterity * 1.65) + (currentFighter.stats.attack * 0.55);
      //         }
      //         const attackFilter = res => res.author.id === currentFighter.userID && res.content.toLowerCase() === keyword;
      //         if (currentFighter.stats.dexterity > enemy.dexterity) {
      //           await message.channel.send(`<@!${currentFighter.userID}>, you see an opening to attack!\nQuickly, type \`${keyword}\` to damage the ${enemy.name}!`);
      //           const attackInput = await message.channel.awaitMessages(attackFilter, { max: 1, time: 8000});
      //           if (attackInput.size > 0) damageDone = Math.floor(Math.random() * ((attackStyle * 10 + Math.floor(currentFighter.commands/100)) - (attackStyle * 5 + Math.floor(currentFighter.commands/100)) + 1) + (attackStyle * 5 + Math.floor(currentFighter.commands/100)));
      //           if (currentFighter.class === 'rogue' && groupTurns[randomIndex] === 0) damageDone += Math.floor(Math.random() * (45 - 20 + 1) + 20);
      //           specialRoll = Math.floor(Math.random() * 101);
      //           if (specialRoll < 13) {
      //             message.channel.send(`The ${enemy.name} uses **FORESIGHT** to anticipate your attack, swiftly dodging it!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
      //           } else {
      //             enemy.health -= damageDone;
      //             message.channel.send(`<@!${currentFighter.userID}> does **${damageDone.toLocaleString()} damage** to the ${enemy.name}!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
      //           }
                
      //           if (enemy.health <= 0) {
      //             enemy.status = 'dead';
      //             break;
      //           }
      //           specialRoll = Math.floor(Math.random() * 101);
      //           let damageTaken = Math.random() * ((enemy.wisdom * 10) - (enemy.wisdom * 5) + 1) + (enemy.wisdom * 5);
      //           if (specialRoll <= 25) {
      //             message.channel.send(`The ${enemy.name} cast a **FIRE WAVE** towards the group, dealing **${Math.floor(damageTaken / groupCurrentHealth.length / 2)}** damage to everyone!`);
      //             for (let i = 0; i < groupCurrentHealth.length; i++) {
      //               groupCurrentHealth[i] -= Math.floor(damageTaken / groupCurrentHealth.length / 2);
      //               if (groupCurrentHealth[i] <= 0) {
      //                 message.channel.send(`<@!${dungeonGroup[i].userID}> has been knocked unconscious! They can no longer help you...`);
                      
      //                 groupCurrentHealth.splice(i, 1);
      //                 groupMaxHealth.splice(i, 1);
      //                 if (dungeonGroup[i].class === 'mage' && dungeonGroup.length > 0) {
      //                   for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                     let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //                     groupCurrentHealth[i] += toHeal;
      //                   }
      //                   message.channel.send(`As <@!${dungeonGroup[i].userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //                 }
      //                 dungeonGroup.splice(i, 1);
      //                 if (dungeonGroup.length === 0) {
      //                   groupStatus = 'dead';
      //                   break;
      //                 }                              
      //               }
      //             }
                  
      //           } else {
                  
      //             if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
      //             damageTaken = Math.floor(damageTaken);
      //             groupCurrentHealth[randomIndex] -= damageTaken;
      //             message.channel.send(`The ${enemy.name} casts a **MASSIVE FIREBALL**, causing **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
      //           }
                
                
      //           if (groupCurrentHealth[randomIndex] <= 0) {
      //             message.channel.send(`<@!${currentFighter.userID}> has been knocked unconscious! They can no longer help you...`);
      //             dungeonGroup.splice(randomIndex, 1);
      //             groupCurrentHealth.splice(randomIndex, 1);
      //             groupMaxHealth.splice(randomIndex, 1);
      //             if (currentFighter.class === 'mage' && dungeonGroup.length > 0) {
      //               for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                 let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //                 groupCurrentHealth[i] += toHeal;
      //               }
      //               message.channel.send(`As <@!${currentFighter.userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //             }
      //             if (dungeonGroup.length === 0) groupStatus = 'dead';
      //           } 
      //         } else {
      //           specialRoll = Math.floor(Math.random() * 101);
      //           let damageTaken = Math.random() * ((enemy.wisdom * 10) - (enemy.wisdom * 5) + 1) + (enemy.wisdom * 5);
      //           if (specialRoll <= 25) {
      //             message.channel.send(`The ${enemy.name} cast a **FIRE WAVE** towards the group, dealing **${Math.floor(damageTaken / groupCurrentHealth.length / 2)}** damage to everyone!`);
      //             for (let i = 0; i < groupCurrentHealth.length; i++) {
      //               groupCurrentHealth[i] -= Math.floor(damageTaken / groupCurrentHealth.length / 2);
      //               if (groupCurrentHealth[i] <= 0) {
      //                 message.channel.send(`<@!${dungeonGroup[i].userID}> has been knocked unconscious! They can no longer help you...`);
                      
      //                 groupCurrentHealth.splice(i, 1);
      //                 groupMaxHealth.splice(i, 1);
      //                 if (dungeonGroup[i].class === 'mage' && dungeonGroup.length > 0) {
      //                   for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                     let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //                     groupCurrentHealth[i] += toHeal;
      //                   }
      //                   message.channel.send(`As <@!${dungeonGroup[i].userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //                 }
      //                 dungeonGroup.splice(i, 1);
      //                 if (dungeonGroup.length === 0) {
      //                   groupStatus = 'dead';
      //                   break;
      //                 }                              
      //               }
      //             }
                  
      //           } else {
                  
      //             if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
      //             damageTaken = Math.floor(damageTaken);
      //             groupCurrentHealth[randomIndex] -= damageTaken;
      //             message.channel.send(`The ${enemy.name} casts a **MASSIVE FIREBALL**, causing **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
      //           }
      //           if (groupCurrentHealth[randomIndex] <= 0) {
      //             message.channel.send(`<@!${currentFighter.userID}> has been knocked unconscious! They can no longer help you...`);
      //             dungeonGroup.splice(randomIndex, 1);
      //             groupCurrentHealth.splice(randomIndex, 1);
      //             groupMaxHealth.splice(randomIndex, 1);
      //             if (currentFighter.class === 'mage' && dungeonGroup.length > 0) {
      //               for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                 let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //                 groupCurrentHealth[i] += toHeal;
      //               }
      //               message.channel.send(`As <@!${currentFighter.userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //             }
      //             if (dungeonGroup.length === 0) groupStatus = 'dead';
      //           } else {
      //             await message.channel.send(`<@!${currentFighter.userID}>, you see an opening to attack!\nQuickly, type \`${keyword}\` to damage the ${enemy.name}!`);
      //             const attackInput = await message.channel.awaitMessages(attackFilter, { max: 1, time: 8000});
      //             if (attackInput.size > 0) damageDone = Math.floor(Math.random() * ((attackStyle * 10 + Math.floor(currentFighter.commands/100)) - (attackStyle * 5 + Math.floor(currentFighter.commands/100)) + 1) + (attackStyle * 5 + Math.floor(currentFighter.commands/100)));
      //             if (currentFighter.class === 'rogue' && groupTurns[randomIndex] === 0) damageDone += Math.floor(Math.random() * (45 - 20 + 1) + 20);
      //             specialRoll = Math.floor(Math.random() * 101);
      //             if (specialRoll < 13) {
      //               message.channel.send(`The ${enemy.name} uses **FORESIGHT** to anticipate your attack, swiftly dodging it!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
      //             } else {
      //               enemy.health -= damageDone;
      //               message.channel.send(`<@!${currentFighter.userID}> does **${damageDone.toLocaleString()} damage** to the ${enemy.name}!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
      //             }
      //             if (enemy.health <= 0) {
      //               enemy.status = 'dead';
      //               break;
      //             }
      //           }
      //         }
      //         groupTurns[randomIndex] += 1;
      //       }

            
      //       if (groupStatus === 'alive') {
      //         message.channel.send(`The mighty beast falls to the floor...\n\n**You defeated the ${enemy.name}!**`);
      //         for (let i = 0; i < dungeonGroup.length; i++) {
      //           await rewards(enemy, dungeonGroup[i], message);
      //         }
      //         let healthStats = 'css\n';
      //         //TODO: SETUP HEALTH STATS BETWEEN FIGHTS
      //         for (let i = 0; i < groupCurrentHealth.length; i++) {
      //           let u = message.guild.members.cache.get(dungeonGroup[i].userID);
      //           healthStats += `${u.user.username}: [${groupMaxHealth[i]}/${groupMaxHealth[i]}]\n`;
      //           //healthStats += `=====\n`;
      //         }
      //         message.channel.send(`\`\`\`${healthStats}\`\`\``);  
      //       } else {
      //         return message.channel.send('**Unfortunately.... you failed.**');
      //       }
      //       groupTurns = groupTurnsReset;
      //       message.channel.send('*You push open the door to the keep...*');
      //       setTimeout(async () => {
      //         message.channel.send('*All is silent before a voice is heard...*')
      //         setTimeout(async () => {
      //           //boss fight
      //           groupCurrentHealth = groupMaxHealth;
      //           let enemy = boss;
      //           let groupStatus = 'alive';
      //           await message.channel.send(`**BEHOLD, __${enemy.name}__**!`);
      //           while (groupStatus === 'alive') {
      //             let randomIndex = Math.floor(Math.random() * dungeonGroup.length);
      //             let currentFighter = dungeonGroup[randomIndex];
      //             let damageDone = 0;
      //             let keyword;
      //             let attackStyle;
      //             if (currentFighter.class === 'mage') { 
      //               keyword = mageAttacks[Math.floor(Math.random() * mageAttacks.length)];
      //               attackStyle = currentFighter.stats.wisdom * 1.8;
      //             }
      //             if (currentFighter.class === 'warlock') { 
      //               keyword = warlockAttacks[Math.floor(Math.random() * mageAttacks.length)];
      //               attackStyle = currentFighter.stats.wisdom * 1.8;
      //             }
      //             if (currentFighter.class === 'warrior') { 
      //               keyword = warriorAttacks[Math.floor(Math.random() * warriorAttacks.length)];
      //               attackStyle = currentFighter.stats.attack * 1.25;
      //             }
      //             if (currentFighter.class === 'rogue') { 
      //               keyword = rogueAttacks[Math.floor(Math.random() * rogueAttacks.length)];
      //               attackStyle = (currentFighter.stats.dexterity * 1.65) + (currentFighter.stats.attack * 0.5);
      //             }
      //             const attackFilter = res => res.author.id === currentFighter.userID && res.content.toLowerCase() === keyword;
      //             if (currentFighter.stats.dexterity > enemy.dexterity) {
      //               await message.channel.send(`<@!${currentFighter.userID}>, you see an opening to attack!\nQuickly, type \`${keyword}\` to damage the ${enemy.name}!`);
      //               const attackInput = await message.channel.awaitMessages(attackFilter, { max: 1, time: 8000});
      //               if (attackInput.size > 0) damageDone = Math.floor(Math.random() * ((attackStyle * 10 + Math.floor(currentFighter.commands/100)) - (attackStyle * 5 + Math.floor(currentFighter.commands/100)) + 1) + (attackStyle * 5 + Math.floor(currentFighter.commands/100)));
      //               if (currentFighter.class === 'rogue' && groupTurns[randomIndex] === 0) damageDone += Math.floor(Math.random() * (45 - 20 + 1) + 20);
      //               enemy.health -= damageDone;
      //               message.channel.send(`<@!${currentFighter.userID}> does **${damageDone.toLocaleString()}** damage to the ${enemy.name}!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
      //               if (enemy.health <= 0) {
      //                 enemy.status = 'dead';
      //                 break;
      //               }
      //               let specialRoll = (Math.random() * 101);
      //               if (specialRoll <= 50) {
      //                 let damageTaken = Math.random() * ((enemy.attack * 15) - (enemy.attack * 10) + 1) + (enemy.attack * 10);
      //                 if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
      //                 damageTaken = Math.floor(damageTaken);
      //                 groupCurrentHealth[randomIndex] -= damageTaken;
      //                 message.channel.send(`The ${enemy.name} lunges with his **ROYAL EDGE**, causing **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
      //                 message.channel.send(`The massive blade sweeps the area, causing everyone to take **${Math.floor(damageTaken/groupCurrentHealth.length/2)}** damage each!`);
      //                 if (dungeonGroup.length > 1) {
      //                   for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                     if (dungeonGroup[i].userID !== currentFighter.userID) {
      //                       groupCurrentHealth[i] -= Math.floor(damageTaken / groupCurrentHealth.length / 2);
      //                       if (groupCurrentHealth[i] <= 0) {
      //                         message.channel.send(`<@!${dungeonGroup[i].userID}> has been knocked unconscious! They can no longer help you...`);
                              
      //                         groupCurrentHealth.splice(i, 1);
      //                         groupMaxHealth.splice(i, 1);
      //                         if (dungeonGroup[i].class === 'mage' && dungeonGroup.length > 0) {
      //                           for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                             let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //                             groupCurrentHealth[i] += toHeal;
      //                           }
      //                           message.channel.send(`As <@!${dungeonGroup[i].userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //                         }
      //                         dungeonGroup.splice(i, 1);
      //                         if (dungeonGroup.length === 0) {
      //                           groupStatus = 'dead';
      //                           break;
      //                         }                              
      //                       }
      //                     }
      //                   }
                        
      //                 }
      //               } else {
      //                 let damageTaken = Math.random() * ((enemy.wisdom * 15) - (enemy.wisdom * 10) + 1) + (enemy.wisdom * 10);
      //                 if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
      //                 damageTaken = Math.floor(damageTaken);
      //                 groupCurrentHealth[randomIndex] -= damageTaken;
      //                 message.channel.send(`The ${enemy.name} manifests a **RAGING FIRE STRIKE**, causing **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
      //                 message.channel.send(`Hell rains down, causing everyone to take **${Math.floor(damageTaken/groupCurrentHealth.length/2)}** damage each!`);
      //                 if (dungeonGroup.length > 1) {
      //                   for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                     if (dungeonGroup[i].userID !== currentFighter.userID) {
      //                       groupCurrentHealth[i] -= Math.floor(damageTaken / groupCurrentHealth.length / 2);
      //                       if (groupCurrentHealth[i] <= 0) {
      //                         message.channel.send(`<@!${dungeonGroup[i].userID}> has been knocked unconscious! They can no longer help you...`);
                              
      //                         groupCurrentHealth.splice(i, 1);
      //                         groupMaxHealth.splice(i, 1);
      //                         if (dungeonGroup[i].class === 'mage' && dungeonGroup.length > 0) {
      //                           for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                             let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //                             groupCurrentHealth[i] += toHeal;
      //                           }
      //                           message.channel.send(`As <@!${dungeonGroup[i].userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //                         }
      //                         dungeonGroup.splice(i, 1);
      //                         if (dungeonGroup.length === 0) {
      //                           groupStatus = 'dead';
      //                           break;
      //                         }                              
      //                       }
      //                     }
      //                   }
                        
      //                 }
      //               }
                    
      //               if (groupCurrentHealth[randomIndex] <= 0) {
      //                 message.channel.send(`<@!${currentFighter.userID}> has been knocked unconscious! They can no longer help you...`);
      //                 dungeonGroup.splice(randomIndex, 1);
      //                 groupCurrentHealth.splice(randomIndex, 1);
      //                 groupMaxHealth.splice(randomIndex, 1);
      //                 if (currentFighter.class === 'mage' && dungeonGroup.length > 0) {
      //                   for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                     let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //                     groupCurrentHealth[i] += toHeal;
      //                   }
      //                   message.channel.send(`As <@!${currentFighter.userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //                 }
      //                 if (dungeonGroup.length === 0) groupStatus = 'dead';
      //               } 
      //             } else {
      //               let specialRoll = (Math.random() * 101);
      //               if (specialRoll <= 50) {
      //                 let damageTaken = Math.random() * ((enemy.attack * 15) - (enemy.attack * 10) + 1) + (enemy.attack * 10);
      //                 if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
      //                 damageTaken = Math.floor(damageTaken);
      //                 groupCurrentHealth[randomIndex] -= damageTaken;
      //                 message.channel.send(`The ${enemy.name} lunges with his **ROYAL EDGE**, causing **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
      //                 message.channel.send(`The massive blade sweeps the area, causing everyone to take **${Math.floor(damageTaken/groupCurrentHealth.length/2)}** damage each!`);
      //                 if (dungeonGroup.length > 1) {
      //                   for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                     if (dungeonGroup[i].userID !== currentFighter.userID) {
      //                       groupCurrentHealth[i] -= Math.floor(damageTaken / groupCurrentHealth.length / 2);
      //                       if (groupCurrentHealth[i] <= 0) {
      //                         message.channel.send(`<@!${dungeonGroup[i].userID}> has been knocked unconscious! They can no longer help you...`);
                              
      //                         groupCurrentHealth.splice(i, 1);
      //                         groupMaxHealth.splice(i, 1);
      //                         if (dungeonGroup[i].class === 'mage' && dungeonGroup.length > 0) {
      //                           for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                             let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //                             groupCurrentHealth[i] += toHeal;
      //                           }
      //                           message.channel.send(`As <@!${dungeonGroup[i].userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //                         }
      //                         dungeonGroup.splice(i, 1);
      //                         if (dungeonGroup.length === 0) {
      //                           groupStatus = 'dead';
      //                           break;
      //                         }                              
      //                       }
      //                     }
      //                   }
                        
      //                 }
      //               } else {
      //                 let damageTaken = Math.random() * ((enemy.wisdom * 15) - (enemy.wisdom * 10) + 1) + (enemy.wisdom * 10);
      //                 if (currentFighter.class === 'warrior') damageTaken = damageTaken - (damageTaken/4);
      //                 damageTaken = Math.floor(damageTaken);
      //                 groupCurrentHealth[randomIndex] -= damageTaken;
      //                 message.channel.send(`The ${enemy.name} manifests a **RAGING FIRE STRIKE**, causing **${damageTaken}** damage to <@!${currentFighter.userID}>!`);
      //                 message.channel.send(`Hell rains down, causing everyone to take **${Math.floor(damageTaken/groupCurrentHealth.length/2)}** damage each!`);
      //                 if (dungeonGroup.length > 1) {
      //                   for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                     if (dungeonGroup[i].userID !== currentFighter.userID) {
      //                       groupCurrentHealth[i] -= Math.floor(damageTaken / groupCurrentHealth.length / 2);
      //                       if (groupCurrentHealth[i] <= 0) {
      //                         message.channel.send(`<@!${dungeonGroup[i].userID}> has been knocked unconscious! They can no longer help you...`);
                              
      //                         groupCurrentHealth.splice(i, 1);
      //                         groupMaxHealth.splice(i, 1);
      //                         if (dungeonGroup[i].class === 'mage' && dungeonGroup.length > 0) {
      //                           for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                             let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //                             groupCurrentHealth[i] += toHeal;
      //                           }
      //                           message.channel.send(`As <@!${dungeonGroup[i].userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //                         }
      //                         dungeonGroup.splice(i, 1);
      //                         if (dungeonGroup.length === 0) {
      //                           groupStatus = 'dead';
      //                           break;
      //                         }                              
      //                       }
      //                     }
      //                   }
                        
      //                 }
      //               }
      //               if (groupCurrentHealth[randomIndex] <= 0) {
      //                 message.channel.send(`<@!${currentFighter.userID}> has been knocked unconscious! They can no longer help you...`);
      //                 dungeonGroup.splice(randomIndex, 1);
      //                 groupCurrentHealth.splice(randomIndex, 1);
      //                 groupMaxHealth.splice(randomIndex, 1);
      //                 if (currentFighter.class === 'mage' && dungeonGroup.length > 0) {
      //                   for (let i = 0; i < groupCurrentHealth.length; i++) {
      //                     let toHeal = Math.floor(groupMaxHealth[i] * 0.1)
      //                     groupCurrentHealth[i] += toHeal;
      //                   }
      //                   message.channel.send(`As <@!${currentFighter.userID}> falls, they cast one final spell healing the group for **10%** of their max health!`);
      //                 }
      //                 if (dungeonGroup.length === 0) groupStatus = 'dead';
      //               } else {
      //                 await message.channel.send(`<@!${currentFighter.userID}>, you see an opening to attack!\nQuickly, type \`${keyword}\` to damage the ${enemy.name}!`);
      //                 const attackInput = await message.channel.awaitMessages(attackFilter, { max: 1, time: 8000});
      //                 if (attackInput.size > 0) damageDone = Math.floor(Math.random() * ((attackStyle * 10 + Math.floor(currentFighter.commands/100)) - (attackStyle * 5 + Math.floor(currentFighter.commands/100)) + 1) + (attackStyle * 5 + Math.floor(currentFighter.commands/100)));
      //                 if (currentFighter.class === 'rogue' && groupTurns[randomIndex] === 0) damageDone += Math.floor(Math.random() * (45 - 20 + 1) + 20);
      //                 enemy.health -= damageDone;
      //                 message.channel.send(`<@!${currentFighter.userID}> does **${damageDone.toLocaleString()}** damage to the ${enemy.name}!\nIt has ${enemy.health.toLocaleString()} health remaining!`);
      //                 if (enemy.health <= 0) {
      //                   enemy.status = 'dead';
      //                   break;
      //                 }
      //               }
      //             }
      //             groupTurns[randomIndex] += 1;
      //           }
                
      //           //message.channel.send(`\`\`\`${healthStats}\`\`\``);  
      //           if (groupStatus === 'alive') {
      //             message.channel.send(`The mighty beast falls to the floor...\n\n**You defeated the ${enemy.name}!**`);
      //             for (let i = 0; i < dungeonGroup.length; i++) {
      //               await rewards(enemy, dungeonGroup[i], message);
      //             }
      //             message.channel.send(`**Congratulations! You have completed ${dungeon}!**`);
      //             let healthStats = 'css\n';
      //         //TODO: SETUP HEALTH STATS BETWEEN FIGHTS
      //             for (let i = 0; i < groupCurrentHealth.length; i++) {
      //               let u = message.guild.members.cache.get(dungeonGroup[i].userID);
      //               healthStats += `${u.user.username}: [${groupCurrentHealth[i]}/${groupMaxHealth[i]}]\n`;
      //               //healthStats += `=====\n`;
      //             }
      //             message.channel.send(`\`\`\`${healthStats}\`\`\``); 
      //           } else {
      //             return message.channel.send('**Unfortunately.... you failed.**');
      //           }
      //         }, 3000);
      //       }, 5000);
      //     }, 5000);
      //   }, 5000);
      // }
      } else if (choice === 'list') {
        const dungeonEmbed = new Discord.MessageEmbed()
        .setTitle('Dungeon List')
        .setDescription('Each dungeon gets progressively harder. To unlock a dungeon, you must meet the level requirements and complete all dungeons before it. Remember, dungeons are easier in a group!')
        .addField('The Blood Groves:', 'Level Requirement: ||25||\nBoss: ||Stalker Manticore||\nCommand: `(p)dungeon groves`')
        .addField('The Goblin Fortress:', 'Level Requirement: ||50||\nBoss: ||The King of Greed||\nCommand: `(p)dungeon fortress`')
        .addField('The Withered Plains:', 'Level Requirement: ||100||\nBoss: ||Dark Chimera||\nCommand: `(p)dungeon withered`')
        .setFooter('check out your profile to see your level!')
        .setColor("RANDOM")
        .setTimestamp();

        await message.channel.send(dungeonEmbed).catch(err => console.log(err))
      }
    }

  }
}

async function bloodGroveMobs(keys, group, totalLevel) {
  let mobs = new Map();
 
  
  mobs.set(keys[0], {
    health: Math.floor(200 + (2.5 * totalLevel)),
    attack: 3,
    dexterity: 5,
    status: 'alive',
    name: 'Orb Weaver',
    drops: [{ item: 'bone', count: Math.floor(Math.random()* (35 - 20 + 1) + 20), dropRate: 100 }, { item: 'silkgland', count: 1, dropRate: 8 }, { item: 'spidersfang', count: 1, dropRate: 3 }],
    payout: Math.floor(Math.random() * (20000 - 15000 + 1) + 15000)
  });
  mobs.set(keys[1], {
    health: Math.floor(250 + (2.8 * totalLevel)),
    attack: 5,
    dexterity: 1,
    status: 'alive',
    name: 'Ent',
    drops: [{ item: 'corewood', count: Math.floor(Math.random()* (5 - 1 + 1) + 1), dropRate: 100 },  { item: 'essenceoflife', count: 1, dropRate: 5 }, { item: 'essenceofnature', count: 1, dropRate: 3 }],
    payout: Math.floor(Math.random() * (50000 - 35000 + 1) + 35000)
  });
  return mobs;
}
async function bloodGroveBoss(group, totalLevel) {
  let boss;
  
  boss = {
    health: Math.floor(350 + (3.2 * totalLevel)),
    attack: 5,
    dexterity: 4,
    status: 'alive',
    name: 'Stalker Manticore',
    drops: [{ item: 'bone', count: Math.floor(Math.random()* (40 - 30 + 1) + 30), dropRate: 100 }, { item: 'vialofx', count: 1, dropRate: 8.5 }, { item: 'stingerblade', count: 1, dropRate: 1.5 }, { item: 'manticoresmane', count: 1, dropRate: 0.75 }],
    alwaysDrops: { item: 'manticorehead', count: 1},
    payout: Math.floor(Math.random() * (150000 - 50000 + 1) + 50000)
  };
  return boss;
}


async function goblinFortressMobs(keys, group, totalLevel) {
  let mobs = new Map();
 
  
  mobs.set(keys[0], {
    health: Math.floor(400 + (2.3 * totalLevel)),
    attack: 4,
    dexterity: 4,
    wisdom: 2,
    status: 'alive',
    name: 'Hobgoblin',
    drops: [{ item: 'tornrags', count: Math.floor(Math.random()* (45 - 30 + 1) + 30), dropRate: 100 }, { item: 'eyeofgreed', count: 1, dropRate: 5.1 }, { item: 'featheredspear', count: 1, dropRate: 2.1 }, { item: 'greedysack', count: 1, dropRate: 0.5 }],
    payout: Math.floor(Math.random() * (80000 - 70000 + 1) + 70000)
  });
  mobs.set(keys[1], {
    health: Math.floor(500 + (2.6 * totalLevel)),
    attack: 3,
    dexterity: 5,
    wisdom: 7,
    status: 'alive',
    name: 'Goblin Shaman',
    drops: [{ item: 'goblinsheart', count: Math.floor(Math.random()* (6 - 1 + 1) + 1), dropRate: 100 }, { item: 'markofthewise', count: 1, dropRate: 4 }, { item: 'gemstaff', count: 1, dropRate:  2}],
    payout: Math.floor(Math.random() * (130000 - 120000 + 1) + 120000)
  });
  return mobs;
}

async function goblinFortressBoss(group, totalLevel) {
  let boss;
  
  boss = {
    health: Math.floor(700 + (3 * totalLevel)),
    attack: 7,
    dexterity: 5,
    wisdom: 6,
    status: 'alive',
    name: 'The King of Greed | Goblin King',
    drops: [{ item: 'tornrags', count: Math.floor(Math.random()* (45 - 30 + 1) + 30), dropRate: 100 }, { item: 'jewelnecklace', count: 1, dropRate: 6 }, { item: 'busterblade', count: 1, dropRate: 1.5 }, { item: 'kingsbreastplate', count: 1, dropRate: 0.75 } ],
    alwaysDrops: { item: 'kingshead', count: 1},
    payout: Math.floor(Math.random() * (250000 - 240000 + 1) + 240000)
  };
  return boss;
}


async function rewards(mob, user, msg) {
  let userUpdate = await userDB.findOne({ userID: user.userID });
  let userInv = userUpdate.inventory;
  let items = await itemDB.find({});
  let dropRoll = Math.random() * 100;
  let reward;
  let payout = mob.payout;
  let rewardString = '';
  if (userInv) {
    mob.drops.forEach(async drop => {
      if (drop.dropRate >= dropRoll) reward = drop;
    });
    let checkForItem = userInv.find( ({itemID}) => itemID === reward.item);
    let item = items.find( ({itemID}) => itemID === reward.item);
    if (checkForItem) {
      checkForItem.count += reward.count;
    } else {
      userInv.push({ itemID: reward.item, itemName: item.itemName, userID: user.userID, count: reward.count });
      if (item.attack) userUpdate.stats.attack += item.attack;
      if (item.wisdom) userUpdate.stats.wisdom += item.wisdom;
      if (item.dexterity) userUpdate.stats.dexterity += item.dexterity;
    }
    rewardString += `<@!${user.userID}> received $${payout.toLocaleString()} and ${reward.count} ${item.itemName}!`
    userUpdate.wallet += Number(payout);
    if(mob.alwaysDrops) {
      let reward = mob.alwaysDrops;
      let checkForItem = userInv.find( ({itemID}) => itemID === reward.item);
      let item = items.find( ({itemID}) => itemID === reward.item);
      if (checkForItem) {
        
      } else {
        userInv.push({ itemID: reward.item, itemName: item.itemName, userID: user.userID, count: reward.count });
        if (item.attack) userUpdate.stats.attack += item.attack;
        if (item.wisdom) userUpdate.stats.wisdom += item.wisdom;
        if (item.dexterity) userUpdate.stats.dexterity += item.dexterity;
        rewardString += `\n<@!${userUpdate.userID}> also received ${reward.count} ${item.itemName}!`
      }
    }
    userUpdate.commands += 25;
    await userUpdate.save().catch(err => console.log(err));
    msg.channel.send(rewardString);
  }
}