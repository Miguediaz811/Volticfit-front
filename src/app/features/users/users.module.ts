import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeleteAccountComponent } from './components/delete-account/delete-account.component';

@NgModule({
  declarations: [DeleteAccountComponent],
  exports:      [DeleteAccountComponent],
  imports:      [CommonModule, FormsModule],
})
export class UsersModule {}