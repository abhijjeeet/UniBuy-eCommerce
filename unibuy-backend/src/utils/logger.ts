import { createLogger, format, transports } from 'winston';
import "winston-daily-rotate-file";
const { combine, timestamp, printf, errors } = format;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stringifyObject = (obj: Record<string, any>, depth: number = 2): string => {
  if (!obj) return "";
  const indent = ' '.repeat(depth * 2);
  let str = '';
  const keys = Object.keys(obj).filter(
    key => !['timestamp', 'level', 'message', 'stack'].includes(key)
  );
  keys.forEach((key, index) => {
    const value = obj[key];
    str += `${index === 0 ? '{' : ''}\n${indent}${key}: `;
    if (typeof value === 'object' && value !== null) {
      str += stringifyObject(value, depth + 1);
    } else {
      str += `${JSON.stringify(value)}`;
    }
    str += `${index === keys.length - 1 ? '\n' + indent.slice(2) + '}' : ','}`;
  });
  return str;
};

// Custom log format
const myNewFormat = printf(info => {
  const { timestamp, level, message, stack } = info;
  let finalMessage = `${timestamp} ${level.toUpperCase()}: ${message}\n${stringifyObject(info)}`;
  if (stack) finalMessage += `\n${stack}\n`;

  return finalMessage;
});

// Create logger
export const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    myNewFormat
  ),
  transports: [
    new transports.Console(),
    new transports.DailyRotateFile({
      dirname: "logs",
      filename: "%DATE%-app.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ]
});

export default logger;
