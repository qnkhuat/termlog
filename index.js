const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 3456;
let ws = null;

const configure = (conn, defaultConsole) => {
  // skip if already configured
  if (console._tsconsole_configured) return;
  console._tsconsole_configured = true;

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

}

const release = (defaultConsole) => {
  console = defaultConsole;
  ws = null;
}

const termsole = (options = {}) => {
  // Ensure termsole doesn't run in production mode
  if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') return;

  if (ws) {
    console.log("already running");
    return; // already running
  }  
  const defaultConsole = Object.assign(Object.create(Object.getPrototypeOf(console)), console);

  options = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    ssl: false,
    ...options,
  }

  ws = new WebSocket(`${options.ssl ? "wss" : "ws"}://${options.host}:${options.port}`);
  ws.onopen = () => {
    configure(ws, defaultConsole);
    console.log('[TCONSOLE]: Connected');
  };

  ws.onclose = (event) => {
    release(defaultConsole);
    console.log("[TCONSOLE]: Disconnected", event.message);
  }

  ws.onerror = (event) => {
    release(defaultConsole);
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

export default termsole;
