import { environment } from '../../../../../environments/environment';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface LandingStats {
  activeMembers: number;
  availableEquipment: number;
  experienceYears: number;
}

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  private readonly apiUrl = environment.apiUrl;
  stats = [
    { value: '0', label: 'Miembros activos' },
    { value: '0', label: 'Equipos disponibles' },
    { value: '0', label: 'Anos de experiencia' }
  ];

  menuOpen = false;
  features = [
    {
      icon: 'EQ',
      title: 'Equipos modernos',
      description: 'Contamos con la maquinaria mas avanzada para que entrenes sin limites.'
    },
    {
      icon: 'APP',
      title: 'App intuitiva',
      description: 'Gestiona tus rutinas, reservas y progreso desde nuestra aplicacion movil.'
    },
    {
      icon: 'PR',
      title: 'Seguimiento real',
      description: 'Monitorea cada avance con metricas detalladas y reportes personalizados.'
    },
    {
      icon: 'IN',
      title: 'Instructores',
      description: 'Nuestros entrenadores certificados te guian en cada paso de tu transformacion.'
    },
    {
      icon: 'SE',
      title: 'Seguridad',
      description: 'Instalaciones con camaras, acceso controlado y protocolos de higiene.'
    },
    {
      icon: 'QR',
      title: 'Acceso rapido',
      description: 'Entra al gimnasio en segundos con tu tarjeta o codigo QR personalizado.'
    }
  ];

  aboutPoints = [
    'Entrenamiento personalizado para todos los niveles.',
    'Horarios flexibles adaptados a tu estilo de vida.',
    'Comunidad activa y motivadora que te impulsa.',
    'Resultados medibles desde la primera semana.'
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStats();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  scrollTo(sectionId: string): void {
    this.closeMenu();
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }




  private loadStats(): void {
    this.http.get<LandingStats>(`${this.apiUrl}/public/landing-stats`).subscribe({
      next: stats => {
        this.stats = [
          { value: String(stats.activeMembers ?? 0), label: 'Miembros activos' },
          { value: String(stats.availableEquipment ?? 0), label: 'Equipos disponibles' },
          { value: String(stats.experienceYears ?? 0), label: 'Anos de experiencia' },
        ];
      },
      error: () => {
        this.stats = [
          { value: '0', label: 'Miembros activos' },
          { value: '0', label: 'Equipos disponibles' },
          { value: '0', label: 'Anos de experiencia' },
        ];
      },
    });
  }
}