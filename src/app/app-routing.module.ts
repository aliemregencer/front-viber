import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.module').then(
        (m) => m.DashboardModule
      ),
  },
  {
    path: 'analytics',
    loadChildren: () =>
      import('./features/analytics/analytics.module').then(
        (m) => m.AnalyticsModule
      ),
  },
  {
    path: 'reports',
    loadChildren: () =>
      import('./features/reports/reports.module').then(
        (m) => m.ReportsModule
      ),
  },
  // 🌐 Ana path yönlendirmesi
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  // ❌ Bilinmeyen URL'ler için 404 yönlendirmesi (isteğe bağlı)
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
