const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 3456;

const configure = (conn, defaultConsole) => {
  // skip if already configured
  if (console._tsconsole_configured) return;
  console._tsconsole_configured = true;

  console.log = (...args) => {
    sendWhenConnected(conn, JSON.stringify({ type: 'log', data: Array.from(args) }), defaultConsole);
    defaultConsole.log.apply(defaultConsole, args);
  };

  console.info = (...args) => {
    sendWhenConnected(conn, JSON.stringify({ type: 'info', data: Array.from(args) }), defaultConsole);
    defaultConsole.info.apply(defaultConsole, args);
  };

  console.error = (...args) => {
    sendWhenConnected(conn, JSON.stringify({ type: 'error', data: Array.from(args) }), defaultConsole);
    defaultConsole.error.apply(defaultConsole, args);
  };

  console.warn = (...args) => {
    sendWhenConnected(conn, JSON.stringify({ type: 'warn', data: Array.from(args) }), defaultConsole);
    defaultConsole.warn.apply(defaultConsole, args);
  };

  console.debug = (...args) => {
    sendWhenConnected(conn, JSON.stringify({ type: 'debug', data: Array.from(args) }), defaultConsole);
    defaultConsole.debug.apply(defaultConsole, args);
  };

}

const release = (defaultConsole) => {
  console = defaultConsole;
  console._tsconsole_configured = false;
  if (typeof ws !== 'undefined') {
    ws = null;
  }
}

const termlog = (options = {}) => {

  options = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    ssl: false,
    disableEnvironmentCheck: false,
    ...options,
  }

  // Ensure tconsole doesn't run in production mode
  if (
    !options.disableEnvironmentCheck
    && process
    && process.env.NODE_ENV
    && process.env.NODE_ENV !== 'development'
  ) {
    return;
  }

  const defaultConsole = Object.assign(Object.create(Object.getPrototypeOf(console)), console);

  const ws = new WebSocket(`${options.ssl ? "wss" : "ws"}://${options.host}:${options.port}`);

  configure(ws, defaultConsole);

  ws.onopen = () => {
    console.log('[TERMLOG]: Connected');
  };

  ws.onclose = (event) => {
    release(defaultConsole);
    console.log("[TERMLOG]: Disconnected", event.message);
  }

  ws.onerror = (event) => {
    release(defaultConsole);
    console.error("[TERMLOG]: Disconnected", event.message);
  }
}


// *** Utils *** //
const sendWhenConnected = (ws, msg, defaultConsole, n = 0, maxTries = 100) => {
  // Closing or closed
  if (ws.readyState === 2 || ws.readyState === 3) return;

  // try sending
  setTimeout(() => {
    if (ws.readyState === 1) {
      ws.send(msg);
    } else if (n < maxTries) {
      sendWhenConnected(ws, msg, defaultConsole, n + 1);
    } else{
      defaultConsole.error("Exceed tries to send message: ", msg);
    }
  }, 10); // wait 10 milisecond for the connection...
}

export default termlog;
