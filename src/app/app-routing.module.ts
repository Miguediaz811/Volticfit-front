import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { DeleteAccountComponent } from './features/users/components/delete-account/delete-account.component';
const routes: Routes = [
   { path: 'test/delete-account', component: DeleteAccountComponent },
  {
    path: '',
    loadChildren: () =>
      import('./features/home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  // Agregar aquí las rutas protegidas cuando existan, por ejemplo:
  // {
  //   path: 'dashboard',
  //   loadChildren: () =>
  //     import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'admin',
  //   loadChildren: () =>
  //     import('./features/admin/admin.module').then(m => m.AdminModule),
  //   canActivate: [authGuard],
  //   data: { roles: ['admin'] }
  // },
  {
    path: '**',
    redirectTo: ''
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}