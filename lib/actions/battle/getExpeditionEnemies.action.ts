'use server'

import { COOKIE_NAME } from '@/constants';
import Character from '@/lib/models/character.model';
import User from '@/lib/models/user.model';
import { connectToDB } from '@/lib/mongoose';
import { extractUserId } from '@/lib/utils';
import { cookies } from 'next/headers';
import { expeditionEnemies } from '@/constants/enemies';
import { EnemyStatsInterface } from '@/lib/interfaces/enemy.interface';
import Journal from '@/lib/models/journal.model';
import { expeditions } from '@/constants/expeditions';

export async function getExpeditionEnemies(expeditionName: string) {
  const token = cookies().get(COOKIE_NAME);

  if (!token) throw new Error('Unathorized');

  if (!expeditions.hasOwnProperty(expeditionName)) return null;

  const expedition = expeditionEnemies[expeditionName];

  const enemiesInfo = [];

  try {
    const userId = extractUserId(token);

    connectToDB();

    const user = await User.findById(userId)
      .populate({
        path: 'character',
        model: Character,
        populate: {
          path: 'journal',
          model: Journal,
        }
      })

    if (!user || !user.character) throw new Error('Unauthorized');

    const character = user.character;

    // Checks the character's knowledge of each enemy in the area and returns the knowledge he has.
    for (const enemyName in expedition) {
      if (expedition.hasOwnProperty(enemyName)) {
        const enemy = expedition[enemyName];

        const enemyKnowledge = character.journal.expeditions[expeditionName][enemyName]?.knowledge || 0;

        const enemyInfo: EnemyStatsInterface = {
          name: enemy.name,
          image: enemy.image,
          id: enemy.id,
        };

        if (enemyKnowledge > 0) {
          enemyInfo.level = enemy.level;
        }

        if (enemyKnowledge > 1) {
          enemyInfo.crowns = enemy.crowns;
          enemyInfo.experience = enemy.experience;
        }

        if (enemyKnowledge > 2) {
          enemyInfo.strength = enemy.strength;
          enemyInfo.endurance = enemy.endurance;
          enemyInfo.agility = enemy.agility;
          enemyInfo.dexterity = enemy.dexterity;
          enemyInfo.intelligence= enemy.intelligence;
          enemyInfo.charisma = enemy.charisma;
        }

        enemiesInfo.push(enemyInfo);
      }
    }

    return enemiesInfo;

  } catch (error) {
    console.log(`${new Date} - Failed to get enemies - ${error}`);
    return null;
  }
}