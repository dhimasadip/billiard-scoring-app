import { Match, MatchResult, PlayerId } from './types';

export type StatDelta = {
  playerId: PlayerId;
  pointsDelta: number;  // team's score
  winDelta: 0 | 1;
  lossDelta: 0 | 1;
  gamePlayedDelta: 1;
};

/**
 * Validates that the scores are allowed (no ties).
 */
export function validateResult(scoreA: number, scoreB: number): boolean {
  return scoreA !== scoreB;
}

/**
 * Computes the result of a match and the statistical changes for each player.
 */
export function computeResult(
  match: Match,
  scoreA: number,
  scoreB: number
): { result: MatchResult; statDeltas: StatDelta[] } {
  if (!validateResult(scoreA, scoreB)) {
    throw new Error('Ties are not allowed in billiard scoring.');
  }

  const winningSide = scoreA > scoreB ? 'A' : 'B';
  
  const result: MatchResult = {
    matchId: match.id,
    teamAScore: scoreA,
    teamBScore: scoreB,
    winningSide,
  };

  const statDeltas: StatDelta[] = [];

  // Team A Players
  for (const pid of match.teamA.players) {
    statDeltas.push({
      playerId: pid,
      pointsDelta: scoreA,
      winDelta: winningSide === 'A' ? 1 : 0,
      lossDelta: winningSide === 'A' ? 0 : 1,
      gamePlayedDelta: 1,
    });
  }

  // Team B Players
  for (const pid of match.teamB.players) {
    statDeltas.push({
      playerId: pid,
      pointsDelta: scoreB,
      winDelta: winningSide === 'B' ? 1 : 0,
      lossDelta: winningSide === 'B' ? 0 : 1,
      gamePlayedDelta: 1,
    });
  }

  return { result, statDeltas };
}
