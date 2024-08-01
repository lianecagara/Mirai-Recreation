import fs from "fs";
import fsp from "fs/promises";
// This thing was entirely different than what mirai and botpack has
// The original threads.js code sucks a lot
// This script is reworked by Liane Cagara entirely, because "if it works, don't touch it" is never my thing.

// Note: the original version was never class based
// Some methods were basically copy pasted from the reworked users.js

export class ThreadsClass {
  constructor({ path, api, Users }) {
    this.path = path;
    this.api = api;
    let threadsData = {};
    try {
      threadsData = JSON.parse(fs.readFileSync(path, "utf8"));
    } catch (error) {
      console.error(error);
      fs.writeFileSync(path, "{}");
    }
    this.threadsData = threadsData;
    this.Users = Users;
  }
  async getInfo(threadID) {
    try {
      const result = await api.getThreadInfo(threadID);
      return result;
    } catch (error) {
      throw new Error(error);
    }
  }
  async getData(userID, callback) {
    const { threadsData } = this;
    try {
      if (!threadID) throw new Error("Thread ID cannot be blank");
      if (isNaN(threadID)) throw new Error("Invalid threadID");
      if (!threadsData[threadID])
        await this.createData(threadID, (error, info) => {
          return info;
        });
      const data = threadsData[threadID];
      if (callback && typeof callback == "function") {
        await callback(null, data);
      }
      return data;
    } catch (error) {
      if (callback && typeof callback == "function") {
        await callback(error, null);
      }
      return false;
    }
  }
  async delData(userID, callback) {
    try {
      const { threadsData: usersData } = this;
      if (!userID) throw new Error("Thread ID cannot be blank");
      if (isNaN(userID)) throw new Error("Invalid Thread ID");
      if (!(userID in usersData)) {
        throw new Error(`Thread ID: ${userID} does not exist in Database`);
      }

      delete usersData[userID];
      await this.saveData(usersData);
      if (callback && typeof callback == "function") {
        await callback(null, `REMOVE THREAD${userID}SUCCESS`);
      }
      return true;
    } catch (error) {
      if (callback && typeof callback == "function") {
        await callback(error, null);
      }
      return false;
    }
  }

  async getAll(keys, callback) {
    try {
      const { threadsData: usersData } = this;
      const userKeys = Object.keys(usersData);
      if (!keys) {
        if (userKeys.length == 0) {
          return [];
        } else if (userKeys.length > 0) {
          // I simplified it :>
          return userKeys.map((i) => usersData[i]);
        }
      }
      if (!Array.isArray(keys))
        throw new Error("The input parameter must be an array");
      //const data = [];

      // I made a different logic that only uses map and spread operator.
      const data = keys.map((i) => {
        const userData = usersData[i] ?? {};
        return {
          ...userData,
          ID: i,
        };
      });
      /*
      // This original logic was too long LMAO
      for (const userID in usersData) {
        const database = {
          ID: userID,
        };
        const userData = usersData[userID];
        for (const i of keys) {
          database[i] = userData[i];
        }

        data.push(database);
      }
      */
      if (callback && typeof callback == "function") {
        await callback(null, data);
      }
      return data;
    } catch (error) {
      if (callback && typeof callback == "function") {
        await callback(error, null);
      }
      return false;
    }
  }

  async saveData(data) {
    try {
      if (!data) throw new Error("Data cannot be left blank");
      await fsp.writeFile(this.path, JSON.stringify(data, null, 4));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async setData(userID, options, callback) {
    const { threadsData: usersData } = this; // I am 100% lazy to change variable names, let it be
    try {
      if (!userID) throw new Error("Thread ID cannot be blank");
      if (isNaN(userID)) throw new Error("Invalid Thread ID");

      if (!usersData[userID]) {
        throw new Error(`Thread ID: ${userID} does not exist in Database`);
      }

      if (typeof options != "object") {
        throw new Error("The options parameter passed must be an object");
      }
      // I'm surprised the original code uses spread operator here, but nowhere else
      usersData[userID] = { ...usersData[userID], ...options };
      await this.saveData(usersData);
      if (callback && typeof callback == "function") {
        await callback(null, usersData[userID]);
      }
      return usersData[userID];
    } catch (error) {
      if (callback && typeof callback == "function") {
        await callback(error, null);
      }
      return false;
    }
  }
  async createData(threadID, callback) {
    try {
      const { threadsData, Users } = this;
      if (!threadID) throw new Error("threadID cannot be empty");
      if (isNaN(threadID)) throw new Error("Invalid threadID");
      if (threadsData[threadID]) {
        throw new Error(
          `Threads with ID: ${threadID} already exists in Database`,
        );
      }
      let threadInfo = await api.getThreadInfo(threadID);
      let data = {
        [threadID]: {
          threadInfo: {
            threadID: threadID,
            threadName: threadInfo.threadName,
            emoji: threadInfo.emoji,
            adminIDs: threadInfo.adminIDs,
            participantIDs: threadInfo.participantIDs,
            isGroup: threadInfo.isGroup,
          },
          createTime: {
            timestamp: Date.now(),
          },
          data: {
            timestamp: Date.now(),
          },
        },
      };
      Object.assign(threadsData, data);
      const dataUser = global.data.allUserID;
      for (singleData of threadInfo.userInfo) {
        if (singleData.gender != undefined) {
          try {
            if (Users.usersData[singleData.id]) continue;
            Users.usersData.push(singleData.id);
            await Users.createData(singleData.id);
            global.liane.logger(
              `New User Detected: ${singleData.id}`,
              "DATABASE",
            );
          } catch (e) {
            console.error(e);
          }
        }
      }
      await this.saveData(threadsData);
      if (callback && typeof callback == "function") {
        await callback(null, data);
      }
      return data;
    } catch (error) {
      if (callback && typeof callback == "function") {
        await callback(error, null);
      }
      return false;
    }
  }
}

export function xThreads({ api, Users }) {
  return new ThreadsClass({
    api,
    Users,
    path: "handlerFiles/database/data/threads.json",
  });
}
