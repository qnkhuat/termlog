#!/usr/bin/env node
const WebSocket = require('ws');
const minimist = require("minimist");
const chalk = require('chalk');
const repl = require('repl');

const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 3456;

const getTime = () => {
  const now = new Date();
  const hours = (now.getHours() > 9 ? "" : "0") + now.getHours();
  const minutes = (now.getMinutes() > 9 ? "" : "0") + now.getMinutes();
  const seconds = (now.getSeconds() > 9 ? "" : "0") + now.getSeconds();
  return `[${hours}:${minutes}:${seconds}]`;
}

const out = (text, color = "white", stream = null) => {
  let formattedText;
  switch (color) {
    case "white":
      text = `${getTime()} ${chalk.white(text)}`;
      break;
    case "red":
      text = `${getTime()} ${chalk.red(text)}`;
      break;
    case "yellow":
      text = `${getTime()} ${chalk.yellow(text)}`;
      break;
    case "blue":
      text = `${getTime()} ${chalk.blue(text)}`;
      break;
    default:
      text = `${getTime()} ${chalk.white(text)}`;
      break;
  }
  console.log(text);
  if (stream) stream.write(text + "\n");
}

function heartbeat() {
  this.isAlive = true;
}

const startServer = (options) => {

  console.log(`Server running at: ${options.host}:${options.port}`);

  let fileStream;
  if (options.out) {
    const fs = require('fs');
    fileStream = fs.createWriteStream(options.out, {flags: 'a'});
    console.log(`Saving log to ${options.out}`);
  }

  const server = new WebSocket.Server({ port: options.port, host: options.host});
  server.on("connection", (conn) => {
    conn.isAlive = true;

    conn.on('pong', heartbeat);

    conn.on('message', (message) => {
      const event = JSON.parse(message);
      var { type, data } = event;

      if (typeof data[0] === 'object') {
        const prettyprint  = require('prettyprint');
        data = prettyprint.default(data[0]).trim().split('\n');
      }

      switch (type) {
        case 'log':
          data.forEach((text) => out(text, "white", fileStream));
          break;
        case 'error':
          data.forEach((text) => out(text, "red", fileStream));
          break;
        case 'warn':
          data.forEach((text) => out(text, "yellow", fileStream));
          break;
        case 'debug':
          data.forEach((text) => out(text, "blue", fileStream));
          break;
        default:
          data.forEach((text) => out(text, "white"), fileStream);
      }
    });

    conn.on("close", (event) => {
      out("[TERMLOG]: Closed", conn);
    });

  });

  const closeHandler = (status=0) => {
    if (fileStream) fileStream.end();
    server.close();
    process.exit(status)
  }


  const interval = setInterval(() => {
    server.clients.forEach((conn) => {
      if (conn.isAlive === false)  return conn.terminate();

      conn.isAlive = false;
      conn.ping("");
    });
  }, 5000);

  server.on("close", ()  => {
    clearInterval(interval);
    closeHandler(0);
  });

  server.on("error", (event) => {
    out(event, "red");
    closeHandler(1);
  })


  // Start a node repl
  const r = repl.start('> ');
  r.on('exit', () => {
    closeHandler(0);
});
}


const args = minimist(process.argv.slice(2));
if ("help" in args) {
  console.log(`
Termlog - Console log to terminal

Options:

--help
    Display this help

--addr localhost
    Change address of server
    Default is: localhost

--port 3456
    Change port of server
    Default is: 3456

--out arg
    Save output to file

  `);
} else {
  const options = {
    port: DEFAULT_PORT,
    host:DEFAULT_HOST,
    ...args
  }

  startServer(options);
}
