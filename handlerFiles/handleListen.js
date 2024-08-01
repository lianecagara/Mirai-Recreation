import { xUsers } from "./database/handler/users.js";
import { xThreads } from "./database/handler/threads.js";
import { xCurrencies } from "./database/handler/currencies.js";
import lianeUtils from "fca-liane-utils";

export async function handleListen({ api, ...extra1 }) {
  const { Box } = lianeUtils;
  const Users = await xUsers({ api });
  const Threads = await xThreads({ api, Users });
  const Currencies = await xCurrencies({ api, Users });
  const handlerKeys = [
    "handleCommand",
    "handleReply",
    "handleReaction",
    "handleEvent",
    "handleCommandEvent",
    "handleDB",
  ];
  const handlers = {};
  for (const handlerKey of handlerKeys) {
    const handler = require(`./${handlerKey}`);
    handlers[handlerKey] = await handler({
      api,
      Users,
      Threads,
      Currencies,
      ...extra1,
    });
  }

  return async function ({ api, event, ...extras }) {
    const box = new Box(api, event);
    const listenObj = {
      api,
      box,
      event,
      Users,
      Threads,
      Currencies,
      ...extras,
    };
    switch (event.type) {
      case "message":
      case "message_reply":
        // "handleEvent" muna ng cmds yung mageexecute
        await handler.handleCommandEvent(listenObj);
        // tapos yung database naman
        await handler.handleDB(listenObj);
        // then yung command handling yung naka "run"
        await handler.handleCommand(listenObj);
        // then yung mga "handleReply" naman.
        await handler.handleReply(listenObj);
      case "event":
        await handler.handleEvent(listenObj);
      case "message_reaction":
        await handler.handleReaction(listenObj);
    }
  };
}
