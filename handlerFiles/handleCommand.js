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
        threadAllowNSFW,
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
      if (!ADMINBOT.includes(senderID) && hasPrefix) {
        if (userBanned.has(senderID)) {
          const { reason = "Unknown", dateAdded = "Unknown" } =
            userBanned.get(senderID) ?? {};
          const ID = await box.reply(
            `❌ | You have been banned from using this bot.\nRaisins: ${reason}\nDate: ${dateAdded}`,
          );
          await delay(5000);
          await api.unsendMessage(ID);
          return;
        }
        if (threadBanned.has(senderID)) {
          const { reason = "Unknown", dateAdded = "Unknown" } =
            threadBanned.get(senderID) ?? {};
          const ID = await box.reply(
            `❌ | Your thread have been banned from using this bot.\nRaisins: ${reason}\nDate: ${dateAdded}`,
          );
          await delay(5000);
          await api.unsendMessage(ID);
          return;
        }
        if (commandBanned.has(threadID) || commandBanned.has(senderID)) {
          const banThreads = commandBanned.get(threadID) ?? [];
          const banUsers = commandBanned.get(senderID) ?? [];
          if (banThreads.includes(command.config.name)) {
            const ID = await box.reply(
              `❌ | Your thread is unable to use the command "${command.config.name}"`,
            );

            await delay(5000);
            await api.unsendMessage(ID);
            return;
          }
          if (banUsers.includes(command.config.name)) {
            const ID = await box.reply(
              `❌ | Your are unable to use the command "${command.config.name}"`,
            );
          }
          await delay(5000);
          await api.unsendMessage(ID);
          return;
        }
      }
      const { config, run } = command;
      // usePrefix is true if not configured, is it your first time seeing "??="
      config.usePrefix ??= true;

      if (config.usePrefix === false && hasPrefix) {
        // I've added strict mode because it feels cool, and doesn't break when installed in a normal mirai/botpack
        if (config.strictMode === true) {
          return box.reply(
            `⚠️ | The command "${commandName}" doesn't work with prefix in strict mode!`,
          );
        }
      }
      if (config.usePrefix === true && !hasPrefix) {
        if (config.strictMode === true) {
          return box.reply(
            `⚠️ | Please type ${PREFIX}${commandName} to use this command!`,
          );
        }
      }
      // LMAO nsfw
      if (
        String(config.commandCategory).toLowerCase() === "nsfw" &&
        !threadAllowNSFW.includes(threadID)
      ) {
        const ID = await box.reply(
          `❌ | The command "${config.name}" is an NSFW command and your thread is not allowed to use it.`,
        );
        await delay(5000);
        await api.unsendMessage(ID);
      }
      let threadInfoo =
        threadInfo.get(threadID) || (await Threads.getInfo(threadID));
      const find = threadInfoo.adminIDs.find(
        (uid) => uid?.id === senderID || uid === senderID,
      );

      // Me wondering why is it called "hasPermssion" instead of "hasPermission"
      let permission = 0;
      if (find) {
        permission = 1;
      }
      if (ADMINBOT.includes(senderID)) {
        permission = 2;
      }
      if (config.hasPermssion === 1) {
        if (!find && !ADMINBOT.includes(senderID)) {
          return box.reply(
            `❌ | Only group admins can use the command "${config.name}"`,
          );
        }
      }
      if (config.hasPermssion === 2 && !ADMINBOT.includes(senderID)) {
        return box.reply(
          `❌ | Only bot admins are allowed to use the command "${config.name}"`,
        );
      }
      if (!client.cooldowns.has(command.config.name)) {
        client.cooldowns.set(command.config.name, new Map());
      }
      const timestamps =
        command && command.config
          ? client.cooldowns.get(command.config.name)
          : undefined;

      const expirationTime =
        ((command && command.config && command.config.cooldowns) || 1) * 1000;
      if (
        timestamps &&
        timestamps instanceof Map &&
        timestamps.has(senderID) &&
        dateNow < timestamps.get(senderID) + expirationTime
      ) {
        await box.react("⏳");
        return box.reply(
          `⏳ | Please wait ${(timestamps.get(senderID) + expirationTime - dateNow) / 1000} seconds before using this command again.`,
        );
      }
      const langInstance = new global.liane.LangClass(command);
      const getText2 = langInstance.getText.bind(langInstance);
      // finally, command execution.
      const ctx = {
        ...extra2,
        box,
        api,
        event,
        args,
        models,
        Users,
        Threads,
        Currencies,
        permssion,
        getText: getText2,
      };
      if (typeof run !== "function") {
        return box.reply(
          `❌ | What the f this will never happen, this will never happen unless a dumbass tried to mess with the code.`,
        );
      }
      activeCmd = true;
      try {
        await run({ ...ctx, box: null });
        if (typeof command.modernEntry === "function") {
          // You'll need to use module.exports.modernEntry to access the "box"
          await command.modernEntry({ ...ctx });
        }
        timestamps.set(senderID, dateNow);
      } catch (error) {
        console.error(error);
        return box.error(error);
      }
      activeCmd = false;
      if (DeveloperMode === true) {
        logger(
          `Handling Command "${config.name}" | ${senderID} | ${threadID} | ${args.join(" ")}`,
          "DEV",
        );
      }
    } catch (error) {
      console.error(error);
      return box.error(error);
    }
  };
}
