import { type Client, Room } from "@colyseus/core";
import { GameState } from "../../../../libs/common/src/lib/entities/GameState.ts";
import { EventTypes } from "../../../../libs/common/src/lib/types.ts";
import { Colors, colorize, log } from "../lib/log.ts";

/** Hosts the authoritative player scores for one game. */
export class GameRoom extends Room<{ state: GameState }> {
  override state = new GameState();

  override onCreate(): void {
    this.onMessage(EventTypes.increaseScore, this.onIncreaseScore.bind(this));
  }

  override onJoin({ sessionId }: Client): void {
    this.state.addPlayer(sessionId);
    log(`Player ${sessionId} has joined`);
  }

  override onLeave({ sessionId }: Client): void {
    this.state.removePlayer(sessionId);
    log(`Player ${sessionId} has left`);
  }

  private onIncreaseScore({ sessionId }: Client): void {
    const player = this.state.getPlayer(sessionId);
    if (!player) {
      return;
    }
    player.increaseScore();
    log(
      `Player ${sessionId} has increased score to ${colorize(player.score, Colors.yellow)}`,
    );
  }
}
