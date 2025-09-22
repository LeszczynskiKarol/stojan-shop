// backend/src/utils/bot-detector.ts
const BOT_USER_AGENTS = [
  'bot',
  'crawler',
  'spider',
  'crawling',
  'baidu',
  'pingdom',
  'googlebot',
  'mediapartners-google',
  'adsbot-google',
  'bingbot',
  'yandex',
];

export const detectBot = (userAgent: string): boolean => {
  const lowerUA = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => lowerUA.includes(bot));
};
