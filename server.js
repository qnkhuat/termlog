#!/usr/bin/env node
const WebSocket = require('ws');
const minimist = require("minimist");
const repl = require('repl');

const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 3456;

const CRed = "\x1b[31m";
const CYellow = "\x1b[33m";
const CWhite = "\x1b[37m";
const CBlue = "\x1b[34m";

const LOGLEVELS = ['info', 'log', 'warn', 'error', 'debug'];
// global var keeping track of what to display
let SHOWLEVELS = LOGLEVELS; 

function heartbeat() {
  this.isAlive = true;
}

const getTime = () => {
  const now = new Date();
  const hours = (now.getHours() > 9 ? "" : "0") + now.getHours();
  const minutes = (now.getMinutes() > 9 ? "" : "0") + now.getMinutes();
  const seconds = (now.getSeconds() > 9 ? "" : "0") + now.getSeconds();
  return `[${hours}:${minutes}:${seconds}]`;
}

const out = (data, color = CWhite) => {
  if (!Array.isArray(data)) data = [data];
  process.stdout.write(color);
  process.stdout.write(getTime() + " ");
  console.log.apply(console, data);
  process.stdout.write(CWhite);
}

const applyShowFilter = (args) => {
  let newShowLevels =  [];

  for (let level of args) {
    level = level.trim();
    if (LOGLEVELS.includes(level)) newShowLevels.push(level);
    else {
      console.error("[TERMLOG] Invalid level: ", level);
      return false;
    }
  }
  console.log(`[TERMLOG] Show ${newShowLevels.join(",")} only`)
  SHOWLEVELS = newShowLevels;
  return true;
}

const startServer = (options) => {

  console.log(`[TERMLOG] Server running at: ${options.host}:${options.port}`);
    
  let fileStream;
  if (options.out) {
    const fs = require('fs');
    fileStream = fs.createWriteStream(options.out, {flags: 'a'});
    console.log(`[TERMLOG] Saving log to ${options.out}`);
  }

  if (options.show) applyShowFilter(options.show);

  const server = new WebSocket.Server({ port: options.port, host: options.host});
  server.on("connection", (conn) => {
    conn.isAlive = true;

    conn.on('pong', heartbeat);

    conn.on('message', (message) => {
      const event = JSON.parse(message);
      let { type, data } = event;

      if (!SHOWLEVELS.includes(type)) return;

      switch (type) {
        case 'log':
          out(data, CWhite);
          break;

        case 'error':
          out(data, CRed);
          break;

        case 'warn':
          out(data, CYellow);
          break;

        case 'debug':
          out(data, CBlue);
          break;

        default:
          out(data, CWhite);
          break;
      }
      if (options.out) {
        fileStream.write(data.join(" "));
        fileStream.write("\n");
      }    
    });

    conn.on("close", () => {
      out("[TERMLOG]: Closed", CWhite);
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
    out(event, CRed);
    closeHandler(1);
  })

  // Start a node repl
  const r = repl.start({prompt: "> "});
  r.defineCommand('show', {
    help: '[TERMLOG] Select log levels to display (info | log | warning | error | debug). Multiple levels are seperated by `,`',
    action(arg) {
      const args = arg.split(",");
      applyShowFilter(args);
    }
  });

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

--show args
    Select log levels to display (info | log | warning | error | debug). Multiple levels are seperated by \`,\`

  `);
} else {

  if (args.show) args.show = args.show.split(",");

  const options = {
    port: DEFAULT_PORT,
    host:DEFAULT_HOST,
    show: LOGLEVELS,
    ...args
  }
  
  startServer(options);
}
