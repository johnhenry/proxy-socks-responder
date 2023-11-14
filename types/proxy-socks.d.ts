// proxy-socks.d.ts
declare module "proxy-socks" {
  // deno-lint-ignore no-explicit-any
  export const Agent = class {
    constructor(address: string);
    serve(handler: Function): void;
  };
}
