import { Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  constructor(id: string) {
    super();
    this.id = id;
  }
  @type("string") id: string;
  @type("number") score = 0;

  increaseScore(): void {
    this.score += 1;
  }
}
