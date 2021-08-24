#!/usr/bin/env node
const WebSocket = require('ws');
const chalk = require('chalk');
const repl = require('repl');
const { DEFAULT_HOST, DEFAULT_PORT } = require("./config");

const getTime = () => {
  const now = new Date();
  const hours = (now.getHours() > 9 ? "" : "0") + now.getHours();
  const minutes = (now.getMinutes() > 9 ? "" : "0") + now.getMinutes();
  const seconds = (now.getSeconds() > 9 ? "" : "0") + now.getSeconds();
  return `[${hours}:${minutes}:${seconds}]`;
}

const out = (text, color = "white") => {
  switch (color) {
    case "white":
      console.log(getTime(), chalk.white(text))
      break;
    case "red":
      console.log(getTime(), chalk.red(text))
      break;
    case "yellow":
      console.log(getTime(), chalk.yellow(text))
      break;
    case "blue":
      console.log(getTime(), chalk.blue(text))
      break;
    default:
      console.log(getTime(), chalk.white(text))
      break;
  }
}

function heartbeat() {
  this.isAlive = true;
}

console.log(`Listening to http://${DEFAULT_HOST}:${DEFAULT_PORT}`);
const server = new WebSocket.Server({ port: DEFAULT_PORT, host: DEFAULT_HOST});

server.on("connection", (conn) => {
  conn.isAlive = true;

  conn.on('pong', heartbeat);

  conn.on('message', (message) => {
    //conn.isAlive = true;
    const event = JSON.parse(message);
    const { type, data } = event;
    switch (type) {
      case 'log':
        data.forEach((text) => out(text, "white"));
        break;
      case 'error':
        data.forEach((text) => out(text, "red"));
        break;
      case 'warn':
        data.forEach((text) => out(text, "yellow"));
        break;
      case 'debug':
        data.forEach((text) => out(text, "blue"));
        break;
      default:
        data.forEach((text) => out(text, "white"));
    }
  });
  
  conn.on("close", (event) => {
    out("[TCONSOLE]: Closed", conn);
  });

});

const interval = setInterval(() => {
  server.clients.forEach((conn) => {
    if (conn.isAlive === false)  return conn.terminate();

    conn.isAlive = false;
    conn.ping("");
  });
}, 5000);

server.on("close", ()  => {
  clearInterval(interval);
  process.exit(0);
});

server.on("error", (event) => {
  out(event, "red");
  process.exit(1);
})


// Start a node repl
const r = repl.start('> ');
