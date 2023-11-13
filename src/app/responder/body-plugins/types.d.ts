type BodyPlugin = {
  name: string;
  recommend?: boolean | ((request: Request) => boolean);
  Render:
    | React.ReactNode
    | null
    | ((options?: Record<any, any>) => React.ReactNode | null);
};

type RecordHeader = Record<string, string | number>;

export type { BodyPlugin, RecordHeader };
