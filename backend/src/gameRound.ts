import { gameRoundStatements } from "./database.js";

export class GameRound {
  private id: string;

  constructor(
    public gameSessionId: string,
    public playerId: string,
    public duration: number,
    id?: string,
  ) {
    this.id = id || crypto.randomUUID();
  }

  // Save game to database (insert or update)
  public save(): void {
    const existing = gameRoundStatements.getById.get(this.id);

    if (existing) {
      gameRoundStatements.update.run({
        id: this.id,
        gameSessionId: this.gameSessionId,
        playerId: this.playerId,
        duration: this.duration,
      });
    } else {
      gameRoundStatements.insert.run({
        id: this.id,
        gameSessionId: this.gameSessionId,
        playerId: this.playerId,
        duration: this.duration,
      });
    }
  }

  // Get game round from database by id
  public static getGameRound(id: string): GameRound | null {
    const row = gameRoundStatements.getById.get(id) as any;

    if (!row) {
      return null;
    }

    return new GameRound(row.gameSessionId, row.playerId, row.duration, row.id);
  }

  // Get all game rounds
  public static getAllGameRounds(): GameRound[] {
    const rows = gameRoundStatements.getAll.all() as any[];
    return rows.map((row) => {
      return new GameRound(
        row.gameSessionId,
        row.playerId,
        row.duration,
        row.id,
      );
    });
  }

  // Delete game round from database
  public delete(): void {
    gameRoundStatements.delete.run(this.id);
  }

  // Get the game round ID
  public getId(): string {
    return this.id;
  }
}
