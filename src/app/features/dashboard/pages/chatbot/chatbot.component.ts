import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss',
})
export class ChatbotComponent {
  isOpen = true;
  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: '¡Hola! Soy tu asistente de Voltic Fit. ¿En qué te puedo ayudar hoy?',
    },
  ];
  loading = false;
  error = '';

  form = this.fb.group({
    message: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor(private fb: FormBuilder, private api: DashboardApiService) {}

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  send(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const text = this.form.value.message?.trim() || '';
    if (!text) return;

    this.messages.push({ role: 'user', text });
    this.form.reset({ message: '' });
    this.loading = true;
    this.error = '';

    this.api.sendChatbotMessage(text).subscribe({
      next: response => {
        this.messages.push({
          role: 'assistant',
          text: response.response || response.message || 'No recibí una respuesta clara. Intenta de nuevo.',
        });
        this.loading = false;
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudo enviar el mensaje.');
        this.loading = false;
      },
    });
  }

  private serverMessage(err: any, fallback: string): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }

    return message || fallback;
  }
}
