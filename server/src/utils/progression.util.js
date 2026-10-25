export const calculateTreeStatus = (xp, penaltyPoints) => {
  if (penaltyPoints >= 2) return 'DEAD';
  if (xp >= 1000) return 'GROWN';
  if (xp >= 400) return 'JUVENILE';
  if (xp >= 100) return 'SAPLING';
  return 'SEED';
};