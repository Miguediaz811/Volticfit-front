import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { PoliciesComponent } from './pages/policies/policies.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'politicas', component: PoliciesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule {}