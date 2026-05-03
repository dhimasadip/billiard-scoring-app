import { Match, BreakCycle, PlayerId } from './types';

/**
 * Assigns a break player for a match based on a rotation queue.
 * Priority is given to players who haven't broken in the current cycle.
 */
export function assignBreakPlayer(
  match: Match,
  cycle: BreakCycle
): { breakPlayerId: PlayerId; updatedCycle: BreakCycle } {
  const activePlayers = [...match.teamA.players, ...match.teamB.players];

  const findEligible = (c: BreakCycle) => {
    return c.queue.find(
      (pid) => activePlayers.includes(pid) && !c.brokenThisCycle.includes(pid)
    );
  };

  let breakPlayerId = findEligible(cycle);
  let updatedCycle = { ...cycle };

  if (!breakPlayerId) {
    // Everyone in the match has already broken in this cycle.
    // Reset cycle and try again.
    updatedCycle.brokenThisCycle = [];
    breakPlayerId = findEligible(updatedCycle);
  }

  // If still no break player found (shouldn't happen with 4 players), fallback to first player
  if (!breakPlayerId) {
    breakPlayerId = activePlayers[0];
  }

  updatedCycle.brokenThisCycle = [...updatedCycle.brokenThisCycle, breakPlayerId];

  // If everyone in the queue has broken, reset the cycle
  if (updatedCycle.brokenThisCycle.length === updatedCycle.queue.length) {
    updatedCycle.brokenThisCycle = [];
  }

  return { breakPlayerId, updatedCycle };
}
