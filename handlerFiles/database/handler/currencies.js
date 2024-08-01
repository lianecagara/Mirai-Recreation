import { UsersClass } from "./users.js";

// I'm almost gonna laugh when I saw that the original currencies.js was basically a copy paste of users.js except it has TWO, yes TWO extra methods which is "increaseMoney" and "decreaseMoney", hell.
// Imagine copypasting everything just to add two extra methods. THAT'S SO RIDICULOUS!

// I hate copy pasting everything, so I came up with the idea of using "extends" keyword.
export class CurrenciesClass extends UsersClass {
  constructor({ api }) {
    super({ path: "handlerFiles/database/data/users.json", api });
  }
  async increaseMoney(userID, money = 0) {
    if (typeof money != "number") {
      throw new Error("Money must be a NUMBER 🤦‍♀️");
    }
    try {
      let { money: balance } = await this.getData(userID);
      await this.setData(userID, { money: balance + money });
      return true;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async decreaseMoney(userID, money) {
    if (typeof money != "number") {
      throw new Error("Money must be a NUMBER 🤦‍♀️");
    }
    try {
      let { money: balance } = await this.getData(userID);
      if (balance < money) {
        return false;
      }
      await this.setData(userID, { money: balance - money });
      return true;
    } catch (error) {
      throw error;
    }
  }
}
