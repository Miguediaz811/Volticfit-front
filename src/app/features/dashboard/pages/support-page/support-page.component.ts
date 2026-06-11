import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DashboardApiService, SupportTicket } from '../../../../core/services/dashboard-api.service';
import { timeout } from 'rxjs/operators';

interface ConversationTurn {
  author: 'user' | 'admin' | 'system';
  label: string;
  text: string;
}

@Component({
  selector: 'app-support-page',
  templateUrl: './support-page.component.html',
  styleUrl: './support-page.component.scss',
})
export class SupportPageComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatWindow') chatWindow!: ElementRef<HTMLDivElement>;

  saving = false;
  loading = false;
  message = '';
  error = '';
  formError = '';
  myTickets: SupportTicket[] = [];
  selectedTicket: SupportTicket | null = null;
  private shouldScroll = false;

  replyMap: Record<string, string> = {};
  replySuccessMap: Record<string, string> = {};
  replyErrorMap: Record<string, string> = {};
  replyingCode = '';

  form = this.fb.group({
    subject: ['', [Validators.required, Validators.minLength(4)]],
    description: ['', [Validators.required, Validators.minLength(12)]],
    attachment: [''],
  });

  constructor(private fb: FormBuilder, private api: DashboardApiService) {}

  ngOnInit(): void {
    this.loadMyTickets();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    if (this.chatWindow?.nativeElement) {
      const el = this.chatWindow.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  loadMyTickets(): void {
    this.loading = true;
    this.api.getMySupportTickets().pipe(timeout(8000)).subscribe({
      next: tickets => {
        this.myTickets = tickets;
        if (this.selectedTicket) {
          this.selectedTicket = tickets.find(t => t.code === this.selectedTicket!.code) || tickets[0] || null;
        } else {
          this.selectedTicket = tickets[0] || null;
        }
        this.loading = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.myTickets = [];
        this.selectedTicket = null;
        this.loading = false;
      },
    });
  }

  selectTicket(ticket: SupportTicket): void {
    this.selectedTicket = ticket;
    this.replySuccessMap[ticket.code] = '';
    this.replyErrorMap[ticket.code] = '';
    this.shouldScroll = true;
  }

  send(): void {
    this.formError = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const subjectCtrl = this.form.get('subject');
      const descCtrl = this.form.get('description');
      if (subjectCtrl?.errors?.['required'] || descCtrl?.errors?.['required']) {
        this.formError = 'El asunto y la descripción son obligatorios.';
      } else if (subjectCtrl?.errors?.['minlength']) {
        this.formError = 'El asunto debe tener al menos 4 caracteres.';
      } else if (descCtrl?.errors?.['minlength']) {
        this.formError = 'La descripción debe tener al menos 12 caracteres.';
      } else {
        this.formError = 'Revisa los campos antes de enviar.';
      }
      return;
    }

    this.saving = true;
    this.message = '';
    this.error = '';

    this.api.createSupportTicket({
      subject: this.form.value.subject || '',
      description: this.form.value.description || '',
      attachment: this.form.value.attachment || '',
    }).subscribe({
      next: ticket => {
        this.message = `Consulta enviada correctamente. Código: ${ticket.code}`;
        this.formError = '';
        this.form.reset({ subject: '', description: '', attachment: '' });
        this.saving = false;
        this.loadMyTickets();
      },
      error: err => {
        this.error = err?.error?.message || err?.message || 'No se pudo enviar la consulta.';
        this.saving = false;
      },
    });
  }

  sendReply(ticket: SupportTicket): void {
    const text = this.replyMap[ticket.code]?.trim();
    if (!text) return;

    this.replyingCode = ticket.code;
    this.replySuccessMap[ticket.code] = '';
    this.replyErrorMap[ticket.code] = '';

    this.api.replySupportTicket(ticket.code, text).subscribe({
      next: res => {
        this.replySuccessMap[ticket.code] = res.message || 'Respuesta enviada.';
        this.replyMap[ticket.code] = '';
        this.replyingCode = '';
        this.loadMyTickets();
      },
      error: err => {
        this.replyErrorMap[ticket.code] = err?.error?.message || err?.message || 'No se pudo enviar la respuesta.';
        this.replyingCode = '';
      },
    });
  }

  parseConversation(ticket: SupportTicket): ConversationTurn[] {
    const fullText = (ticket.attachment || '').trim();
    const turns: ConversationTurn[] = [];

    if (!fullText) {
      turns.push({ author: 'user', label: 'Tu consulta', text: ticket.lastMessage || 'Sin mensaje registrado.' });
      if (ticket.response) {
        turns.push({ author: 'admin', label: 'Instructor', text: ticket.response });
      } else {
        turns.push({ author: 'system', label: 'Sistema', text: 'Tu consulta ha sido recibida y esta siendo revisada.' });
      }
      return turns;
    }

    const segments = fullText.split(/\n\n(?=Respuesta admin: |Respuesta usuario: )/);

    segments.forEach((seg, i) => {
      const segment = seg.trim();
      if (segment.startsWith('Respuesta admin: ')) {
        const text = segment.replace('Respuesta admin: ', '').trim();
        if (text) turns.push({ author: 'admin', label: 'Instructor', text });
      } else if (segment.startsWith('Respuesta usuario: ')) {
        const text = segment.replace('Respuesta usuario: ', '').trim();
        if (text) turns.push({ author: 'user', label: 'Tu', text });
      } else if (i === 0) {
        const parts = segment.split('\n\n');
        const desc = parts.slice(1).join('\n\n').replace(/\n\nAdjunto:.*$/s, '').trim();
        const text = desc || ticket.lastMessage || parts[0] || 'Sin mensaje registrado.';
        turns.push({ author: 'user', label: 'Tu consulta', text });
      }
    });

    if (!turns.some(turn => turn.author === 'admin')) {
      turns.push({ author: 'system', label: 'Sistema', text: 'Tu consulta ha sido recibida y esta siendo revisada.' });
    }

    return turns;
  }

  statusClass(status: string): string {
    if (status === 'Resuelta') return 'badge--green';
    if (status === 'En revision') return 'badge--yellow';
    return 'badge--gray';
  }
}
