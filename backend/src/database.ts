import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
const dbPath = path.join(__dirname, "..", "games.db");
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Create games table
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    attributes JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    gameId TEXT NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS game_rounds (
    id TEXT PRIMARY KEY,
    gameSessionId TEXT NOT NULL,
    playerId TEXT NOT NULL,
    duration INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gameSessionId) REFERENCES game_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS bggthings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    attributes JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Prepared statements for players
export const playerStatements = {
  insert: db.prepare(`
    INSERT INTO players (id, name)
    VALUES (@id, @name)
  `),

  update: db.prepare(`
    UPDATE players 
    SET name = @name, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),

  getById: db.prepare(`
    SELECT id, name, created_at as createdAt, updated_at as updatedAt
    FROM players 
    WHERE id = ?
  `),

  getAll: db.prepare(`
    SELECT id, name, created_at as createdAt, updated_at as updatedAt
    FROM players 
    ORDER BY created_at DESC
  `),

  delete: db.prepare(`
    DELETE FROM players WHERE id = ?
  `),
};

// Prepared statements for games
export const gameStatements = {
  insert: db.prepare(`
    INSERT INTO games (id, name, attributes)
    VALUES (@id, @name, @attributes)
  `),

  update: db.prepare(`
    UPDATE games 
    SET name = @name, attributes = @attributes, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),

  getById: db.prepare(`
    SELECT id, name, attributes, created_at as createdAt, updated_at as updatedAt
    FROM games 
    WHERE id = ?
  `),

  getAll: db.prepare(`
    SELECT id, name, attributes, created_at as createdAt, updated_at as updatedAt
    FROM games 
    ORDER BY created_at DESC
  `),

  getAllActive: db.prepare(`
    SELECT id, name, attributes, created_at as createdAt, updated_at as updatedAt
    FROM games 
    WHERE json_extract(attributes, '$.overDate') IS NULL
    ORDER BY created_at DESC
  `),

  delete: db.prepare(`
    DELETE FROM games WHERE id = ?
  `),
};

// Prepared statements for game sessions
export const gameSessionStatements = {
  insert: db.prepare(`
    INSERT INTO game_sessions (id, gameId, startTime, endTime)
    VALUES (@id, @gameId, @startTime, @endTime)
  `),

  update: db.prepare(`
    UPDATE game_sessions 
    SET gameId = @gameId, startTime = @startTime, endTime = @endTime, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),

  getById: db.prepare(`
    SELECT id, gameId, startTime, endTime, created_at as createdAt, updated_at as updatedAt
    FROM game_sessions 
    WHERE id = ?
  `),

  getAll: db.prepare(`
    SELECT id, gameId, startTime, endTime, created_at as createdAt, updated_at as updatedAt
    FROM game_sessions 
    ORDER BY created_at DESC
  `),

  getByGameId: db.prepare(`
    SELECT id, gameId, startTime, endTime, created_at as createdAt, updated_at as updatedAt
    FROM game_sessions 
    WHERE gameId = ?
    ORDER BY created_at DESC
  `),

  delete: db.prepare(`
    DELETE FROM game_sessions WHERE id = ?
  `),
};

// Prepared statements for game rounds
export const gameRoundStatements = {
  insert: db.prepare(`
    INSERT INTO game_rounds (id, gameSessionId, playerId, duration)
    VALUES (@id, @gameSessionId, @playerId, @duration)
  `),

  update: db.prepare(`
    UPDATE game_rounds 
    SET gameSessionId = @gameSessionId, playerId = @playerId, duration = @duration, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),

  getById: db.prepare(`
    SELECT id, gameSessionId, playerId, duration, created_at as createdAt, updated_at as updatedAt
    FROM game_rounds 
    WHERE id = ?
  `),

  getAll: db.prepare(`
    SELECT id, gameSessionId, playerId, duration, created_at as createdAt, updated_at as updatedAt
    FROM game_rounds 
    ORDER BY created_at DESC
  `),

  delete: db.prepare(`
    DELETE FROM game_rounds WHERE id = ?
  `),
};

export const bggThingStatements = {
  insert: db.prepare(`
    INSERT INTO bggthings (id, name, attributes)
    VALUES (@id, @name, @attributes)
  `),

  update: db.prepare(`
    UPDATE bggthings 
    SET name = @name, attributes = @attributes, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),

  getById: db.prepare(`
    SELECT id, name, attributes, created_at as createdAt, updated_at as updatedAt
    FROM bggthings 
    WHERE id = ?
  `),

  // getAll: db.prepare(`
  //   SELECT id, name, attributes, created_at as createdAt, updated_at as updatedAt
  //   FROM bggthings
  //   ORDER BY created_at DESC
  // `),

  delete: db.prepare(`
    DELETE FROM bggthings WHERE id = ?
  `),
};

// Graceful shutdown
process.on("exit", () => db.close());
process.on("SIGINT", () => {
  db.close();
  process.exit(0);
});
