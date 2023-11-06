import { Agent } from "./proxy-agent/index.mjs";
import { invertedPromise } from "./util/index.mjs";
import { PORTS } from "./settings.mjs";
const address = `http://localhost:${PORTS.HANDLING}`;
let response, setResponse;

const agent = new Agent(address, { reconnect: 1000 });

const serve = agent.boundServe;

serve(async (req) => {
  try {
    const { url, method, headers } = req;
    const json = await req.json();
    [response, setResponse] = invertedPromise();
    setTimeout(() => {
      setResponse(
        new Response(`Hello there ${json.name}`, {
          status: 210,
          statusText: "It's all good",
          headers: {
            "content-type": "text/vanilla",
          },
        })
      );
    });
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
