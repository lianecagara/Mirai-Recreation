import login from "./fca-unofficial/promises";

import fsp from "fs/promises";
import moment from "moment-timezone";
import fs from "fs";

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
const pkg = require("./package.json");
// bot start logics..
async function main() {
  logger(`Mirai Recoded v${pkg.version}, "info"`);
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
    logger(error, "Login");
    process.exit(1);
  }
  logger(`Login Success! ID: ${api.getCurrentUserID()}`, "Login");
  global.recodedExtras.api = api;
  api.setOptions(config.FCAOption);
}

main();
