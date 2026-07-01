import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-policies',
  templateUrl: './policies.component.html',
  styleUrls: ['./policies.component.scss']
})
export class PoliciesComponent implements OnInit {
  returnUrl = '/';

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Desplazar al inicio de la página cuando cargue
    window.scrollTo(0, 0);
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
  }

  goBack(): void {
    if (this.returnUrl !== '/') {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    this.location.back();
  }

  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
