import login from "./fca-unofficial/promises";

import fsp from "fs/promises";
import moment from "moment-timezone";
import fs from "fs";
import { execSync } from "child_process";
import { join } from "path";

// i did for the sake of reuse.
const timeZone = "Asia/Manila";

// botpack/mirai stuff..
global.client = {
  commands: new Map(),
  events: new Map(),
  cooldowns: new Map(),
  configPath: "config.json",
  mainPath: process.cwd(),
  eventRegistered: [],
  // arrays sucks ngl when it comes to storing reply data but I'll keep it here, its unique
  handleSchedule: [],
  handleReply: [],
  handleReaction: [],
  // alternatives that works too.
  repliesMap: new Map(),
  reactionsMap: new Map(),
  // this has been changed but it'll still work the same way :)
  getTime(option, ...extraArgs) {
    const handlerFunc = global.recodedExtras.timeOptions[option];
    if (typeof handlerFunc !== "function") {
      return null;
    }
    return handlerFunc(...extraArgs);
  },
  timeStart: Date.now(),
};

// all of these are not in the official MIRAI, be careful when using it.
global.recodedExtras = {
  timeZone,
  timeOptions: {
    seconds() {
      return this.format("ss");
    },
    minutes() {
      return this.format("mm");
    },
    hours() {
      return this.format("HH");
    },
    date() {
      return this.format("DD");
    },
    month() {
      return this.format("MM");
    },
    year() {
      return this.format("YYYY");
    },
    fullHour() {
      return this.format("HH:mm:ss");
    },
    fullYear() {
      return this.format("DD/MM/YYYY");
    },
    fullTime() {
      return this.format("HH:mm:ss DD/MM/YYYY");
    },
    format(format) {
      return `${moment.tz(timeZone).format(format)}`;
    },
  },
  configCache: {},
  get config() {
    this.loadConfig();
    return this.configCache;
  },
  loadConfig() {
    const data = JSON.parse(fs.readFileSync(global.client.configPath, "utf8"));
    this.configCache = data;
  },
  saveConfig(config) {
    fs.writeFileSync(global.client.configPath, JSON.stringify(config, null, 2));
    this.configCache = config;
  },
};

// I can't put it to global.client for incompatibility reasons, also recodedExtras sounds too long, maybe I'll just use my 5 letter name..?
global.liane = {
  // I made my own command loader stuffs that are reusable because mirai and botpack counterpart of this are not reusable, and it sucks a lot.
  installPackage(name) {
    try {
      execSync(`npm --package-lock false --save install ${name}`, {
        stdio: "inherit",
        env: process.env,
        shell: true,
        cwd: join(__dirname, "node_modules"),
      });
      const cache = require.resolve(name);
      if (cache) {
        delete require.cache[cache];
      }
    } catch (error) {
      throw error;
    }
  },
  async loadCommand(fileName, force) {
    try {
      const cache = require.resolve(
        __dirname + "/modules/commands/" + fileName,
      );
      if (cache) {
        delete require.cache[cache];
      }
      const command = require(`./modules/commands/${fileName}`);

      // let's go gambling!
      const { run, config } = command;
      if (typeof run !== "function") {
        // aw, DANG IT!
        throw new TypeError(
          `The module.exports["run"] must be a function, received ${typeof run}`,
        );
      }
      if (typeof config !== "object") {
        // aw, DANG IT!
        throw new TypeError(
          `The module.exports["config"] must be an objecy contaning command configuration like .name: string, .category: string and .usePrefix: boolean, received ${typeof config}.`,
        );
      }
      if (typeof config.name !== "string" || config.name.length < 1) {
        throw new TypeError(
          `The module.exports.config["name"] is a string that acts as a name for the command, it must be a string or enclosed in "" or '', received: ${typeof config.name}.`,
        );
      }
      if (
        typeof config.commandCategory !== "string" ||
        config.commandCategory.length < 1
      ) {
        throw new TypeError(
          `The module.exports.config["commandCategory"] is a string that acts as a classification for some bot commands and has no good usage other than help list and that NSFW feature. Received: ${typeof config.commandCategory}`,
        );
      }
      const { commands } = global.client;
      if (commands.has(config.name) && !force) {
        throw new Error(
          `The command name "${config.name}" is already used by another command.`,
        );
      }
      if (typeof command.onLoad === "function") {
        await command.onLoad({ api: global.recodedExtras.api });
      }
      const { dependencies } = config;
      if (dependencies) {
        for (const [name, version] of Object.entries(dependencies)) {
          this.installPackage(name + (version ? `@${version}` : ""));
        }
      }
      commands.set(config.name, command);
    } catch (error) {
      throw error;
    }
  },
  async unloadCommand(fileName) {
    try {
    } catch (error) {
      throw error;
    }
  },
  async loadEvent(fileName, force) {
    try {
    } catch (error) {
      throw error;
    }
  },
  async unloadEvent(fileName) {
    try {
    } catch (error) {
      throw error;
    }
  },
  validateFileType(files) {
    return files.filter(
      (i) =>
        i.endsWith(".js") ||
        i.endsWith(".ts") ||
        i.endsWith(".cjs") ||
        i.endsWith(".mjs"),
    );
  },
  async loadAllCommands(callback = async function () {}, force) {
    const files = this.validateFileType(
      await fsp.readdir(global.client.mainPath + "/modules/commands"),
    );
    const results = [];
    for (const file of files) {
      try {
        const command = await this.loadCommand(file, force);
        results.push({
          file,
          data: command,
          error: null,
        });
        await callback(null, file, command);
      } catch (error) {
        results.push({
          file,
          error,
          data: null,
        });
        await callback(error, file, null);
      }
    }
    return results;
  },
  async loadAllEvents(callback = async function () {}, force) {
    const files = this.validateFileType(
      await fsp.readdir(global.client.mainPath + "/modules/events"),
    );
    const results = [];
    for (const file of files) {
      try {
        const event = await this.loadCommand(file, force);
        results.push({
          file,
          data: event,
          error: null,
        });
        await callback(null, file, command);
      } catch (error) {
        results.push({
          file,
          error,
          data: null,
        });
        await callback(error, file, null);
      }
    }
    return results;
  },
};

// This is the simplest implementation, better than STORING EVERYTHING IN AN OBJECT.
global.nodemodule = new Proxy(
  {},
  {
    get(_, prop) {
      return require(prop);
    },
  },
);

// why class? I just want to annoy..
global.data = class {
  static allUserID = [];
  static allThreadID = [];
  static allCurrenciesID = [];

  static threadInfo = new Map();
  static threadData = new Map();
  static threadBanned = new Map();

  static threadAllowNSFW = [];

  static commandBanned = new Map();

  static userName = new Map();
  static userBanned = new Map();
};

function logger(content, type = "info") {
  console.log(`[ ${String(type).toUpperCase()} ]`, content);
}
const handlerPath = (i) => `./handlerFiles/handle${i}`;
const { handleListen } = require(handlerPath("Listen"));

const pkg = require("./package.json");
// bot start logics..
async function main() {
  logger(`Mirai Recoded v${pkg.version}`, "info");
  Object.defineProperty(global, "config", {
    get() {
      return global.recodedExtras.config;
    },
  });
  try {
    global.config;
    logger("Config loaded!", "config");
  } catch (error) {
    logger(error, "config");
    process.exit(1);
  }
  const { config } = global;
  logger("Loading Bot Appstate...", "Appstate");
  let appState = null;
  try {
    // as expected, it'll use the path provided in the config, also if it starts with env:, it'll use the process.env and the key.
    const appStatePath = config.APPSTATEPATH ?? "appstate.json";
    const appStateStr = appStatePath.startsWith("env:")
      ? process.env[appStatePath.slice(4).trim()]
      : await fsp.readFile(appStatePath, "utf8");
    appState = JSON.parse(appStateStr);
  } catch (error) {
    logger(error, "Appstate");
  }
  if (!appState) {
    logger(
      "Invalid Appstate! We cannot proceed, please fix your appstate configuration first.",
      "Appstate",
    );
    process.exit(1);
  }
  // ah yes, util.promisify!
  logger("Logging in..", "Login");
  let api = null;
  try {
    api = await login({ appState });
  } catch (error) {
    logger(error.error ?? error, "Login");
    process.exit(1);
  }
  logger(`Login Success! ID: ${api.getCurrentUserID()}`, "Login");
  global.recodedExtras.api = api;
  api.setOptions(config.FCAOption);
  logger("Listener Setup...", "Listen");
  api.listen(handleListen);
}

main();
