const COLORS = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

const printDate = () => {
  return `[${(new Date).toLocaleString()}]`;
};

const log = (...msgs: unknown[]) => {
  console.log(printDate(), ...msgs);
};

const error = (...msgs: unknown[]) => {
  console.error(printDate(), `${COLORS.red}ERROR:${COLORS.reset}`, ...msgs);
};

const warn = (...msgs: unknown[]) => {
  console.warn(printDate(), `${COLORS.yellow}WARNING:${COLORS.reset}`, ...msgs);
};

const info = (...msgs: unknown[]) => {
  console.warn(printDate(), `${COLORS.blue}INFO:${COLORS.reset}`, ...msgs);
};

const debug = (...msgs: unknown[]) => {
  console.warn(printDate(), `${COLORS.magenta}DEBUG:${COLORS.reset}`, ...msgs);
};

const Logger = {
  log,
  error,
  warn,
  info,
  debug
};

export default Logger;
