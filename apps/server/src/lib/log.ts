const LogTypes = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
} as const;
type LogType = (typeof LogTypes)[keyof typeof LogTypes];
const Colors = {
  gray: "gray",
  blue: "blue",
  yellow: "yellow",
  red: "red",
  clear: "clear",
} as const;
type Color = (typeof Colors)[keyof typeof Colors];
const colorMap: Record<Color, string> = {
  gray: "\x1b[1;30;47m",
  blue: "\x1b[1;34;47m",
  yellow: "\x1b[1;33;47m",
  red: "\x1b[1;31;47m",
  clear: "\x1b[0m",
};
const colorByType: Record<LogType, Color> = {
  [LogTypes.debug]: Colors.gray,
  [LogTypes.info]: Colors.blue,
  [LogTypes.warn]: Colors.yellow,
  [LogTypes.error]: Colors.red,
};

export const colorize = (message: string | number, color: Color): string =>
  `${colorMap[color]}${message}${colorMap.clear}`;

/** Writes operational room events to the server log. */
export const log = (message: string, type: LogType = LogTypes.debug): void => {
  // biome-ignore lint/suspicious/noConsole: This is the server's central operational logger.
  console.info(colorize(`[${type}] ${message}`, colorByType[type]));
};
export { Colors, LogTypes };
