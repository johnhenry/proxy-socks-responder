export const API_HOST: string =
  process.env.NEXT_PUBLIC_API_HOST ?? "localhost:8080";
export const API_INSECURE: boolean = Boolean(
  process.env.NEXT_PUBLIC_API_HOST_INSECURE
);

const S_FOR_SECURITY = API_INSECURE ? "" : "s";
export const WEBSOCKET_ADDRESS = `ws${S_FOR_SECURITY}://${API_HOST}`;
export const CONNECTION_ADDRESS = `http${S_FOR_SECURITY}://${API_HOST}`;
export const SECRET_NAME: string = process.env.SECRET_NAME || "secret";
