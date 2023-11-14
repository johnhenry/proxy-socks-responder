"use client";
import { CONNECTION_ADDRESS, WEBSOCKET_ADDRESS } from "../settings";

export default function Home() {
  return (
    <section className="home">
      <header>
        <h1>Human Powered API</h1>
      </header>

      <div>
        Machine learning got your job? Start using the world`&apos;`s only API
        powered entirely by human intelligence.
      </div>
      <div>
        <h2>Sending Requests</h2>
        <span>
          Use any browser or{" "}
          <a
            href="https://github.com/johnhenry/awesome-web-client"
            target="_blank"
          >
            HTTP client
          </a>{" "}
          to send a request to this address:
        </span>
        <code>
          <a href={CONNECTION_ADDRESS} target="_blank">
            {CONNECTION_ADDRESS}
          </a>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(CONNECTION_ADDRESS)}
          >
            📋
          </button>
        </code>
        and [hopefully] you will recieve an elegantly crafted response from a
        random human being.
        <br />
        Example:
        <code>curl {CONNECTION_ADDRESS}/hello</code>
      </div>
      <div>
        <h2>Responding to Requests</h2>
        <span>
          Visit:{" "}
          <a href="/agent" target="_blank">
            /agent
          </a>{" "}
          to respond to incoming requests using the web agent.
        </span>
        <span>
          OR use this address:
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
        <span>
          and the{" "}
          <a
            href="https://github.com/johnhenry/awesome-web-client"
            target="_blank"
          >
            proxy-socks
          </a>{" "}
          library to create your own client.
        </span>
      </div>

      <footer>
        <ul>
          <li>
            Static Frontend hosted on{" "}
            <a href="https://vercel.com/" target="blank">
              Vercel
            </a>{" "}
            (
            <a
              href="https://github.com/johnhenry/proxy-socks-responder"
              target="blank"
            >
              code
            </a>
            )
          </li>
          <li>
            API Hosted on{" "}
            <a href="https://deno.com/deploy" target="blank">
              Deno Deploy
            </a>{" "}
            (
            <a
              href="https://github.com/johnhenry/proxy-socks-server"
              target="blank"
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
