import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent {
  @Input() name: string = '';
  @Input() text: string = '';
  @Input() type: 'number' | 'password' | 'text' | 'email' = 'text';
  @Input() placeholder: string = '';
  @Input() control!: AbstractControl;
}