import stringSimilarity from "string-similarity";
import moment from "moment-timezone";

export default async function ({ api, ...extra1 }) {
  const { logger, delay } = global.liane;
  let activeCmd = false;
  return async function ({ api, event, box, ...extra2 }) {
    try {
      // Lmao I don't like bots responding to their own messages.
      if (activeCmd || event.senderID === api.getCurrentUserID()) {
        return;
      }
      const dateNow = Date.now();
      const time = moment.tz("Asia/Manila").format("HH:MM:ss DD/MM/YYYY");
      const { allowInbox, PREFIX, ADMINBOT, DeveloperMode, adminOnly } =
        global.config;
      const {
        userBanned,
        threadBanned,
        threadInfo,
        threadData,
        commandBanned,
      } = global.data;
      const { commands, cooldowns } = global.client;
      let { body = "", senderID = "", threadID = "", messageID = "" } = event;
      // Avoiding some sort of TypeError by making sure they were strings.
      senderID = String(senderID);
      threadID = String(threadID);
      body = String(body);
      const threadSetting = threadData.get(threadID) ?? {};
      // Array destructure looks cool ngl.
      let [commandName = "", ...args] = body.split(" ").filter(Boolean);
      commandName = String(commandName).toLowerCase();
      let hasPrefix = commandName.startsWith(PREFIX);
      if (hasPrefix) {
        commandName = commandName.slice(PREFIX.length);
      }
      let command = commands.get(commandName);
      if (!command) {
        // I added this logic for case sensitive keys and also ignore spaces with command names if there's one weird command y'k..
        command = Array.from(commands).find(
          ([name, val]) =>
            String(name).toLowerCase().trim().replaceAll(" ", "") ===
            commandName,
        );
      }
      // yey the string similarity
      let bestMatch = null;
      if (!command) {
        const allCommandName = Array.from(commands.keys());
        const checker = stringSimilarity.findBestMatch(
          commandName,
          allCommandName,
        );
        bestMatch = checker.bestMatch;
        if (checker.bestMatch.rating >= 0.7) {
          command = commands.get(checker.bestMatch.target);
        }
      }
      const replyAD =
        global.config?.replyAD ||
        "❌ | Currently only admins can only use this bot.";
      if (!command && hasPrefix) {
        return box.reply(
          `❔ | Invalid Command${commandName ? ` "${commandName}" ` : ""}, ${bestMatch && bestMatch.rating >= 0.5 ? `are you looking for "${bestMatch.target}"? If not,` : ""} please use ${PREFIX}help to see all commands.`,
        );
      }
      if (adminOnly === true && !ADMINBOT.includes(senderID)) {
        return box.reply(replyAD);
      }
      if (!ADMINBOT.includes(senderID)) {
        if (userBanned.has(senderID)) {
          const { reason = "Unknown", dateAdded = "Unknown" } =
            userBanned.get(senderID) ?? {};
          const ID = await box.reply(
            `❌ | You have been banned from using this bot.\nRaisins: ${reason}\nDate Added: ${dateAdded}`,
          );
          await delay(5000);
          await api.unsendMessage(ID);
          return;
        }
        if (threadBanned.has(senderID)) {
          const { reason = "Unknown", dateAdded = "Unknown" } =
            threadBanned.get(senderID) ?? {};
          const ID = await box.reply(
            `❌ | Your thread have been banned from using this bot.\nRaisins: ${reason}\nDate Added: ${dateAdded}`,
          );
          await delay(5000);
          await api.unsendMessage(ID);
          return;
        }
      }
    } catch (error) {
      console.error(error);
      return box.error(error);
    }
  };
}
