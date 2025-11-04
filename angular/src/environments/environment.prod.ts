import { Environment } from '@abp/ng.core';

const baseUrl = 'http://localhost:4200';

const oAuthConfig = {
  issuer: 'https://localhost:44328/',
  redirectUri: baseUrl,
  clientId: 'SpaApp_App',
  responseType: 'code',
  scope: 'offline_access SpaApp',
  requireHttps: true,
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
      url: 'https://localhost:44328',
      rootNamespace: 'SpaApp',
    },
    AbpAccountPublic: {
      url: oAuthConfig.issuer,
      rootNamespace: 'AbpAccountPublic',
    },
  },
  remoteEnv: {
    url: '/getEnvConfig',
    mergeStrategy: 'deepmerge'
  }
} as Environment;
