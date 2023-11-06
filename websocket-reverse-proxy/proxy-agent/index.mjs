import {
  bytesToBase64,
  base64ToBytes,
  invertedPromise,
  doConnection,
  randId,
} from "../util/index.mjs";
const RemoteRequest = class {
  #url = null;
  #method = "GET";
  #headers = {};
  #onemit = () => {};
  #await = null;
  constructor(url, { method, headers } = { method: "GET", headers: {} }) {
    this.#url = url;
    this.#method = method;
    this.#headers = headers;
  }
  get url() {
    return this.#url;
  }
  get method() {
    return this.#method;
  }
  get headers() {
    return this.#headers;
  }
  set _onemit(callback) {
    this.#onemit = callback;
  }
  _awaited(data) {
    this.#await(data);
  }
  text() {
    return this._body("text");
  }
  async json() {
    return JSON.parse(await this._body("json"));
  }
  async formData() {
    return new URLSearchParams(await this._body("form"));
  }
  async blob() {
    return this._body("blob");
  }
  async blob() {
    return this._body("stream");
  }
  arrayBuffer() {}
  _body(payload) {
    const [body, setBody] = invertedPromise();
    this.#await = setBody;
    this.#onemit({ kind: "body?", payload });
    return body.then(({ body, bodyType }) => {
      switch (bodyType) {
        case "base64":
          body = base64ToBytes(body);
          break;
        default:
      }
      return body;
    });
  }
  toString() {
    return JSON.stringify({
      url: this.#url,
      method: this.#method,
      headers: this.#headers,
    });
  }
  inspect() {
    return this.toString();
  }
};

// body: ReadableStream { locked: false },
// bodyUsed: false,
// headers: Headers { "content-type": "text/plain;charset=UTF-8" },
// ok: true,
// redirected: false,
// status: 200,
// statusText: "",
// url: ""

const RemoteResponse = class {
  #body = null;
  #bodyKind = undefined;
  #headers = {};
  #status = 200;
  #statusText = "OK";
  #stream = false;
  #websocket = false;
  constructor(
    body = null,
    { statusText, status, headers } = {
      statusText: "OK",
      status: 200,
      headers: {},
    },
    { streamng = false, websocket = false } = {
      streamng: false,
      websocket: false,
    }
  ) {
    this.#body = body;

    switch (true) {
      case body instanceof ReadableStream:
        this.#stream = true;
        break;
      case body instanceof Uint8Array:
        this.#bodyKind = "base64";
        this.#body = bytesToBase64(body);
        break;
    }

    this.#status = status;
    this.#statusText = statusText;
    this.#headers = headers || {};
  }
  get body() {
    return this.#body;
  }
  get bodyKind() {
    return this.#bodyKind;
  }
  get headers() {
    return this.#headers;
  }
  get status() {
    return this.#status;
  }
  get statusText() {
    return this.#statusText;
  }
  get stream() {
    return this.#stream;
  }
  get websocket() {
    return this.#websocket;
  }
};

const upgradeWebSocket = (req) => {
  const response = new RemoteResponse(null, { websocket: true });
};

const serve = ({ connection = null } = { connection: null }, handler) => {
  if (!connection) {
    throw new Error("no connection");
  }
  const activeRequests = new Map();
  connection.addEventListener("message", async (event) => {
    try {
      const data = JSON.parse(event.data);
      const { id, kind, payload, body, bodyKind } = data;
      const { url, method, headers } = payload ?? {};
      let request;
      let response;
      if (kind === "request") {
        request = new RemoteRequest(url, { method, headers });
        activeRequests.set(id, request);
        request._onemit = async (emitted) => {
          connection.send(JSON.stringify({ id, ...emitted }));
        };

        response = await handler(request);
        if (!response) {
          response = new RemoteResponse();
        }

        const resObject = {
          kind: "response:static",
          payload: {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText,
            body: response.body,
            bodyKind: response.bodyKind,
            websocket: false,
            streaming: false,
          },
        };

        if (response.websocket) {
          resObject.kind = "response:socket";
        }

        if (response.stream) {
          resObject.kind = "response:stream";
        }
        if (response.body !== null && response.body !== undefined) {
          switch (response.bodyKind) {
            case "base64":
              resObject.payload.body = base64ToBytes(resObject.payload.body);
              break;
            default:
          }
        }
        connection.send(JSON.stringify({ id, ...resObject }));
        return;
      } else {
        switch (kind) {
          case "websocket":
            request._awaited({ kind, body, bodyKind });
            break;
          case "body:full":
            request = activeRequests.get(id);
            request._awaited({ body, bodyKind });
            break;
          case "body:start":
            request.setBodyStart();
            break;
          case "body:chunk":
            request._awaited({ body, bodyKind });
            break;
          case "body:end":
            request.setBodyEnd();
            break;
          default:
            break;
        }
      }
    } catch (e) {
      console.error(e);
    }
  });
};
export { serve, upgradeWebSocket, RemoteResponse, RemoteRequest };

export default serve;

const Agent = class {
  #connection = null;
  #id = null;
  #sessions = null;
  #send = null;
  #recieve = null;
  #reconnect = undefined;
  #handler = () => new Response("empty responder", { status: 500 });
  constructor(address, { reconnect } = {}) {
    this.#reconnect = reconnect;
    this.#id = randId("agent-");
    this.#sessions = new Map();
    console.log("AgentID", this.#id);
    this.#connection = this.createConnection(address);
  }
  createConnection(address) {
    return new Promise((success) => {
      const connection = new WebSocket(address);
      const handshaker = () => {
        const [send, recieve] = doConnection(connection);
        send({
          kind: "agent",
          agent: this.#id,
        });
        this.#send = send;
        this.#recieve = recieve;
        setTimeout(async () => {
          let stream = null;
          let send, recieve;
          for await (const message of this.#recieve) {
            const { kind, id, payload, request: req } = message;
            if (kind === "request") {
              let response;
              [send, recieve] = doConnection(connection, {
                filter: (x) => x.request === req,
                transform: (x) => ({ ...x, request: req }),
              });
              let body = null;
              if (payload.body) {
                stream = new TransformStream();
                body = stream.readable;
                setTimeout(async () => {
                  const writer = stream.writable.getWriter();
                  for await (const message of recieve) {
                    const { kind, payload } = message;
                    if (kind === "request:body") {
                      writer?.write(
                        payload.bodyKind === "base64"
                          ? base64ToBytes(payload.body)
                          : payload.body
                      );
                    } else if (
                      kind === "request:body:end" ||
                      kind === "request:end"
                    ) {
                      writer?.close();
                    } else if (kind === "response:body?") {
                      // read response body
                      const res = await response;
                      const reader = res.body.getReader();
                      let value, done;
                      while (!done) {
                        // TODO: bail out if collection empty?
                        ({ value, done } = await reader.read());
                        send({
                          kind: "response:body",
                          payload: {
                            body: bytesToBase64(value),
                            bodyKind: "base64",
                          },
                        });
                      }
                      //reader.close();
                      send({ kind: "response:body:end" });
                    }
                  }
                });
              }
              const request = new Request(payload.url, {
                method: payload.method,
                headers: payload.headers,
                body: body,
              });
              response = this.#handler(request);
              this.#sessions.set(id, {
                send,
                recieve,
                request,
                response,
              });
              response.then((response) => {
                const session = this.#sessions.get(id);
                this.#sessions.set(id, {
                  ...session,
                  response,
                });
                send({
                  kind: "response",
                  payload: {
                    url: request.url,
                    method: request.method,
                    headers: Object.fromEntries(request.headers),
                    body: !!response.body,
                  },
                });
                if (response.body) {
                  setTimeout(async () => {
                    const reader = response.body.getReader();
                    let { value, done } = await reader.read();
                    while (!done) {
                      // TODO: bail out if collection empty?
                      send({
                        kind: "response:body",
                        payload: {
                          body: bytesToBase64(value),
                          bodyKind: "base64",
                        },
                      });
                      ({ value, done } = await reader.read());
                      await new Promise((success) => setTimeout(success, 1000));
                    }
                    send({ kind: "response:body:end" });
                  });
                }
              });
            }
          }
        });
        success(connection);
      };
      const closer = () => {
        console.log(`reconnecting in ${this.#reconnect} ms`);
        if (this.#reconnect !== undefined) {
          this.#connection = new Promise(async (success) => {
            await new Promise((success) =>
              setTimeout(success, this.#reconnect)
            );
            success(this.createConnection(address));
          });
        }
      };
      connection.addEventListener("open", handshaker);
      connection.addEventListener("close", closer);
    });
  }
  get connection() {
    return this.#connection;
  }
  serve(handler) {
    this.#handler = handler;
  }
  get boundServe() {
    return this.serve.bind(this);
  }
};

export { Agent };
