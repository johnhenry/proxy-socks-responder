"use client";
import { useState, useEffect } from "react";

import {
  serve,
  RemoteResponse as Response,
} from "../../websocket-reverse-proxy/proxy-agent/index.mjs";
import { invertedPromise } from "../../websocket-reverse-proxy/util/index.mjs";

import { PORTS } from "../../websocket-reverse-proxy/settings.mjs";

const HeaderRenderer = ({ headers = {} } = { headers: {} }) => {
  return (
    <table>
      <tbody>
        {Object.entries(headers).map(([key, value]) => (
          <tr key={key}>
            <td>{key}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "session-panel": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
    interface IntrinsicElements {
      "session-table": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

/*
let o;
let ts
ts = new TransformStream({});
ts.writable.getWriter().write("input");
const request = new Request("/myEndpoint", {
  method: "POST",
  body: ts.readable,
  duplex: "half"
});
o = await request.body.getReader().read();
console.log(o);
ts = new TransformStream({});
ts.writable.getWriter().write("output");
const response = new Response(ts.readable);
o = await response.body.getReader().read();
console.log(o);
*/

import { TablePlus } from "./table-plus";
const SESSIONS = [
  {
    method: "a-POST",
    path: "c-http://localhost:8080/v1/health",
    headers: "b-",
    session: {
      request: {},
      response: {},
    },
  },
  {
    method: "c-POST",
    path: "a-http://localhost:8080/v1/health",
    headers: "c-",
    session: {
      request: {},
      response: {},
    },
  },
  {
    method: "b-POST",
    path: "b-http://localhost:8080/v1/health",
    headers: "a-",
    session: {
      request: {},
      response: {},
    },
  },
];

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [headers, setHeaders] = useState([
    {
      id: "method",
      display: "Method",
    },
    {
      id: "path",
      display: "Path",
    },
    {
      id: "url",
      display: "URL",
    },
    {
      id: "protocol",
      display: "Protocol",
    },
    {
      id: "origin",
      display: "Origin",
    },
    {
      id: "headers",
      display: "Headers",
    },
    {
      id: "start",
      display: "Start",
    },
  ]);

  const transformedSessions = sessions.map((session: any) => {
    const {
      request: { method, url, headers },
    } = session;
    const Url = new URL(url);

    const headerArray = Array.from(Object.entries(headers));

    const displayHeades = headerArray
      .map(([key, value]) => {
        return `${key}: ${value}`;
      })
      .join("\n");
    let headersDisplay = "...";
    switch (headerArray.length) {
      case 0:
        break;
      case 1:
        headersDisplay = `${headerArray[0][0]}:${headerArray[0][1]}`;
        break;

      default:
        headersDisplay = `${headerArray[0][0]}:${headerArray[0][1]} (... and ${
          headerArray.length - 1
        } more)`;
    }

    return {
      method,
      // Path Params
      path: Url.pathname,
      url: Url.href,
      host: Url.host,
      hostname: Url.hostname,
      origin: Url.origin,
      password: Url.password,
      port: Url.port,
      protocol: Url.protocol,
      search: Url.search,
      username: Url.username,
      // Timing
      start: Date.now(),
      // UI
      headers: <div title={displayHeades}>{headersDisplay}</div>,
      // Invisible
      searchParams: Url.searchParams,
      ...session,
    };
  });

  const updateSort = (id: string) => {
    let maxSort = 0;
    let targetSort = 0;
    let targetIndex = 0;
    let index = 0;
    for (const item of headers) {
      maxSort = Math.max(maxSort, Math.abs(item.sort || 0));
      if (item.id === id) {
        targetSort = item.sort || 0;
        targetIndex = index;
      }
      index++;
    }
    const multiplier = targetSort < 0 ? 1 : -1;
    headers[targetIndex].sort = (maxSort + 1) * multiplier;
    setHeaders([...headers]);
  };

  useEffect(() => {
    const address = `ws://localhost:${PORTS.HANDLING}`;
    const connection = new WebSocket(address);
    serve({ connection } as any, async (request: any) => {
      try {
        const [response, setResponse] = invertedPromise();
        setSessions((previous) => [
          ...previous,
          { request, response, setResponse },
        ]);
        return response;
      } catch (e) {
        console.error(e);
      }
    });
    return () => {
      connection.close();
    };
  }, []);

  return (
    <main>
      <section>
        <TablePlus
          headers={headers}
          data={transformedSessions}
          headerClick={(e) => updateSort(e.head)}
          recordClick={(e) => setCurrentSession(e.session)}
        />
        {currentSession && (
          <session-panel>
            <div>
              <h2>Incoming: </h2>
              <h3>
                {currentSession.method}{" "}
                <abbr title={currentSession.url}>{currentSession.path}</abbr>
              </h3>
              <canvas
                style={{
                  display: "block",
                  width: "100%",
                  height: "64px",
                  backgroundColor: "black",
                }}
              ></canvas>

              <h3>Incoming Headers</h3>
              <HeaderRenderer headers={currentSession.request.headers} />

              <h3>Incoming Body</h3>
              <button type="button">load body</button>
            </div>
            <div>
              <h2>Outgoing</h2>

              <h3>
                <label>
                  Status: <input placeholder="status code" defaultValue={200} />
                </label>
                <label>
                  Status Text:{" "}
                  <input placeholder="status text" defaultValue={"OK"} />
                </label>
              </h3>
              <h3>Outgoing Headers</h3>
              <ul>
                <li>
                  <input name="" title="?" />:<input name="" title="?" />
                </li>
                <li>
                  <input name="" title="?" />:<input name="" title="?" />
                </li>
              </ul>
            </div>
            <div>
              <h3>Outgoing Body</h3>
            </div>
            <button
              className="closer"
              title="set"
              type="button"
              onClick={() => setCurrentSession(null)}
            ></button>
            <textarea title="body"></textarea>
            <br />
            <button title="">+</button> <button title="">ws</button>{" "}
            <button title="">sse</button> <button title="">stream</button>
            <br></br>
            <button type="button">Cancel</button>
            <button type="button">Send</button>
          </session-panel>
        )}
      </section>
    </main>
  );
}
