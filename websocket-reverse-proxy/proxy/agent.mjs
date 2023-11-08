import {
  bytesToBase64,
  base64ToBytes,
  invertedPromise,
  doConnection,
  randId,
} from "../util/index.mjs";

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

const upgradeWebSocket = (req) => {
  const response = new Response(null, { websocket: true });
};
export { Agent, upgradeWebSocket };

export default Agent;
