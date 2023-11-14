import { useEffect, useState } from "react";
import { extractFileTypesFromHeaderValue } from "../../../utils";
import type { BodyPlugin } from "./types.d";

// Body Plugin: Text (Generic)
// Body plugin that renders the body as text if the body exists
export const bodyPluginTextGeneric: BodyPlugin = {
  name: "Text (Generic)",
  Render: (request) => {
    const [body, setBody] = useState("");
    useEffect(() => {
      async function fetchData() {
        const text = (await request?.text()) || {};
        setBody(text);
      }
      fetchData();
    }, [request]);
    return <pre title="request-body">{body}</pre>;
  },
};

// Body Plugin: Text
// Body plugin that checks if the request body is text and, if so, renders it cleanly as text
export const bodyPluginText: BodyPlugin = {
  name: "Text",
  recommend: (request) => {
    const contentType = request?.headers.get("content-type");
    if (!contentType) {
      return false;
    }
    const contentTypes = extractFileTypesFromHeaderValue(contentType);
    return contentTypes.includes("application/text");
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
    return <pre title="request-body">{body}</pre>;
  },
};

// Body Plugin: JSON
// Body plugin that checks if the request body is JSON and, if so, renders it neatly as json
export const bodyPluginJSON: BodyPlugin = {
  name: "JSON",
  recommend: (request) => {
    const contentType = request?.headers.get("content-type");
    if (!contentType) {
      return false;
    }
    const contentTypes = extractFileTypesFromHeaderValue(contentType);
    return contentTypes.includes("application/json");
  },
  Render: (request) => {
    const [body, setBody] = useState("");
    useEffect(() => {
      async function fetchData() {
        const json = (await request?.json()) || {};
        setBody(JSON.stringify(json, null, " "));
      }
      fetchData();
    }, [request]);
    return <pre title="request-body">{body}</pre>;
  },
};

// Body Plugin: Image
// Body plugin that checks if the request body is a common image format image and, if so, renders it witin an image tag
export const bodyPluginImage: BodyPlugin = {
  name: "Image",
  recommend: (request) => {
    const contentType = request?.headers.get("content-type");
    if (!contentType) {
      return false;
    }
    const contentTypes = extractFileTypesFromHeaderValue(contentType);

    return contentTypes.some((type) => {
      return (
        type.includes("image") &&
        !type.includes("svg") &&
        !type.includes("webp")
      );
    });
  },
  Render: (request) => {
    const [body, setBody] = useState("");
    useEffect(() => {
      async function fetchData() {
        const blob = (await request?.blob()) || {};
        setBody(URL.createObjectURL(blob));
      }
      fetchData();
    }, [request]);
    return <img title="request-body" src={body} />;
  },
};

// Body Plugin: SVG
// Body plugin that checks if the request body is an SVG image and, if so, renders it within an svg tag
export const bodyPluginSVG: BodyPlugin = {
  name: "SVG",
  recommend: (request) => {
    const contentType = request?.headers.get("content-type");
    if (!contentType) {
      return false;
    }
    const contentTypes = extractFileTypesFromHeaderValue(contentType);

    return contentTypes.some((type) => {
      return type.includes("image/svg");
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
    return <svg dangerouslySetInnerHTML={{ __html: body }} />;
  },
};

// Body Plugin: Video
// Body plugin that checks if the request body is a common video format and, if so, renders it within a video tag
export const bodyPluginVideo: BodyPlugin = {
  name: "Video",
  recommend: (request) => {
    const contentType = request?.headers.get("content-type");
    if (!contentType) {
      return false;
    }
    const contentTypes = extractFileTypesFromHeaderValue(contentType);

    return contentTypes.some((type) => {
      return type.includes("video");
    });
  },
  Render: (request) => {
    const [body, setBody] = useState("");
    useEffect(() => {
      async function fetchData() {
        const blob = (await request?.blob()) || {};
        setBody(URL.createObjectURL(blob));
      }
      fetchData();
    }, [request]);
    return (
      <video title="request-body" controls>
        <source src={body} />
      </video>
    );
  },
};

// Body Plugin: Audio
// Body plugin that checks if the request body is a common audio format and, if so, renders it within an audio tag
export const bodyPluginAudio: BodyPlugin = {
  name: "Audio",
  recommend: (request) => {
    const contentType = request?.headers.get("content-type");
    if (!contentType) {
      return false;
    }
    const contentTypes = extractFileTypesFromHeaderValue(contentType);

    return contentTypes.some((type) => {
      return type.includes("audio");
    });
  },
  Render: (request) => {
    const [body, setBody] = useState("");
    useEffect(() => {
      async function fetchData() {
        const blob = (await request?.blob()) || {};
        setBody(URL.createObjectURL(blob));
      }
      fetchData();
    }, [request]);
    return (
      <audio title="request-body" controls>
        <source src={body} />
      </audio>
    );
  },
};

// Body Plugin: HTML
// Body plugin that checks if the request body is HTML and, if so, renders it within a borderlss iframe
export const bodyPluginHTML: BodyPlugin = {
  name: "HTML",
  recommend: (request) => {
    const contentType = request?.headers.get("content-type");
    if (!contentType) {
      return false;
    }
    const contentTypes = extractFileTypesFromHeaderValue(contentType);

    return contentTypes.some((type) => {
      return type.includes("text/html");
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
      <iframe
        title="request-body"
        style={{
          border: "none",
        }}
        srcDoc={body}
      />
    );
  },
};

// Body Plugin: Form
// Body plugin that checks if the request body is a form and, if so, renders it as a table
export const bodyPluginForm: BodyPlugin = {
  name: "Form",
  recommend: (request) => {
    const contentType = request?.headers.get("content-type");
    if (!contentType) {
      return false;
    }
    const contentTypes = extractFileTypesFromHeaderValue(contentType);

    return contentTypes.some((type) => {
      return type.includes("application/x-www-form-urlencoded");
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

// Body Plugin: Download
// Plugin that renderes the request body to a downloadble link. If a file name is suggested, it will be used to set the download attribute of the link. If a file name is not found, the hash of the request body will be used instead.

export const bodyPluginDownload: BodyPlugin = {
  name: "Download",
  Render: (request) => {
    const [body, setBody] = useState("");
    const [filename, setFilename] = useState("");
    useEffect(() => {
      async function fetchData() {
        const blob = (await request?.blob()) || {};
        setBody(URL.createObjectURL(blob));
        const contentDisposition = request?.headers.get("content-disposition");
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.*)"/i);
          if (filenameMatch) {
            setFilename(filenameMatch[1]);
            return;
          }
        }
        const hash = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(body)
        );
        setFilename(
          Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
        );
      }
      fetchData();
    }, [request]);
    return (
      <a title="request-body" href={body} download={filename}>
        {filename}
      </a>
    );
  },
};

// Body Plugin: GraphQL
// Body plugin that checks if the request body is a GraphQL query and, if so, renders it as possibly nested a table
export const bodyPluginGraphQL: BodyPlugin = {
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

// Body Plugin: PDF
// Body plugin that checks if the request body is a PDF and, if so, renders it within a borderless iframe

export const bodyPluginPDF: BodyPlugin = {
  name: "PDF",
  recommend: (request) => {
    const contentType = request?.headers.get("content-type");
    if (!contentType) {
      return false;
    }
    const contentTypes = extractFileTypesFromHeaderValue(contentType);

    return contentTypes.some((type) => {
      return type.includes("application/pdf");
    });
  },
  Render: (request) => {
    const [body, setBody] = useState("");
    useEffect(() => {
      async function fetchData() {
        const blob = (await request?.blob()) || {};
        setBody(URL.createObjectURL(blob));
      }
      fetchData();
    }, [request]);
    return (
      <iframe
        title="request-body"
        style={{
          border: "none",
        }}
        src={body}
      />
    );
  },
};

// Body Plugin: XML
// Body plugin that checks if the request body is XML and, if so, renders it within a borderless iframe
export const bodyPluginXML: BodyPlugin = {
  name: "XML",
  recommend: (request) => {
    const contentType = request?.headers.get("content-type");
    if (!contentType) {
      return false;
    }

    const contentTypes = extractFileTypesFromHeaderValue(contentType);

    return contentTypes.some((type) => {
      return type.includes("application/xml");
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
      <iframe
        title="request-body"
        style={{
          border: "none",
        }}
        srcDoc={body}
      />
    );
  },
};
