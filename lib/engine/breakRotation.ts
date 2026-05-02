import { Match, BreakCycle, PlayerId } from './types';

/**
 * Assigns a break player for a match based on the global break rotation rules.
 * 
 * Rules:
 * 1. A player breaks only if they are one of the 4 active players in the match.
 * 2. Within a cycle, each player must break exactly once.
 * 3. Priority is determined by the player's position in the original registration queue.
 * 4. If all active players in a match have already broken in the current cycle, 
 *    the cycle is reset (or advanced) until at least one active player is available to break.
 */
export function assignBreakPlayer(
  match: Omit<Match, 'breakPlayerId'>,
  cycle: BreakCycle
): { breakPlayerId: PlayerId; updatedCycle: BreakCycle } {
  const activePlayerIds = [
    ...match.teamA.players,
    ...match.teamB.players
  ];

  let currentCycle = { ...cycle };

  // Helper to find eligible player in current queue state
  const findEligible = (c: BreakCycle) => {
    // We look through the queue in order. The first player who is:
    // a) Active in this match
    // b) Has NOT broken this cycle
    return c.queue.find(id => 
      activePlayerIds.includes(id) && !c.brokenThisCycle.includes(id)
    );
  };

  let breakPlayerId = findEligible(currentCycle);

  // If no one in this match can break in the current cycle, we MUST reset the cycle.
  // Note: This can happen if the 4 players in this match already broke, 
  // but others in the session haven't.
  if (!breakPlayerId) {
    currentCycle = {
      ...currentCycle,
      cycleNumber: currentCycle.cycleNumber + 1,
      brokenThisCycle: [],
      pointer: 0 // Reset pointer for the new cycle
    };
    
    breakPlayerId = findEligible(currentCycle);
  }

  if (!breakPlayerId) {
    // This should theoretically not happen if the match has 4 players from the queue
    throw new Error('Could not assign a break player even after cycle reset.');
  }

  // Update cycle state
  const updatedCycle: BreakCycle = {
    ...currentCycle,
    brokenThisCycle: [...currentCycle.brokenThisCycle, breakPlayerId],
    // The pointer in this specific implementation is less critical if we use findEligible,
    // but we can update it to the index of the player who just broke.
    pointer: currentCycle.queue.indexOf(breakPlayerId)
  };

  // Check if this was the last person in the queue who needed to break
  if (updatedCycle.brokenThisCycle.length === updatedCycle.queue.length) {
    return {
      breakPlayerId,
      updatedCycle: {
        ...updatedCycle,
        cycleNumber: updatedCycle.cycleNumber + 1,
        brokenThisCycle: [],
        pointer: 0
      }
    };
  }

  return { breakPlayerId, updatedCycle };
}
