import { Component } from '@angular/core';
 
@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
 
  stats = [
    { value: '000+', label: 'Miembros activos' },
    { value: '00+', label: 'Equipos disponibles' },
    { value: '00', label: 'Años de experiencia' }
  ];
 
  features = [
    {
      icon: '🏋️',
      title: 'Equipos modernos',
      description: 'Contamos con la maquinaria más avanzada para que entrenes sin límites.'
    },
    {
      icon: '📱',
      title: 'App intuitiva',
      description: 'Gestiona tus rutinas, reservas y progreso desde nuestra aplicación móvil.'
    },
    {
      icon: '📊',
      title: 'Seguimiento real',
      description: 'Monitorea cada avance con métricas detalladas y reportes personalizados.'
    },
    {
      icon: '🧑‍🏫',
      title: 'Instructores',
      description: 'Nuestros entrenadores certificados te guían en cada paso de tu transformación.'
    },
    {
      icon: '🛡️',
      title: 'Seguridad',
      description: 'Instalaciones con cámaras, acceso controlado y protocolos de higiene.'
    },
    {
      icon: '⚡',
      title: 'Acceso rápido',
      description: 'Entra al gimnasio en segundos con tu tarjeta o código QR personalizado.'
    }
  ];
 
  aboutPoints = [
    'Entrenamiento personalizado para todos los niveles.',
    'Horarios flexibles adaptados a tu estilo de vida.',
    'Comunidad activa y motivadora que te impulsa.',
    'Resultados medibles desde la primera semana.'
  ];
}
