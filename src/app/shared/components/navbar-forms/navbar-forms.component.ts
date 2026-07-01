import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-navbar-forms',
  templateUrl: './navbar-forms.component.html',
  styleUrl: './navbar-forms.component.scss'
})
export class NavbarFormsComponent {
  @Input() backRoute: string | null = null;
  @Input() linkText: string | null = null;
  @Input() linkLabel: string | null = null;
  @Input() linkRoute: string = '';
  @Input() bannerText: string | null = null;
}
