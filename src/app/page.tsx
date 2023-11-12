"use client";
import { useState, useEffect } from "react";
import { Agent } from "../../websocket-reverse-proxy/proxy/index.mjs";
import { invertedPromise } from "../../websocket-reverse-proxy/util/index.mjs";
import { PORTS } from "../../websocket-reverse-proxy/settings.mjs";

import { TablePlus } from "./table-plus";
import { HeaderRenderer } from "./utils";
import * as BPlugins from "./body-plugins/index";
import * as RPlugins from "./response-plugins/index";

import type { BodyPlugin } from "./body-plugins/types.d";
import type { ResponsePlugin } from "./response-plugins/types.d";

const bodyPlugins: BodyPlugin[] = [...Object.values(BPlugins)];
const responsePlugins: ResponsePlugin[] = [...Object.values(RPlugins)];

const PluginChoices = ({
  request,
  setPlugin,
  title,
  plugins,
}: {
  request: Request;
  setPlugin: Function;
  title: string;
  plugins: (BodyPlugin | ResponsePlugin)[];
}) => (
  <div>
    {title}:
    {plugins
      .filter((plugin: ResponsePlugin) => {
        return typeof plugin.recommend !== "function"
          ? plugin.recommend ?? true
          : plugin.recommend(request);
      })
      .map((plugin: ResponsePlugin) => {
        return (
          <button
            key={plugin.name}
            type="button"
            onClick={() => setPlugin(plugin)}
          >
            {plugin.name}
          </button>
        );
      })}
    <label>
      <input type="checkbox" placeholder="null" name="recommended" /> Show only
      recommended plugins
    </label>
  </div>
);

const RenderBody = ({
  plugin,
  request,
  setPlugin,
}: {
  plugin?: ResponsePlugin;
  request: Request;
  setPlugin: Function;
}) => {
  if (!plugin) {
    return PluginChoices({
      title: "Body",
      request,
      setPlugin,
      plugins: bodyPlugins,
    });
  }
  return typeof plugin.Render !== "function"
    ? plugin.Render
    : plugin.Render(request);
};

const RenderResponder = ({
  plugin,
  request,
  setPlugin,
  respondWith,
}: {
  plugin?: ResponsePlugin;
  request: Request;
  setPlugin: Function;
  respondWith: Function;
}) => {
  if (!plugin) {
    return PluginChoices({
      title: "Response",
      request,
      setPlugin,
      plugins: responsePlugins,
    });
  }

  const initialStatus =
    typeof plugin.initialStatus !== "function"
      ? plugin.initialStatus ?? 200
      : plugin.initialStatus(request);
  const initialStatusText =
    typeof plugin.initialStatusText !== "function"
      ? plugin.initialStatusText ?? "OK"
      : plugin.initialStatusText(request);
  const initialHeaders =
    typeof plugin.initialHeaders !== "function"
      ? plugin.initialHeaders ?? {}
      : plugin.initialHeaders(request);
  const initialBody =
    typeof plugin.initialBody !== "function"
      ? plugin.initialBody ?? null
      : plugin.initialBody(request);
  return typeof plugin.Render !== "function"
    ? plugin.Render
    : plugin.Render({
        request,
        initialStatus,
        initialStatusText,
        initialHeaders,
        initialBody,
        setPlugin,
        respondWith,
      });
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

type ColumnHeader = {
  id: string;
  display: string;
  sort?: number;
};

type Session = {
  id: string;
  request: Request;
  response: Promise<Response>;
  respondWith: Function;
};

type TransformedSession = Session & {
  url: URL;
  method: string;
  path: string;
  start: number;
  headers: JSX.Element;
  searchParams: URLSearchParams;
  headersRendered: JSX.Element;
};

const expandSession = (session: Session) => {
  const { request } = session;
  const { url, headers, body } = request;
  const Url = new URL(url);

  const headerArray = Array.from(headers);

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
    ...session,
    url: Url,
    // Path Params
    method: request.method,
    path: Url.pathname,

    body: !!body,
    // Timing
    start: Date.now(),
    end: null,
    // UI
    headersRendered: <div title={displayHeades}>{headersDisplay}</div>,
    // Invisible
    searchParams: Url.searchParams,
  };
};

const DEFAULT_HEADERS = [
  {
    id: "id",
    display: "ID",
  },
  {
    id: "method",
    display: "Method",
  },
  {
    id: "path",
    display: "Path",
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
    id: "headersRendered",
    display: "Headers",
  },
  {
    id: "start",
    display: "Start",
  },
];

const OpenSession = ({
  session,
  currentSessionId,
  setCurrentSession,
}: {
  session: TransformedSession;
  currentSessionId: string | undefined;
  setCurrentSession: Function;
}) => {
  const [bodyPlugin, setBodyPlugin] = useState<BodyPlugin | undefined>(
    undefined
  );
  const [responsePlugin, setResponsePlugin] = useState<
    ResponsePlugin | undefined
  >(undefined);

  return (
    <div
      key={session.id}
      className={`session-panel${
        session.id === currentSessionId ? " showing" : ""
      }`}
    >
      <div>
        <h2>
          {session.method} {session.url.protocol}&#47;&#47;
          {session.url.host}
          {session.url.pathname}
        </h2>

        <h3>Headers</h3>
        <ul>
          {Array.from(session.request.headers).map(([key, value]) => (
            <li key={key}>
              {key}: {value}
            </li>
          ))}
        </ul>
        <h3>Search</h3>
        <ul>
          {Array.from(session.url.searchParams).map(([key, value]) => (
            <li key={key}>
              {key}: {value}
            </li>
          ))}
        </ul>
        <hr style={{ borderStyle: "dashed" }}></hr>
        <RenderBody
          plugin={bodyPlugin}
          request={session.request}
          setPlugin={setBodyPlugin}
        />
      </div>
      <hr></hr>
      <div>
        <RenderResponder
          plugin={responsePlugin}
          request={session.request}
          setPlugin={setResponsePlugin}
          respondWith={session.respondWith}
        />
      </div>
      <button
        type="button"
        className="closer"
        onClick={() => {
          setCurrentSession(undefined);
        }}
      ></button>
    </div>
  );
};

export default function Home() {
  const [sessions, setSessions] = useState<TransformedSession[]>([]);
  const [currentSession, setCurrentSession] = useState<
    TransformedSession | undefined
  >(undefined);
  const [headers, setHeaders] = useState<ColumnHeader[]>(DEFAULT_HEADERS);
  const transformedSessions = sessions.map(expandSession);
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
    const { serve } = new Agent(address);
    serve(async (request: Request, { id }: { id: string }) => {
      try {
        const [response, respondWith] = invertedPromise();
        setSessions((previous: Session[]) => [
          ...previous,
          { id, request, response, respondWith },
        ]);
        return response;
      } catch (e) {
        console.error(e);
      }
    });
    return () => {};
  }, []);

  return (
    <main>
      <section>
        <TablePlus
          headers={headers}
          data={transformedSessions}
          headerClick={(e: any) => updateSort(e.head)}
          recordClick={(e: any) => {
            setCurrentSession(e.session);
          }}
        />

        {transformedSessions.map((session: TransformedSession) => {
          return (
            <OpenSession
              key={session.id}
              session={session}
              currentSessionId={currentSession?.id}
              setCurrentSession={setCurrentSession}
            />
          );
        })}
      </section>
    </main>
  );
}
