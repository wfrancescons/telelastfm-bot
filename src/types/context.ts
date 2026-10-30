import type { Context } from "grammy";
import type { HydrateFlavor } from "@grammyjs/hydrate";
import type { CommandsFlavor } from "@grammyjs/commands";

export type BotContext = HydrateFlavor<CommandsFlavor<Context>>;

