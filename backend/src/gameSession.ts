import { gameSessionStatements } from "./database.js";

export class GameSession {
  private id: string;

  constructor(
    public gameId: string,
    public startTime: Date,
    public endTime: Date | null = null,
    id?: string,
  ) {
    this.id = id || crypto.randomUUID();
  }

  // Save game to database (insert or update)
  public save(): void {
    const existing = gameSessionStatements.getById.get(this.id);

    if (existing) {
      gameSessionStatements.update.run({
        id: this.id,
        gameId: this.gameId,
        startTime: this.startTime.toISOString(),
        endTime: this.endTime ? this.endTime.toISOString() : null,
      });
    } else {
      // prevent adding new session if one already exists for the same gameId with no endTime (assuming only one active session per game)
      const activeSession = gameSessionStatements.getByGameId.get(
        this.gameId,
      ) as GameSession;
      if (activeSession && !activeSession.endTime) {
        throw new Error(
          `An active game session already exists for gameId ${this.gameId}`,
        );
      }

      gameSessionStatements.insert.run({
        id: this.id,
        gameId: this.gameId,
        startTime: this.startTime.toISOString(),
        endTime: this.endTime ? this.endTime.toISOString() : null,
      });
    }
  }

  // Get game session from database by id
  public static getGameSession(id: string): GameSession | null {
    const row = gameSessionStatements.getById.get(id) as any;

    if (!row) {
      return null;
    }

    return new GameSession(
      row.gameId,
      new Date(row.startTime),
      row.endTime ? new Date(row.endTime) : null,
      row.id,
    );
  }

  // Get all games
  public static getAllGameSessions(gameId: string): GameSession[] {
    const rows = gameSessionStatements.getByGameId.all(gameId) as any[];
    return rows.map((row) => {
      const attributes = JSON.parse(row.attributes || "{}");
      return new GameSession(
        row.gameId,
        new Date(row.startTime),
        row.endTime ? new Date(row.endTime) : null,
        row.id,
      );
    });
  }

  // Delete game session from database
  public delete(): void {
    gameSessionStatements.delete.run(this.id);
  }

  // Get the game session ID
  public getId(): string {
    return this.id;
  }
}
