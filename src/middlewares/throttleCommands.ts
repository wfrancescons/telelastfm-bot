import { limit } from "@grammyjs/ratelimiter";

export const throttleCommands = limit();

export default throttleCommands;

