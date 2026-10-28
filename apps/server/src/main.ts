import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Rooms } from "../../../libs/common/src/lib/types.ts";
import { GameRoom } from "./rooms/GameRoom.ts";

const defaultPort = 3000;
const maximumPort = 65_535;
const port = Number(Bun.env.PORT ?? defaultPort);
if (!Number.isInteger(port) || port < 1 || port > maximumPort) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

// Colyseus installs its HTTP matchmaking routes and CORS on the transport.
const gameServer = new Server({
  greet: false,
  transport: new WebSocketTransport(),
});
gameServer.define(Rooms.game, GameRoom);
await gameServer.listen(port);
