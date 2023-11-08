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

const Server = class {
  #strategy = "first";
  #defaultHandler = null;
  #connections = [];
  #currentIndex = 0;
  #connectionsById = new Map();
  #agents = new Map();
  #id = null;
  #boundFetch = null;
  constructor(defaultHandler = () => new Response(null)) {
    this.#id = randId("proxy-");
    this.#defaultHandler = defaultHandler;
    this.#connections = [];
    this.#boundFetch = this.unBoundFetch.bind(this);
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
  unBoundFetch(request, options = {}, moreOptions = {}) {
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
  get fetch() {
    return this.#boundFetch;
  }
};

export { Server };
export default Server;