import { gameStatements } from "./database.js";
import { GameSession } from "./gameSession.js";

interface GameAttributes {
  bggId: string;
  playerIds: string[];
  havePassedPlayerIds: string[];
  firstPlayerId: string;
  scoring: number[];
  overDate: Date | null;
}

export class Game {
  private id: string;

  constructor(
    public name: string,
    public attributes: GameAttributes = {
      bggId: "",
      playerIds: [],
      havePassedPlayerIds: [],
      firstPlayerId: "",
      scoring: [],
      overDate: null,
    },
    id?: string,
  ) {
    this.id = id || crypto.randomUUID();
  }

  // Save game to database (insert or update)
  public save(): void {
    const existing = gameStatements.getById.get(this.id);

    if (existing) {
      gameStatements.update.run({
        id: this.id,
        name: this.name,
        attributes: JSON.stringify(this.attributes),
      });
    } else {
      gameStatements.insert.run({
        id: this.id,
        name: this.name,
        attributes: JSON.stringify(this.attributes),
      });
    }
  }

  // Get game from database by id
  public static getGame(id: string): Game | null {
    const row = gameStatements.getById.get(id) as any;

    if (!row) {
      return null;
    }

    const attributes = JSON.parse(row.attributes || "{}");
    return new Game(row.name, attributes, row.id);
  }

  public end(): void {
    this.attributes.overDate = new Date();
    this.save();
  }

  // Get all games
  public static getAllGames(): Game[] {
    const rows = gameStatements.getAll.all() as any[];
    return rows.map((row) => {
      const attributes = JSON.parse(row.attributes || "{}");
      return new Game(row.name, attributes, row.id);
    });
  }

  // Delete game from database
  public delete(): void {
    gameStatements.delete.run(this.id);
  }

  // Get the game ID
  public getId(): string {
    return this.id;
  }
}

export class GameFull extends Game {
  // Additional methods or properties for full game details can be added here
  constructor(
    name: string,
    attributes: GameAttributes = {
      bggId: "",
      playerIds: [],
      havePassedPlayerIds: [],
      firstPlayerId: "",
      scoring: [],
      overDate: null,
    },
    id?: string,
    public gameSessions: GameSession[] = [],
  ) {
    super(name, attributes, id);
    this.gameSessions = gameSessions;
  }

  // Get all active games (not over)
  public static getActiveGames(): GameFull[] {
    const rows = gameStatements.getAllActive.all() as any[];
    return rows.map((row) => {
      const attributes = JSON.parse(row.attributes || "{}");
      // Retrieve game sessions
      const gameSessions = GameSession.getAllGameSessions(row.id);

      return new GameFull(row.name, attributes, row.id, gameSessions);
    });
  }
}
