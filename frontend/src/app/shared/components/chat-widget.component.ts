import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild,
  HostListener, inject, OnInit,
} from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Company, Service, Project } from '../../core/models';

interface ChatMsg {
  role: 'bot' | 'user';
  text: string;
  time: number;
}

interface QuickReply {
  label: string;
  next?: string;
  action?: 'whatsapp' | 'open-blog';
  href?: string;
}

interface BotContext {
  companyName: string;
  services: Service[];
  projects: Project[];
  quote: QuoteData;
}

interface QuoteData {
  type?: string;
  description?: string;
  features?: string;
  budget?: string;
  name?: string;
  email?: string;
  consent?: boolean;
}

interface ChatNode {
  bot: string[] | ((ctx: BotContext) => string[]);
  replies?: QuickReply[];
  input?: 'text' | 'email';
  placeholder?: string;
}

const DEFAULT_WHATSAPP = '593986056366';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Floating bubble -->
    <button
      type="button"
      class="chat-bubble btn-press"
      [class.chat-bubble--open]="isOpen"
      [class.chat-bubble--pulse]="!isOpen"
      (click)="toggle()"
      [attr.aria-expanded]="isOpen"
      [attr.aria-label]="isOpen ? 'Cerrar asistente de chat' : 'Abrir asistente de chat'"
      aria-controls="alantek-chat-panel"
    >
      <i class="bi" [class.bi-chat-dots-fill]="!isOpen" [class.bi-x-lg]="isOpen" aria-hidden="true"></i>
      <span class="chat-bubble-dot" *ngIf="!isOpen" aria-hidden="true"></span>
    </button>

    <!-- Panel -->
    <section
      id="alantek-chat-panel"
      class="chat-panel"
      [class.chat-panel--open]="isOpen"
      role="dialog"
      aria-label="Asistente virtual ALANTEK"
      *ngIf="isOpen"
    >
      <header class="chat-head">
        <div class="chat-head-avatar" aria-hidden="true"><i class="bi bi-robot"></i></div>
        <div class="chat-head-info">
          <strong>{{ companyName }} Assist</strong>
          <span class="chat-head-status"><span class="dot"></span> En línea</span>
        </div>
        <button type="button" class="chat-head-close" (click)="toggle()" aria-label="Minimizar chat">
          <i class="bi bi-dash-lg" aria-hidden="true"></i>
        </button>
      </header>

      <div class="chat-log" #log>
        <div class="chat-msg" *ngFor="let m of messages" [class.chat-msg--user]="m.role === 'user'"
          [class.chat-msg--bot]="m.role === 'bot'">
          <div class="chat-bubble-msg">{{ m.text }}</div>
        </div>
        <div class="chat-typing" *ngIf="typing" aria-live="polite">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div class="chat-replies" *ngIf="replies.length">
        <button type="button" *ngFor="let r of replies" class="chat-reply btn-press"
          (click)="selectReply(r)">{{ r.label }}</button>
      </div>

      <form class="chat-inputbar" *ngIf="inputType !== 'none'" (ngSubmit)="sendText()">
        <input
          #textInput
          type="text"
          [attr.type]="inputType === 'email' ? 'email' : 'text'"
          class="chat-input"
          name="chatText"
          [(ngModel)]="draft"
          [placeholder]="inputPlaceholder"
          autocomplete="off"
          aria-label="Escribe tu mensaje"
        />
        <button type="submit" class="chat-send btn-press" [disabled]="!draft.trim()" aria-label="Enviar mensaje">
          <i class="bi bi-send-fill" aria-hidden="true"></i>
        </button>
      </form>
    </section>
  `,
  styleUrls: ['./chat-widget.component.scss'],
})
export class ChatWidgetComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('log') logRef?: ElementRef<HTMLElement>;
  @ViewChild('textInput') textInputRef?: ElementRef<HTMLInputElement>;

  isOpen = false;
  typing = false;
  messages: ChatMsg[] = [];
  replies: QuickReply[] = [];
  inputType: 'none' | 'text' | 'email' = 'none';
  inputPlaceholder = '';
  draft = '';

  companyName = 'ALANTEK';
  private whatsappNumber = DEFAULT_WHATSAPP;
  private services: Service[] = [];
  private projects: Project[] = [];
  private dataLoaded = false;
  private quote: QuoteData = {};
  private currentNode = 'start';
  private lastLeadRef = '';
  private sessionId: string | null = null;
  private chatToken: string | null = null;
  private sessionReady = false;
  private handoffRequested = false;
  private readonly storageKey = 'alantek-chat-session';

  private nodes: Record<string, ChatNode> = {
    start: {
      bot: ['¡Hola! 👋 Soy el asistente de ALANTEK. ¿En qué puedo ayudarte hoy?'],
      replies: [
        { label: 'Servicios', next: 'services' },
        { label: 'Proyectos', next: 'projects' },
        { label: 'Cotizar un proyecto', next: 'q_type' },
        { label: 'Preguntas frecuentes', next: 'faq' },
        { label: 'Hablar con un asesor', next: 'handoff' },
      ],
    },
    services: {
      bot: (ctx) => {
        if (!ctx.services.length) return ['Aún no tengo servicios cargados, pero puedo tomar tus datos y un asesor te contactará.'];
        const list = ctx.services.slice(0, 6).map((s) => `• ${s.name}`).join('\n');
        return ['Estos son nuestros servicios principales:\n' + list];
      },
      replies: [
        { label: 'Cotizar un proyecto', next: 'q_type' },
        { label: 'Ver detalle de servicios', action: 'open-blog', href: '/servicios' },
        { label: 'Menú principal', next: 'start' },
      ],
    },
    projects: {
      bot: (ctx) => {
        if (!ctx.projects.length) return ['Todavía no tengo proyectos publicados.'];
        const list = ctx.projects.slice(0, 5).map((p) => `• ${p.title}`).join('\n');
        return ['Algunos proyectos que hemos realizado:\n' + list];
      },
      replies: [
        { label: 'Ver portafolio', action: 'open-blog', href: '/portafolio' },
        { label: 'Cotizar mi idea', next: 'q_type' },
        { label: 'Menú principal', next: 'start' },
      ],
    },
    faq: {
      bot: [
        'Te comparto algunas preguntas frecuentes:\n' +
          '• ¿Cuánto tarda un proyecto? Depende del alcance; te damos un estimado tras la cotización.\n' +
          '• ¿Trabajan de forma remota? Sí, con clientes en toda Latinoamérica.\n' +
          '• ¿Ofrecen soporte? Sí, con planes de mantenimiento.',
      ],
      replies: [
        { label: 'Cotizar un proyecto', next: 'q_type' },
        { label: 'Hablar con un asesor', next: 'handoff' },
        { label: 'Menú principal', next: 'start' },
      ],
    },
    handoff: {
      bot: ['Con gusto te conecto con un asesor. Puedes continuar por WhatsApp y te responderemos lo antes posible.'],
      replies: [
        { label: 'Abrir WhatsApp', action: 'whatsapp' },
        { label: 'Menú principal', next: 'start' },
      ],
    },
    q_type: {
      bot: ['Perfecto, vamos a preparar tu cotización. ¿Qué tipo de solución necesitas?'],
      replies: [
        { label: 'Desarrollo web / e-commerce', next: 'q_desc' },
        { label: 'ERP / sistema a medida', next: 'q_desc' },
        { label: 'App móvil', next: 'q_desc' },
        { label: 'Integraciones / automatización / IA', next: 'q_desc' },
        { label: 'Consultoría', next: 'q_desc' },
        { label: 'Otro', next: 'q_desc' },
      ],
    },
    q_desc: {
      bot: ['Cuéntame brevemente tu necesidad o el problema que quieres resolver.'],
      input: 'text',
      placeholder: 'Ej: necesito una tienda en línea con pagos y panel de administración',
    },
    q_features: {
      bot: ['¿Qué funcionalidades son imprescindibles? (si no estás seguro, escribe "no sé todavía")'],
      input: 'text',
      placeholder: 'Ej: catálogo, carrito, pagos, reportes',
    },
    q_budget: {
      bot: ['¿Tienes un presupuesto orientativo? Es opcional.'],
      replies: [
        { label: 'Menos de $1.000', next: 'q_name' },
        { label: '$1.000 - $5.000', next: 'q_name' },
        { label: '$5.000 - $15.000', next: 'q_name' },
        { label: 'Más de $15.000', next: 'q_name' },
        { label: 'Prefiero no decirlo', next: 'q_name' },
      ],
    },
    q_name: {
      bot: ['¡Genial! ¿Cómo te llamas?'],
      input: 'text',
      placeholder: 'Tu nombre',
    },
    q_email: {
      bot: ['¿Cuál es tu correo electrónico para enviarte la propuesta?'],
      input: 'email',
      placeholder: 'tu@correo.com',
    },
    q_summary: {
      bot: (ctx) => [
        'Este es el resumen de tu solicitud:\n\n' + this.buildSummary(ctx),
        '¿Deseas enviarla? Un asesor te contactará.',
      ],
      replies: [
        { label: 'Enviar solicitud', next: 'q_submit' },
        { label: 'Continuar en WhatsApp', action: 'whatsapp' },
        { label: 'Empezar de nuevo', next: 'q_type' },
      ],
    },
    q_submit: {
      bot: ['Procesando tu solicitud...'],
      replies: [],
    },
    q_done: {
      bot: (ctx) => [
        `¡Listo, ${ctx.quote.name || ''}! Recibimos tu solicitud` +
          (this.lastLeadRef ? ` (referencia ${this.lastLeadRef})` : '') +
          '. Un asesor te contactará pronto.',
        'Si prefieres una respuesta inmediata, puedes continuar por WhatsApp.',
      ],
      replies: [
        { label: 'Abrir WhatsApp', action: 'whatsapp' },
        { label: 'Menú principal', next: 'start' },
      ],
    },
    q_error: {
      bot: ['No pude enviar la solicitud en este momento. Puedes intentarlo de nuevo o escribirnos por WhatsApp.'],
      replies: [
        { label: 'Reintentar envío', next: 'q_summary' },
        { label: 'Abrir WhatsApp', action: 'whatsapp' },
        { label: 'Menú principal', next: 'start' },
      ],
    },
  };

  ngOnInit(): void {
    this.ensureData();
  }

  private ensureData(): void {
    if (this.dataLoaded) return;
    this.dataLoaded = true;
    this.api.getPublicCompany().subscribe({
      next: (c) => {
        if (c?.name) this.companyName = c.name;
        const wa = c?.whatsapp || '';
        if (wa) this.whatsappNumber = wa.replace(/\D/g, '');
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.api.getPublicServices().subscribe({
      next: (list) => { this.services = list || []; this.cdr.markForCheck(); },
      error: () => {},
    });
    this.api.getPublicProjects().subscribe({
      next: (list) => { this.projects = list || []; this.cdr.markForCheck(); },
      error: () => {},
    });
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.ensureData();
      if (this.messages.length === 0) {
        this.bootstrapChat();
      }
      setTimeout(() => this.focusInput(), 120);
    }
    this.cdr.markForCheck();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.cdr.markForCheck();
    }
  }

  private bootstrapChat(): void {
    const stored = this.readStoredSession();
    if (stored) {
      this.sessionId = stored.sessionId;
      this.chatToken = stored.token;
      this.sessionReady = true;
      this.api.getChatMessages(stored.sessionId, stored.token).subscribe({
        next: (res) => {
          if (res.messages && res.messages.length) {
            this.messages = res.messages.map((m) => ({
              role: m.direction === 'INBOUND' ? 'user' : 'bot',
              text: m.body,
              time: new Date(m.createdAt).getTime(),
            }));
            this.showHomeReplies();
            this.cdr.markForCheck();
            this.scrollToEnd();
          } else {
            this.greet();
          }
        },
        error: () => {
          this.clearStoredSession();
          this.sessionReady = false;
          this.sessionId = null;
          this.chatToken = null;
          this.greet();
        },
      });
      return;
    }
    this.createSessionThenGreet();
  }

  private createSessionThenGreet(): void {
    this.api.createChatSession({ channel: 'WEB', consent: true }).subscribe({
      next: (res) => {
        this.sessionId = res.session.id;
        this.chatToken = res.token;
        this.sessionReady = true;
        this.storeSession();
        this.cdr.markForCheck();
        this.greet();
      },
      error: () => {
        this.sessionReady = false;
        this.greet();
      },
    });
  }

  private showHomeReplies(): void {
    this.currentNode = 'start';
    this.replies = this.nodes['start'].replies || [];
    this.inputType = 'none';
  }

  private readStoredSession(): { sessionId: string; token: string } | null {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.sessionId && parsed?.token) return parsed;
    } catch {
      /* ignore */
    }
    return null;
  }

  private storeSession(): void {
    if (!this.sessionId || !this.chatToken) return;
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify({ sessionId: this.sessionId, token: this.chatToken }));
    } catch {
      /* ignore */
    }
  }

  private clearStoredSession(): void {
    try {
      sessionStorage.removeItem(this.storageKey);
    } catch {
      /* ignore */
    }
  }

  private greet(): void {
    this.goTo('start');
  }

  private ctx(): BotContext {
    return {
      companyName: this.companyName,
      services: this.services,
      projects: this.projects,
      quote: this.quote,
    };
  }

  private goTo(nodeId: string): void {
    const node = this.nodes[nodeId];
    if (!node) return;
    this.currentNode = nodeId;

    // Special: run submission when entering q_submit
    if (nodeId === 'q_submit') {
      this.replies = [];
      this.inputType = 'none';
      this.submitLead();
      return;
    }

    const botLines = typeof node.bot === 'function' ? node.bot(this.ctx()) : node.bot;
    this.replies = [];
    this.inputType = 'none';

    // Simulate typing then push messages
    let delay = 250;
    botLines.forEach((line, i) => {
      setTimeout(() => {
        this.typing = false;
        this.push('bot', line);
        if (i === botLines.length - 1) {
          this.replies = node.replies || [];
          this.inputType = node.input || 'none';
          this.inputPlaceholder = node.placeholder || 'Escribe tu mensaje...';
          this.typing = false;
          this.cdr.markForCheck();
          this.scrollToEnd();
          if (node.input) this.focusInput();
        }
      }, delay);
      delay += 500;
      this.typing = true;
    });
    this.cdr.markForCheck();
    setTimeout(() => this.scrollToEnd(), 50);
  }

  selectReply(reply: QuickReply): void {
    this.push('user', reply.label);
    this.replies = [];
    this.cdr.markForCheck();

    if (reply.action === 'whatsapp') {
      this.openWhatsApp();
      return;
    }
    if (reply.action === 'open-blog' && reply.href) {
      window.location.href = reply.href;
      return;
    }
    if (reply.next) {
      // Capture quick-reply answers for the quote flow
      switch (this.currentNode) {
        case 'q_type':
          this.quote.type = reply.label;
          break;
        case 'q_budget':
          this.quote.budget = reply.label;
          break;
        default:
          break;
      }
      this.goTo(reply.next);
    }
  }

  sendText(): void {
    const text = this.draft.trim();
    if (!text) return;

    if (this.inputType === 'email' && !this.isValidEmail(text)) {
      this.push('user', text);
      this.draft = '';
      this.push('bot', 'Ese correo no parece válido. Escríbelo de nuevo, por favor.');
      this.cdr.markForCheck();
      this.scrollToEnd();
      return;
    }

    this.push('user', text);
    this.draft = '';

    switch (this.currentNode) {
      case 'q_desc':
        this.quote.description = text;
        this.goTo('q_features');
        break;
      case 'q_features':
        this.quote.features = text;
        this.goTo('q_budget');
        break;
      case 'q_name':
        this.quote.name = text;
        this.goTo('q_email');
        break;
      case 'q_email':
        this.quote.email = text;
        this.goTo('q_summary');
        break;
      default:
        this.goTo('start');
        break;
    }
    this.cdr.markForCheck();
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private buildSummary(ctx: BotContext): string {
    const q = ctx.quote;
    const rows = [
      `Nombre: ${q.name || '-'}`,
      `Correo: ${q.email || '-'}`,
      `Tipo de solución: ${q.type || '-'}`,
      `Necesidad: ${q.description || '-'}`,
      `Funcionalidades: ${q.features || '-'}`,
      `Presupuesto orientativo: ${q.budget || 'No especificado'}`,
    ];
    return rows.join('\n');
  }

  private submitLead(): void {
    const q = this.quote;
    const features = (q.features || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50);

    this.typing = true;
    this.cdr.markForCheck();

    this.api.createQuote({
      type: (q.type || 'Proyecto').slice(0, 120),
      description: (q.description || 'Sin descripción').slice(0, 4000),
      features,
      budget: q.budget || undefined,
      name: (q.name || 'Visitante web').slice(0, 150),
      email: q.email || 'sin-correo@alantek.com',
      sessionId: this.sessionId || undefined,
    }).subscribe({
      next: (res) => {
        this.typing = false;
        this.lastLeadRef = res?.code || (res?.quote?.id || '').slice(0, 8).toUpperCase();
        this.cdr.markForCheck();
        this.goTo('q_done');
      },
      error: () => {
        this.typing = false;
        this.cdr.markForCheck();
        this.goTo('q_error');
      },
    });
  }

  openWhatsApp(): void {
    const text = this.buildWaText();
    this.registerHandoff(text);
    const url = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private buildWaText(): string {
    return this.quote.type || this.quote.description
      ? `Hola ALANTEK, quiero cotizar un proyecto.\n` +
        `Tipo: ${this.quote.type || '-'}\n` +
        `Necesidad: ${this.quote.description || '-'}\n` +
        `Funcionalidades: ${this.quote.features || '-'}\n` +
        `Presupuesto: ${this.quote.budget || 'No especificado'}`
      : 'Hola ALANTEK, me gustaría más información sobre sus servicios.';
  }

  private registerHandoff(reason: string): void {
    if (this.handoffRequested || !this.sessionReady || !this.sessionId || !this.chatToken) return;
    this.handoffRequested = true;
    this.api.requestChatHandoff(this.sessionId, this.chatToken, {
      reason: reason.slice(0, 2000),
      contactName: this.quote.name,
      contactEmail: this.quote.email,
    }).subscribe({ error: () => {} });
  }

  private push(role: 'bot' | 'user', text: string): void {
    this.messages.push({ role, text, time: Date.now() });
    this.persistMessage(role, text);
    this.cdr.markForCheck();
    this.scrollToEnd();
  }

  private persistMessage(role: 'bot' | 'user', text: string): void {
    if (!this.sessionReady || !this.sessionId || !this.chatToken) return;
    this.api.postChatMessage(this.sessionId, this.chatToken, {
      body: text.slice(0, 4000),
      senderType: role === 'user' ? 'VISITOR' : 'BOT',
    }).subscribe({ error: () => {} });
  }

  private focusInput(): void {
    setTimeout(() => this.textInputRef?.nativeElement?.focus(), 60);
  }

  private scrollToEnd(): void {
    setTimeout(() => {
      const el = this.logRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  }
}
