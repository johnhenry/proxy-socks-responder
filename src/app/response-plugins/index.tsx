import { useEffect, useState } from "react";

import type { ResponsePlugin } from "./types";

const objToArry = (obj: any) => Object.keys(obj).map((key) => [key, obj[key]]);

const responsePluginOK: ResponsePlugin = {
  name: "OK:200",
  initialHeaders: { alpha: "beta" },
  Render(options) {
    const {
      request,
      initialHeaders,
      initialStatus,
      initialBody,
      setPlugin,
      respondWith,
    } = options!;
    const [status, setStatus] = useState(initialStatus);
    const [body, setBody] = useState(initialBody);
    const [headers, setHeaders] = useState<[any, any][]>(
      objToArry(initialHeaders)
    );

    return (
      <div>
        <h2>
          Status{" "}
          <input
            title="status"
            defaultValue={status}
            onChange={(e) => {
              setStatus(e.target.value);
            }}
          />
        </h2>
        <h2>headers </h2>
        <ul>
          {headers.map(([key, value], index) => {
            return (
              <li key={index}>
                <input
                  defaultValue={key}
                  placeholder="header name"
                  onChange={(e) => {
                    setHeaders((headers) => {
                      headers.splice(index, 1, [e.target.value, value]);
                      return headers;
                    });
                  }}
                />
                :{" "}
                <input
                  defaultValue={value}
                  placeholder="header value"
                  onChange={(e) => {
                    setHeaders((headers) => {
                      headers.splice(index, 1, [key, e.target.value]);
                      return headers;
                    });
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setHeaders(headers.filter((_, i) => i !== index));
                  }}
                >
                  x
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => {
            setHeaders([...headers, ["", ""]]);
          }}
        >
          +
        </button>
        <textarea
          placeholder="body"
          defaultValue={body}
          onChange={(e) => {
            setBody(e.target.value);
          }}
        />
        <button type="button" onClick={() => setPlugin(undefined)}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            respondWith(
              new Response(body, {
                status: Number(status),
                headers: Object.fromEntries(headers),
              })
            );
          }}
        >
          Send
        </button>
      </div>
    );
  },
};

const responsePluginAbort: ResponsePlugin = {
  name: "abort",
  Render(options) {
    const { respondWith } = options!;
    useEffect(() => {
      respondWith(undefined);
    });
    return null;
  },
};

export { responsePluginOK, responsePluginAbort };
