export enum SessionStatus {
  Pending = 0,
  Responded = 1,
  Complete = 2,
  Remove = 3,
}
export type Session = {
  id: string;
  request: Request;
  response: Promise<Response>;
  respondWith: Function;
  status: SessionStatus;
  tStart: Number;
  tResponded?: Number;
  tEnd?: Number;
  url: URL;
  method: string;
  path: string;
  searchParams: URLSearchParams;
  headersRendered: JSX.Element;
};

export type ColumnHeader = {
  id: string;
  display: string;
  sort?: number;
};
