const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const userDB = require('../../utils/models/currency.js');
const itemDB = require('../../utils/models/item.js');
const statsDB = require('../../utils/models/botstats.js');
const humanizeDuration = require('humanize-duration');
const FuzzySearch = require('fuzzy-search');
//const mobDB = require('../../utils/models/mobs.js');
//const bossDB = require('../../utils/models/bosses.js');
const { response } = require('express');
let globalMessage;
module.exports = class NewdungeonCommand extends BaseCommand {
  constructor() {
    super('dungeon', 'Currency', [], 'dungeon', 'Test your might in revBot Dungeons! There are more dungeons under the `(p)dung list` command!');
  }

  async run(client, message, args) {
    const target = message.author;
    const starter = await userDB.findOne({ userID: target.id });
    const stats = await statsDB.findOne({});
    const cooldown = 60000 * 1;
    const joinCooldown = 30000;
    const dungeons = ['The Blood Groves', 'The Goblin Fortress', 'The Withered Plains', 'The Necropolis', 'The Empty'];
    const choice = args[0].toLowerCase();
    const searcher = new FuzzySearch(dungeons, undefined, {sort: true});
    const result = searcher.search(choice);
    const dungeon = result[0];
    globalMessage = message;
    let dungeonGroup = [starter];
    let groupCurrentHealth = [];
    let groupMaxHealth = [];
    let groupTurns = [];
    let groupTurnsReset = [];
    let totalLevel = 0;
    
    async function joinFilter(res) {
      if (res.content.toLowerCase() === 'join dungeon') {
        let joiner = await userDB.findOne({ userID: res.author.id });
        if (!joiner || joiner.class === 'none'){
          message.channel.send(`<@!${res.author.id}>, you do not meet the requirements to join a dungeon group. \`(p)class\``);
        } else if (dungeonGroup.find( ({userID}) => userID === joiner.userID)) {
          message.channel.send(`<@!${res.author.id}>, you've already joined the group!`);
        } else if (dungeonGroup.length > 8) {
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
      if (dungeon === dungeons[1]) {
        starter.dungeonStartCD = Date.now();
        starter.dungeonCD = Date.now();
        stats.dungeons += 1;
        await stats.save();
        await starter.save();
        const mobKeys = ['Hobgoblin', 'Goblin Shaman']
        
        await message.channel.send(`<@!${starter.userID}> is calling for adventurers to join them in **${dungeon}**!\nType \`join dungeon\` to join them!`);
        const msgs = await message.channel.awaitMessages(joinFilter, { time: 30000 });
        let entryMessage = '';
        dungeonGroup.forEach( member => {
          entryMessage += `<@!${member.userID}> `;
          totalLevel += Math.floor((member.commands / 100));
          let memberHealth = member.health + Math.floor(0.5 * (member.commands / 100));
          let userInv = member.inventory;
          let breastPlate = userInv.find( ({itemID}) => itemID === 'kingsbreastplate');
          let rage = userInv.find( ({itemID}) => itemID === 'essenceofrage');
          let refinedEssence = userInv.find( ({itemID}) => itemID === 'refinedessence');
          let evasiveWings = userInv.find( ({itemID}) => itemID === 'evasivewings');
          let wizardsRobe = userInv.find( ({itemID}) => itemID === 'wizardsrobe');
          let roguesCloak = userInv.find( ({itemID}) => itemID === 'roguescloak');
          let ancientMechanism = userInv.find( ({itemID}) => itemID === 'ancientmechanism');
          let revenantsRobe = userInv.find( ({itemID}) => itemID === 'revenantsrobe');
          let etherealBand = userInv.find( ({itemID}) => itemID === 'etherealband');
          if (breastPlate) memberHealth += 75;
          if (rage) memberHealth -= 50;
          if (refinedEssence) memberHealth += 50;
          if (evasiveWings) memberHealth += 25;
          if (wizardsRobe) memberHealth += 25;
          if (roguesCloak) memberHealth += 25;
          if (ancientMechanism) memberHealth += 25;
          if (revenantsRobe) memberHealth += 25;
          if (etherealBand) memberHealth += 50;
          groupMaxHealth.push(memberHealth);
          groupCurrentHealth.push(memberHealth);
          groupTurns.push(0);
          groupTurnsReset.push(0);
        });
        const mobs = await goblinFortressMobs(mobKeys, dungeonGroup, totalLevel);
        const boss = await goblinFortressBoss(dungeonGroup, totalLevel);
        //const boss = await goblinFortressBoss(dungeonGroup, totalLevel);
        await message.channel.send(`${entryMessage}\nPrepare to enter **${dungeon}**!`);
        setTimeout(async () => {
          let enemy = mobs.get(mobKeys[0]);
          let battleScarred = Math.floor(Math.random() * (5 - 3 + 1) + 3);
          let randomIndex = 0;
          while (dungeonGroup.length > 0) {
            let currentFighter = dungeonGroup[randomIndex];
            let damageDone = 0;
            let death;
            let enemyDeath = false;
            let playerDamage = 0;
            let enemyDamage = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: [], attack: ''};
            let intent;
            
            intent = await abilityEmbed(message, currentFighter, dungeon);
            
            if (currentFighter.stats.dexterity > enemy.dexterity) {
              if (intent[1]) {
                playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                if (enemy.health <= 0) {
                  enemyDeath = true;
                } else {
                  enemyDamage = hobAttack(message, currentFighter, enemy, randomIndex, battleScarred, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                }
                
              } else {
                enemyDamage = hobAttack(message, currentFighter, enemy, randomIndex, battleScarred, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
              }
            } else {
              if (intent[1]) {
                enemyDamage = hobAttack(message, currentFighter, enemy, randomIndex, battleScarred, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                if (!death) playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
              } else {
                enemyDamage = hobAttack(message, currentFighter, enemy, randomIndex, battleScarred, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
              }
            }
            if (enemy.health <= 0) {
              enemyDeath = true;
            } 
            attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon);
            await delay();
            randomIndex += 1;
            if (randomIndex >= dungeonGroup.length) {
              randomIndex = 0;
            }
            
            if (enemyDeath) {
              break;
            }
          }
          let rewardString = '';
          if (dungeonGroup.length > 0) {
            message.channel.send(`The mighty beast falls to the floor...\n\n**You defeated the ${enemy.name}!**`);
            for (let i = 0; i < dungeonGroup.length; i++) {
              await rewards(enemy, dungeonGroup[i], message).then(val => rewardString += val);
            }
            rewardEmbed(rewardString, message);
          } else {
            return message.channel.send('**Unfortunately.... you failed.**');
          }
          message.channel.send('*You proceed deeper into the fortress...*');
          setTimeout(async () => {
            let enemy = mobs.get(mobKeys[1]);
            let randomIndex = 0;
            while (dungeonGroup.length > 0) {
              let currentFighter = dungeonGroup[randomIndex];
              let damageDone = 0;
              let death;
              let enemyDeath = false;
              let playerDamage = 0;
              let enemyDamage = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: []};
              let intent;
              
              intent = await abilityEmbed(message, currentFighter, dungeon);
              
              if (currentFighter.stats.dexterity > enemy.dexterity) {
                if (intent[1]) {
                  playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                  if (enemy.health <= 0) {
                    enemyDeath = true;
                  } else {
                    enemyDamage = shamanAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  }
                  
                } else {
                  enemyDamage = shamanAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                }
              } else {
                if (intent[1]) {
                  enemyDamage = shamanAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  if (!death) playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                } else {
                  enemyDamage = shamanAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                }
              }
              if (enemy.health <= 0) {
                enemyDeath = true;
              } 
              attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon);
              randomIndex += 1;
            if (randomIndex >= dungeonGroup.length) {
              randomIndex = 0;
            }
              await delay();
              
              if (enemyDeath) {
                break;
              }
            }
            let rewardString = '';
            if (dungeonGroup.length > 0) {
              message.channel.send(`The mighty beast falls to the floor...\n\n**You defeated the ${enemy.name}!**`);
              for (let i = 0; i < dungeonGroup.length; i++) {
                await rewards(enemy, dungeonGroup[i], message).then(val => rewardString += val);
              }
              rewardEmbed(rewardString, message);
            } else {
              return message.channel.send('**Unfortunately.... you failed.**');
            }
            message.channel.send('*You proceed deeper into the fortress...*');
            for (let i = 0; i < groupCurrentHealth.length; i++) {
              groupCurrentHealth[i] = groupMaxHealth[i];
            }
            setTimeout(async () => {
              let enemy = boss;
              let randomIndex = 0;
              while (dungeonGroup.length > 0) {
                let currentFighter = dungeonGroup[randomIndex];
                let damageDone = 0;
                let death;
                let enemyDeath = false;
                let playerDamage = 0;
                let enemyDamage = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: []};
                let intent;
                
                intent = await abilityEmbed(message, currentFighter, dungeon);
                
                 
                if (currentFighter.stats.dexterity > enemy.dexterity) {
                  if (intent[1]) {
                    playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                    if (enemy.health <= 0) {
                      enemyDeath = true;
                    } else {
                      enemyDamage = goblinKingAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                      death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                    }
                    
                  } else {
                    enemyDamage = goblinKingAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  }
                } else {
                  if (intent[1]) {
                    enemyDamage = goblinKingAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                    if (!death) playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                  } else {
                    enemyDamage = goblinKingAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  }
                }
                if (enemy.health <= 0) {
                  enemyDeath = true;
                } 
                attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon);
                await delay();
                groupTurns[randomIndex] += 1;
                randomIndex += 1;
                if (randomIndex >= dungeonGroup.length) {
                  randomIndex = 0;
                }
                if (enemyDeath) {
                  break;
                }
              }
              let rewardString = '';
              if (dungeonGroup.length > 0) {
                message.channel.send(`The mighty beast falls to the floor...\n\n**You defeated the ${enemy.name}!**`);
                for (let i = 0; i < dungeonGroup.length; i++) {
                  await rewards(enemy, dungeonGroup[i], message).then(val => rewardString += val);
                }
                rewardEmbed(rewardString, message);
              } else {
                return message.channel.send('**Unfortunately.... you failed.**');
              }
              message.channel.send(`**Congratulations, you have completed ${dungeon}!**`)
            }, 5000);
          }, 5000);
        }, 5000);
      } else if (dungeon === dungeons[2]) {
        starter.dungeonStartCD = Date.now();
        starter.dungeonCD = Date.now();
        stats.dungeons += 1;
        await stats.save();
        await starter.save();
        const mobKeys = ['Blood Mosquito', 'Void Devourer']
        
        await message.channel.send(`<@!${starter.userID}> is calling for adventurers to join them in **${dungeon}**!\nType \`join dungeon\` to join them!`);
        const msgs = await message.channel.awaitMessages(joinFilter, { time: 30000 });
        let entryMessage = '';
        dungeonGroup.forEach( member => {
          entryMessage += `<@!${member.userID}> `;
          totalLevel += Math.floor(member.commands / 100);
          let memberHealth = member.health + Math.floor(0.5 * (member.commands / 100));
          let userInv = member.inventory;
          let breastPlate = userInv.find( ({itemID}) => itemID === 'kingsbreastplate')
          let rage = userInv.find( ({itemID}) => itemID === 'essenceofrage');
          let refinedEssence = userInv.find( ({itemID}) => itemID === 'refinedessence');
          let evasiveWings = userInv.find( ({itemID}) => itemID === 'evasivewings');
          let wizardsRobe = userInv.find( ({itemID}) => itemID === 'wizardsrobe');
          let roguesCloak = userInv.find( ({itemID}) => itemID === 'roguescloak');
          let ancientMechanism = userInv.find( ({itemID}) => itemID === 'ancientmechanism');
          let revenantsRobe = userInv.find( ({itemID}) => itemID === 'revenantsrobe');
          let etherealBand = userInv.find( ({itemID}) => itemID === 'etherealband');
          if (breastPlate) memberHealth += 75;
          if (rage) memberHealth -= 50;
          if (refinedEssence) memberHealth += 50;
          if (evasiveWings) memberHealth += 25;
          if (wizardsRobe) memberHealth += 25;
          if (roguesCloak) memberHealth += 25;
          if (ancientMechanism) memberHealth += 25;
          if (revenantsRobe) memberHealth += 25;
          if (etherealBand) memberHealth += 50;

          groupMaxHealth.push(memberHealth);
          groupCurrentHealth.push(memberHealth);
          groupTurns.push(0);
          groupTurnsReset.push(0);
        });
        const mobs = await witheredPlainsMobs(mobKeys, dungeonGroup, totalLevel);
        const boss = await witheredPlainsBoss(dungeonGroup, totalLevel);
        //const boss = await goblinFortressBoss(dungeonGroup, totalLevel);
        await message.channel.send(`${entryMessage}\nPrepare to enter **${dungeon}**!`);
        setTimeout(async () => {
          let enemy = mobs.get(mobKeys[0]);
          let randomIndex = 0;
          while (dungeonGroup.length > 0) {
            let currentFighter = dungeonGroup[randomIndex];
            let damageDone = 0;
            let death;
            let enemyDeath = false;
            let playerDamage = 0;
            let enemyDamage = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: [], attack: ''};
            let intent;
            let lifeLeechChance = Math.random();
            intent = await abilityEmbed(message, currentFighter, dungeon);
            
            if (currentFighter.stats.dexterity > enemy.dexterity) {
              if (intent[1]) {
                playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                
                
                if (enemy.health <= 0) {
                  enemyDeath = true;
                } else {
                  enemyDamage = mosquitoAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  if (lifeLeechChance > 3/4) {
                    enemyDamage.selfHeal = Math.floor(playerDamage.playerDamage / 4);
                    enemy.health += enemyDamage.selfHeal;
                  } else if (lifeLeechChance > 0.93) {
                    enemy.health += playerDamage.playerDamage;
                    enemy.status.stun.state = false;
                    enemy.status.stun.duration = 0;
                    playerDamage.playerDamage = 0;
                  }
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                }
                
              } else {
                enemyDamage = mosquitoAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
              }
            } else {
              if (intent[1]) {
                enemyDamage = mosquitoAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                if (!death) playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                if (lifeLeechChance > 3/4) {
                  enemyDamage.selfHeal = Math.floor(playerDamage.playerDamage / 4);
                  enemy.health += enemyDamage.selfHeal;
                } else if (lifeLeechChance > 0.93) {
                  enemy.health += playerDamage.playerDamage;
                  enemy.status.stun.state = false;
                  enemy.status.stun.duration = 0;
                  playerDamage.playerDamage = 0;
                }
              } else {
                enemyDamage = mosquitoAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
              }
            }
            if (enemy.health <= 0) {
              enemyDeath = true;
            } 
            attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon);
            await delay();
            groupTurns[randomIndex] += 1;
            randomIndex += 1;
            if (randomIndex >= dungeonGroup.length) {
              randomIndex = 0;
            }
            if (enemyDeath) {
              break;
            }
          }
          let rewardString = '';
          if (dungeonGroup.length > 0) {
            message.channel.send(`The mighty beast falls to the floor...\n\n**You defeated the ${enemy.name}!**`);
            for (let i = 0; i < dungeonGroup.length; i++) {
              await rewards(enemy, dungeonGroup[i], message).then(val => rewardString += val);
            }
            rewardEmbed(rewardString, message);
          } else {
            return message.channel.send('**Unfortunately.... you failed.**');
          }
          message.channel.send('*The presence of death is suffocating...*');
          setTimeout(async () => {
            let enemy = mobs.get(mobKeys[1]);
            let randomIndex = 0;
            while (dungeonGroup.length > 0) {
              let currentFighter = dungeonGroup[randomIndex];
              let damageDone = 0;
              let death;
              let enemyDeath = false;
              let playerDamage = 0;
              let enemyDamage = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: []};
              let intent;
              let bodyShrinkChance = Math.random();
              intent = await abilityEmbed(message, currentFighter, dungeon);
              
              if (currentFighter.stats.dexterity > enemy.dexterity) {
                if (intent[1]) {
                  playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                  if (enemy.health <= 0) {
                    enemyDeath = true;
                  } else {
                    enemyDamage = devourerAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    if (bodyShrinkChance < 0.1) {
                      enemy.health += playerDamage.playerDamage;
                      enemy.status.stun.state = false;
                      enemy.status.stun.duration = 0;
                      playerDamage.playerDamage = 0;
                    }
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  }
                  
                } else {
                  enemyDamage = devourerAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                }
              } else {
                if (intent[1]) {
                  enemyDamage = devourerAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  if (!death) playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                  if (bodyShrinkChance < 0.1) {
                    enemy.health += playerDamage.playerDamage;
                    enemy.status.stun.state = false;
                    enemy.status.stun.duration = 0;
                    playerDamage.playerDamage = 0;
                  }
                } else {
                  enemyDamage = devourerAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                }
              }
              if (enemy.health <= 0) {
                enemyDeath = true;
              } 
              attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon);
              await delay();
              groupTurns[randomIndex] += 1;
              randomIndex += 1;
              if (randomIndex >= dungeonGroup.length) {
                randomIndex = 0;
              }
              if (enemyDeath) {
                break;
              }
            }
            let rewardString = '';
            if (dungeonGroup.length > 0) {
              message.channel.send(`The mighty beast falls to the floor...\n\n**You defeated the ${enemy.name}!**`);
              for (let i = 0; i < dungeonGroup.length; i++) {
                await rewards(enemy, dungeonGroup[i], message).then(val => rewardString += val);
              }
              rewardEmbed(rewardString, message);
            } else {
              return message.channel.send('**Unfortunately.... you failed.**');
            }
            message.channel.send('*Dread is a familiar feeling here...*');
            for (let i = 0; i < groupCurrentHealth.length; i++) {
              groupCurrentHealth[i] = groupMaxHealth[i];
            }
            setTimeout(async () => {
              let enemy = boss;
              let randomIndex = 0;
              while (dungeonGroup.length > 0) {
                let currentFighter = dungeonGroup[randomIndex];
                let damageDone = 0;
                let death;
                let enemyDeath = false;
                let playerDamage = 0;
                let enemyDamage = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: []};
                let intent;
                
                intent = await abilityEmbed(message, currentFighter, dungeon);
                
                 
                if (currentFighter.stats.dexterity > enemy.dexterity) {
                  if (intent[1]) {
                    playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                    if (enemy.health <= 0) {
                      enemyDeath = true;
                    } else {
                      enemyDamage = chimeraAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                      death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                    }
                    
                  } else {
                    enemyDamage = chimeraAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  }
                } else {
                  if (intent[1]) {
                    enemyDamage = chimeraAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                    if (!death) playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                  } else {
                    enemyDamage = chimeraAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  }
                }
                if (enemy.health <= 0) {
                  enemyDeath = true;
                } 
                attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon);
                await delay();
                groupTurns[randomIndex] += 1;
                randomIndex += 1;
                if (randomIndex >= dungeonGroup.length) {
                  randomIndex = 0;
                }
                if (enemyDeath) {
                  break;
                }
              }
              let rewardString = '';
              if (dungeonGroup.length > 0) {
                message.channel.send(`The mighty beast falls to the floor...\n\n**You defeated the ${enemy.name}!**`);
                for (let i = 0; i < dungeonGroup.length; i++) {
                  await rewards(enemy, dungeonGroup[i], message).then(val => rewardString += val);
                }
                rewardEmbed(rewardString, message);
              } else {
                return message.channel.send('**Unfortunately.... you failed.**');
              }
              message.channel.send(`**Congratulations, you have completed ${dungeon}!**`)
            }, 5000);
          }, 5000);
        }, 5000);
      } else if (dungeon === dungeons[3]) {
        starter.dungeonStartCD = Date.now();
        starter.dungeonCD = Date.now();
        stats.dungeons += 1;
        await stats.save();
        await starter.save();
        const mobKeys = ['Awoken Mummy', 'Skeletal Warrior']
        
        await message.channel.send(`<@!${starter.userID}> is calling for adventurers to join them in **${dungeon}**!\nType \`join dungeon\` to join them!`);
        const msgs = await message.channel.awaitMessages(joinFilter, { time: 30000 });
        let entryMessage = '';
        dungeonGroup.forEach( member => {
          entryMessage += `<@!${member.userID}> `;
          totalLevel += Math.floor(member.commands / 100);
          let memberHealth = member.health + Math.floor(0.5 * (member.commands / 100));
          let userInv = member.inventory;
          let breastPlate = userInv.find( ({itemID}) => itemID === 'kingsbreastplate')
          let rage = userInv.find( ({itemID}) => itemID === 'essenceofrage');
          let refinedEssence = userInv.find( ({itemID}) => itemID === 'refinedessence');
          let evasiveWings = userInv.find( ({itemID}) => itemID === 'evasivewings');
          let wizardsRobe = userInv.find( ({itemID}) => itemID === 'wizardsrobe');
          let roguesCloak = userInv.find( ({itemID}) => itemID === 'roguescloak');
          let ancientMechanism = userInv.find( ({itemID}) => itemID === 'ancientmechanism');
          let revenantsRobe = userInv.find( ({itemID}) => itemID === 'revenantsrobe');
          let etherealBand = userInv.find( ({itemID}) => itemID === 'etherealband');
          if (breastPlate) memberHealth += 75;
          if (rage) memberHealth -= 50;
          if (refinedEssence) memberHealth += 50;
          if (evasiveWings) memberHealth += 25;
          if (wizardsRobe) memberHealth += 25;
          if (roguesCloak) memberHealth += 25;
          if (ancientMechanism) memberHealth += 25;
          if (revenantsRobe) memberHealth += 25;
          if (etherealBand) memberHealth += 50;

          groupMaxHealth.push(memberHealth);
          groupCurrentHealth.push(memberHealth);
          groupTurns.push(0);
          groupTurnsReset.push(0);
        });
        const mobs = await necropolisMobs(mobKeys, dungeonGroup, totalLevel);
        const boss = await necropolisBoss(dungeonGroup, totalLevel);
        //const boss = await goblinFortressBoss(dungeonGroup, totalLevel);
        await message.channel.send(`${entryMessage}\nPrepare to enter **${dungeon}**!`);
        setTimeout(async () => {
          let enemy = mobs.get(mobKeys[0]);
          let randomIndex = 0;
          while (dungeonGroup.length > 0) {
            let currentFighter = dungeonGroup[randomIndex];
            let damageDone = 0;
            let death;
            let enemyDeath = false;
            let playerDamage = 0;
            let enemyDamage = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: [], attack: ''};
            let intent;
            let lifeLeechChance = Math.random();
            intent = await abilityEmbed(message, currentFighter, dungeon);
            
            if (currentFighter.stats.dexterity > enemy.dexterity) {
              if (intent[1]) {
                playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                
                
                if (enemy.health <= 0) {
                  enemyDeath = true;
                } else {
                  enemyDamage = mummyAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  if (lifeLeechChance > 3/4) {
                    enemyDamage.selfHeal = Math.floor(playerDamage.playerDamage / 4);
                    enemy.health += enemyDamage.selfHeal;
                  } 
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                }
                
              } else {
                enemyDamage = mummyAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
              }
            } else {
              if (intent[1]) {
                enemyDamage = mummyAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                if (!death) playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                if (lifeLeechChance > 3/4) {
                  enemyDamage.selfHeal = Math.floor(playerDamage.playerDamage / 4);
                  enemy.health += enemyDamage.selfHeal;
                }
              } else {
                enemyDamage = mummyAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
              }
            }
            if (enemy.health <= 0) {
              enemyDeath = true;
            } 
            attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon);
            await delay();
            groupTurns[randomIndex] += 1;
            randomIndex += 1;
            if (randomIndex >= dungeonGroup.length) {
              randomIndex = 0;
            }
            if (enemyDeath) {
              break;
            }
          }
          let rewardString = '';
          if (dungeonGroup.length > 0) {
            message.channel.send(`The putrid wretch unravels on the floor...\n\n**You defeated the ${enemy.name}!**`);
            for (let i = 0; i < dungeonGroup.length; i++) {
              await rewards(enemy, dungeonGroup[i], message).then(val => rewardString += val);
            }
            rewardEmbed(rewardString, message);
          } else {
            return message.channel.send('**Unfortunately.... you failed.**');
          }
          message.channel.send('*Your heart is beating faster... Your breath is shortening...*');
          setTimeout(async () => {
            let enemy = mobs.get(mobKeys[1]);
            let randomIndex = 0;
            while (dungeonGroup.length > 0) {
              let currentFighter = dungeonGroup[randomIndex];
              let damageDone = 0;
              let death;
              let enemyDeath = false;
              let playerDamage = 0;
              let enemyDamage = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: []};
              let intent;
              let bodyShrinkChance = Math.random();
              intent = await abilityEmbed(message, currentFighter, dungeon);
              
              if (currentFighter.stats.dexterity > enemy.dexterity) {
                if (intent[1]) {
                  playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                  if (enemy.health <= 0) {
                    enemyDeath = true;
                  } else {
                    enemyDamage = skeletonAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    if (bodyShrinkChance < 0.1) {
                      enemy.health += playerDamage.playerDamage;
                      enemy.status.stun.state = false;
                      enemy.status.stun.duration = 0;
                      playerDamage.playerDamage = 0;
                    }
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  }
                  
                } else {
                  enemyDamage = skeletonAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                }
              } else {
                if (intent[1]) {
                  enemyDamage = skeletonAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  if (!death) playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                  if (bodyShrinkChance < 0.1) {
                    enemy.health += playerDamage.playerDamage;
                    enemy.status.stun.state = false;
                    enemy.status.stun.duration = 0;
                    playerDamage.playerDamage = 0;
                  }
                } else {
                  enemyDamage = skeletonAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                }
              }
              if (enemy.health <= 0) {
                enemyDeath = true;
              } 
              attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon);
              await delay();
              groupTurns[randomIndex] += 1;
              randomIndex += 1;
              if (randomIndex >= dungeonGroup.length) {
                randomIndex = 0;
              }
              if (enemyDeath) {
                break;
              }
            }
            let rewardString = '';
            if (dungeonGroup.length > 0) {
              message.channel.send(`The bones suddenly crumble before you...\n\n**You defeated the ${enemy.name}!**`);
              for (let i = 0; i < dungeonGroup.length; i++) {
                await rewards(enemy, dungeonGroup[i], message).then(val => rewardString += val);
              }
              rewardEmbed(rewardString, message);
            } else {
              return message.channel.send('**Unfortunately.... you failed.**');
            }
            message.channel.send('*You hear a voice... "You are making a grave mistake, adventurer..."*');
            for (let i = 0; i < groupCurrentHealth.length; i++) {
              groupCurrentHealth[i] = groupMaxHealth[i];
            }
            setTimeout(async () => {
              let enemy = boss;
              let randomIndex = 0;
              while (dungeonGroup.length > 0) {
                let currentFighter = dungeonGroup[randomIndex];
                let damageDone = 0;
                let death;
                let enemyDeath = false;
                let playerDamage = 0;
                let enemyDamage = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: []};
                let intent;
                
                intent = await abilityEmbed(message, currentFighter, dungeon);
                
                 
                if (currentFighter.stats.dexterity > enemy.dexterity) {
                  if (intent[1]) {
                    playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                    if (enemy.health <= 0) {
                      enemyDeath = true;
                    } else {
                      enemyDamage = revenantAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                      death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                    }
                    
                  } else {
                    enemyDamage = revenantAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  }
                } else {
                  if (intent[1]) {
                    enemyDamage = revenantAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                    if (!death) playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                  } else {
                    enemyDamage = revenantAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  }
                }
                if (enemy.health <= 0) {
                  enemyDeath = true;
                } 
                attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon);
                await delay();
                groupTurns[randomIndex] += 1;
                randomIndex += 1;
                if (randomIndex >= dungeonGroup.length) {
                  randomIndex = 0;
                }
                if (enemyDeath) {
                  break;
                }
              }
              let rewardString = '';
              if (dungeonGroup.length > 0) {
                message.channel.send(`The figure shrieks in pain and suddenly disappears...\n\n**You defeated the ${enemy.name}!**`);
                for (let i = 0; i < dungeonGroup.length; i++) {
                  await rewards(enemy, dungeonGroup[i], message).then(val => rewardString += val);
                }
                rewardEmbed(rewardString, message);
              } else {
                return message.channel.send('**Unfortunately.... you failed.**');
              }
              message.channel.send(`**Congratulations, you have completed ${dungeon}!**`)
            }, 5000);
          }, 5000);
        }, 5000);
      } else if (dungeon === dungeons[4]) {
        //return message.channel.send('Under Construction (sorry...)');
        starter.dungeonStartCD = Date.now();
        starter.dungeonCD = Date.now();
        stats.dungeons += 1;
        await stats.save();
        await starter.save();
        const mobKeys = ['Pulsating Vein', 'Phantom Blood']
        
        await message.channel.send(`<@!${starter.userID}> is calling for adventurers to join them in **${dungeon}**!\nType \`join dungeon\` to join them!`);
        const msgs = await message.channel.awaitMessages(joinFilter, { time: 30000 });
        let entryMessage = '';
        dungeonGroup.forEach( member => {
          entryMessage += `<@!${member.userID}> `;
          totalLevel += Math.floor(member.commands / 100);
          let memberHealth = member.health + Math.floor(0.5 * (member.commands / 100));
          let userInv = member.inventory;
          let breastPlate = userInv.find( ({itemID}) => itemID === 'kingsbreastplate')
          let rage = userInv.find( ({itemID}) => itemID === 'essenceofrage');
          let refinedEssence = userInv.find( ({itemID}) => itemID === 'refinedessence');
          let evasiveWings = userInv.find( ({itemID}) => itemID === 'evasivewings');
          let wizardsRobe = userInv.find( ({itemID}) => itemID === 'wizardsrobe');
          let roguesCloak = userInv.find( ({itemID}) => itemID === 'roguescloak');
          let ancientMechanism = userInv.find( ({itemID}) => itemID === 'ancientmechanism');
          let revenantsRobe = userInv.find( ({itemID}) => itemID === 'revenantsrobe');
          let etherealBand = userInv.find( ({itemID}) => itemID === 'etherealband');
          if (breastPlate) memberHealth += 75;
          if (rage) memberHealth -= 50;
          if (refinedEssence) memberHealth += 50;
          if (evasiveWings) memberHealth += 25;
          if (wizardsRobe) memberHealth += 25;
          if (roguesCloak) memberHealth += 25;
          if (ancientMechanism) memberHealth += 25;
          if (revenantsRobe) memberHealth += 25;
          if (etherealBand) memberHealth += 50;

          groupMaxHealth.push(memberHealth);
          groupCurrentHealth.push(memberHealth);
          groupTurns.push(0);
          groupTurnsReset.push(0);
        });
        const mobs = await emptyMobs(mobKeys, dungeonGroup, totalLevel);
        const boss = await emptyBoss(dungeonGroup, totalLevel);
        //const boss = await goblinFortressBoss(dungeonGroup, totalLevel);
        await message.channel.send(`${entryMessage}\nPrepare to enter **${dungeon}**!`);
        setTimeout(async () => {
          let enemy = mobs.get(mobKeys[0]);
          let randomIndex = 0;
          while (dungeonGroup.length > 0) {
            let currentFighter = dungeonGroup[randomIndex];
            let damageDone = 0;
            let death;
            let enemyDeath = false;
            let playerDamage = 0;
            let enemyDamage = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: [], attack: ''};
            let intent;
            let lifeLeechChance = Math.random();
            intent = await abilityEmbed(message, currentFighter, dungeon);
            
            if (currentFighter.stats.dexterity > enemy.dexterity) {
              if (intent[1]) {
                playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                
                
                if (enemy.health <= 0) {
                  enemyDeath = true;
                } else {
                  enemyDamage = await veinAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                }
                
              } else {
                enemyDamage = veinAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
              }
            } else {
              if (intent[1]) {
                enemyDamage = await veinAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                if (!death) playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
              } else {
                enemyDamage = await veinAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
              }
            }
            if (enemy.health <= 0) {
              enemyDeath = true;
            } 
            attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon);
            await delay();
            groupTurns[randomIndex] += 1;
            randomIndex += 1;
            if (randomIndex >= dungeonGroup.length) {
              randomIndex = 0;
            }
            if (enemyDeath) {
              break;
            }
          }
          let rewardString = '';
          if (dungeonGroup.length > 0) {
            message.channel.send(`The putrid wretch unravels on the floor...\n\n**You defeated the ${enemy.name}!**`);
            for (let i = 0; i < dungeonGroup.length; i++) {
              await rewards(enemy, dungeonGroup[i], message).then(val => rewardString += val);
            }
            rewardEmbed(rewardString, message);
          } else {
            return message.channel.send('**Unfortunately.... you failed.**');
          }
          message.channel.send('*Your heart is beating faster... Your breath is shortening...*');
          setTimeout(async () => {
            let enemy = mobs.get(mobKeys[1]);
            let randomIndex = 0;
            while (dungeonGroup.length > 0) {
              let currentFighter = dungeonGroup[randomIndex];
              let damageDone = 0;
              let death;
              let enemyDeath = false;
              let playerDamage = 0;
              let enemyDamage = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: []};
              let intent;
              let bodyShrinkChance = Math.random();
              intent = await abilityEmbed(message, currentFighter, dungeon);
              
              if (currentFighter.stats.dexterity > enemy.dexterity) {
                if (intent[1]) {
                  playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                  if (enemy.health <= 0) {
                    enemyDeath = true;
                  } else {
                    enemyDamage = await bloodAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  }
                  
                } else {
                  enemyDamage = await bloodAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                }
              } else {
                if (intent[1]) {
                  enemyDamage = await bloodAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  if (!death) playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
              
                } else {
                  enemyDamage = await bloodAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                  death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                }
              }
              if (enemy.health <= 0) {
                enemyDeath = true;
              } 
              attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon);
              await delay();
              groupTurns[randomIndex] += 1;
              randomIndex += 1;
              if (randomIndex >= dungeonGroup.length) {
                randomIndex = 0;
              }
              if (enemyDeath) {
                break;
              }
            }
            let rewardString = '';
            if (dungeonGroup.length > 0) {
              message.channel.send(`The bones suddenly crumble before you...\n\n**You defeated the ${enemy.name}!**`);
              for (let i = 0; i < dungeonGroup.length; i++) {
                await rewards(enemy, dungeonGroup[i], message).then(val => rewardString += val);
              }
              rewardEmbed(rewardString, message);
            } else {
              return message.channel.send('**Unfortunately.... you failed.**');
            }
            message.channel.send('*You hear the stomping and the withering of your flesh as something moves closer...*');
            for (let i = 0; i < groupCurrentHealth.length; i++) {
              groupCurrentHealth[i] = groupMaxHealth[i];
            }
            setTimeout(async () => {
              let enemy = boss;
              let randomIndex = 0;
              while (dungeonGroup.length > 0) {
                let currentFighter = dungeonGroup[randomIndex];
                let damageDone = 0;
                let death;
                let enemyDeath = false;
                let playerDamage = 0;
                let enemyDamage = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: []};
                let intent;
                let configurationChance = Math.random();
                intent = await abilityEmbed(message, currentFighter, dungeon);
                
                 
                if (currentFighter.stats.dexterity > enemy.dexterity) {
                  if (intent[1]) {
                    playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                    if (enemy.health <= 0) {
                      enemyDeath = true;
                    } else {
                      enemyDamage = await monarchAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                      if (configurationChance < ((0.01 * enemy.dexterity))) {
                        enemy.health += playerDamage.playerDamage;
                        enemy.status.stun.state = false;
                        enemy.status.stun.duration = 0;
                        playerDamage.playerDamage = 0;
                        enemy.dexterity += 1;
                      }
                      death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                    }
                    
                  } else {
                    enemyDamage = await monarchAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  }
                } else {
                  if (intent[1]) {
                    enemyDamage = await monarchAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                    if (!death) playerDamage = await intent[1].attack(intent[0], currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex);
                    if (configurationChance < ((0.01 * enemy.dexterity))) {
                      enemy.health += playerDamage.playerDamage;
                      enemy.status.stun.state = false;
                      enemy.status.stun.duration = 0;
                      playerDamage.playerDamage = 0;
                      enemy.dexterity += 1;
                    }
                  } else {
                    enemyDamage = await monarchAttack(message, currentFighter, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup);
                    death = checkForDeath(groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup);
                  }
                }
                if (enemy.health <= 0) {
                  enemyDeath = true;
                } 
                attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon);
                await delay();
                groupTurns[randomIndex] += 1;
                randomIndex += 1;
                if (randomIndex >= dungeonGroup.length) {
                  randomIndex = 0;
                }
                if (enemyDeath) {
                  break;
                }
              }
              let rewardString = '';
              if (dungeonGroup.length > 0) {
                message.channel.send(`The figure shrieks in pain and suddenly disappears...\n\n**You defeated the ${enemy.name}!**`);
                for (let i = 0; i < dungeonGroup.length; i++) {
                  await rewards(enemy, dungeonGroup[i], message).then(val => rewardString += val);
                }
                rewardEmbed(rewardString, message);
              } else {
                return message.channel.send('**Unfortunately.... you failed.**');
              }
              message.channel.send(`**Congratulations, you have completed ${dungeon}!**`)
            }, 5000);
          }, 5000);
        }, 5000); 
      }
    }
  }
}



function delay(ms) {
  ms = ms || 3000;
  return new Promise(done => {
    setTimeout(() => {
      done();
    }, ms);
  });
}

async function abilityEmbed(msg, target, dungeon) {
  let targetClass = target.class;
  let targetUser = msg.guild.members.cache.get(target.userID);
  if (targetUser) targetUser = targetUser.user;

  let abilities;
  if (targetClass === 'mage') abilities = mageAbilities;
  if (targetClass === 'warrior') abilities = warriorAbilities;
  if (targetClass === 'rogue') abilities = rogueAbilities;
  if (targetClass === 'warlock') abilities = warlockAbilities;
  if (targetClass === 'priest') abilities = priestAbilities;
  if (targetClass === 'paladin') abilities = paladinAbilities;
  
  let abilityNumber = 1;
  const dungeonEmbed = new Discord.MessageEmbed()
  .setAuthor(`${dungeon}`, targetUser.displayAvatarURL({dynamic: true}))
  .setTitle(`${targetUser.username}, it's your turn!`)
  .setDescription('Choose your ability by reacting below.')
  .setColor("RANDOM");
  abilities.forEach(ability => {
    dungeonEmbed.addField(`${abilityNumber}. ${ability.name}`, `${ability.desc}`);
    abilityNumber += 1;
  })
  let sendEmbed = await msg.channel.send(`<@!${targetUser.id}>`,dungeonEmbed).catch(err => console.log(err));
  await sendEmbed.react('1⃣');
  await sendEmbed.react('2⃣');
  await sendEmbed.react('3⃣');
  await sendEmbed.react('4⃣');
  const filter = (reaction, user) => {
    return (reaction.emoji.name === '1⃣' || reaction.emoji.name === '2⃣' || reaction.emoji.name === '3⃣' || reaction.emoji.name === '4⃣') && user.id === target.userID;
  }
  const reaction = await sendEmbed.awaitReactions(filter, { max: 1, time: 15000});
  if (reaction.size >= 1) {
    const choice = reaction.first();
    if (choice.emoji.name === '1⃣') return [sendEmbed, abilities[0]];
    if (choice.emoji.name === '2⃣') return [sendEmbed, abilities[1]];
    if (choice.emoji.name === '3⃣') return [sendEmbed, abilities[2]];
    if (choice.emoji.name === '4⃣') return [sendEmbed, abilities[3]];
  } else {
    return [sendEmbed];
  }
}

async function attackEmbed(message, intent, currentFighter, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex, death, enemyDeath, playerDamage, enemyDamage, dungeon) {
  let targetUser = message.guild.members.cache.get(currentFighter.userID);
  if (targetUser) targetUser = targetUser.user;
  let userTarget;
  currentFighter = await userDB.findOne({ userID: currentFighter.userID });
  if (playerDamage.targetedHeal) {
    if (playerDamage.targetedHeal.target) {
      userTarget = message.guild.members.cache.get(playerDamage.targetedHeal.target);
      if (userTarget) userTarget = userTarget.user;
    }
  }
  let rotDamage = 0;
  let bleedDamage = 0;
  if (enemy.status.rot.state) {
    let applicator = enemy.status.rot.applicator;
    let damageDone = Math.floor(Math.random() * (applicator.stats.wisdom * 6 * 0.5 * (applicator.commands/600) - applicator.stats.wisdom * 6 * 0.5 * (applicator.commands/800) + 1) + applicator.stats.wisdom * 6 * 0.5 * (applicator.commands/800));
    rotDamage = damageDone;
    enemy.status.rot.duration -= 1;
    if (enemy.status.rot.duration <= 0) {
      enemy.status.rot.state = false;
    }
  }
  if (enemy.status.bleed.state) {
    let applicator = enemy.status.bleed.applicator;
    let damageDone = Math.floor(Math.random() * (applicator.stats.dexterity * 6 * 0.5 * (applicator.commands/600) - applicator.stats.dexterity * 6 * 0.5 * (applicator.commands/800) + 1) + applicator.stats.dexterity * 6 * 0.5 * (applicator.commands/800));
    bleedDamage = damageDone;
    enemy.status.bleed.duration -= 1;
    if (enemy.status.bleed.duration <= 0) {
      enemy.status.bleed.state = false;
    }
  }
  let description = '';
  const dungeonEmbed = new Discord.MessageEmbed()
  .setAuthor(`${dungeon}`, targetUser.displayAvatarURL({dynamic: true}))
  .setTitle(`${targetUser.username} vs. ${enemy.name}`);
  if (currentFighter.stats.dexterity > enemy.dexterity) {
    if (!intent[1]) description += `${targetUser.username} took too long to decide!\n`;
    if (!death && playerDamage.playerDamage === 0 && intent[1] && playerDamage.groupHeal === 0 && playerDamage.selfHeal === 0 && !currentFighter.status.stun.state) description += `${targetUser.username} used **${intent[1].name}**, but **missed**!\n`;
    if (!death && playerDamage.playerDamage === 0 && intent[1] && playerDamage.groupHeal === 0 && playerDamage.selfHeal === 0 && currentFighter.status.stun.state) description += `${targetUser.username} is **stunned**!\n`;
    if (playerDamage.selfHeal > 0 && intent[1]) description += `${targetUser.username} used **${intent[1].name}**, healing themselves for ${playerDamage.selfHeal.toLocaleString()} health!\n`;
    if (userTarget && intent[1] && playerDamage.targetedHeal.heal > 0) description += `${targetUser.username} used **${intent[1].name}**, healing ${userTarget.username} for ${playerDamage.targetedHeal.heal.toLocaleString()} health!\n`;
    if (playerDamage.groupHeal >  0 && intent[1]) description += `${targetUser.username} used **${intent[1].name}**, healing the group for ${playerDamage.groupHeal.toLocaleString()} health!\n`;
    if (playerDamage.playerDamage > 0 && intent[1]) description += `${targetUser.username} used **${intent[1].name}**, dealing **${playerDamage.playerDamage.toLocaleString()}** damage!\n`;
    if (playerDamage.selfDamage > 0 && intent[1]) description += `${targetUser.username} also did **${playerDamage.selfDamage.toLocaleString()}** damage to themselves!\n`;
    description += '\n';
    if (enemyDamage.playerDamage > 0) description += `${enemy.name} used **${enemyDamage.attack}**, dealing **${enemyDamage.playerDamage.toLocaleString()}** damage!\n`;
    if (enemyDamage.groupDamage > 0) description += `${enemy.name}'s **${enemyDamage.attack}** also dealt **${enemyDamage.groupDamage.toLocaleString()}** damage to the group!\n`;
    if (enemyDamage.selfHeal > 0) description += `${enemy.name} used **${enemyDamage.attack}**, healing themselves for ${enemyDamage.selfHeal.toLocaleString()} health!\n`;
    if (enemyDamage.selfDamage > 0) description += `${enemy.name} used **${enemyDamage.attack}**, damaging themselves for ${enemyDamage.selfDamage.toLocaleString()} damage!\n`;
    if (rotDamage > 0) description += `${enemy.name} took ${rotDamage.toLocaleString()} damage from **Rot**!\n`;
    if (bleedDamage > 0) description += `${enemy.name} took ${bleedDamage.toLocaleString()} damage from **Bleed**!\n`;
    if (enemyDamage.playerDamage === 0 && enemyDamage.groupDamage === 0 && enemyDamage.selfHeal === 0 && !enemy.status.stun.state && !enemyDeath) description += `${enemy.name} **missed**!\n`;
    if (enemyDamage.playerDamage === 0 && enemyDamage.groupDamage === 0 && enemy.status.stun.state) description += `${enemy.name} is **stunned**!\n`;
    if (currentFighter.status.stun.duration === 0) {
      currentFighter.status.stun.state = false;
    }
    if (currentFighter.status.stun.state) {
      currentFighter.status.stun.duration -= 1;
    }
    await currentFighter.save();
  } else {
    if (!intent[1]) description += `${targetUser.username} took too long to decide!\n`;
    if (enemyDamage.playerDamage > 0) description += `${enemy.name} used **${enemyDamage.attack}**, dealing **${enemyDamage.playerDamage.toLocaleString()}** damage!\n`;
    if (enemyDamage.groupDamage > 0) description += `${enemy.name}'s **${enemyDamage.attack}** also dealt **${enemyDamage.groupDamage.toLocaleString()}** damage to the group!\n`;
    if (enemyDamage.selfHeal > 0) description += `${enemy.name} used **${enemyDamage.attack}**, healing themselves for ${enemyDamage.selfHeal.toLocaleString()} health!\n`;
    if (enemyDamage.selfDamage > 0) description += `${enemy.name} used **${enemyDamage.attack}**, damaging themselves for ${enemyDamage.selfDamage.toLocaleString()} damage!\n`;
    if (rotDamage > 0) description += `${enemy.name} took ${rotDamage.toLocaleString()} damage from **Rot**!\n`;
    if (bleedDamage > 0) description += `${enemy.name} took ${bleedDamage.toLocaleString()} damage from **Bleed**!\n`;
    if (enemyDamage.playerDamage === 0 && enemyDamage.groupDamage === 0 && enemyDamage.selfHeal === 0 && !enemy.status.stun.state) description += `${enemy.name} **missed**!\n`;
    if (enemyDamage.playerDamage === 0 && enemyDamage.groupDamage === 0 && enemy.status.stun.state) description += `${enemy.name} is **stunned**!\n`;
    description += '\n';
    if (!death && playerDamage.playerDamage === 0 && intent[1] && playerDamage.groupHeal === 0 && playerDamage.selfHeal === 0 && !currentFighter.status.stun.state) description += `${targetUser.username} used **${intent[1].name}**, but **missed**!\n`;
    if (!death && playerDamage.playerDamage === 0 && intent[1] && playerDamage.groupHeal === 0 && playerDamage.selfHeal === 0 && currentFighter.status.stun.state) description += `${targetUser.username} is **stunned**!\n`;
    if (playerDamage.playerDamage > 0 && intent[1]) description += `${targetUser.username} used **${intent[1].name}**, dealing **${playerDamage.playerDamage.toLocaleString()}** damage!\n`;
    if (playerDamage.selfDamage > 0 && intent[1]) description += `${targetUser.username} also did **${playerDamage.selfDamage.toLocaleString()}** damage to themselves!\n`;
    if (playerDamage.selfHeal > 0 && intent[1]) description += `${targetUser.username} used **${intent[1].name}**, healing themselves for **${playerDamage.selfHeal.toLocaleString()}** health!\n`;
    if (userTarget && intent[1] && playerDamage.targetedHeal.heal > 0) description += `${targetUser.username} used **${intent[1].name}**, healing ${userTarget.username} for ${playerDamage.targetedHeal.heal.toLocaleString()} health!\n`;
    if (playerDamage.groupHeal >  0 && intent[1]) description += `${targetUser.username} used **${intent[1].name}**, healing the group for **${playerDamage.groupHeal.toLocaleString()}** health!\n`;
    if (currentFighter.status.stun.state) {
      currentFighter.status.stun.duration -= 1;
      if (currentFighter.status.stun.duration === 0) {
        currentFighter.status.stun.state = false;
      }
    }
    await currentFighter.save();
  }
  
  if (death) description += `**${targetUser.username} has died!**\n`;
  if (enemyDamage.dead) {
    if (enemyDamage.dead.length > 0 && enemyDamage.dead[0] !== undefined) {
      console.log(enemyDamage.dead);
      enemyDamage.dead.forEach( player => {
        let groupMember = message.guild.members.cache.get(player.userID);
        if (groupMember) groupMember = groupMember.user;
        description += `**${groupMember.username} has died!**\n`;
      });
    }
  }
  
  if (enemyDeath) description += `${enemy.name} has died!\n`;
  let currentHealth = groupCurrentHealth[randomIndex];
  let maxHealth = groupMaxHealth[randomIndex];
  if (currentHealth === undefined || maxHealth === undefined || death) {
    currentHealth = 0;
    maxHealth = 0;
  }
  if (enemy.status.stun.state === true) {
    enemy.status.stun.duration -= 1;
    if (enemy.status.stun.duration === 0) {
      enemy.status.stun.state = false;
    }
  }
  
  dungeonEmbed.setDescription(description)
  .addField(`__${targetUser.username}__`, `${currentHealth.toLocaleString()}/${maxHealth.toLocaleString()} Health`, true)
  .addField(`__${enemy.name}__`, `${enemy.health.toLocaleString()}/${enemy.originalHealth.toLocaleString()} Health`, true)
  .setColor("RANDOM");
  intent[0].reactions.removeAll().catch(err => console.error('Failed to clear reactions: ', err));
  intent[0].edit(`<@!${targetUser.id}>`,dungeonEmbed);
}

const checkForDeath = (groupCurrentHealth, randomIndex, groupMaxHealth, dungeonGroup) => {
  let dead;
  if (groupCurrentHealth[randomIndex] <= 0) {
    dead = dungeonGroup[randomIndex];
    dungeonGroup.splice(randomIndex,1);
    groupCurrentHealth.splice(randomIndex,1);
    groupMaxHealth.splice(randomIndex,1);
  }
  return dead;
}

const mageParalysisBlast = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let hitChance = Math.random();
  if (hitChance > 0.5) {
    enemy.status.stun.state = true;
    enemy.status.stun.duration = 1;
  }
  let damageDone = Math.floor(Math.random() * ((target.stats.wisdom * 6 * 1.1 * ((target.commands/600))) - (target.stats.wisdom * 6 * 1.1 * ((target.commands/800))) + 1 ) + (target.stats.wisdom * 6 * 1.1 * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;

}

const mageSoulFlame = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageDone = Math.floor(Math.random() * ((target.stats.wisdom * 6 * 1.65 * ((target.commands/600))) - (target.stats.wisdom * 6 * 1.65 * ((target.commands/800))) + 1 ) + (target.stats.wisdom * 6 * 1.65 * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const mageEarthquake = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageDone = Math.floor(Math.random() * ((target.stats.wisdom * 6 * 1.8 * ((target.commands/600))) - (target.stats.wisdom * 6 * 1.8 * ((target.commands/800))) + 1 ) + (target.stats.wisdom * 6 * 1.8 * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  damageDone = Math.floor(damageDone * 0.005);
  groupCurrentHealth[randomIndex] -= damageDone;
  result.selfDamage = damageDone;
  
  return result;
}

const mageDrainingTouch = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let amountToHeal = Math.floor(enemy.health * 0.005);
  enemy.health -= amountToHeal;
  result.playerDamage += amountToHeal;
  if (groupCurrentHealth[randomIndex] + amountToHeal > groupMaxHealth[randomIndex]) {
    result.selfHeal = groupMaxHealth[randomIndex] - groupCurrentHealth[randomIndex];
    groupCurrentHealth[randomIndex] = groupMaxHealth[randomIndex];
  } else {
    result.selfHeal += amountToHeal;
    groupCurrentHealth[randomIndex] += amountToHeal;
  }
  return result;
}

const mageAbilities = [
  { attack: mageSoulFlame, name: 'Soul Flame', desc: 'Harness flames that do 1.65x Damage.'}, 
  { attack: mageParalysisBlast, name: 'Paralysis Blast', desc: 'Have a chance to stun a foe while dealing 1.1x Damage'}, 
  { attack: mageEarthquake, name: 'Earthquake', desc: 'Send a shockwave through the ground, dealing 1.8x Damage to a foe and 0.05% back to you.'}, 
  { attack: mageDrainingTouch, name: 'Draining Touch', desc: 'Sap 5% of the foe\'s remaining health.'}
];

const warriorCrushingBlow = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageDone = Math.floor(Math.random() * ((target.stats.attack * 6 * 1.8 * ((target.commands/600))) - (target.stats.attack * 6 * 1.8 * ((target.commands/800))) + 1 ) + (target.stats.attack * 6 * 1.8 * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const warriorVengeance = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageDone = Math.floor(Math.random() * ((target.stats.attack * 6 * 1.55 * ((target.commands/600))) - (target.stats.attack * 6 * 1.55 * ((target.commands/800))) + 1 ) + (target.stats.attack * 6 * 1.55 * ((target.commands/800))));
  enemy.status.bleed.state = true;
  enemy.status.bleed.duration = 3;
  enemy.status.bleed.applicator = target;
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const warriorChargeShock = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let hitChance = Math.random();
  if (hitChance > 0.45) {
    enemy.status.stun.state = true;
    enemy.status.stun.duration = 1;
  }
  let damageDone = Math.floor(Math.random() * ((target.stats.attack * 6 * 1 * ((target.commands/600))) - (target.stats.attack * 6 * 1 * ((target.commands/800))) + 1 ) + (target.stats.attack * 6 * 1 * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const warriorBerserker = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageMulti = 1 + (0.015 * target.stats.attack);
  let damageDone = Math.floor(Math.random() * ((target.stats.attack * 6 * damageMulti * ((target.commands/600))) - (target.stats.attack * 6 * damageMulti * ((target.commands/800))) + 1 ) + (target.stats.attack * 6 * damageMulti * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  damageDone = Math.floor(groupCurrentHealth[randomIndex] * 0.05);
  result.selfDamage = damageDone;
  groupCurrentHealth[randomIndex] -= damageDone;
  return result;
}

const warriorAbilities = [
  { attack: warriorCrushingBlow, name: 'Crushing Blow', desc: 'A devastating blow to the head dealing 1.8x damage.'},
  { attack: warriorVengeance, name: 'Vengeance', desc: '1.65x damage and applying bleed to your enemy, causing them to take damage over the next 3 turns.'},
  { attack: warriorChargeShock, name: 'Charge Shock', desc: 'Charge into the enemy dealing 1x damage, with a 55% chance to stun them.'},
  { attack: warriorBerserker, name: 'Berserker', desc: 'Wildly rush the foe to deal 1x damage plus 0.015 per attack point.'}
];

const rogueLungPiercer = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let critChance = Math.random();
  let damageDone = Math.floor(Math.random() * ((target.stats.dexterity * 6 * 1.45 * ((target.commands/600))) - (target.stats.dexterity * 6 * 1.45 * ((target.commands/800))) + 1 ) + (target.stats.dexterity * 6 * 1.45 * ((target.commands/800))));
  if (critChance > 0.5) damageDone = Math.floor(damageDone * 2);
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const rogueToxicFumes = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let hitChance = Math.random();
  if (hitChance > 0.55) {
    enemy.status.stun.state = true;
    enemy.status.stun.duration = 1;
  }
  let damageDone = Math.floor(Math.random() * ((target.stats.dexterity * 6 * 1.1 * ((target.commands/600))) - (target.stats.dexterity * 6 * 1.1 * ((target.commands/800))) + 1 ) + (target.stats.dexterity * 6 * 1.1 * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const rogueEviscerate = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageMulti = 1 + (0.02 * target.stats.dexterity);
  let damageDone = Math.floor(Math.random() * ((target.stats.dexterity * 6 * damageMulti * ((target.commands/600))) - (target.stats.dexterity * 6 * damageMulti * ((target.commands/800))) + 1 ) + (target.stats.dexterity * 6 * damageMulti * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const rogueAssassination = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageMulti = 1.25;
  let damageDone = Math.floor(Math.random() * ((target.stats.dexterity * 6 * damageMulti * ((target.commands/600))) - (target.stats.dexterity * 6 * damageMulti * ((target.commands/800))) + 1 ) + (target.stats.dexterity * 6 * damageMulti * ((target.commands/800))));
  if (enemy.health <= enemy.originalHealth * 0.15) {
    result.playerDamage = enemy.health;
    enemy.health = 0;
    let amountToHeal = Math.floor(groupMaxHealth[randomIndex] * 0.1)
    groupCurrentHealth[randomIndex] += amountToHeal;
    result.selfHeal = amountToHeal;
  } else {
    enemy.health -= damageDone;
    result.playerDamage = damageDone;
  }
  
  return result;
}


const rogueAbilities = [
  //{ attack: rogueClearMind, name: 'Clear Mind', desc: '+5 dexterity to boost damage on your next attack.'},
  { attack: rogueLungPiercer, name: 'Lung Piercer', desc: 'shoot a crossbow bolt into the opponent for 1.45x damage. 50% chance to do an additional 2x damage.'},
  { attack: rogueToxicFumes, name: 'Toxic Fumes', desc: 'Fill the area with toxic fumes that have a 45% chance to stuns the enemy, while also dealing 1.10x damage.'},
  { attack: rogueEviscerate, name: 'Eviscerate', desc: 'Swing your blades twice, causing 1x damage plus 0.02 x your Dexterity.'},
  { attack: rogueAssassination, name: 'Assassination', desc: 'If enemy is below 15% health, kill it instantly and gain 10% of your health. Otherwise, 1.25x damage.'}
];

const warlockDeathsKnock = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageDone = Math.floor(Math.random() * ((target.stats.wisdom * 6 * 1.45 * ((target.commands/600))) - (target.stats.wisdom * 6 * 1.45 * ((target.commands/800))) + 1 ) + (target.stats.wisdom * 6 * 1.45 * ((target.commands/800))));
  enemy.status.rot.state = true;
  enemy.status.rot.duration = 6;
  enemy.status.rot.applicator = target;
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const warlockMindTap = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let hitChance = Math.random();
  if (hitChance > 0.55) {
    enemy.status.stun.state = true;
    enemy.status.stun.duration = 1;
  }
  let damageDone = Math.floor(Math.random() * ((target.stats.wisdom * 6 * 1.1 * ((target.commands/600))) - (target.stats.wisdom * 6 * 1.1 * ((target.commands/800))) + 1 ) + (target.stats.wisdom * 6 * 1.1 * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const warlockObliterate = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageMulti = 2;
  let hitChance = Math.random();
  let damageDone = Math.floor(Math.random() * ((target.stats.wisdom * 6 * damageMulti * ((target.commands/600))) - (target.stats.wisdom * 6 * damageMulti * ((target.commands/800))) + 1 ) + (target.stats.wisdom * 6 * damageMulti * ((target.commands/800))));
  if (enemy.health <= enemy.originalHealth * 0.25) {
    enemy.health -= damageDone;
    result.playerDamage = damageDone;
  } else if (hitChance >= 0.55) {
    enemy.health -= damageDone;
    result.playerDamage = damageDone;
  }
  
  return result;
}

const warlockDemonicTouch = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageMulti = 1 + (0.01 * target.stats.wisdom);
  let damageDone = Math.floor(Math.random() * ((target.stats.wisdom * 6 * damageMulti * ((target.commands/600))) - (target.stats.wisdom * 6 * damageMulti * ((target.commands/800))) + 1 ) + (target.stats.wisdom * 6 * damageMulti * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const warlockAbilities = [
  { attack: warlockDeathsKnock, name: 'Death\'s Knock', desc: 'Call upon the powers of death to deal 1.65x Damage and apply rot for 6 turns'},
  { attack: warlockDemonicTouch, name: 'Demonic Touch', desc: 'Use your demonic abilities to strike the foe for 1x damage plus 0.01 x your wisdom.'},
  { attack: warlockObliterate, name: 'Obliterate', desc: 'Deal a deadly blow, causing 2x damage with a 55% chance to miss. 0% Chance to miss when enemy is below 25% health.'},
  { attack: warlockMindTap, name: 'Mind Tap', desc: 'Invade your foes mind, 45% chance of stunning them for one turn and dealing 1.10x damage'}
];

const priestHolyBeam = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let targetUser = globalMessage.guild.members.cache.get(target.userID);
  if (targetUser) targetUser = targetUser.user;
  let damageDone = Math.floor(Math.random() * ((target.stats.wisdom * 6 * 1.15 * ((target.commands/600))) - (target.stats.wisdom * 6 * 1.15 * ((target.commands/800))) + 1 ) + (target.stats.wisdom * 6 * 1.15 * ((target.commands/800))));
  let amountToHeal = Math.floor(damageDone * 0.005);
  let abilityNumber = 1;
  let personToHeal;
  if (dungeonGroup.length === 1) {
    personToHeal = 0;
    if (groupCurrentHealth[personToHeal] + amountToHeal > groupMaxHealth[personToHeal]) {
      
      result.selfHeal = groupMaxHealth[personToHeal] - groupCurrentHealth[personToHeal];
      groupCurrentHealth[personToHeal] = groupMaxHealth[personToHeal];
    } else {
      result.selfHeal = amountToHeal
      groupCurrentHealth[personToHeal] += amountToHeal;
    }
  } else {
    const healingEmbed = new Discord.MessageEmbed()
    .setAuthor(`${targetUser.username}`, targetUser.displayAvatarURL({dynamic: true}))
    .setTitle(`Choose who to heal!`)
    .setDescription('Pick your target by reacting below.')
    .setColor("RANDOM");
    for (let i = 0; i < dungeonGroup.length; i++) {
      let player = globalMessage.guild.members.cache.get(dungeonGroup[i].userID);
      healingEmbed.addField(`${abilityNumber}. ${player.user.username}`, `${groupCurrentHealth[i].toLocaleString()}/${groupMaxHealth[i].toLocaleString()}`, true);
      abilityNumber += 1;
    }
    let editEmbed = await message.edit(`<@!${target.userID}>`, healingEmbed);
    await message.reactions.removeAll().catch(err => console.log(err));
    await editEmbed.react('1⃣');
    if (abilityNumber > 2) await editEmbed.react('2⃣');
    if (abilityNumber > 3) await editEmbed.react('3⃣');
    if (abilityNumber > 4) await editEmbed.react('4⃣');
    if (abilityNumber > 5) await editEmbed.react('5⃣');
    if (abilityNumber > 6) await editEmbed.react('6⃣');
    if (abilityNumber > 7) await editEmbed.react('7⃣');
    if (abilityNumber > 8) await editEmbed.react('8⃣');
    const filter = (reaction, user) => {
      return (reaction.emoji.name === '1⃣' || reaction.emoji.name === '2⃣' || reaction.emoji.name === '3⃣' || reaction.emoji.name === '4⃣' || reaction.emoji.name === '5⃣' || reaction.emoji.name === '6⃣' || reaction.emoji.name === '7⃣' || reaction.emoji.name === '8⃣') && user.id === target.userID;
    }
    const reaction = await editEmbed.awaitReactions(filter, { max: 1, time: 15000});
    if (reaction.size >= 1) {
      const choice = reaction.first();
      if (choice.emoji.name === '1⃣') personToHeal = 0;
      if (choice.emoji.name === '2⃣') personToHeal = 1;
      if (choice.emoji.name === '3⃣') personToHeal = 2;
      if (choice.emoji.name === '4⃣') personToHeal = 3;
      if (choice.emoji.name === '5⃣') personToHeal = 4;
      if (choice.emoji.name === '6⃣') personToHeal = 5;
      if (choice.emoji.name === '7⃣') personToHeal = 6;
      if (choice.emoji.name === '8⃣') personToHeal = 7;
    } else {
      enemy.health -= damageDone;
      result.playerDamage = damageDone;
      return result;
    }
    if (groupCurrentHealth[personToHeal] + amountToHeal > groupMaxHealth[personToHeal]) {
      result.targetedHeal.target = dungeonGroup[personToHeal].userID;
      result.targetedHeal.heal = groupMaxHealth[personToHeal] - groupCurrentHealth[personToHeal];
      groupCurrentHealth[personToHeal] = groupMaxHealth[personToHeal];
    } else {
      result.targetedHeal.target = dungeonGroup[personToHeal].userID;
      result.targetedHeal.heal = amountToHeal
      groupCurrentHealth[personToHeal] += amountToHeal;
    }
  }
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const priestHeavenlySmite = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let hitChance = Math.random();
  if (hitChance > 0.75) {
    enemy.status.stun.state = true;
    enemy.status.stun.duration = 1;
  }
  let damageDone = Math.floor(Math.random() * ((target.stats.wisdom * 6 * 1.35 * ((target.commands/600))) - (target.stats.wisdom * 6 * 1.35 * ((target.commands/800))) + 1 ) + (target.stats.wisdom * 6 * 1.35 * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const priestHealingAura = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let amountToHeal = Math.floor(groupMaxHealth[randomIndex] * 0.15);
  groupCurrentHealth[randomIndex] += amountToHeal;
  result.selfHeal = amountToHeal;
  let totalHealing = 0;
  for (let i = 0; i < groupCurrentHealth.length; i++) {
    if (dungeonGroup[i].userID !== target.userID) {
      groupCurrentHealth[i] += Math.floor(groupMaxHealth[i] * 0.15);
      totalHealing += Math.floor(groupMaxHealth[i] * 0.15);
    }
  }
  result.groupHeal = totalHealing;
  return result;
}

const priestHealthSap = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0, targetedHeal: { target: undefined, heal: 0 } };
  //let personToHeal = Math.floor(Math.random() * dungeonGroup.length);
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageMulti = 1 + (0.01 * target.stats.wisdom);
  let damageDone = Math.floor(Math.random() * ((target.stats.wisdom * 6 * damageMulti * ((target.commands/600))) - (target.stats.wisdom * 6 * damageMulti * ((target.commands/800))) + 1 ) + (target.stats.wisdom * 6 * damageMulti * ((target.commands/800))));
  let healChance = Math.random();
  if (healChance <= 0.3) {
    let amountToHeal = Math.floor((damageDone * 0.0125));
    if (groupCurrentHealth[randomIndex] + amountToHeal > groupMaxHealth[randomIndex]) {
      result.selfHeal = groupMaxHealth[randomIndex] - groupCurrentHealth[randomIndex];
      groupCurrentHealth[randomIndex] = groupMaxHealth[randomIndex];
    } else {
      groupCurrentHealth[randomIndex] += amountToHeal;
      result.selfHeal = amountToHeal;
    }
    let totalHealing = 0;
    for (let i = 0; i < groupCurrentHealth.length; i++) {
      if (dungeonGroup[i].userID !== target.userID) {
        if (groupCurrentHealth[i] + amountToHeal > groupMaxHealth[i]) {
          result.groupHeal += groupMaxHealth[i] - groupCurrentHealth[i];
          groupCurrentHealth[i] = groupMaxHealth[i];
          
        } else {
          groupCurrentHealth[i] += amountToHeal;
          result.groupHeal += amountToHeal;
        }
      }
    }
  }
  
  //if (dungeonGroup[personToHeal].userID === target.userID) {
  //   if (groupCurrentHealth[personToHeal] + amountToHeal > groupMaxHealth[personToHeal]) {
  //     result.selfHeal = groupMaxHealth[personToHeal] - groupCurrentHealth[personToHeal];
  //     groupCurrentHealth[personToHeal] = groupMaxHealth[personToHeal];
  //   } else {
  //     groupCurrentHealth[personToHeal] += amountToHeal;
  //     result.selfHeal = amountToHeal;
  //   }
  //} else {
  //   if (groupCurrentHealth[personToHeal] + amountToHeal > groupMaxHealth[personToHeal]) {
  //     result.targetedHeal.heal = groupMaxHealth[personToHeal] - groupCurrentHealth[personToHeal];
  //     result.targetedHeal.target = dungeonGroup[personToHeal].userID;
  //     groupCurrentHealth[personToHeal] = groupMaxHealth[personToHeal];
  //   } else {
  //     groupCurrentHealth[personToHeal] += amountToHeal;
  //     result.targetedHeal.heal = amountToHeal;
  //     result.targetedHeal.target = dungeonGroup[personToHeal].userID;
  //   }
   //}
  
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const priestAbilities = [
  { attack: priestHolyBeam, name: 'Holy Beam', desc: 'Deal 1.15x damage. A portion of the damage heals a person of your choosing.'},
  { attack: priestHeavenlySmite, name: 'Heavenly Smite', desc: 'Call down a piercing beam of light to harm your foes for 1.35x damage with a 25% chance to stun.'},
  { attack: priestHealingAura, name: 'Healing Aura', desc: 'You heal the whole party, including yourself, for 15% of each members max health.'},
  { attack: priestHealthSap, name: 'Health Sap', desc: 'Deal 1x damage plus 0.01 damage per wisdom point, with a 30% chance to convert a portion of the damage into healing for the party.'}
];

const paladinJudgement = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0 };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageMulti = 1 + (0.01 * target.stats.wisdom);
  let damageDone = Math.floor(Math.random() * ((target.stats.wisdom * 6 * damageMulti * ((target.commands/600))) - (target.stats.wisdom * 6 * damageMulti * ((target.commands/800))) + 1 ) + (target.stats.wisdom * 6 * damageMulti * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const paladinReckoning = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0 };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageMulti = 1 + (0.01 * target.stats.attack);
  let damageDone = Math.floor(Math.random() * ((target.stats.attack * 6 * damageMulti * ((target.commands/600))) - (target.stats.attack * 6 * damageMulti * ((target.commands/800))) + 1 ) + (target.stats.attack * 6 * damageMulti * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const paladinRepent = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0 };
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  let damageMulti = (target.stats.wisdom * 0.75 * 6) + (target.stats.attack * 0.75 * 6);
  let damageDone = Math.floor(Math.random() * ((damageMulti * ((target.commands/600))) - (damageMulti * ((target.commands/800))) + 1 ) + (damageMulti * ((target.commands/800))));
  let amountToHeal = Math.floor(damageDone * 0.005);
  let healChance = Math.random();
  if (healChance > 0.5) {
    if (groupCurrentHealth[randomIndex] + amountToHeal > groupMaxHealth[randomIndex]) {
      result.selfHeal = groupMaxHealth[randomIndex] - groupCurrentHealth[randomIndex];
      groupCurrentHealth[randomIndex] = groupMaxHealth[randomIndex];
    } else {
      groupCurrentHealth[randomIndex] += amountToHeal;
      result.selfHeal = amountToHeal;
    }
  }
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const paladinDivineIntervention = async (message, target, enemy, groupCurrentHealth, groupMaxHealth, dungeonGroup, randomIndex) => {
  let result = { playerDamage: 0, selfDamage: 0, selfHeal: 0, groupHeal: 0 };
  let hitChance = Math.random();
  let currentTarget = await userDB.findOne({ userID: target.userID });
  if (currentTarget.status.stun.state) return result;
  if (hitChance > 0.55) {
    enemy.status.stun.state = true;
    enemy.status.stun.duration = 1;
  }
  let damageDone = Math.floor(Math.random() * ((target.stats.attack * 6 * 1.1 * ((target.commands/600))) - (target.stats.attack * 6 * 1.1 * ((target.commands/800))) + 1 ) + (target.stats.attack * 6 * 1.1 * ((target.commands/800))));
  enemy.health -= damageDone;
  result.playerDamage = damageDone;
  return result;
}

const paladinAbilities = [
  { attack: paladinJudgement, name: 'Judgement', desc: 'Cast judgement upon your foe, dealing 1x damage plus 0.01 damage per wisdom point.'},
  { attack: paladinReckoning, name: 'Reckoning', desc: 'Cast a reckoning upon your foe, dealing 1x damage plus 0.01 damage per attack point.'},
  { attack: paladinRepent, name: 'Repent', desc: 'Deal 0.75x wisdom damage plus 0.75x attack damage, with a 50% chance to convert a portion of the damage into healing for yourself.'},
  { attack: paladinDivineIntervention, name: 'Divine Intervention', desc: 'Call for divine intervention that has a 45% chance to stun the enemy, while also dealing 1.10x attack damage.'}
];

const hobAttack = (message, target, enemy, randomIndex, battlescars, groupCurrentHealth, groupMaxHealth, dungeonGroup) => {
  let result = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: [], attack: ''}
  let hitChance = 1;
  if (enemy.status.stun.state) return result;
  if (enemy.status.taunt.state) hitChance = Math.random();
  if (enemy.health <= enemy.originalHealth / 2 && hitChance > enemy.status.taunt.chance) {
    result.attack = 'Wild Whirlwind';
    let damageDone = Math.random() * ((battlescars * 20) - ((battlescars - 1) * 20) + 1) + ((battlescars - 1) * 20);
    damageDone = Math.floor(damageDone * 1.5);
    groupCurrentHealth[randomIndex] -= damageDone;
    result.playerDamage = damageDone
    if (dungeonGroup.length > 1) {
      damageDone = Math.floor(damageDone / groupCurrentHealth.length / 2);
      result.groupDamage = damageDone;
      for (let i = 0; i < groupCurrentHealth.length; i++) {
        groupCurrentHealth[i] -= damageDone;
        let dead = checkForDeath(groupCurrentHealth, i, groupMaxHealth, dungeonGroup);
        if (dead) {
          result.dead.push(dead);
        }
        
      }
    }
    
  } else if (hitChance > enemy.status.taunt.chance) {
    result.attack = 'Jab';
    let damageDone = Math.random() * ((battlescars * 20) - ((battlescars - 1) * 20) + 1) + ((battlescars - 1) * 20);
    groupCurrentHealth[randomIndex] -= Math.floor(damageDone);
    result.playerDamage = Math.floor(damageDone);
  }
  return result;
}

const shamanAttack = (message, target, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup) => {
  let result = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: [], attack: ''}
  let hitChance = Math.random();

  if (enemy.status.stun.state) return result;
  
  if (hitChance > 0.66) {
    result.attack = 'Fire Wave';
    let damageDone = Math.random() * ((enemy.wisdom * 10) - (enemy.wisdom * 5) + 1) + (enemy.wisdom * 5);
    groupCurrentHealth[randomIndex] -= Math.floor(damageDone / groupCurrentHealth.length / 2);
    result.playerDamage = Math.floor(damageDone);
    if (dungeonGroup.length > 1) {
      damageDone = Math.floor(damageDone / groupCurrentHealth.length / 2);
      result.groupDamage = damageDone;
      for (let i = 0; i < groupCurrentHealth.length; i++) {
        groupCurrentHealth[i] -= damageDone;
        let dead = checkForDeath(groupCurrentHealth, i, groupMaxHealth, dungeonGroup);
        if (dead) {
          result.dead.push(dead);
        }
        
      }
    }
    
  } else if (hitChance > 0.33) {
    result.attack = 'Fireball';
    let damageDone = Math.random() * ((enemy.wisdom * 10) - (enemy.wisdom * 5) + 1) + (enemy.wisdom * 5);
    groupCurrentHealth[randomIndex] -= Math.floor(damageDone);
    result.playerDamage = Math.floor(damageDone);
  } else {
    result.attack = 'Healing Touch';
    let amountToHeal = Math.floor(enemy.originalHealth * 0.05);
    enemy.health += amountToHeal;
    result.selfHeal = amountToHeal;
  }
  return result;
}

const goblinKingAttack = (message, target, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup) => {
  let result = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: [], attack: ''};
  let hitChance = Math.random();

  if (enemy.status.stun.state) return result;
  
  if (hitChance > 0.5) {
    result.attack = 'Royal Edge';
    let damageDone = Math.random() * ((enemy.attack * 15) - (enemy.attack * 10) + 1) + (enemy.attack * 10);
    groupCurrentHealth[randomIndex] -= Math.floor(damageDone);
    result.playerDamage = Math.floor(damageDone);
    if (dungeonGroup.length > 1) {
      damageDone = Math.floor(damageDone / groupCurrentHealth.length / 2);
      result.groupDamage = damageDone;
      for (let i = 0; i < groupCurrentHealth.length; i++) {
        if (dungeonGroup[randomIndex].userID !== dungeonGroup[i].userID) {
          groupCurrentHealth[i] -= damageDone;
          let dead = checkForDeath(groupCurrentHealth, i, groupMaxHealth, dungeonGroup);
          if (dead) {
            result.dead.push(dead);
          }
        }
      }
    }
  } else {
    result.attack = 'Raging Fire Strike';
    let damageDone = Math.random() * ((enemy.wisdom * 15) - (enemy.wisdom * 10) + 1) + (enemy.wisdom * 10);
    groupCurrentHealth[randomIndex] -= Math.floor(damageDone);
    result.playerDamage = Math.floor(damageDone);
    if (dungeonGroup.length > 1) {
      damageDone = Math.floor(damageDone / groupCurrentHealth.length / 2);
      result.groupDamage = damageDone;
      for (let i = 0; i < groupCurrentHealth.length; i++) {
        if (dungeonGroup[randomIndex].userID !== dungeonGroup[i].userID) {
          groupCurrentHealth[i] -= damageDone;
          let dead = checkForDeath(groupCurrentHealth, i, groupMaxHealth, dungeonGroup);
          if (dead) {
            result.dead.push(dead);
          }
        }
      }
    }
  }
  return result;
}

const mosquitoAttack = (message, target, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup) => {
  let result = {playerDamage: 0, groupDamage: 0, selfHeal: 0, dead: [], attack: ''};
  if (enemy.status.stun.state) return result;
  let damageDone = Math.random() * ((enemy.attack * 15) - (enemy.attack * 10) + 1) + (enemy.attack * 10);
  result.attack = 'Piercing Sting';
  result.playerDamage = Math.floor(damageDone);
  groupCurrentHealth[randomIndex] -= Math.floor(damageDone);
  return result;
}

const devourerAttack = (message, target, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup) => {
  let result = {playerDamage: 0, groupDamage: 0, selfHeal: 0, selfDamage: 0, dead: [], attack: ''};
  let pickAttack = Math.random();
  if (enemy.status.stun.state) return result;
  if (pickAttack > 1/2) {
    result.attack = 'Life Sap';
    let damageDone = Math.floor(groupCurrentHealth[randomIndex] * 0.15);
    result.playerDamage = Math.floor(damageDone + (groupCurrentHealth[randomIndex] * 0.075));
    groupCurrentHealth[randomIndex] -= result.playerDamage;
    result.groupDamage = damageDone;
    if (groupCurrentHealth.length > 1) {
      for (let i = 0; i < groupCurrentHealth.length; i++) {
        if (dungeonGroup[i].userID !== target.userID) {
          groupCurrentHealth[i] -= damageDone;
          let dead = checkForDeath(groupCurrentHealth, i, groupMaxHealth, dungeonGroup);
          if (dead) {
            result.dead.push(dead);
          }
        }
      }
    }
    
  } else {
    result.attack = 'Detach';
    let damageDone = Math.random() * ((enemy.wisdom * 15) - (enemy.wisdom * 10) + 1) + (enemy.wisdom * 10);
    result.playerDamage = Math.floor(damageDone);
    groupCurrentHealth[randomIndex] -= result.playerDamage;
    damageDone = Math.floor(enemy.originalHealth * 0.05);
    result.selfDamage = damageDone;
    enemy.health -= result.selfDamage;
  }
  return result;
}

const chimeraAttack = (message, target, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup) => {
  let result = {playerDamage: 0, groupDamage: 0, selfHeal: 0, selfDamage: 0, dead: [], attack: ''};
  let pickAttack = Math.random();
  if (enemy.status.stun.state) return result;
  if (pickAttack > 2/3) {
    result.attack = 'Fireball';
    let damageDone = Math.random() * ((enemy.wisdom * 20) - (enemy.wisdom * 15) + 1) + (enemy.wisdom * 15);
    groupCurrentHealth[randomIndex] -= Math.floor(damageDone);
    result.playerDamage = Math.floor(damageDone);
  } else if (pickAttack > 1/3) {
    result.attack = 'Void Burst';
    let damageDone = Math.random() * ((enemy.wisdom * 20) - (enemy.wisdom * 15) + 1) + (enemy.wisdom * 15);
    groupCurrentHealth[randomIndex] -= Math.floor(damageDone);
    result.playerDamage = Math.floor(damageDone);
    if (dungeonGroup.length > 1) {
      damageDone = Math.floor(damageDone / groupCurrentHealth.length / 2);
      result.groupDamage = damageDone;
      for (let i = 0; i < groupCurrentHealth.length; i++) {
        groupCurrentHealth[i] -= damageDone;
        let dead = checkForDeath(groupCurrentHealth, i, groupMaxHealth, dungeonGroup);
        if (dead) {
          result.dead.push(dead);
        }
        
      }
    }
  } else {
    result.attack = 'Leeching Claws';
    let damageDone = Math.random() * ((enemy.attack * 20) - (enemy.attack * 15) + 1) + (enemy.attack * 15);
    result.playerDamage = Math.floor(damageDone);
    groupCurrentHealth[randomIndex] -= result.playerDamage;
    damageDone = Math.floor(result.playerDamage * 7.5);
    result.selfHeal = damageDone;
    enemy.health += result.selfHeal;
  }
  return result;
}

const mummyAttack = (message, target, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup) => {
  let result = {playerDamage: 0, groupDamage: 0, selfHeal: 0, selfDamage: 0, dead: [], attack: ''};
  let pickAttack = Math.random();
  if (enemy.status.stun.state) return result;
  if (pickAttack > 0.6) {
    result.attack = 'Ancient Magick';
    let damageDone = Math.random() * ((enemy.wisdom * 15) - (enemy.wisdom * 10) + 1) + (enemy.wisdom * 10);
    damageDone = Math.floor(damageDone / dungeonGroup.length);
    if (dungeonGroup.length > 1) {
      result.groupDamage = damageDone;
      for (let i = 0; i < groupCurrentHealth.length; i++) {
        groupCurrentHealth[i] -= damageDone;
        let dead = checkForDeath(groupCurrentHealth, i, groupMaxHealth, dungeonGroup);
        if (dead) {
          result.dead.push(dead);
        }
      }
    } else {
      result.playerDamage = Math.floor(damageDone/2);
      groupCurrentHealth[randomIndex] -= damageDone;
    }
  } else {
    result.attack = 'Beam of Ra';
    let damageDone = Math.random() * ((enemy.wisdom * 15) - (enemy.wisdom * 10) + 1) + (enemy.wisdom * 10);
    let doubleChance = Math.random();
    if (doubleChance < 0.1) damageDone = damageDone * 2;
    damageDone = Math.floor(damageDone);
    result.playerDamage = damageDone;
    groupCurrentHealth[randomIndex] -= damageDone;
  }
  return result;
}

const skeletonAttack = (message, target, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup) => {
  let result = {playerDamage: 0, groupDamage: 0, selfHeal: 0, selfDamage: 0, dead: [], attack: ''};
  let pickAttack = Math.random();
  if (enemy.status.stun.state) return result;
  if (pickAttack > 0.8) {
    result.attack = 'Consume Flesh';
    let amountToHeal = Math.floor(Math.random() * ((enemy.health / 2) - 1000 + 1) + 1000);
    result.selfHeal = amountToHeal;
    enemy.health += amountToHeal;
  } else {
    result.attack = 'Bone Strike';
    let damageDone = Math.random() * ((enemy.attack * 15) - (enemy.attack * 10) + 1) + (enemy.attack * 10);
    damageDone = Math.floor(damageDone);
    result.playerDamage = damageDone;
    groupCurrentHealth[randomIndex] -= damageDone;
  }
  return result;
}

const revenantAttack = (message, target, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup) => {
  let result = {playerDamage: 0, groupDamage: 0, selfHeal: 0, selfDamage: 0, dead: [], attack: ''};
  let pickAttack = Math.random();
  if (enemy.status.stun.state) return result;
  if (pickAttack > 0.7) {
    result.attack = 'Mortal Strike';
    if (dungeonGroup.length > 1) {
      let totalDamage = 0;
      for (let i = 0; i < groupCurrentHealth.length; i++) {
        groupCurrentHealth[i] -= Math.floor(groupCurrentHealth[i]/4);
        totalDamage += Math.floor(groupCurrentHealth[i]/4);
        let dead = checkForDeath(groupCurrentHealth, i, groupMaxHealth, dungeonGroup);
        if (dead) {
          result.dead.push(dead);
        }
      }
      result.groupDamage = totalDamage;
    } else {
      result.playerDamage = Math.floor(groupCurrentHealth[randomIndex]/4);
      groupCurrentHealth[randomIndex] -= Math.floor(groupCurrentHealth[randomIndex]/4);
    }
  } else {
    result.attack = 'Smite';
    let damageDone = Math.random() * ((enemy.wisdom * 20) - (enemy.wisdom * 15) + 1) + (enemy.wisdom * 15);
    damageDone = Math.floor(damageDone);
    result.playerDamage = damageDone;
    groupCurrentHealth[randomIndex] -= damageDone;
  }
  return result;
}

const veinAttack = async (message, target, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup) => {
  let result = {playerDamage: 0, groupDamage: 0, selfHeal: 0, selfDamage: 0, dead: [], attack: ''};
  let pickAttack = Math.random();
  if (enemy.status.stun.state) return result;
  let currentTarget = await userDB.findOne({ userID: target.userID });
  let damageDone = 0;
  if (pickAttack > 0.5) {
    if (currentTarget.status.stun.state && pickAttack > 0.75) {
      result.attack = 'Razor Jaw';
      damageDone = Math.random() * ((enemy.wisdom * 15) - (enemy.wisdom * 10) + 1) + (enemy.wisdom * 10);
      damageDone = damageDone * 1.5
      groupCurrentHealth[randomIndex] -= Math.floor(damageDone);
      result.playerDamage = Math.floor(damageDone);
    } else {
      result.attack = 'Grip Coil';
      damageDone = Math.random() * ((enemy.wisdom * 15) - (enemy.wisdom * 10) + 1) + (enemy.wisdom * 10);
      currentTarget.status.stun.state = true;
      currentTarget.status.stun.duration = 1;
      groupCurrentHealth[randomIndex] -= Math.floor(damageDone);
      result.playerDamage = Math.floor(damageDone);
      await currentTarget.save();
    }
  } else {
    result.attack = 'Wide Sweep';
    damageDone = Math.random() * ((enemy.attack * 15) - (enemy.attack * 10) + 1) + (enemy.attack * 10);
    groupCurrentHealth[randomIndex] -= Math.floor(damageDone / groupCurrentHealth.length);
    result.playerDamage = Math.floor(damageDone / groupCurrentHealth.length);
    if (dungeonGroup.length > 1) {
      damageDone = Math.floor(damageDone / groupCurrentHealth.length);
      result.groupDamage = damageDone;
      for (let i = 0; i < groupCurrentHealth.length; i++) {
        groupCurrentHealth[i] -= damageDone;
        let dead = checkForDeath(groupCurrentHealth, i, groupMaxHealth, dungeonGroup);
        if (dead) {
          result.dead.push(dead);
        }
      }
    }
  }
  return result;
}

const bloodAttack = async (message, target, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup) => {
  let result = {playerDamage: 0, groupDamage: 0, selfHeal: 0, selfDamage: 0, dead: [], attack: ''};
  let pickAttack = Math.random();
  if (enemy.status.stun.state) return result;
  let currentTarget = await userDB.findOne({ userID: target.userID });
  let damageDone = 0;
  if (pickAttack > 2/3) {
    if(currentTarget.status.stun.state) {
      result.attack = 'Silent Wind';
      damageDone = Math.random() * ((enemy.wisdom * 17) - (enemy.wisdom * 15) + 1) + (enemy.wisdom * 15);
      groupCurrentHealth[randomIndex] -= Math.floor(damageDone);
      result.playerDamage = Math.floor(damageDone);
      enemy.health -= Math.floor(damageDone * 100);
      result.selfDamage = Math.floor(damageDone * 100);
      await currentTarget.save();
    } else {
      result.attack = 'Silent Wind';
      damageDone = Math.random() * ((enemy.wisdom * 17) - (enemy.wisdom * 12) + 1) + (enemy.wisdom * 12);
      currentTarget.status.stun.state = true;
      currentTarget.status.stun.duration = 1;
      groupCurrentHealth[randomIndex] -= Math.floor(damageDone);
      result.playerDamage = Math.floor(damageDone);
      await currentTarget.save();
    }
  } else if (pickAttack > 1/3) {
    result.attack = 'Cutting Wind';
    damageDone = Math.random() * ((enemy.wisdom * 15) - (enemy.wisdom * 10) + 1) + (enemy.wisdom * 10);
    groupCurrentHealth[randomIndex] -= Math.floor(damageDone / groupCurrentHealth.length);
    result.playerDamage = Math.floor(damageDone / groupCurrentHealth.length);
    if (dungeonGroup.length > 1) {
      damageDone = Math.floor(damageDone / groupCurrentHealth.length);
      result.groupDamage = damageDone;
      for (let i = 0; i < groupCurrentHealth.length; i++) {
        groupCurrentHealth[i] -= damageDone;
        let dead = checkForDeath(groupCurrentHealth, i, groupMaxHealth, dungeonGroup);
        if (dead) {
          result.dead.push(dead);
        }
      }
    }
  } else {
    result.attack = 'Numbness Nullifier';
    let amountToHeal = Math.floor(enemy.health * 0.2);
    let stunChance = Math.random();
    if (enemy.health + amountToHeal > enemy.originalHealth) {
      result.selfHeal = enemy.originalHealth - enemy.health;
      enemy.health = enemy.originalHealth;
      
    } else {
      result.selfHeal = amountToHeal;
      enemy.health += amountToHeal;
    }
    if (stunChance <= 0.3) {
      currentTarget.status.stun.state = true;
      currentTarget.status.stun.duration = 1;
      await currentTarget.save();
    }
  }
  return result;
}

const monarchAttack = async (message, target, enemy, randomIndex, groupCurrentHealth, groupMaxHealth, dungeonGroup) => {
  let result = {playerDamage: 0, groupDamage: 0, selfHeal: 0, selfDamage: 0, dead: [], attack: ''};
  let pickAttack = Math.random();
  if (enemy.status.stun.state) return result;
  let currentTarget = await userDB.findOne({ userID: target.userID });
  let damageDone = 0;
  if (pickAttack > 0.66) {
    result.attack = 'Void Slash';
    damageDone = Math.random() * ((enemy.attack * 17) - (enemy.attack * 12) + 1) + (enemy.attack * 12);
    damageDone = Math.floor(damageDone);
    result.playerDamage = damageDone;
    groupCurrentHealth[randomIndex] -= damageDone;
    groupMaxHealth[randomIndex] = Math.floor(groupMaxHealth[randomIndex] - (groupMaxHealth[randomIndex] * 0.03));
  } else if (pickAttack > 0.33) {
    result.attack = 'Pain Absorber';
    let amountToHeal = Math.floor(Math.random() * ((enemy.originalHealth * 0.25) - (enemy.originalHealth * 0.15) + 1) + enemy.originalHealth * 0.15);
    result.selfHeal = amountToHeal;
    enemy.health += amountToHeal;
  } else {
    result.attack = 'Acupuncture';
    damageDone = Math.random() * ((enemy.dexterity * 20) - (enemy.dexterity * 15) + 1) + (enemy.dexterity * 15);
    damageDone = Math.floor(damageDone);
    result.playerDamage = damageDone;
    groupCurrentHealth[randomIndex] -= damageDone;
    currentTarget.status.stun.state = true;
    currentTarget.status.stun.duration = 1;
  }
  return result;
}

async function goblinFortressMobs(keys, group, totalLevel) {
  let mobs = new Map();
  mobs.set(keys[0], {
    health: Math.floor(25000 + (75 * totalLevel)),
    originalHealth: Math.floor(25000 + (75 * totalLevel)),
    attack: 4,
    dexterity: 4,
    wisdom: 2,
    status: { stun: {state: false, duration: 0 }, rot: {state: false, duration: 0, applicator: undefined}, bleed: {state: false, duration: 0, applicator: undefined}, taunt: {state: false, chance: 0, duration: 0} },
    name: 'Hobgoblin',
    drops: [{ item: 'tornrags', count: Math.floor(Math.random()* (45 - 30 + 1) + 30), dropRate: 100 }, { item: 'eyeofgreed', count: 1, dropRate: 5.1 }, { item: 'featheredspear', count: 1, dropRate: 2.1 }, { item: 'greedysack', count: 1, dropRate: 0.5 }],
    payout: Math.floor(Math.random() * (80000 - 70000 + 1) + 70000)
  });
  mobs.set(keys[1], {
    health: Math.floor(30000 + (100 * totalLevel)),
    originalHealth: Math.floor(30000 + (100 * totalLevel)),
    attack: 3,
    dexterity: 5,
    wisdom: 7,
    status: { stun: {state: false, duration: 0 }, rot: {state: false, duration: 0, applicator: undefined }, bleed: {state: false, duration: 0, applicator: undefined}, taunt: {state: false, chance: 0, duration: 0} },
    name: 'Goblin Shaman',
    drops: [{ item: 'goblinsheart', count: Math.floor(Math.random()* (6 - 1 + 1) + 1), dropRate: 100 }, { item: 'markofthewise', count: 1, dropRate: 4 }, { item: 'gemstaff', count: 1, dropRate:  2}],
    payout: Math.floor(Math.random() * (130000 - 120000 + 1) + 120000)
  });
  return mobs;
}

async function goblinFortressBoss(group, totalLevel) {
  let boss;
  boss = {
    health: Math.floor(35000 + (125 * totalLevel)),
    originalHealth: Math.floor(35000 + (125 * totalLevel)),
    attack: 7,
    dexterity: 5,
    wisdom: 6,
    status: { stun: {state: false, duration: 0 }, rot: {state: false, duration: 0, applicator: undefined}, bleed: {state: false, duration: 0, applicator: undefined}, taunt: {state: false, chance: 0, duration: 0} },
    name: 'The King of Greed | Goblin King',
    drops: [{ item: 'tornrags', count: Math.floor(Math.random()* (45 - 30 + 1) + 30), dropRate: 100 }, { item: 'jewelnecklace', count: 1, dropRate: 6 }, { item: 'busterblade', count: 1, dropRate: 1.5 }, { item: 'kingsbreastplate', count: 1, dropRate: 0.75 } ],
    alwaysDrops: { item: 'kingshead', count: 1},
    payout: Math.floor(Math.random() * (250000 - 240000 + 1) + 240000)
  };
  return boss;
}

async function witheredPlainsMobs(keys, group, totalLevel) {
  let mobs = new Map();
  mobs.set(keys[0], {
    health: Math.floor(50000 + (75 * totalLevel)),
    originalHealth: Math.floor(50000 + (75 * totalLevel)),
    attack: 6,
    dexterity: 6,
    wisdom: 5,
    status: { stun: {state: false, duration: 0 }, rot: {state: false, duration: 0, applicator: undefined}, bleed: {state: false, duration: 0, applicator: undefined}, taunt: {state: false, chance: 0, duration: 0} },
    name: 'Blood Mosquito',
    drops: [{ item: 'mosquitowings', count: Math.floor(Math.random()* (8 - 3 + 1) + 3), dropRate: 100 }, { item: 'bloodvial', count: 1, dropRate: 6 }, { item: 'sharpenedneedle', count: 1, dropRate: 3 }, { item: 'evasivewings', count: 1, dropRate: 1.5 }],
    payout: Math.floor(Math.random() * (205000 - 195000 + 1) + 195000)
  });
  mobs.set(keys[1], {
    health: Math.floor(55000 + (100 * totalLevel)),
    originalHealth: Math.floor(55000 + (100 * totalLevel)),
    attack: 4,
    dexterity: 7,
    wisdom: 6,
    status: { stun: {state: false, duration: 0 }, rot: {state: false, duration: 0, applicator: undefined}, bleed: {state: false, duration: 0, applicator: undefined}, taunt: {state: false, chance: 0, duration: 0} },
    name: 'Void Devourer',
    drops: [{ item: 'voidessence', count: Math.floor(Math.random()* (4 - 1 + 1) + 1), dropRate: 100 }, { item: 'voidcore', count: 1, dropRate: 2.1 }, { item: 'refinedessence', count: 1, dropRate:  1.1}, { item: 'blackhole', count: 1, dropRate:  0.1}],
    payout: Math.floor(Math.random() * (230000 - 220000 + 1) + 220000)
  });
  return mobs;
}

async function witheredPlainsBoss(group, totalLevel) {
  let boss;
  
  boss = {
    health: Math.floor(65000 + (125 * totalLevel)),
    originalHealth: Math.floor(65000 + (125 * totalLevel)),
    attack: 8,
    dexterity: 7,
    wisdom: 7,
    status: { stun: {state: false, duration: 0 }, rot: {state: false, duration: 0, applicator: undefined}, bleed: {state: false, duration: 0, applicator: undefined}, taunt: {state: false, chance: 0, duration: 0} },
    name: 'Dark Chimera | Ruler of the Void',
    drops: [{ item: 'voidessence', count: Math.floor(Math.random()* (8 - 2 + 1) + 2), dropRate: 100 }, { item: 'dragonstaff', count: 1, dropRate: 1.6 }, { item: 'essenceofrage', count: 1, dropRate: 1.1 }, { item: 'hornsofemptiness', count: 1, dropRate: 0.6 }, { item: 'bloodyblade', count: 1, dropRate:  0.1} ],
    alwaysDrops: { item: 'chimerashead', count: 1},
    payout: Math.floor(Math.random() * (350000 - 300000 + 1) + 300000)
  };
  return boss;
}

async function necropolisMobs(keys, group, totalLevel) {
  let mobs = new Map();
  mobs.set(keys[0], {
    health: Math.floor(80000 + (75 * totalLevel)),
    originalHealth: Math.floor(80000 + (75 * totalLevel)),
    attack: 6,
    dexterity: 13,
    wisdom: 12,
    status: { stun: {state: false, duration: 0 }, rot: {state: false, duration: 0, applicator: undefined}, bleed: {state: false, duration: 0, applicator: undefined}, taunt: {state: false, chance: 0, duration: 0} },
    name: 'Awoken Mummy',
    drops: [{ item: 'etherealdust', count: Math.floor(Math.random()* (15 - 5 + 1) + 5), dropRate: 100 }, { item: 'etherealband', count: 1, dropRate: 2 }, { item: 'ancientstaff', count: 1, dropRate: 1 }, { item: 'pharoahsheadress', count: 1, dropRate: 0.5 }],
    payout: Math.floor(Math.random() * (230000 - 220000 + 1) + 220000)
  });
  mobs.set(keys[1], {
    health: Math.floor(90000 + (100 * totalLevel)),
    originalHealth: Math.floor(90000 + (100 * totalLevel)),
    attack: 12,
    dexterity: 13,
    wisdom: 6,
    status: { stun: {state: false, duration: 0 }, rot: {state: false, duration: 0, applicator: undefined}, bleed: {state: false, duration: 0, applicator: undefined}, taunt: {state: false, chance: 0, duration: 0} },
    name: 'Skeletal Warrior',
    drops: [{ item: 'bone', count: Math.floor(Math.random()* (500 - 250 + 1) + 250), dropRate: 100 }, { item: 'ancientmechanism', count: 1, dropRate: 1.5 }, { item: 'forgottenflail', count: 1, dropRate:  0.5}],
    payout: Math.floor(Math.random() * (260000 - 250000 + 1) + 250000)
  });
  return mobs;
}

async function necropolisBoss(group, totalLevel) {
  let boss;
  boss = {
    health: Math.floor(100000 + (125 * totalLevel)),
    originalHealth: Math.floor(100000 + (125 * totalLevel)),
    attack: 12,
    dexterity: 13,
    wisdom: 12,
    status: { stun: {state: false, duration: 0 }, rot: {state: false, duration: 0, applicator: undefined}, bleed: {state: false, duration: 0, applicator: undefined}, taunt: {state: false, chance: 0, duration: 0} },
    name: 'Revenant | Ruler of the Necropolis',
    drops: [{ item: 'armorscraps', count: Math.floor(Math.random()* (8 - 3 + 1) + 3), dropRate: 100 }, { item: 'revenantsdagger', count: 1, dropRate: 2 }, { item: 'revenantsblood', count: 1, dropRate: 1 }, { item: 'revenantsrobe', count: 1, dropRate: 0.5 } ],
    alwaysDrops: { item: 'revenantshead', count: 1},
    payout: Math.floor(Math.random() * (350000 - 300000 + 1) + 300000)
  };
  return boss;
}

async function emptyMobs(keys, group, totalLevel) {
  let mobs = new Map();
  mobs.set(keys[0], {
    health: Math.floor(110000 + (75 * totalLevel)),
    originalHealth: Math.floor(110000 + (75 * totalLevel)),
    attack: 13,
    dexterity: 14,
    wisdom: 13,
    status: { stun: {state: false, duration: 0 }, rot: {state: false, duration: 0, applicator: undefined}, bleed: {state: false, duration: 0, applicator: undefined}, taunt: {state: false, chance: 0, duration: 0} },
    name: 'Pulsating Vein',
    drops: [{ item: 'purevoid', count: Math.floor(Math.random()* (4 - 1 + 1) + 1), dropRate: 100 }, { item: 'vileofvoid', count: 1, dropRate: 2.5 }, { item: 'veinpiercer', count: 1, dropRate: 1 }],
    payout: Math.floor(Math.random() * (280000 - 270000 + 1) + 270000)
  });
  mobs.set(keys[1], {
    health: Math.floor(130000 + (100 * totalLevel)),
    originalHealth: Math.floor(130000 + (100 * totalLevel)),
    attack: 13,
    dexterity: 15,
    wisdom: 16,
    status: { stun: {state: false, duration: 0 }, rot: {state: false, duration: 0, applicator: undefined}, bleed: {state: false, duration: 0, applicator: undefined}, taunt: {state: false, chance: 0, duration: 0} },
    name: 'Phantom Blood',
    drops: [{ item: 'livingflesh', count: Math.floor(Math.random()* (6 - 1 + 1) + 1), dropRate: 100 }, { item: 'markofvengeance', count: 1, dropRate: 3 }, { item: 'tomeofthewinds', count: 1, dropRate: 1 }],
    payout: Math.floor(Math.random() * (315000 - 305000 + 1) + 305000)
  });
  return mobs;
}

async function emptyBoss(group, totalLevel) {
  let boss;
  boss = {
    health: Math.floor(180000 + (125 * totalLevel)),
    originalHealth: Math.floor(180000 + (125 * totalLevel)),
    attack: 17,
    dexterity: 18,
    wisdom: 16,
    status: { stun: {state: false, duration: 0 }, rot: {state: false, duration: 0, applicator: undefined}, bleed: {state: false, duration: 0, applicator: undefined}, taunt: {state: false, chance: 0, duration: 0} },
    name: 'Fallen Monarch | Ruler of Nothing',
    drops: [{ item: 'purevoid', count: Math.floor(Math.random()* (8 - 2 + 1) + 2), dropRate: 100 }, { item: 'ominousarmblade', count: 1, dropRate: 4.2 }, { item: 'monarchsrule', count: 1, dropRate: 3 }, { item: 'monarchscore', count: 1, dropRate: 1 } ],
    alwaysDrops: { item: 'monarchsauthority', count: 1},
    payout: Math.floor(Math.random() * (375000 - 330000 + 1) + 330000)
  };
  return boss;
}

async function rewardEmbed(rewardString, msg) {
  const rEmbed = new Discord.MessageEmbed()
  .setTitle('Rewards')
  .setDescription(rewardString)
  .setFooter('phat lootz')
  .setColor("RANDOM")
  .setTimestamp();

  await msg.channel.send(rEmbed);
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
    rewardString += `<@!${user.userID}> received $${payout.toLocaleString()} and ${reward.count} ${item.itemName}! ${item.icon}\n`
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
        rewardString += `\n<@!${user.userID}> also received ${reward.count} ${item.itemName}! ${item.icon}\n`
      }
    }
    userUpdate.commands += 25;
    await userUpdate.save().catch(err => console.log(err));
    return rewardString;
  }
}