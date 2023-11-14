import { useEffect, useState } from "react";
import { extractFileTypesFromHeaderValue } from "../../../utils";
import type { BodyPlugin } from "./types.d";
// TODO: Create proper YAML parser

// Body Plugin: YAML
// Body plugin that checks if the request body is a YAML document and, if so, renders it as a table
const bodyPluginYAML: BodyPlugin = {
  name: "YAML",
  recommend: (request) => {
    const contentType = request?.headers.get("content-type");
    if (!contentType) {
      return false;
    }
    const contentTypes = extractFileTypesFromHeaderValue(contentType);

    return contentTypes.some((type) => {
      return type.includes("text/yaml");
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
