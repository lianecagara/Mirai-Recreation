// This thing was entirely different than what mirai and botpack has
// The original users.js code sucks a lot
// This script is reworked by Liane Cagara entirely, because "if it works, don't touch it" is never my thing.

// Note: the original version was never class based

import fs from "fs";
import fsp from "fs/promises";

export class UsersClass {
  constructor({ path, api }) {
    this.path = path;
    this.api = api;
    let usersData = {};
    try {
      usersData = JSON.parse(fs.readFileSync(path, "utf8"));
    } catch (error) {
      console.error(error);
      fs.writeFileSync(path, "{}");
    }
    this.usersData = usersData;
  }
  async saveData(data) {
    try {
      if (!data) throw new Error("Data cannot be left blank");
      await fsp.writeFile(path, JSON.stringify(data, null, 4));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  // This is the most dangerous method I've ever seen because of no caching
  async getInfo(id) {
    const { [id]: data } = await this.api.getUserInfo(id);
    return data;
  }
  // what the fuck is this? this wasted resources by gathering the userInfo only to return "UserID: ${userID}", WHAT THE HELL!?
  async getNameUserOriginal(userID) {
    try {
      if (!userID) throw new Error("User ID cannot be blank");
      if (isNaN(userID)) throw new Error("Invalid user ID");
      var userInfo = await api.getUserInfo(userID);
      return `User ID: ${userID}`;
    } catch (error) {
      return `Facebook users`;
    }
  }
  // My version utilizes the getInfo earlier
  async getNameUser(userID) {
    try {
      if (!userID) throw new Error("User ID cannot be blank");
      if (isNaN(userID)) throw new Error("Invalid user ID");
      const { name = "Facebook users" } = await this.getInfo(userID);
      return name;
    } catch (error) {
      return `Facebook users`;
    }
  }
  // From D-Jukie, but where tf do I even initialize the global.account.accessToken!?
  async getUserFull(id) {
    let resolveFunc = function () {};
    let rejectFunc = function () {};
    let returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    try {
      this.api.httpGet(
        `https://graph.facebook.com/${id}?fields=email,about,birthday,link&access_token=${global.account.accessToken}`,
        (e, i) => {
          if (e) return rejectFunc(e);
          let t = JSON.parse(i);
          let dataUser = {
            error: 0,
            author: "D-Jukie",
            data: {
              uid: t.id ?? null,
              about: t.about ?? null,
              link: t.link ?? null,
              imgavt: `https://graph.facebook.com/${t.id}/picture?height=1500&width=1500&access_token=1073911769817594|aa417da57f9e260d1ac1ec4530b417de`,
            },
          };
          return resolveFunc(dataUser);
        },
      );
      return returnPromise;
    } catch (error) {
      return resolveFunc({
        error: 1,
        author: "D-Jukie",
        data: {},
      });
    }
  }
  async getAll(keys, callback) {
    try {
      const { usersData } = this;
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
  async getData(userID, callback) {
    const { usersData } = this;
    try {
      if (!userID) throw new Error("User ID cannot be blank");
      if (isNaN(userID)) throw new Error("Invalid user ID");
      if (!usersData[userID])
        await this.createData(userID, (error, info) => {
          return info;
        });
      const data = usersData[userID];
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
  async setData(userID, options, callback) {
    const { usersData } = this;
    try {
      if (!userID) throw new Error("User ID cannot be blank");
      if (isNaN(userID)) throw new Error("Invalid user ID");

      if (global.config.autoCreateDB) {
        if (!usersData[userID]) {
          throw new Error(`User ID: ${userID} does not exist in Database`);
        }
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

  async delData(userID, callback) {
    try {
      const { usersData } = this;
      if (!userID) throw new Error("User ID cannot be blank");
      if (isNaN(userID)) throw new Error("Invalid user ID");
      if (global.config.autoCreateDB) {
        if (!(userID in usersData)) {
          throw new Error(`User ID: ${userID} does not exist in Database`);
        }
      }
      delete usersData[userID];
      await this.saveData(usersData);
      if (callback && typeof callback == "function") {
        await callback(null, usersData);
      }
      return usersData;
    } catch (error) {
      if (callback && typeof callback == "function") {
        await callback(error, null);
      }
      return false;
    }
  }

  async createData(userID, callback) {
    try {
      const { usersData } = this;
      if (!userID) throw new Error("User ID cannot be blank");
      if (isNaN(userID)) throw new Error("Invalid user ID");
      const userInfo = await getInfo(userID);
      let data = {};
      if (usersData[userID]) {
        return false;
      }
      data = {
        [userID]: {
          userID: userID,
          money: 0,
          exp: 0,
          createTime: {
            timestamp: Date.now(),
          },
          data: {
            timestamp: Date.now(),
          },
          lastUpdate: Date.now(),
        },
      };
      // The fact that it uses Object.assign here instead of spread operator
      Object.assign(usersData, data);
      await this.saveData(usersData);
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

/*
  Warning about inconsistencies,
  All methods in my reworked users.js has asynchronous callbacks that actually pauses the execution if you were to use "await" keyword while executing the method.
*/

export function xUsers({ api }) {
  return new UserClass({ api, path: "handlerFiles/database/data/users.json" });
}
