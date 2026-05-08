import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  platform: 'github' | 'gitlab';
  language: string;
  stars: number;
  forks: number;
  isPrivate: boolean;
  lastPushed: string;
  topics: string[];
}

@Component({
  selector: 'app-repository-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './repository-list.component.html',
  styleUrls: ['./repository-list.component.scss']
})
export class RepositoryListComponent implements OnInit {
  repos: Repository[] = [];
  showForm = false;
  editingRepo: Repository | null = null;
  form = {
    name: '', fullName: '', description: '', url: '',
    platform: 'github' as Repository['platform'],
    language: '', stars: 0, forks: 0, isPrivate: false,
    lastPushed: '', topics: ''
  };
  isSubmitting = false;
  syncing = { github: false, gitlab: false };

  ngOnInit(): void {
    this.loadRepos();
  }

  loadRepos(): void {
    const stored = localStorage.getItem('portfolio_repos');
    this.repos = stored ? JSON.parse(stored) : [
      {
        id: '1', name: 'portfolio', fullName: 'user/portfolio',
        description: 'Personal portfolio website', url: 'https://github.com/user/portfolio',
        platform: 'github', language: 'TypeScript', stars: 12, forks: 3,
        isPrivate: false, lastPushed: '2026-04-20', topics: ['angular', 'portfolio', 'typescript']
      },
    ];
  }

  saveRepos(): void {
    localStorage.setItem('portfolio_repos', JSON.stringify(this.repos));
  }

  syncGitHub(): void {
    this.syncing.github = true;
    setTimeout(() => {
      this.syncing.github = false;
    }, 2000);
  }

  syncGitLab(): void {
    this.syncing.gitlab = true;
    setTimeout(() => {
      this.syncing.gitlab = false;
    }, 2000);
  }

  openCreate(): void {
    this.editingRepo = null;
    this.form = {
      name: '', fullName: '', description: '', url: '',
      platform: 'github', language: '', stars: 0, forks: 0,
      isPrivate: false, lastPushed: '', topics: ''
    };
    this.showForm = true;
  }

  openEdit(repo: Repository): void {
    this.editingRepo = repo;
    this.form = {
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      url: repo.url,
      platform: repo.platform,
      language: repo.language,
      stars: repo.stars,
      forks: repo.forks,
      isPrivate: repo.isPrivate,
      lastPushed: repo.lastPushed,
      topics: repo.topics.join(', ')
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingRepo = null;
  }

  submitForm(): void {
    if (!this.form.name.trim()) return;
    this.isSubmitting = true;
    const data: Repository = {
      id: this.editingRepo?.id || crypto.randomUUID(),
      name: this.form.name,
      fullName: this.form.fullName,
      description: this.form.description,
      url: this.form.url,
      platform: this.form.platform,
      language: this.form.language,
      stars: this.form.stars,
      forks: this.form.forks,
      isPrivate: this.form.isPrivate,
      lastPushed: this.form.lastPushed,
      topics: this.form.topics.split(',').map(t => t.trim()).filter(Boolean)
    };
    if (this.editingRepo) {
      const idx = this.repos.findIndex(r => r.id === this.editingRepo!.id);
      if (idx !== -1) this.repos[idx] = data;
    } else {
      this.repos.push(data);
    }
    this.saveRepos();
    this.showForm = false;
    this.editingRepo = null;
    this.isSubmitting = false;
  }

  deleteRepo(id: string): void {
    if (confirm('Delete this repository?')) {
      this.repos = this.repos.filter(r => r.id !== id);
      this.saveRepos();
    }
  }

  openRepo(url: string): void {
    window.open(url, '_blank');
  }
}
