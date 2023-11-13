type RecordHeader = {
  id: string;
  display: any;
  hidden?: boolean;
  sort?: number;
};

const TablePlus = (
  {
    data = [],
    headers = [],
    gridMode = true,
    recordClick,
    headerClick,
  }: {
    data: any[];
    headers: RecordHeader[];
    gridMode?: boolean;
    recordClick?: Function;
    headerClick?: Function;
  } = {
    data: [],
    headers: [],
    gridMode: true,
    recordClick: undefined,
    headerClick: undefined,
  }
) => {
  const sortOrders = headers
    .filter(({ sort, hidden }) => sort && !hidden)
    .sort((a, b) => {
      return Math.abs(a.sort!) - Math.abs(b.sort!);
    })
    .map(({ id, sort = 0 }) => {
      return [id, sort > 0];
    }); //.reverse(); //?
  for (const [id, direction] of sortOrders) {
    if (direction) {
      data.sort((a, b) => a[id || ""]?.localeCompare?.(b[id || ""]));
    } else {
      data.sort((a, b) => b[id || ""]?.localeCompare?.(a[id || ""]));
    }
  }

  const records: any[] = [];
  const heads = [];
  for (const { id, hidden, display, sort } of headers) {
    if (hidden) {
      continue;
    }
    const className =
      typeof sort !== "number" ? "" : sort > 0 ? "ascending" : "descending";

    heads.push([id, display, className]);
    const record = [];
    for (const datum of data) {
      // console.log({ datum });

      record.push({ value: datum[id], session: datum });
    }
    records.push(record);
  }
  const trecords = records[0].map((_: unknown, i: number) =>
    records.map((row) => row[i])
  );

  return (
    <table
      style={{
        ...(gridMode
          ? {
              display: "grid",
              gridTemplateColumns: `repeat(${heads.length}, 1fr)`,
            }
          : {}),
      }}
    >
      <thead
        style={{
          display: gridMode ? "contents" : undefined,
        }}
      >
        <tr
          style={{
            ...(gridMode
              ? {
                  display: "grid",
                  gridColumn: "1/-1",
                  gridTemplateColumns: "subgrid",
                }
              : {}),
          }}
        >
          {heads.map(([id, display, className]) => (
            <th
              key={id}
              className={className}
              onClick={
                headerClick
                  ? (event) => headerClick((((event as any).head = id), event))
                  : undefined
              }
            >
              {display}
            </th>
          ))}
        </tr>
      </thead>
      <tbody
        style={{
          display: gridMode ? "contents" : undefined,
        }}
      >
        {trecords.map((record: any[], i: number) => (
          <tr
            style={{
              ...(gridMode
                ? {
                    display: "grid",
                    gridColumn: "1/-1",
                    gridTemplateColumns: "subgrid",
                  }
                : {}),
            }}
            key={i}
            onClick={
              recordClick
                ? (event) =>
                    recordClick(
                      (((event as any).session = record[0].session), event)
                    )
                : undefined
            }
          >
            {record.map(({ value }: any, j: number) => (
              <td key={`${i}-${j}`}>{value} </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export type { RecordHeader };
export { TablePlus };
export default TablePlus;
