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

  it("should generate 5 matches for 5 players in one-pass mode", () => {
    const schedule = generateSchedule(mockPlayers, "one-pass");
    expect(schedule.length).toBe(5); // C(5, 4) = 5
  });

  it("should populate sittingOut correctly for 5 players", () => {
    const schedule = generateSchedule(mockPlayers, "one-pass");
    schedule.forEach(match => {
      expect(match.sittingOut.length).toBe(1);
      const allInvolved = [...match.teamA.players, ...match.teamB.players, ...match.sittingOut];
      expect(new Set(allInvolved).size).toBe(5);
    });
  });
});

describe("Break Rotation", () => {
  it("should assign break player from active players", () => {
    const players = mockPlayers.slice(0, 4);
    const match: Omit<Match, "breakPlayerId"> = {
      id: "m1",
      index: 1,
      teamA: { players: ["1", "2"] },
      teamB: { players: ["3", "4"] },
      sittingOut: [],
      status: "upcoming",
    };
    const cycle: BreakCycle = {
      queue: ["1", "2", "3", "4"],
      pointer: 0,
      cycleNumber: 0,
      brokenThisCycle: [],
    };

    const { breakPlayerId, updatedCycle } = assignBreakPlayer(match, cycle);
    expect(["1", "2", "3", "4"]).toContain(breakPlayerId);
    expect(updatedCycle.brokenThisCycle).toContain(breakPlayerId);
  });

  it("should reset cycle when everyone has broken", () => {
    const players = ["1", "2", "3", "4"];
    const match: Omit<Match, "breakPlayerId"> = {
      id: "m1",
      index: 1,
      teamA: { players: ["1", "2"] },
      teamB: { players: ["3", "4"] },
      sittingOut: [],
      status: "upcoming",
    };
    const cycle: BreakCycle = {
      queue: players,
      pointer: 3,
      cycleNumber: 0,
      brokenThisCycle: ["1", "2", "3"],
    };

    const { breakPlayerId, updatedCycle } = assignBreakPlayer(match, cycle);
    expect(breakPlayerId).toBe("4");
    expect(updatedCycle.cycleNumber).toBe(1);
    expect(updatedCycle.brokenThisCycle.length).toBe(0);
  });
});

describe("Scoring", () => {
  it("should validate that ties are not allowed", () => {
    expect(validateResult(7, 4)).toBe(true);
    expect(validateResult(5, 5)).toBe(false);
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
    expect(statDeltas.find(d => d.playerId === "1")?.pointsDelta).toBe(7);
    expect(statDeltas.find(d => d.playerId === "3")?.pointsDelta).toBe(4);
  });
});
