import fsp from "fs/promises";

export default async function ({ api, Users, Threads, ...extra1 }) {
  // __dirname is available in ts-node .register() obviously
  const users = JSON.parse(
    await fsp.readFile(__dirname + "/database/data/users.json", "utf8"),
  );
  const threads = JSON.parse(
    await fsp.readFile(__dirname + "/database/data/threads.json", "utf8"),
  );
  // I have a very bad feeling about the users and threads because they were loaded freakin once.
  const { logger } = global.liane;
  return async function ({ api, event, ...extra2 }) {
    const { allUserID, allThreadID } = global.data;
    const { autoCreateDB } = global.config;
    /* 
  ![] means false but it might be confusing too.
  if (autoCreateDB == ![]) return;
  */
    if (autoCreateDB !== true) {
      return;
    }
    let { senderID, threadID } = event;
    senderID = parseInt(senderID);
    threadID = parseInt(threadID);
    try {
      if (
        !allThreadID.includes(threadID) &&
        event.isGroup == true &&
        !threads[threadID]
      ) {
        allThreadID.push(threadID);
        await Threads.createData(threadID);
        logger(`New thread detected: ${threadID}`, "DATABASE");
      }

      if (threads[threadID]) {
        const data = threads[threadID];
        // optional chaining avoids errors but ofc it would lead to something worse.
        // also Array.isArray is helpful here, to avoid more TypeError like data.threadInfo.participantIDs.includes is not a function
        if (
          Array.isArray(data.threadInfo?.participantIDs) &&
          !data.threadInfo.participanIDs.includes(senderID)
        ) {
          data.threadInfo.participantIDs.push(senderID);
          logger(
            `Perform more group data.. (${senderID} is a new member probably)`,
            "ADD DATA",
          );
          await Threads.setData(threadID, { threadInfo: data.threadInfo });
        }
      }
      if (!allUserID.includes(senderID) && !users[senderID]) {
        allUserID.push(senderID);
        await Users.createData(senderID);
        logger(`New user detected: ${senderID}`, "DATABASE");
      }
      return;
    } catch (error) {
      return console.error(error);
    }
  };
}
// I just don't see the point of using !![] instead of true.
