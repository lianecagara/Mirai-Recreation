const { spawn } = require("child_process");

const { retro } = require("gradient-string");

function start() {
  const child = spawn("node", ["spawner.js"], {
    cwd: __dirname,
    stdio: "pipe",
    shell: true,
  });
  child.on("close", (code) => {
    if (code === 2) {
      start();
    }
  });
  const handleLog = (data) => {
    const output = retro(data.toString());
    console.log(output);
  };
  child.stdout.on("data", handleLog);
  child.stderr.on("data", handleLog);
}

start();
