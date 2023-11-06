import { serve, RemoteResponse as Response } from "./proxy-agent/index.mjs";
import { invertedPromise } from "./util/index.mjs";
import { PORTS } from "./settings.mjs";
const address = `http://localhost:${PORTS.HANDLING}`;
const connection = new WebSocket(address);
let response, setResponse;

serve({ connection }, async (req) => {
  try {
    const { url, method, headers } = req;
    const text = await req.text();
    [response, setResponse] = invertedPromise();
    setTimeout(() => {
      setResponse(
        new Response("howdy!", {
          status: 210,
          statusText: "It's all good",
          headers: {
            "content-type": "text/vanilla",
          },
        })
      );
    }, 4000);
    return response;
  } catch (e) {
    console.error(e);
  }
});
// serve({ connection }, async (req) => {
//   try {
//     const { url, method, headers } = req;
//     const text = await req.text();
//     [response, setResponse] = invertedPromise();
//     return response;
//   } catch (e) {
//     console.log(e);
//   }
// });

/*

setResponse(new Response("howdy!", {
  status: 210,
  statusText: "It's all good",
  headers: {
    "content-type": "text/vanilla",
  }
}));

*/
