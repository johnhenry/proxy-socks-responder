import { RecordHeader } from "./body-plugins/types";

const extractFileTypesFromHeaderValue = (value: string): string[] =>
  value
    .split(",") // Split the header value by comma to separate different content types
    .map((type) => type.split(";")[0].trim()); // Map each type to extract the MIME type before any semicolons (which indicate parameters)

const HeaderRenderer = (
  { headers = {} }: { headers: RecordHeader } = { headers: {} }
) => {
  return (
    <table>
      <tbody>
        {Object.entries(headers).map(
          ([key, value]: [string, string | number]) => {
            return (
              <tr key={key}>
                <td>{key}</td>
                <td>{value}</td>
              </tr>
            );
          }
        )}
      </tbody>
    </table>
  );
};

export { extractFileTypesFromHeaderValue, HeaderRenderer };
