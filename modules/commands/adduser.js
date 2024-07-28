module.exports = {
  config: {
    name: "adduser",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "Yan Maglinte (Original), Liane Cagara (Changes and fixes)",
    description: "Add a user to group by userID",
    usePrefix: true,
    commandCategory: "box-chat",
    usages: "[args]",
    cooldowns: 5,
  },
  async run({ api, event, args }) {
    // I didn't used some sort of getUID..
    const out = (msg) => api.sendMessage(msg, event.threadID, evebt.messageID);
    if (!args[0] || isNaN(args[0])) {
      return out(`❌ | Please enter a valid userID to add.`);
    }
    const botUserID = api.getCurrentUserID();
    let { participantIDs, approvalMode, adminIDs } = await api.getThreadInfo(
      event.threadID,
    );
    participantIDs = participantIDs.map((e) => parseInt(e));
    const { [args[0]]: userInfo } = await api.getUserInfo(args[0]);
    const { name = "Unknown User" } = userInfo ?? {};
    const id = parseInt(args[0]);
    if (participantIDs.includes(id)) {
      return out(`❌ | ${name ? name : "Member"} is already in the group.`);
    } else {
      const admins = adminIDs.map((e) => parseInt(e.id));
      try {
        await api.addUserToGroup(id, threadID);
      } catch {
        return out(`❌ | Can't add ${name ? name : "user"} in group.`);
      }
      if (approvalMode === true && !admins.includes(botUserID)) {
        return out(
          `✅ | Added ${name ? name : "member"} to the approved list !`,
        );
      } else {
        return out(`✅ | Added ${name ? name : "member"} to the group !`);
      }
    }
  },
};
