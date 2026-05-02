import { Player, Match, ScheduleDepth, PlayerId, Team } from './types';

/**
 * Generates a match schedule for a billiard session.
 * 
 * Complexity: O(C(n, 4)) which is O(n^4). 
 * For n=8, C(8, 4) = 70 subsets. 
 * In full mode, 70 * 3 = 210 matches. 
 * In one-pass mode, 70 matches.
 * This is well within performance limits for client-side execution.
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
  const subsets = getSubsets(playerIds, 4);
  const matches: Match[] = [];
  let matchIndex = 1;

  for (const subset of subsets) {
    const splits = get2v2Splits(subset);
    
    // In 'one-pass' mode, we only take the first split of each 4-player subset.
    // In 'full' mode, we take all 3 possible splits.
    const splitsToTake = depth === 'one-pass' ? [splits[0]] : splits;

    for (const split of splitsToTake) {
      const sittingOut = playerIds.filter(id => !subset.includes(id));
      
      matches.push({
        id: crypto.randomUUID(),
        index: matchIndex++,
        teamA: { players: [split[0][0], split[0][1]] },
        teamB: { players: [split[1][0], split[1][1]] },
        breakPlayerId: '', // To be assigned by break rotation engine
        sittingOut,
        status: 'upcoming',
      });
    }
  }

  return matches;
}

/**
 * Returns all unique subsets of size k from an array of elements.
 * O(C(n, k))
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
 * If players are [A, B, C, D], the splits are:
 * 1. [A, B] vs [C, D]
 * 2. [A, C] vs [B, D]
 * 3. [A, D] vs [B, C]
 */
function get2v2Splits(players: PlayerId[]): [[PlayerId, PlayerId], [PlayerId, PlayerId]][] {
  if (players.length !== 4) throw new Error('Splits require exactly 4 players');

  const [p1, p2, p3, p4] = players;

  return [
    [[p1, p2], [p3, p4]],
    [[p1, p3], [p2, p4]],
    [[p1, p4], [p2, p3]],
  ];
}
