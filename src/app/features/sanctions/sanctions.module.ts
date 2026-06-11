import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SanctionAlertComponent } from './components/sanction-alert/sanction-alert.component';

@NgModule({
  declarations: [SanctionAlertComponent],
  exports:      [SanctionAlertComponent],
  imports:      [CommonModule],
})
export class SanctionsModule {}