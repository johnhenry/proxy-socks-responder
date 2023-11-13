"use client";
import { useState, useEffect } from "react";
import { Agent } from "proxy-socks";
import { invertedPromise } from "../../utils";
import { SessionStatus } from "./types.d";

import { TablePlus } from "./table-plus";

import type { Session, ColumnHeader } from "./types.d";

import { OpenSession } from "./opensession";

import { API_HOST } from "../../settings.mjs";

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
    id: "status",
    display: "Status",
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

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | undefined>(
    undefined
  );
  const [headers, setHeaders] = useState<ColumnHeader[]>(DEFAULT_HEADERS);
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
    const { serve } = new Agent(`ws://${API_HOST}`);
    serve(async (request: Request, { id }: { id: string }) => {
      try {
        const [response, respondWith] = invertedPromise();
        const { url, headers } = request;
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
            headersDisplay = `${headerArray[0][0]}:${
              headerArray[0][1]
            } (... and ${headerArray.length - 1} more)`;
        }
        const session = {
          id,
          request,
          response,
          respondWith,
          status: SessionStatus.Pending,
          url: Url,
          // Path Params
          method: request.method,
          path: Url.pathname,
          // Timing
          tStart: Date.now(),
          // UI
          headersRendered: <div title={displayHeades}>{headersDisplay}</div>,
          // Invisible
          searchParams: Url.searchParams,
        };
        setSessions((previous: Session[]) => [...previous, session]);
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
          data={sessions}
          headerClick={(e: any) => updateSort(e.head)}
          recordClick={(e: any) => {
            setCurrentSession(e.session);
          }}
        />

        {sessions.map((session: Session) => {
          const advance = (stat = undefined) => {
            setSessions((previous: Session[]) => {
              const index = previous.findIndex(
                (item) => item.id === session.id
              );
              const next = [...previous];
              const current = next[index];
              current.status = stat !== undefined ? stat : current.status + 1;
              if (current.status === SessionStatus.Responded) {
                current.tResponded = Date.now();
              }
              if (current.status === SessionStatus.Complete) {
                current.tEnd = Date.now();
              }
              if (current.status === SessionStatus.Remove) {
                next.splice(index, 1);
                return next;
              }
              next.splice(index, 1, current);
              return next;
            });
          };

          return (
            <OpenSession
              key={session.id}
              session={session}
              currentSessionId={currentSession?.id}
              close={() => setCurrentSession(undefined)}
              remove={() => {
                advance(SessionStatus.Remove);
              }}
              advance={advance}
            />
          );
        })}
      </section>
    </main>
  );
}
