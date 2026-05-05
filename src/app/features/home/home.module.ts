import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
 
import { LandingComponent } from './pages/landing/landing.component';
 
const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  }
];
 
@NgModule({
  declarations: [
    LandingComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class HomeModule {}
