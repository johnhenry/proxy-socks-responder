import { useEffect, useState } from "react";

import type { ResponsePlugin } from "./types.d";

import { statusCodes } from "./statusCodes";

const objToArry = (obj: any) => Object.keys(obj).map((key) => [key, obj[key]]);

// List of All HTTP Status Codes and their meanings

const DynamicHeaders = ({
  headers,
  setHeaders,
}: {
  headers: [any][][];
  setHeaders: Function;
}) => (
  <>
    <ul>
      {headers.map(([key, value], index) => {
        return (
          <li key={index}>
            <input
              defaultValue={key}
              placeholder="header name"
              onChange={(e) => {
                setHeaders((headers: any[][]) => {
                  headers.splice(index, 1, [e.target.value, value]);
                  return [...headers];
                });
              }}
            />
            :{" "}
            <input
              defaultValue={value}
              placeholder="header value"
              onChange={(e) => {
                setHeaders((headers: [any, any][]) => {
                  headers.splice(index, 1, [key, e.target.value]);
                  return [...headers];
                });
              }}
            />
            <button
              type="button"
              onClick={() => {
                setHeaders([...headers.filter((_, i) => i !== index)]);
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
  </>
);

const StaticHeaders = ({ headers }: { headers: any[][] }) => (
  <ul>
    {headers.map(([key, value], index) => {
      return (
        <li key={index}>
          {key}:{value}
        </li>
      );
    })}
  </ul>
);

// Response Plugin:Generic
// Response plugin that creates a response with basic options:
// user can set status, headers, and text body
// Changes to non-dynamic mode when finished (sesson status > 0)

const responsePluginGeneric: ResponsePlugin = {
  name: "Generic Response",
  Render(options) {
    const {
      initialHeaders,
      initialStatus,
      initialBody,
      setPlugin,
      respondWith,
      advance,
      sessionStatus,
    } = options!;
    const [status, setStatus] = useState(initialStatus);
    const [body, setBody] = useState(initialBody);
    const [headers, setHeaders] = useState<any[][]>(objToArry(initialHeaders));

    return (
      <div>
        {sessionStatus === 0 ? (
          <>
            <p>
              status:
              <select
                title="status"
                defaultValue={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                }}
              >
                {statusCodes.map(([code, description]) => (
                  <option key={code} value={code}>
                    {code}:{description}
                  </option>
                ))}
              </select>
            </p>
            <p>headers:</p>
            <DynamicHeaders headers={headers} setHeaders={setHeaders} />
            <p>body:</p>
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
                advance(2);
              }}
            >
              Send
            </button>
          </>
        ) : (
          <>
            <p>{status}</p>
            <hr />
            <StaticHeaders headers={headers} />
            {body ? (
              <>
                <hr />
                <pre>{body}</pre>
              </>
            ) : null}
          </>
        )}
      </div>
    );
  },
};

// Response Plugin:Abort
// Response plugin that reuturns undefind to abort the request and displays nothing
const responsePluginAbort: ResponsePlugin = {
  name: "Abort",
  Render(options) {
    const { respondWith, advance } = options!;
    useEffect(() => {
      respondWith(undefined);
      advance(2);
    }, []);
    return null;
  },
};

// Response Plugin:File
// Response plugin that creates a response with file options:
// uses input with type of file to get file
// Sets proper headers and returns file as body
const responsePluginFile: ResponsePlugin = {
  name: "File",
  Render(options) {
    const { respondWith, advance } = options!;
    const [file, setFile] = useState<File | undefined>(undefined);
    const [headers, setHeaders] = useState<[any, any][]>([["", ""]]);
    const [body, setBody] = useState<string | ArrayBuffer | null>("");

    return (
      <div>
        <p>headers:</p>
        <DynamicHeaders headers={headers} setHeaders={setHeaders} />
        <p>
          file:
          <input
            title="file"
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                return;
              }
              setFile(file);
              const reader = new FileReader();
              reader.onload = () => {
                setBody(reader.result);
              };
              reader.readAsText(file);
            }}
          />
        </p>
        <button
          type="button"
          disabled={!file}
          onClick={() => {
            headers.push(["content-type", file?.type]);
            respondWith(
              new Response(body, {
                status: 200,
                headers: Object.fromEntries(headers),
              })
            );
            advance(2);
          }}
        >
          Send
        </button>
      </div>
    );
  },
};

export {
  // responsePluginFile,
  responsePluginGeneric,
  responsePluginAbort,
};
