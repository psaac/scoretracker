import { playerStatements } from "./database.js";

export class Player {
  private id: string;

  constructor(
    public name: string,
    id?: string,
  ) {
    this.id = id || crypto.randomUUID();
  }

  public save(): void {
    const existing = playerStatements.getById.get(this.id);

    if (existing) {
      playerStatements.update.run({
        id: this.id,
        name: this.name,
      });
    } else {
      playerStatements.insert.run({
        id: this.id,
        name: this.name,
      });
    }
  }

  // Get player from database by name
  public static getPlayer(name: string): Player | null {
    const row = playerStatements.getById.get(name) as any;

    if (!row) {
      return null;
    }

    return new Player(row.name, row.id);
  }

  // Get all players
  public static getAllPlayers(): Player[] {
    const rows = playerStatements.getAll.all() as any[];
    return rows.map((row) => {
      return new Player(row.name, row.id);
    });
  }

  // Delete player from database
  public delete(): void {
    playerStatements.delete.run(this.id);
  }

  // Get the player ID
  public getId(): string {
    return this.id;
  }
}
