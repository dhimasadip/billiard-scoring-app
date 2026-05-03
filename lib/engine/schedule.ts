import { Player, Match, ScheduleDepth, PlayerId } from './types';

/**
 * Generates a match schedule for a billiard session.
 * 
 * Sub-Session Logic:
 * Each sub-session consists of n games (where n is the total number of players).
 * Within each sub-session:
 * 1. Every player must break EXACTLY once.
 * 2. Every player must sit out EXACTLY (n-4) times.
 */
export function generateSchedule(
  players: Player[],
  depth: ScheduleDepth
): Match[] {
  const n = players.length;
  if (n < 4) {
    throw new Error('Minimum 4 players required to generate a 2v2 schedule.');
  }

  const playerIds = players.map(p => p.id);
  
  // 1. Generate the pool of all possible unique matches (splits)
  const pool: { subset: PlayerId[]; split: [PlayerId, PlayerId][] }[] = [];
  const allSubsets = getSubsets(playerIds, 4);

  for (const subset of allSubsets) {
    const splits = get2v2Splits(subset);
    const splitsToInclude = depth === 'one-pass' ? [splits[0]] : splits;
    for (const split of splitsToInclude) {
      pool.push({ subset, split });
    }
  }

  // Shuffle pool to ensure varied matchups
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const matches: Match[] = [];
  let currentSubSessionMatches: Match[] = [];
  let brokenInSub: Set<PlayerId> = new Set();
  let outCountsInSub: Record<PlayerId, number> = {};
  
  const resetSubSession = () => {
    brokenInSub = new Set();
    playerIds.forEach(id => (outCountsInSub[id] = 0));
    currentSubSessionMatches = [];
  };

  resetSubSession();

  // 2. Generate matches sub-session by sub-session
  while (pool.length > 0) {
    let bestPoolIdx = -1;
    let selectedBreakPlayerId: PlayerId = '';

    // Search for a match in the pool that fits the current sub-session constraints
    for (let i = 0; i < pool.length; i++) {
      const { subset } = pool[i];
      const sittingOut = playerIds.filter(id => !subset.includes(id));
      
      // Constraint: All sitting out players must still be under the limit
      const outConstraintMet = sittingOut.every(id => outCountsInSub[id] < (n - 4));
      if (!outConstraintMet) continue;

      // Constraint: At least one playing player must not have broken yet
      const possibleBreakers = subset.filter(id => !brokenInSub.has(id));
      if (possibleBreakers.length === 0) continue;

      // Found a candidate!
      bestPoolIdx = i;
      // Randomly pick from eligible breakers
      selectedBreakPlayerId = possibleBreakers[Math.floor(Math.random() * possibleBreakers.length)];
      break;
    }

    // Fallback: If no match perfectly fits, just take the first from pool
    if (bestPoolIdx === -1) {
      bestPoolIdx = 0;
      const { subset } = pool[bestPoolIdx];
      const possibleBreakers = subset.filter(id => !brokenInSub.has(id));
      selectedBreakPlayerId = possibleBreakers.length > 0 
        ? possibleBreakers[Math.floor(Math.random() * possibleBreakers.length)] 
        : subset[Math.floor(Math.random() * subset.length)];
    }

    const { subset, split } = pool.splice(bestPoolIdx, 1)[0];
    const sittingOut = playerIds.filter(id => !subset.includes(id));

    // Position the break player at Team A, index 0 (Top Left)
    let finalTeamA = split[0];
    let finalTeamB = split[1];

    if (finalTeamB.includes(selectedBreakPlayerId)) {
      // Swap teams if break player is in Team B
      const temp = finalTeamA;
      finalTeamA = finalTeamB;
      finalTeamB = temp;
    }

    // Move break player to the first position in Team A
    finalTeamA = [
      selectedBreakPlayerId,
      ...finalTeamA.filter(id => id !== selectedBreakPlayerId)
    ] as [PlayerId, PlayerId];

    // Update sub-session state
    brokenInSub.add(selectedBreakPlayerId);
    sittingOut.forEach(id => outCountsInSub[id]++);

    matches.push({
      id: crypto.randomUUID(),
      index: matches.length + 1,
      teamA: { players: finalTeamA },
      teamB: { players: finalTeamB },
      breakPlayerId: selectedBreakPlayerId,
      sittingOut,
      status: 'upcoming',
    });

    // Check if sub-session is complete
    if (matches.length % n === 0) {
      resetSubSession();
    }
  }

  return matches;
}

/**
 * Returns all unique subsets of size k from an array of elements.
 */
function getSubsets<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  function backtrack(start: number, current: T[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}

/**
 * For a set of 4 players, there are exactly 3 unique ways to split them into two teams of 2.
 */
function get2v2Splits(players: PlayerId[]): [PlayerId, PlayerId][][] {
  if (players.length !== 4) throw new Error('Splits require exactly 4 players');
  const [p1, p2, p3, p4] = players;
  return [
    [[p1, p2], [p3, p4]],
    [[p1, p3], [p2, p4]],
    [[p1, p4], [p2, p3]],
  ];
}
