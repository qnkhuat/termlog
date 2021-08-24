#!/usr/bin/env node
const WebSocket = require('ws');
const chalk = require('chalk');
const repl = require('repl');

const getTime = () => {
  const now = new Date();
  const hours = (now.getHours() > 9 ? "" : "0") + now.getHours();
  const minutes = (now.getMinutes() > 9 ? "" : "0") + now.getMinutes();
  const seconds = (now.getSeconds() > 9 ? "" : "0") + now.getSeconds();
  return `[${hours}:${minutes}:${seconds}]`;
}

const out = (text, color) => {
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

const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (ws) => {
  ws.on('message', (message) => {
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
});

const r = repl.start('> ');
