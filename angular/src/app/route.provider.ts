import { RoutesService, eLayoutType } from '@abp/ng.core';
import { inject, provideAppInitializer } from '@angular/core';

export const APP_ROUTE_PROVIDER = [
  provideAppInitializer(() => {
    configureRoutes();
  }),
];

function configureRoutes() {
  const routes = inject(RoutesService);
  routes.add([
      {
        path: '/',
        name: '::Menu:Home',
        iconClass: 'fas fa-home',
        order: 1,
        layout: eLayoutType.application,
      },
    {
      path: '/comments',
      name: 'Spa Comments',
      iconClass: 'fas fa-comments',
      layout: eLayoutType.application,
      //requiredPolicy: 'SpaApp.Comments',
      order: 2,
    },
  ]);
}
