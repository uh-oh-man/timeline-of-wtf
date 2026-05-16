import { achievements } from "../data/achievements";

export function getAchievementById(id) {
  return achievements.find((achievement) => achievement.id === id) || null;
}

export function unlockAchievement(currentIds, id) {
  const achievement = getAchievementById(id);
  if (!achievement) {
    return { nextIds: currentIds, achievement: null, didUnlock: false };
  }

  if (currentIds.includes(id)) {
    return { nextIds: currentIds, achievement, didUnlock: false };
  }

  return {
    nextIds: [...currentIds, id],
    achievement,
    didUnlock: true,
  };
}

export function getUnlockedAchievements(unlockedIds) {
  const unlocked = new Set(unlockedIds);
  return achievements.filter((achievement) => unlocked.has(achievement.id));
}
