import { Company } from '../models';

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '';
  return `${r}, ${g}, ${b}`;
}

export function applyCompanyBrand(company?: Partial<Company> | null): void {
  const root = document.documentElement;
  if (!company?.name && !company?.primaryColor) {
    root.style.setProperty('--alantek-primary', '#2563eb');
    root.style.setProperty('--alantek-accent', '#22d3ee');
    root.style.setProperty('--alantek-background', '#070c14');
    root.style.setProperty('--alantek-surface', '#111d31');
    root.style.setProperty('--alantek-text', '#e2e8f0');
    return;
  }
  if (company.name) root.style.setProperty('--brand-name', company.name);
  const setVar = (name: string, value?: string | null) => {
    if (value) root.style.setProperty(name, value);
  };
  setVar('--alantek-primary', company.primaryColor);
  setVar('--alantek-secondary', company.secondaryColor);
  setVar('--alantek-accent', company.accentColor);

  if (company.primaryColor) root.style.setProperty('--primary', company.primaryColor);
  if (company.secondaryColor) root.style.setProperty('--secondary', company.secondaryColor);
  if (company.accentColor) {
    root.style.setProperty('--accent', company.accentColor);
    const rgb = hexToRgb(company.accentColor);
    if (rgb) root.style.setProperty('--accent-rgb', rgb);
  }
}
