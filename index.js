let ws = null;

// https://stackoverflow.com/a/44782052/7539840
const defaultConsole = Object.assign(Object.create(Object.getPrototypeOf(console)), console);

const configure = (conn) => {
  // already configured
  if (console.stdlog) return;

  console.log = (...args) => {
    sendWhenConnected(conn, JSON.stringify({ type: 'log', data: Array.from(args) }));
    defaultConsole.log.apply(defaultConsole, args);
  };

  console.error = (...args) => {
    sendWhenConnected(conn, JSON.stringify({ type: 'error', data: Array.from(args) }));
    defaultConsole.error.apply(defaultConsole, args);
  };

  console.warn = (...args) => {
    sendWhenConnected(conn, JSON.stringify({ type: 'warn', data: Array.from(args) }));
    defaultConsole.warn.apply(defaultConsole, args);
  };

  console.debug = (...args) => {
    sendWhenConnected(conn, JSON.stringify({ type: 'debug', data: Array.from(args) }));
    defaultConsole.debug.apply(defaultConsole, args);
  };

  console.log("[TCONSOLE] CONFIGURED");
}

const release = () => {
  console = defaultConsole;
  console.log("[TCONSOLE]: Released");
  ws = null;
}

const tconsole = (options = {}) => {
  if (ws) return; // already running

  options = {
    host: "localhost",
    port: 8080,
    ...options,
  }

  ws = new WebSocket(`ws://${options.host}:${options.port}`);
  ws.onopen = () => {
    console.log('[TCONSOLE]: connected');
    configure(ws);
  };

  ws.onclose = (event) => {
    release();
    console.log("[TCONSOLE]: Disconnected", event.message);
  }

  ws.onerror = (event) => {
    release();
    console.error("[TCONSOLE]: Disconnected", event.message);
  }
}


// *** Utils *** //
const sendWhenConnected = (ws, msg, n = 0, maxTries = 100) => {
  // Closing or closed
  if (ws.readyState === 2 || ws.readyState === 3) return;

  // try sending
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

export default tconsole;
