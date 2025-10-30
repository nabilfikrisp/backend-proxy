import { logger } from "hono/logger";

const color = {
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
};

export const customLogger = logger((str, ...rest) => {
  const now = new Date().toISOString();
  let output = `[${now}] ${str}`;

  // optional: colorize by status code if found in `rest`
  const status = rest.find((x) => typeof x === "number");
  if (status) {
    if (status >= 500) output = color.red(output);
    else if (status >= 400) output = color.yellow(output);
    else output = color.green(output);
  }

  console.log(color.gray(output));
});
