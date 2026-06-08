import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface PlaceholderAction {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-dashboard-placeholder',
  templateUrl: './dashboard-placeholder.component.html',
  styleUrl: './dashboard-placeholder.component.scss',
})
export class DashboardPlaceholderComponent {
  readonly title = this.route.snapshot.data['title'] || 'Modulo';
  readonly eyebrow = this.route.snapshot.data['eyebrow'] || 'VolticFit';
  readonly description = this.route.snapshot.data['description'] || 'Esta seccion esta lista para conectarse con su endpoint correspondiente.';
  readonly items: string[] = this.route.snapshot.data['items'] || [];
  readonly actions: PlaceholderAction[] = this.route.snapshot.data['actions'] || [];

  constructor(private route: ActivatedRoute) {}
}
