export async function handleListen({ api, ...extra1 }) {
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
    handlers[handlerKey] = await handler({ api, ...extra1 });
  }

  return async function ({ api, event, ...extras }) {
    const listenObj = {
      api,
      event,
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
