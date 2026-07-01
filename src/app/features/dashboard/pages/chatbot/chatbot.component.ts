import { AfterViewChecked, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { AuthService } from '../../../../core/services/auth.service';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

type SupportMode = 'chatbot' | 'instructor';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss',
})
export class ChatbotComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('messageList') private messageList?: ElementRef<HTMLDivElement>;

  isOpen = false;
  mode: SupportMode = 'chatbot';
  loading = false;
  error = '';
  success = '';
  referenceCode = '';
  pendingEscalation = false;
  readonly isAdmin = this.auth.getRol() === 'admin';
  readonly instructorDescriptionMaxLength = 250;

  private loadingTimeout: ReturnType<typeof setTimeout> | null = null;

  private setLoading(value: boolean): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
    this.loading = value;
    if (value) {
      // Si después de 15 segundos no hubo respuesta, apagamos el spinner
      this.loadingTimeout = setTimeout(() => {
        this.setLoading(false);
        this.messages.push({ role: 'system', text: 'La respuesta tardó demasiado. Intenta de nuevo.' });
      }, 15000);
    }
  }

  ngOnDestroy(): void {
    if (this.loadingTimeout) clearTimeout(this.loadingTimeout);
  }

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: 'Hola. Soy tu asistente de Voltic Fit. Puedo ayudarte con horarios, reservas, QR, rutinas o sanciones.',
    },
  ];

  chatForm = this.fb.group({
    message: ['', [Validators.required, Validators.minLength(2)]],
  });

  instructorForm = this.fb.group({
    subject: ['', [Validators.required, Validators.minLength(4)]],
    description: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(250)]],
    attachment: [''],
  });

  constructor(private fb: FormBuilder, private api: DashboardApiService, private auth: AuthService) {}

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  selectMode(mode: SupportMode): void {
    if (this.isAdmin && mode === 'instructor') return;
    this.mode = mode;
    this.error = '';
    this.success = '';
  }

  newTicket(): void {
    this.success = '';
    this.error = '';
    this.instructorForm.reset();
  }

  send(): void {
    if (this.chatForm.invalid || this.loading) {
      this.chatForm.markAllAsTouched();
      return;
    }

    const text = this.chatForm.value.message?.trim() || '';
    if (!text) return;

    this.messages.push({ role: 'user', text });
    this.chatForm.reset({ message: '' });
    this.setLoading(true);
    this.error = '';
    this.success = '';

    if (!this.isAdmin && this.shouldEscalate(text)) {
      this.messages.push({
        role: 'assistant',
        text: 'No pude resolver tu consulta con seguridad. La estoy pasando a un instructor.',
      });
      this.confirmInstructorEscalation(text);
      return;
    }

    this.api.sendChatbotMessage(text).subscribe({
      next: response => {
        const answer = response.response || response.message || this.fallbackChatMessage();
        this.messages.push({ role: 'assistant', text: answer });
        this.setLoading(false);
      },
      error: err => {
        this.error = this.serverMessage(err);
        this.messages.push({
          role: 'system',
          text: this.fallbackChatMessage(),
        });
        this.setLoading(false);
      },
    });
  }

  submitInstructor(): void {
    if (this.instructorForm.invalid) {
      this.instructorForm.markAllAsTouched();
      return;
    }

    this.confirmInstructorEscalation(
      this.instructorForm.value.description || '',
      this.instructorForm.value.subject || 'Consulta con instructor',
      this.instructorForm.value.attachment || ''
    );
  }

  retryChat(): void {
    this.error = '';
    this.selectMode('chatbot');
  }

  private confirmInstructorEscalation(context: string, subject = 'Consulta escalada desde chatbot', attachment = ''): void {
    this.setLoading(true);
    this.pendingEscalation = false;
    this.error = '';

    this.api.createSupportTicket({ subject, description: context, attachment }).subscribe({
      next: ticket => {
        this.setLoading(false);
        this.referenceCode = ticket.code;
        this.success = `Consulta enviada a un instructor. Codigo de seguimiento: ${this.referenceCode}`;
        this.messages.push({
          role: 'system',
          text: `Consulta enviada a un instructor. Codigo de seguimiento: ${this.referenceCode}`,
        });
        this.instructorForm.reset();
      },
      error: err => {
        this.setLoading(false);
        this.error = this.serverMessage(err);
      },
    });
  }

  private shouldEscalate(text: string): boolean {
    const normalized = text.toLowerCase();
    return [
      'instructor',
      'humano',
      'no entiendo',
      'no puedo',
      'ayuda urgente',
      'lesion',
      'lesión',
    ].some(keyword => normalized.includes(keyword));
  }

  private scrollToBottom(): void {
    if (!this.messageList) return;
    const element = this.messageList.nativeElement;
    element.scrollTop = element.scrollHeight;
  }

  private serverMessage(err: any): string {
    const message = err?.error?.message || err?.error?.error || err?.message;

    if (err?.status === 0 || message === 'Failed to fetch') {
      return this.isAdmin
        ? 'Sin conexion. Verifica tu internet e intenta nuevamente.'
        : 'Sin conexion. Verifica tu internet o contacta a un instructor.';
    }

    return message || this.fallbackChatMessage();
  }

  private fallbackChatMessage(): string {
    return this.isAdmin
      ? 'Estamos teniendo problemas tecnicos. Intenta de nuevo.'
      : 'Estamos teniendo problemas tecnicos. Intenta de nuevo o contacta instructor.';
  }
}
