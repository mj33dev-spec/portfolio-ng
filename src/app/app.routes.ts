import { Routes } from '@angular/router';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/desktop/desktop').then((m) => m.Desktop),
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./portfolio/app.component').then((m) => m.AppComponent),
  },
  {
    path: '**',
    redirectTo: '',
  }
];
