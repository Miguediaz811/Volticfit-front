import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeleteAccountComponent } from './components/delete-account/delete-account.component';

@NgModule({
  declarations: [DeleteAccountComponent],
  exports:      [DeleteAccountComponent],
  imports:      [CommonModule],
})
export class UsersModule {}