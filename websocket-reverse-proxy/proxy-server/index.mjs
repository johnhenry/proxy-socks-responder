import {
  bytesToBase64,
  base64ToBytes,
  randId,
  invertedPromise,
  doConnection,
} from "../util/index.mjs";
const serverStrategies = new Set([
  "first",
  "last-used",
  "random",
  "round-robin",
  "most-recent",
  "last",
]);

const ProxyServer = class {
  #strategy = "first";
  #defaultHandler;
  #connections = [];
  #currentIndex = 0;
  constructor(defaultHandler = () => new Response(null)) {
    this.#defaultHandler = defaultHandler;
  }
  setStrategy(newStrategy) {
    if (serverStrategies.has(newStrategy)) {
      this.#strategy = newStrategy;
    }
  }
  set strategy(newStrategy) {
    setStrategy(newStrategy);
  }
  get strategy() {
    return this.#strategy;
  }
  addConnection(connection) {
    const addIndex = this.#connections.indexOf(connection);

    if (addIndex === -1) {
      this.#connections.push(connection);
    }
    return connection;
  }
  removeConnection(connection) {
    const removeIndex = this.#connections.indexOf(connection);
    if (removeIndex === -1) {
      return;
    }
    if (this.#currentIndex > removeIndex) {
      this.#currentIndex--;
    }
    this.#connections.splice(removeIndex, 1);
    return connection;
  }
  async fetch(req) {
    try {
      if (!this.#connections.length) {
        return this.#defaultHandler(req);
      }
      switch (this.#strategy) {
        case "most-recent":
          // do nothing
          break;
        case "random":
          this.#currentIndex = Math.floor(
            Math.random() * this.#connections.length
          );
          break;
        case "round-robin":
          this.#currentIndex++;
          if (this.#currentIndex >= this.#connections.length) {
            this.#currentIndex = 0;
          }
          break;
        case "last":
          this.#currentIndex = this.#connections.length - 1;
          break;
        default:
        case "first":
          this.#currentIndex = 0;
      }
      const connection = this.#connections[this.#currentIndex];
      if (!connection) {
        return this.#defaultHandler(req);
      }
      const [response, setResponse] = invertedPromise();

      // const body = await req.text();
      // const url = new URL(req.url);
      const close = () => {
        connection.removeEventListener("message", respond);
      };
      const socketClose = () => {
        socket.removeEventListener("close", socketClose);
        socket.removeEventListener("message", socketRespond);
        close();
      };
      const socketRespond = ({ data }) => {
        connection.send(
          JSON.stringify({
            id,
            kind: "websocket",
            body: bytesToBase64(data),
            bodyKind: "base64",
          })
        );
      };
      // incoming events from server after fetch
      const respond = async (event) => {
        try {
          const data = JSON.parse(event.data);
          const { kind, payload, id: _id } = data;
          if (id !== _id) {
            return;
          }
          let body;
          let status;
          let statusText;
          let headers;
          let bodyKind;
          let socket;
          let response;
          switch (kind) {
            case "response:static":
              close();
              ({
                headers = {},
                body,
                status = 200,
                statusText = "OK",
                bodyKind,
              } = payload);
              switch (bodyKind) {
                case "base64":
                  body = base64ToBytes(body);
                  break;
              }
              response = new Response(body, { status, statusText, headers });
              setResponse(response);
              break;
            case "response:socket":
              ({ socket, response } = Deno.upgradeWebSocket(req));

              socket.addEventListener("close", socketClose);
              socket.addEventListener("message", socketRespond);
              break;
            case "response:stream":
              body = new ReadableStream({
                async start(controller) {
                  controller.enqueue(payload.body);
                },
                async pull(controller) {},
              });
              break;
            case "socket":
              ({ body, bodyKind } = payload);
              switch (bodyKind) {
                case "base64":
                  body = base64ToBytes(body);
                  break;
              }
              socket.send(body);
              break;
            case "stream":
              switch (bodyKind) {
                case "base64":
                  body = base64ToBytes(body);
                  break;
              }
              body.write(body);
              break;
            case "body?":
              // payload is one of http request body types
              if (payload === "stream") {
                connection.send(
                  JSON.stringify({
                    id,
                    kind: "body:start",
                  })
                );
                for await (const chunk of req.body) {
                  connection.send(
                    JSON.stringify({
                      id,
                      kind: "body:chunk",
                      body: bytesToBase64(chunk),
                      bodyKind: "base64",
                    })
                  );
                }
                connection.send(
                  JSON.stringify({
                    id,
                    kind: "body:end",
                  })
                );
                break;
              } else {
                switch (payload) {
                  case "blob":
                    body = base64ToBytes(new Uint8Array(await req.blob()));
                    bodyKind = "base64";
                    break;
                  // case "json":
                  //   body = await req.json();
                  //   break;
                  // case "form":
                  //   body = await req.formData();
                  //   break;
                  // TODO: I believe these will be delivered as text anyway?
                  case "text":
                  case "json":
                  case "form":
                  default:
                    body = await req.text();
                    break;
                }
                connection.send(
                  JSON.stringify({
                    id,
                    kind: "body:full",
                    body,
                    bodyKind,
                  })
                );
              }

              break;
          }
        } catch (e) {
          console.error(e);
        }
      };

      connection.addEventListener("message", respond);
      const headers = Object.fromEntries(req.headers);

      const url = req.url;
      const method = req.method;
      const id = randId();
      connection.send(
        JSON.stringify({
          kind: "request",
          id,
          payload: { url, method, headers },
        })
      );

      return response;
    } catch (e) {
      console.error(e);
    }
  }
};

export { ProxyServer };
export default { ProxyServer };

const ProxyServer2 = class {
  #strategy = "first";
  #defaultHandler = null;
  #connections = [];
  #currentIndex = 0;
  #connectionsById = new Map();
  #agents = new Map();
  #id = null;
  constructor(defaultHandler = () => new Response(null)) {
    this.#id = randId("proxy-");
    this.#defaultHandler = defaultHandler;
    this.#connections = [];
  }
  getAgent(connection, connectionId = undefined) {
    if (this.#agents.has(connection)) {
      return this.#agents.get(connection);
    } else {
      if (!connectionId) {
        throw new Error("connectionId required if connection is new");
      }
      this.#connectionsById.set(connectionId, connection);
      this.#connections.push(connection);
      const agent = doConnection(connection);
      this.#agents.set(connection, agent);
      return agent;
    }
  }
  addConnection(connection) {
    return new Promise((succeed, fail) => {
      const handshaker = (event) => {
        const { kind, agent } = JSON.parse(event.data);
        if (kind === "agent") {
          const [send] = this.getAgent(connection, agent);
          send({
            kind: "proxy",
            proxy: this.#id,
            agent,
          });
          succeed(connection);
        } else {
          connection.close();
          fail(new Error("handshake failed"));
        }
        connection.removeEventListener("message", handshaker);
      };
      connection.addEventListener("message", handshaker);
    });
  }
  findConnectionId(connection) {
    for (const [id, conn] of this.#connectionsById) {
      if (conn === connection) {
        return id;
      }
    }
  }
  findConnectionIndex(connection) {
    return this.#connections.indexOf(connection);
  }
  removeConnection(connection) {
    const id = this.findConnectionId(connection);
    if (id) {
      this.#connectionsById.delete(id);
    }
    const index = this.findConnectionIndex(connection);
    if (index !== -1) {
      this.#connections.splice(index, 1);
    }
    this.#agents.delete(connection);
  }
  removeConnectionById(id) {
    const connection = this.#connectionsById.get(id);
    if (connection) {
      this.removeConnection(connection);
    }
  }
  removeConnectionByIndex(index) {
    const connection = this.#connections[index];
    if (connection) {
      this.removeConnection(connection);
    }
  }
  getConnectionById(id) {
    return this.#connectionsById.get(id);
  }
  getConnectionByIndex(index) {
    return this.#connections[index];
  }
  setStrategy(newStrategy) {
    if (serverStrategies.has(newStrategy)) {
      this.#strategy = newStrategy;
    }
  }
  set strategy(newStrategy) {
    setStrategy(newStrategy);
  }
  get connection() {
    switch (this.#strategy) {
      case "first":
        this.#currentIndex = 0;
        break;
      case "last":
        this.#currentIndex = this.#connections.length - 1;
      case "random":
        this.#currentIndex = Math.floor(
          Math.random() * this.#connections.length
        );
        break;
      case "round-robin":
        this.#currentIndex++;
        if ((this.#currentIndex = this.#connections.length)) {
          this.#currentIndex = 0;
        }
        break;
      case "most-recent":
      default:
      // do nothing
    }
    return this.#connections[this.#currentIndex];
  }
  async commit(
    request,
    { id = randId("request-") } = { id: randId("request-") },
    callback
  ) {
    try {
      const { connection } = this;
      if (!connection) {
        return callback(this.#defaultHandler(request));
      }
      const [send, recieve] = doConnection(connection, {
        filter: (x) => x.request === id,
        transform: (x) => ({ ...x, request: id }),
      });
      send({
        kind: "request",
        payload: {
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers),
          body: !!request.body,
        },
      });
      console.table([
        {
          request: id,
          url: request.url,
          method: request.method,
          body: request.body,
          headers: JSON.stringify(Object.fromEntries(request.headers)),
        },
      ]);

      // Send body asynchronously
      if (request.body) {
        setTimeout(async () => {
          const reader = request.body.getReader();
          let { value, done } = await reader.read();

          while (!done) {
            // TODO: bail out if collection empty?
            send({
              kind: "request:body",
              payload: {
                body: bytesToBase64(value),
                bodyKind: "base64",
              },
            });
            ({ value, done } = await reader.read());
            await new Promise((succeed) => setTimeout(succeed, 1));
          }
          send({ kind: "request:body:end" });
        });
      }
      setTimeout(async () => {
        let stream = null;
        let writer = null;
        for await (const event of recieve) {
          const { kind, payload } = event;
          let body = null;
          if (kind === "response") {
            if (payload.body) {
              stream = new TransformStream();
              body = stream.readable;
              writer = stream.writable.getWriter();
            }
            callback(
              new Response(body, {
                status: payload.status,
                statusText: payload.statusText,
                headers: payload.headers,
              })
            );
          } else if (kind === "response:body") {
            writer?.write(
              payload.bodyKind === "base64"
                ? base64ToBytes(payload.body)
                : payload.body
            );
          } else if (kind === "response:end" || kind === "response:body:end") {
            writer?.close();
            break;
          }
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
  fetch(request, options = {}, moreOptions = {}) {
    let req;
    let opts;
    if (!request instanceof Request) {
      if (typeof request !== "string") {
        throw new error("req must be a string or Request");
      }
      req = new Request(request, options);
      opts = moreOptions;
    } else {
      req = request;
      opts = { options, ...moreOptions };
    }
    const [response, callback] = invertedPromise();
    this.commit(req, opts, callback);
    return response;
  }
  get boundFetch() {
    return this.fetch.bind(this);
  }
};

export { ProxyServer2 };
