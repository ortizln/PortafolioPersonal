import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { ChatSessionSummary, ChatSession, ChatMessage, ChatHandoff } from '../core/models';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';

const CHANNEL_LABELS: Record<string, string> = { WEB: 'Web', WHATSAPP: 'WhatsApp' };
const SENDER_LABELS: Record<string, string> = { VISITOR: 'Visitante', BOT: 'Bot', AGENT: 'Asesor', SYSTEM: 'Sistema' };

@Component({
  selector: 'app-chat-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, HasPermissionDirective],
  templateUrl: './chat-admin.component.html',
  styleUrls: ['./chat-admin.component.scss'],
})
export class ChatAdminComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  sessions: ChatSessionSummary[] = [];
  selected: ChatSession | null = null;
  total = 0;
  openCount = 0;
  loading = true;
  loadingDetail = false;
  search = '';
  statusFilter = 'ALL';
  replyDraft = '';
  sending = false;
  whatsapp: { configured: boolean; connected: boolean; defaultNumber: string } | null = null;
  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;
  private pollTimer: any;

  get channelLabels(): Record<string, string> { return CHANNEL_LABELS; }
  get senderLabels(): Record<string, string> { return SENDER_LABELS; }

  ngOnInit(): void {
    this.loadSessions();
    this.loadWhatsapp();
    this.pollTimer = setInterval(() => {
      this.loadSessions(true);
      if (this.selected) this.reloadSelected(true);
    }, 20000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  loadSessions(silent = false): void {
    if (!silent) this.loading = true;
    this.api.getChatSessions({
      page: 1,
      limit: 50,
      status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
      search: this.search || undefined,
    }).subscribe({
      next: (res) => {
        this.sessions = res.sessions;
        this.total = res.total;
        this.openCount = res.openCount;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        if (!silent) this.showToast('No se pudieron cargar las conversaciones', 'error');
      },
    });
  }

  loadWhatsapp(): void {
    this.api.getWhatsappStatus().subscribe({
      next: (res) => (this.whatsapp = res.whatsapp),
      error: () => {},
    });
  }

  filterStatus(status: string): void {
    this.statusFilter = status;
    this.loadSessions();
  }

  applyFilters(): void {
    this.loadSessions();
  }

  selectSession(session: ChatSessionSummary): void {
    this.loadingDetail = true;
    this.selected = null;
    this.replyDraft = '';
    this.api.getChatSession(session.id).subscribe({
      next: (res) => {
        this.selected = res.session;
        this.loadingDetail = false;
      },
      error: () => {
        this.loadingDetail = false;
        this.showToast('No se pudo abrir la conversación', 'error');
      },
    });
  }

  private reloadSelected(silent = false): void {
    if (!this.selected) return;
    this.api.getChatSession(this.selected.id).subscribe({
      next: (res) => {
        this.selected = res.session;
      },
      error: () => {
        if (!silent) this.showToast('No se pudo actualizar', 'error');
      },
    });
  }

  messages(): ChatMessage[] {
    return this.selected?.messages || [];
  }

  sendReply(): void {
    const body = this.replyDraft.trim();
    if (!body || !this.selected || this.sending) return;
    this.sending = true;
    this.api.postAgentMessage(this.selected.id, body).subscribe({
      next: (res) => {
        this.sending = false;
        this.replyDraft = '';
        this.selected!.messages = [...(this.selected!.messages || []), res.message];
        this.showToast('Respuesta enviada', 'success');
        this.loadSessions(true);
      },
      error: () => {
        this.sending = false;
        this.showToast('No se pudo enviar la respuesta', 'error');
      },
    });
  }

  setStatus(status: 'OPEN' | 'CLOSED'): void {
    if (!this.selected) return;
    this.api.updateChatSession(this.selected.id, { status }).subscribe({
      next: (res) => {
        this.selected!.status = res.session.status;
        this.showToast(status === 'CLOSED' ? 'Conversación cerrada' : 'Conversación reabierta', 'success');
        this.loadSessions(true);
      },
      error: () => this.showToast('No se pudo actualizar el estado', 'error'),
    });
  }

  assignToMe(): void {
    if (!this.selected) return;
    const me = this.auth.getCurrentUser();
    if (!me) return;
    this.api.updateChatSession(this.selected.id, { assignedToId: me.id }).subscribe({
      next: () => {
        this.showToast('Conversación asignada', 'success');
        this.reloadSelected();
      },
      error: () => {},
    });
  }

  activeHandoff(): ChatHandoff | null {
    const list = this.selected?.handoffs || [];
    return list.find((h) => h.status === 'REQUESTED' || h.status === 'ACCEPTED') || null;
  }

  acceptHandoff(handoff: ChatHandoff): void {
    this.api.updateChatHandoff(handoff.id, { status: 'ACCEPTED' }).subscribe({
      next: () => {
        this.showToast('Atención aceptada', 'success');
        this.reloadSelected();
      },
      error: () => this.showToast('No se pudo aceptar', 'error'),
    });
  }

  closeHandoff(handoff: ChatHandoff): void {
    this.api.updateChatHandoff(handoff.id, { status: 'CLOSED' }).subscribe({
      next: () => {
        this.showToast('Handoff cerrado', 'success');
        this.reloadSelected();
      },
      error: () => this.showToast('No se pudo cerrar', 'error'),
    });
  }

  senderClass(m: ChatMessage): string {
    if (m.senderType === 'VISITOR') return 'msg--visitor';
    if (m.senderType === 'AGENT') return 'msg--agent';
    return 'msg--bot';
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => (this.toasts = this.toasts.filter((t) => t.id !== id)), 3500);
  }
}
