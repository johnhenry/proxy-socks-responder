import { useState } from "react";

import type { BodyPlugin } from "./body-plugins/types.d";
import type { ResponsePlugin } from "./response-plugins/types.d";
import type { Session } from "./types.d";
import * as BPlugins from "./body-plugins/index";
import * as RPlugins from "./response-plugins/index";

const bodyPlugins: BodyPlugin[] = [...Object.values(BPlugins)];
const responsePlugins: ResponsePlugin[] = [...Object.values(RPlugins)];

const PluginChoices = ({
  request,
  setPlugin,
  plugins,
}: {
  request: Request;
  setPlugin: Function;
  plugins: (BodyPlugin | ResponsePlugin)[];
}) => (
  <div>
    {plugins
      .filter((plugin: BodyPlugin | ResponsePlugin) => {
        return typeof plugin.recommend !== "function"
          ? plugin.recommend ?? true
          : plugin.recommend(request);
      })
      .map((plugin: BodyPlugin | ResponsePlugin) => {
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
  </div>
);

const RenderBody = ({
  plugin,
  request,
  setPlugin,
}: {
  plugin?: BodyPlugin;
  request: Request;
  setPlugin: Function;
}) => {
  if (!request.body) {
    return null;
  }
  if (!plugin) {
    return PluginChoices({
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
  session,
  setPlugin,
  respondWith,
  advance,
}: {
  plugin?: ResponsePlugin;
  session: Session;
  setPlugin: Function;
  respondWith: Function;
  advance: Function;
}) => {
  const { request, status: sessionStatus } = session;
  if (!plugin) {
    return PluginChoices({
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
        advance,
        sessionStatus,
      });
};

const OpenSession = ({
  session,
  currentSessionId,
  close,
  remove,
  advance,
}: {
  session: Session;
  currentSessionId: string | undefined;
  close: Function;
  remove: Function;
  advance: Function;
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
      <header>
        <button
          type="button"
          className="minimizer"
          onClick={() => close()}
        ></button>{" "}
        <button
          type="button"
          className="closer"
          onClick={() => remove()}
        ></button>
        {session.id}
        {session.status === 0
          ? " (pending)"
          : session.status === 1
          ? " (responded)"
          : session.status === 2
          ? " (complete)"
          : " (error)"}
      </header>
      <p>
        {session.method} {session.url.protocol}&#47;&#47;
        {session.url.host}
        {session.url.pathname}
      </p>
      <details open>
        <summary>Headers</summary>
        <ul>
          {Array.from(session.request.headers).map(([key, value]) => (
            <li key={key}>
              {key}: {value}
            </li>
          ))}
        </ul>
      </details>
      {Array.from(session.url.searchParams).length ? (
        <details open>
          <summary>Search</summary>
          <ul>
            {Array.from(session.url.searchParams).map(([key, value]) => (
              <li key={key}>
                {key}: {value}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <details open>
        <summary>Body</summary>
        {session.request.body && (
          <RenderBody
            plugin={bodyPlugin}
            request={session.request}
            setPlugin={setBodyPlugin}
          />
        )}
      </details>
      <details open>
        <summary>Response</summary>
        <RenderResponder
          plugin={responsePlugin}
          session={session}
          setPlugin={setResponsePlugin}
          respondWith={session.respondWith}
          advance={advance}
        />
      </details>
    </div>
  );
};

export { OpenSession };

export default OpenSession;
