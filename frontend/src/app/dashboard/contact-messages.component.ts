import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  isRead: boolean;
}

@Component({
  selector: 'app-contact-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-messages.component.html',
  styleUrls: ['./contact-messages.component.scss']
})
export class ContactMessagesComponent implements OnInit {
  messages: ContactMessage[] = [];
  expandedId: string | null = null;
  showDeleteConfirm: string | null = null;

  get unreadCount(): number {
    return this.messages.filter(m => !m.isRead).length;
  }

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    const stored = localStorage.getItem('portfolio_contact_messages');
    this.messages = stored ? JSON.parse(stored) : [
      {
        id: '1', name: 'Alice Johnson', email: 'alice@example.com',
        subject: 'Collaboration Opportunity',
        message: 'Hi, I came across your portfolio and I am impressed by your work. I would love to discuss a potential collaboration on a web development project. Let me know if you are interested!',
        date: '2026-05-01T10:30:00', isRead: false
      },
      {
        id: '2', name: 'Bob Smith', email: 'bob@example.com',
        subject: 'Job Offer',
        message: 'We have a senior developer position that matches your skill set. Please reach out to discuss details and compensation.',
        date: '2026-04-28T14:15:00', isRead: true
      },
      {
        id: '3', name: 'Carol White', email: 'carol@example.com',
        subject: 'Freelance Project',
        message: 'Need help building a dashboard with Angular. The project timeline is about 3 months. Are you available for freelance work?',
        date: '2026-04-25T09:00:00', isRead: false
      },
    ];
  }

  saveMessages(): void {
    localStorage.setItem('portfolio_contact_messages', JSON.stringify(this.messages));
  }

  toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  markAsRead(id: string): void {
    const msg = this.messages.find(m => m.id === id);
    if (msg) {
      msg.isRead = true;
      this.saveMessages();
    }
  }

  markAsReadEvent(event: Event, id: string): void {
    event.stopPropagation();
    this.markAsRead(id);
  }

  requestDelete(id: string): void {
    this.showDeleteConfirm = id;
  }

  requestDeleteEvent(event: Event, id: string): void {
    event.stopPropagation();
    this.requestDelete(id);
  }

  cancelDelete(): void {
    this.showDeleteConfirm = null;
  }

  confirmDelete(): void {
    const id = this.showDeleteConfirm;
    if (!id) return;
    this.messages = this.messages.filter(m => m.id !== id);
    if (this.expandedId === id) this.expandedId = null;
    this.showDeleteConfirm = null;
    this.saveMessages();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
