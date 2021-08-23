const WebSocket = require('ws');
const chalk = require('chalk');

const { log } = console;

const logParse = (data) => {
  return data.map((it) => JSON.stringify(it)).join(' ');
};

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    const event = JSON.parse(message);
    const { type, data } = event;
    switch (type) {
      case 'log':
        log('>>', logParse(data));
        break;
      case 'error':
        log('>>', chalk.red(logParse(data)));
        break;
      case 'warn':
        log('>>', chalk.yellow(logParse(data)));
        break;
      case 'debug':
        log('>>', chalk.blue(logParse(data)));
        break;
      default:
        log('>>', logParse(data));
    }
  });

  ws.send('something');
});
