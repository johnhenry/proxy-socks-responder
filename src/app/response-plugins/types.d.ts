type ResponsePlugin = {
  name: string;
  recommend?: boolean | ((request?: Request) => boolean);
  initialStatus?: number | ((request?: Request) => number);
  initialStatusText?: string | ((request?: Request) => string);
  initialHeaders?: RecordHeader | ((request?: Request) => RecordHeader);
  initialBody?: string | ((request?: Request) => string);
  Render:
    | React.ReactNode
    | null
    | ((options?: Record<any, any>) => React.ReactNode | null);
};

export type { ResponsePlugin };
