import { Component, Input} from '@angular/core';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss'
})
export class InputComponent {
  @Input() name: string = '';
  @Input() text: string = '';
  @Input() type: 'password' | 'text' = 'text'
  @Input() placeholder: string = '';
}
