import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { DashboardApiService, SupportTicket } from '../../../../core/services/dashboard-api.service';

interface ConversationTurn {
  author: 'user' | 'admin' | 'system';
  label: string;
  text: string;
}

@Component({
  selector: 'app-support-inbox',
  templateUrl: './support-inbox.component.html',
  styleUrl: './support-inbox.component.scss',
})
export class SupportInboxComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatWindow') chatWindow!: ElementRef<HTMLDivElement>;

  tickets: SupportTicket[] = [];
  selected: SupportTicket | null = null;
  reply = '';
  message = '';
  error = '';
  loading = false;
  private shouldScroll = false;

  constructor(private api: DashboardApiService) {}

  ngOnInit(): void {
    this.loadTickets();
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

  loadTickets(): void {
    this.loading = true;
    this.error = '';
    this.api.getSupportTickets().subscribe({
      next: tickets => {
        this.tickets = tickets;
        if (this.selected) {
          this.selected = tickets.find(t => t.code === this.selected!.code) || tickets[0] || null;
        } else {
          this.selected = tickets[0] || null;
        }
        this.loading = false;
        this.shouldScroll = true;
      },
      error: err => {
        this.error = this.serverMessage(err, 'No se pudieron cargar las consultas.');
        this.loading = false;
      },
    });
  }

  selectTicket(ticket: SupportTicket): void {
    this.selected = ticket;
    this.message = '';
    this.error = '';
    this.shouldScroll = true;
  }

  markInReview(): void {
    this.updateStatus('En revision');
  }

  resolveTicket(): void {
    this.updateStatus('Resuelta');
  }

  sendReply(): void {
    if (!this.selected || !this.reply.trim()) return;

    this.api.replySupportTicket(this.selected.code, this.reply.trim()).subscribe({
      next: response => {
        this.message = response.message || `Respuesta enviada a ${this.selected?.user}.`;
        this.reply = '';
        this.loadTickets();
      },
      error: err => this.error = this.serverMessage(err, 'No se pudo enviar la respuesta.'),
    });
  }

  parseConversation(ticket: SupportTicket): ConversationTurn[] {
    const fullText = ticket.attachment || '';
    const turns: ConversationTurn[] = [];

    if (!fullText) {
      turns.push({ author: 'user', label: ticket.user, text: ticket.lastMessage || '' });
      if (ticket.response) {
        turns.push({ author: 'admin', label: 'Instructor', text: ticket.response });
      } else {
        turns.push({ author: 'system', label: 'Sistema', text: 'Consulta escalada desde soporte operativo. Revisa el caso y responde al usuario.' });
      }
      return turns;
    }

    const segments = fullText.split(/\n\n(?=Respuesta admin: |Respuesta usuario: )/);

    segments.forEach((seg, i) => {
      if (seg.startsWith('Respuesta admin: ')) {
        turns.push({ author: 'admin', label: 'Tú (Instructor)', text: seg.replace('Respuesta admin: ', '').trim() });
      } else if (seg.startsWith('Respuesta usuario: ')) {
        turns.push({ author: 'user', label: ticket.user, text: seg.replace('Respuesta usuario: ', '').trim() });
      } else if (i === 0) {
        const parts = seg.split('\n\n');
        const desc = parts.slice(1).join('\n\n').replace(/\n\nAdjunto:.*$/, '').trim();
        turns.push({ author: 'user', label: ticket.user, text: desc || seg });
      }
    });

    if (turns.length > 0 && turns[turns.length - 1].author !== 'admin') {
      turns.push({ author: 'system', label: 'Sistema', text: 'Esperando tu respuesta.' });
    }

    return turns;
  }

  private updateStatus(status: SupportTicket['status']): void {
    if (!this.selected) return;

    this.api.updateSupportTicketStatus(this.selected.code, status).subscribe({
      next: response => {
        this.message = response.message || 'Estado actualizado.';
        this.loadTickets();
      },
      error: err => this.error = this.serverMessage(err, 'No se pudo actualizar la consulta.'),
    });
  }

  private serverMessage(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.error || err?.message || fallback;
  }
}