import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from './components/input/input.component';
import { NavbarFormsComponent } from './components/navbar-forms/navbar-forms.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [InputComponent, NavbarFormsComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  exports: [InputComponent, ReactiveFormsModule, NavbarFormsComponent],
})
export class SharedModule {}