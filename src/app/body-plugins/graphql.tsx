import { useEffect, useState } from "react";
import { extractFileTypesFromHeaderValue } from "../utils";
import type { BodyPlugin } from "./types";
// TODO: Create proper GraphQL parser

// Body Plugin: GraphQL
// Body plugin that checks if the request body is a GraphQL query and, if so, renders it as possibly nested a table
const bodyPluginGraphQL: BodyPlugin = {
  name: "GraphQL",
  recommend: (request) => {
    const contentType = request?.headers.get("content-type");
    if (!contentType) {
      return false;
    }
    const contentTypes = extractFileTypesFromHeaderValue(contentType);

    return contentTypes.some((type) => {
      return type.includes("application/graphql");
    });
  },
  Render: (request) => {
    const [body, setBody] = useState("");
    useEffect(() => {
      async function fetchData() {
        const text = (await request?.text()) || {};
        setBody(text);
      }
      fetchData();
    }, [request]);
    return (
      <table title="request-body">
        <tbody>
          {body.split("&").map((pair) => {
            const [key, value] = pair.split("=");
            return (
              <tr key={key}>
                <td>{key}</td>
                <td>{value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  },
};

export { bodyPluginGraphQL };
