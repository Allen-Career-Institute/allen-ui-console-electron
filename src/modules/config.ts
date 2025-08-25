// Environment configuration
let ENV: 'development' | 'stage' | 'production' = 'production';
let URLS = {
  development: '',
  stage: '',
  production: '',
};
let ASTRA_ELECTRON_SENTRY_DSN: string = '';
let ASTRA_ELECTRON_SENTRY_ENDPOINT: string = '';
let CURRENT_URL: string = '';
let APP_VERSION: string = '';

const getEnv = () => {
  return ENV;
};

const setEnv = (env: 'development' | 'stage' | 'production') => {
  ENV = env;
};

const getSentryDsn = () => {
  return ASTRA_ELECTRON_SENTRY_DSN;
};

const setSentryDsn = (dsn: string) => {
  ASTRA_ELECTRON_SENTRY_DSN = dsn;
};

const getSentryEndpoint = () => {
  return ASTRA_ELECTRON_SENTRY_ENDPOINT;
};

const setSentryEndpoint = (endpoint: string) => {
  ASTRA_ELECTRON_SENTRY_ENDPOINT = endpoint;
};

const getUrls = () => {
  return URLS;
};

const getUrlByEnv = () => {
  return URLS[ENV];
};

const setUrlByEnv = (
  url: string,
  env: 'development' | 'stage' | 'production'
) => {
  URLS[env] = url;
};

const isDev = () => {
  return getEnv() === 'development';
};

const setCurrentUrl = (url: string) => {
  CURRENT_URL = url;
};

const getCurrentUrl = () => {
  return CURRENT_URL;
};

const getAppVersion = () => {
  return APP_VERSION;
};

const setAppVersion = (version: string) => {
  APP_VERSION = version;
};

export {
  isDev,
  getEnv,
  setEnv,
  getUrls,
  setCurrentUrl,
  getCurrentUrl,
  setUrlByEnv,
  getUrlByEnv,
  setSentryDsn,
  setSentryEndpoint,
  getSentryDsn,
  getSentryEndpoint,
  getAppVersion,
  setAppVersion,
};
