export async function handleListen({ api, event, ...extras }) {
  const listenObj = {
    api,
    event,
    ...extras,
  };
  const handlerKeys = [
    "handleCommand",
    "handleReply",
    "handleReaction",
    "handleEvent",
    "handleCommandEvent",
  ];
  const handlers = {};
  for (const handlerKey of handlerKeys) {
    const handler = require(`./${handlerKey}`);
    handlers[handlerKey] = handler;
  }
  switch (event.type) {
    case "message":
    case "message_reply":
      await handler.handleCommand(listenObj);
      await handler.handleCommandEvent(listenObj);
      await handler.handleReply(listenObj);
    case "event":
      await handler.handleEvent(listenObj);
    case "message_reaction":
      await handler.handleReaction(listenObj);
  }
}
