// backend/src/utils/user-agent-parser.ts
import * as UAParser from 'ua-parser-js';

export const parseUserAgent = (userAgent: string) => {
  const parser = new UAParser.UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  return {
    browserName: browser.name || 'unknown',
    browserVersion: browser.version || 'unknown',
    osName: os.name || 'unknown',
    osVersion: os.version || 'unknown',
    deviceType: device.type || 'desktop',
  };
};
