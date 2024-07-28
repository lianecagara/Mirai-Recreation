import login from "./fca-unofficial/promises";
import fsp from "fs/promises";
import moment from "moment-timezone";

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
};

async function main() {}

main();
