import { describe, it, expect } from "bun:test";
import { generateSchedule } from "./schedule";
import { assignBreakPlayer } from "./breakRotation";
import { validateResult, computeResult } from "./scoring";
import { Player, BreakCycle, Match } from "./types";

const mockPlayers: Player[] = [
  { id: "1", name: "Player 1" },
  { id: "2", name: "Player 2" },
  { id: "3", name: "Player 3" },
  { id: "4", name: "Player 4" },
  { id: "5", name: "Player 5" },
  { id: "6", name: "Player 6" },
];

describe("Schedule Generator", () => {
  it("should generate 3 matches for 4 players in full mode", () => {
    const players = mockPlayers.slice(0, 4);
    const schedule = generateSchedule(players, "full");
    expect(schedule.length).toBe(3);
  });

  it("should generate 1 match for 4 players in one-pass mode", () => {
    const players = mockPlayers.slice(0, 4);
    const schedule = generateSchedule(players, "one-pass");
    expect(schedule.length).toBe(1);
  });

  it("should ensure every player plays exactly 4 times every n games", () => {
    const n = 6;
    const players = mockPlayers.slice(0, n);
    const schedule = generateSchedule(players, "full");
    
    // Check first cycle of n games
    const playCounts: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const match = schedule[i];
      [...match.teamA.players, ...match.teamB.players].forEach(pid => {
        playCounts[pid] = (playCounts[pid] || 0) + 1;
      });
    }

    Object.values(playCounts).forEach(count => {
      expect(count).toBe(4);
    });
  });

  it("should ensure every player breaks exactly once every n games", () => {
    const n = 6;
    const players = mockPlayers.slice(0, n);
    const schedule = generateSchedule(players, "full");
    
    const breakCounts: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const pid = schedule[i].breakPlayerId;
      breakCounts[pid] = (breakCounts[pid] || 0) + 1;
    }

    Object.values(breakCounts).forEach(count => {
      expect(count).toBe(1);
    });
  });

  it("should always place the break player at Team A, index 0", () => {
    const players = mockPlayers.slice(0, 6);
    const schedule = generateSchedule(players, "full");
    
    schedule.forEach(match => {
      expect(match.teamA.players[0]).toBe(match.breakPlayerId);
    });
  });
});

describe("Break Rotation", () => {
  it("should assign break player from active players", () => {
    const match: Match = {
      id: "m1",
      index: 1,
      teamA: { players: ["1", "2"] },
      teamB: { players: ["3", "4"] },
      breakPlayerId: "",
      sittingOut: [],
      status: "upcoming",
    };
    const cycle: BreakCycle = {
      queue: ["1", "2", "3", "4", "5"],
      brokenThisCycle: [],
    };

    const { breakPlayerId, updatedCycle } = assignBreakPlayer(match, cycle);
    expect(["1", "2", "3", "4"]).toContain(breakPlayerId);
    expect(updatedCycle.brokenThisCycle).toContain(breakPlayerId);
  });

  it("should reset cycle when everyone has broken", () => {
    const match: Match = {
      id: "m1",
      index: 1,
      teamA: { players: ["1", "2"] },
      teamB: { players: ["3", "4"] },
      breakPlayerId: "",
      sittingOut: [],
      status: "upcoming",
    };
    const cycle: BreakCycle = {
      queue: ["1", "2", "3", "4", "5"],
      brokenThisCycle: ["1", "2", "3", "4"], // 4 have broken, only "5" remains
    };

    const { updatedCycle } = assignBreakPlayer(match, cycle);
    // After the 5th person breaks (even if they aren't in this match, 
    // the logic should find someone and if it completes the cycle, it resets)
    // Wait, in this match only 1,2,3,4 are active. All have broken.
    // So the logic will reset brokenThisCycle and pick one.
    expect(updatedCycle.brokenThisCycle.length).toBe(1);
  });
});

describe("Scoring", () => {
  it("should validate that ties are not allowed", () => {
    expect(validateResult(7, 4)).toBe(true);
    expect(validateResult(5, 5)).toBe(false);
  });

  it("should validate that scores above 8 are not allowed", () => {
    expect(validateResult(9, 4)).toBe(false);
    expect(validateResult(4, 9)).toBe(false);
  });

  it("should compute winner and deltas correctly", () => {
    const match: Match = {
      id: "m1",
      index: 1,
      teamA: { players: ["1", "2"] },
      teamB: { players: ["3", "4"] },
      breakPlayerId: "1",
      sittingOut: [],
      status: "active",
    };

    const { result, statDeltas } = computeResult(match, 7, 4);
    expect(result.winningSide).toBe("A");
    expect(statDeltas.find(d => d.playerId === "1")?.winDelta).toBe(1);
    expect(statDeltas.find(d => d.playerId === "3")?.winDelta).toBe(0);
  });
});
