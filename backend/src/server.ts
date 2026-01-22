import express from "express";
import path from "path";
// import { format } from "date-fns";
import { fileURLToPath } from "url";
// import { getMondayData } from "./getMondayData.js";
// import { generateCSV } from "./generateCSV.js";
// import { updateToJira } from "./updateToJira.js";
import EventEmitter from "events";
import cors from "cors";
import { generatePrimeSync } from "crypto";
import { Game, GameFull } from "./game";
import { Player } from "./player";
import { GameSession } from "./gameSession";
import { BGG } from "./bgg";

// var scriptProgress = {};
// const initScriptProgress = (state: any, info = "") => {
//   scriptProgress = {
//     progress: 0,
//     hasProgress: false,
//     state,
//     info,
//     error: "",
//   };
//   emitChange();
// };

const app = express();
const port = 3001;

const scriptProgressEmitter = new EventEmitter();

// Pour __dirname avec ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const emitChange = () => {
//   scriptProgressEmitter.emit("scriptProgressChanged", scriptProgress);
// };

// const internalSetProgressProp = (prop: string, value: any) => {
//   if (scriptProgress[prop] !== value) {
//     console.log(`Prop "${prop}" changed, new value = ${value}`);
//     scriptProgress[prop] = value;
//     emitChange();
//   }
// };

// export const setProgress = (progress: number) => {
//   internalSetProgressProp("progress", progress);
// };

// export const setHasProgress = (hasProgress: boolean) => {
//   internalSetProgressProp("hasProgress", hasProgress);
// };

// const internalLog = (key: string, value: any) => {
//   // Add date/time to log
//   internalSetProgressProp(
//     key,
//     `${`${format(new Date(), "dd/MMM/yy HH:mm:ss")} - `}${value}`,
//   );
// };

// export const logError = (error: any) => {
//   internalLog("error", error);
// };

// export const logInfo = (info: any) => {
//   internalLog("info", info);
// };

// const setState = (state: any) => {
//   // Add date/time to state
//   internalSetProgressProp("state", state);
// };

// Sert les fichiers statiques (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Parse JSON request bodies
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"], // Support frontend dev server
    credentials: true,
  }),
);

// Route pour exécuter les scripts
app.get("/run/:scriptName/:boardId", async (req, res) => {
  const script = req.params.scriptName;
  const boardId = req.params.boardId;
  // initScriptProgress("RUNNING", `Init ${script} (Board id = ${boardId})`);
  /*
  switch (script) {
    case "getMondayData":
      res.send(await getMondayData(boardId));
      break;
    case "generateCSV":
      res.send(await generateCSV(boardId));
      break;
    case "updateToJira":
      res.send(await updateToJira(boardId));
      break;
    case "emptyDestJiraProject":
      res.send(await emptyDestJiraProject(boardId));
      break;
  }
  */
  // setState("DONE");
});

// To get progress of script
app.get("/progress", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const onScriptProgressChanged = (scriptProgress: any) => {
    res.write(`data: ${JSON.stringify(scriptProgress)}\n\n`);
    if (scriptProgress.state === "DONE") {
      scriptProgressEmitter.removeListener(
        "scriptProgressChanged",
        onScriptProgressChanged,
      );
      res.end();
    }
  };

  scriptProgressEmitter.on("scriptProgressChanged", onScriptProgressChanged);

  // Nettoyage si le client ferme la connexion
  req.on("close", () => {
    scriptProgressEmitter.removeListener(
      "scriptProgressChanged",
      onScriptProgressChanged,
    );
  });

  // Call once first
  // initScriptProgress("INIT");
});

app.get("/game/:id", async (req, res) => {
  const game = Game.getGame(req.params.id);
  if (game) res.send(JSON.stringify(game));
  else res.status(404).send("Game not found");
});

app.post("/game/:id/end", async (req, res) => {
  const game = Game.getGame(req.params.id);
  if (game) {
    game.end();
    res.status(200).send(JSON.stringify(game));
  } else {
    res.status(404).send("Game not found");
  }
});

app.post("/game", async (req, res) => {
  const gameData = req.body;
  const game = new Game(
    gameData.name,
    gameData.attributes,
    gameData.id ?? undefined,
  );
  game.save();
  res.status(201).send(JSON.stringify(game));
});

app.get("/games", async (req, res) => {
  if (req.query.active === "true") {
    const activeGames = GameFull.getActiveGames();
    res.status(200).send(JSON.stringify(activeGames));
    return;
  } else {
    const games = Game.getAllGames();
    res.status(200).send(JSON.stringify(games));
  }
});

// Players
app.post("/player", async (req, res) => {
  const playerData = req.body;
  const player = new Player(playerData.name, playerData.id ?? undefined);
  player.save();
  res.status(201).send(JSON.stringify(player));
});

app.get("/players", async (req, res) => {
  const players = Player.getAllPlayers();
  res.status(200).send(JSON.stringify(players));
});

// Game session
app.get("/game/:gameId/sessions", async (req, res) => {
  const gameSessions = GameSession.getAllGameSessions(req.params.gameId);
  res.status(200).send(JSON.stringify(gameSessions));
});

app.post("/game/:gameId/session", async (req, res) => {
  const gameSessionData = req.body;
  const gameSession = new GameSession(
    req.params.gameId,
    new Date(gameSessionData.startTime),
    gameSessionData.endTime ? new Date(gameSessionData.endTime) : null,
    gameSessionData.id ?? undefined,
  );
  gameSession.save();
  res.status(201).send(JSON.stringify(gameSession));
});

app.post("/game/:gameId/session/:sessionId", async (req, res) => {
  const gameSessionData = req.body;
  const gameSession = new GameSession(
    req.params.gameId,
    new Date(gameSessionData.startTime),
    gameSessionData.endTime ? new Date(gameSessionData.endTime) : null,
    req.params.sessionId,
  );
  gameSession.save();
  res.status(201).send(JSON.stringify(gameSession));
});

// BGG API
app.get("/bgg/search", async (req, res) => {
  const query = req.query.query as string;
  res.send(await BGG.search(query));
});

app.get("/bgg/thing/:id", async (req, res) => {
  const id = req.params.id as string;
  res.send(await BGG.getThingById(id));
});

app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});
