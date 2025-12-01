import { Environment } from '@abp/ng.core';

const baseUrl = 'http://13.51.161.48';
const apiUrl = 'http://13.51.161.48' //:5000';

const oAuthConfig = {
  issuer: apiUrl + '/',
  redirectUri: baseUrl,
  clientId: 'SpaApp_App',
  responseType: 'code',
  scope: 'offline_access SpaApp',
  requireHttps: false,
};

export const environment = {
  production: true,
  application: {
    baseUrl,
    name: 'SpaApp',
  },
  oAuthConfig,
  apis: {
    default: {
      url: apiUrl,
      rootNamespace: 'SpaApp',
    },
    AbpAccountPublic: {
      url: apiUrl,
      rootNamespace: 'AbpAccountPublic',
    },
  },
  //remoteEnv: {
  //  url: '/getEnvConfig',
  //  mergeStrategy: 'deepmerge'
  //}
} as Environment;
