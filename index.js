const sendWhenConnected = (ws, msg, n = 0, maxTries = 100) => {
  setTimeout(() => {
    if (ws.readyState === 1) {
      ws.send(msg);
    } else if (n < maxTries) {
      sendWhenConnected(ws, msg, n + 1);
    } else{
      console.error("Exceed tries to send message: ", msg);
    }
  }, 10); // wait 10 milisecond for the connection...
}

const tconsole = (options) => {

  options = {
    host: "localhost",
    port: 8080,
    ...options,
  }

  const ws = new WebSocket(`ws://${options.host}:${options.port}`);


  ws.onopen = function () {
    console.log('[TCONSOLE]: connected');
  };

  console.stdlog = console.log.bind(console);

  console.log = function () {
    sendWhenConnected(ws, JSON.stringify({ type: 'log', data: Array.from(arguments) }));
    console.stdlog.apply(console, arguments);
  };

  console.error = function () {
    sendWhenConnected(ws, JSON.stringify({ type: 'error', data: Array.from(arguments) }));
    console.stdlog.apply(console, arguments);
  };

  console.defaultWarn = console.warn.bind(console);
  console.warn = function () {
    sendWhenConnected(ws, JSON.stringify({ type: 'warn', data: Array.from(arguments) }));
    console.defaultWarn.apply(console, arguments);
  };

  console.defaultDebug = console.debug.bind(console);
  console.debug = function () {
    sendWhenConnected(ws, JSON.stringify({ type: 'debug', data: Array.from(arguments) }));
    console.defaultDebug.apply(console, arguments);
  };

}

export default tconsole;
