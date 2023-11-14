"use client";
import { CONNECTION_ADDRESS, WEBSOCKET_ADDRESS } from "../settings";

export default function Home() {
  return (
    <section className="home">
      <header>
        <h1>Human Powered API</h1>
      </header>
      <main>
        <div>
          <p>Machine learning after your job?</p>{" "}
          <p>
            Start using the world&apos;s only API powered entirely by human
            intelligence!
          </p>
        </div>
        <div>
          <h2>Responding to Requests</h2>
          <span>
            Respond to requests right now using the web agent{" "}
            <a href="/agent" target="_blank">
              here
            </a>
            .
          </span>
          <span>
            Create your own agent with the{" "}
            <a href="https://www.npmjs.com/package/proxy-socks" target="_blank">
              proxy-socks
            </a>{" "}
            library and connect to the API here:{" "}
            <code>
              {WEBSOCKET_ADDRESS}
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(WEBSOCKET_ADDRESS)}
              >
                📋
              </button>
            </code>
          </span>
        </div>
        <div>
          <h2>Sending Requests</h2>
          <span>
            Use any browser or other{" "}
            <a
              href="https://github.com/johnhenry/awesome-web-client"
              target="_blank"
            >
              HTTP client
            </a>{" "}
            to send a request to this address:{" "}
            <code>
              <a href={CONNECTION_ADDRESS} target="_blank">
                {CONNECTION_ADDRESS}
              </a>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(CONNECTION_ADDRESS)
                }
              >
                📋
              </button>
            </code>
          </span>
          and [hopefully] you will recieve an elegantly crafted response from a
          random human being.
          <div>
            Example:
            <code>
              curl {CONNECTION_ADDRESS}/hello
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `curl ${CONNECTION_ADDRESS}/hello`
                  )
                }
              >
                📋
              </button>
            </code>
          </div>
        </div>
        <form action={CONNECTION_ADDRESS}>
          <h3>Send a GET request</h3>
          <textarea name="content"></textarea>
          <button>Send</button>
        </form>
        <form action={CONNECTION_ADDRESS} method="post">
          <h3>Send a POST request</h3>
          <textarea name="content"></textarea>
          <button>Send</button>
        </form>
      </main>

      <footer>
        <ul>
          <li>
            Static Frontend hosted on{" "}
            <a href="https://vercel.com/" target="_blank" title="service">
              Vercel
            </a>{" "}
            | (
            <a
              href="https://github.com/johnhenry/proxy-socks-responder"
              target="_blank"
              title="code"
            >
              code
            </a>
            )
          </li>
          <li>
            API Hosted on{" "}
            <a href="https://deno.com/deploy" target="_blank" title="service">
              Deno Deploy
            </a>{" "}
            | (
            <a
              href="https://github.com/johnhenry/proxy-socks-server"
              target="_blank"
              title="code"
            >
              code
            </a>
            )
          </li>
        </ul>
      </footer>
    </section>
  );
}
