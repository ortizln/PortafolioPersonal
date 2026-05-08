export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
}

export interface Profile {
  id: number;
  fullName: string;
  professionalTitle: string;
  description?: string;
  biography?: string;
  aboutMe?: string;
  professionalStory?: string;
  objectives?: string;
  workPhilosophy?: string;
  specialties?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  profileImage?: string;
  bannerImage?: string;
  cvFile?: string;
  quickStats?: any;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  id: number;
  company: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  location?: string;
  achievements?: string;
  technologies: string[];
  companyLogo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  field: string;
  level?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  grade?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  certificates?: Certification[];
}

export interface Certification {
  id: number;
  name: string;
  issuingOrganization: string;
  description?: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  category?: string;
  imageUrl?: string;
  educationId?: string;
  createdAt: string;
  updatedAt: string;
  files?: CertificateFile[];
}

export interface CertificateFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  thumbnailPath?: string;
  certificationId: string;
  createdAt: string;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  summary?: string;
  client?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  demoUrl?: string;
  githubUrl?: string;
  gitlabUrl?: string;
  videoUrl?: string;
  bannerImage?: string;
  architecture?: string;
  features?: any;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  images?: ProjectImage[];
  technologies?: Technology[];
  categories?: Category[];
}

export interface ProjectImage {
  id: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
  projectId: string;
  createdAt: string;
}

export interface Technology {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: number;
  name: string;
  percentage: number;
  level?: string;
  icon?: string;
  color?: string;
  order: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Language {
  id: number;
  name: string;
  level: string;
  percentage: number;
  certification?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description?: string;
  url: string;
  platform: string;
  language?: string;
  stars: number;
  forks: number;
  isPrivate: boolean;
  lastPushed?: string;
  topics: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: number;
  key: string;
  value: any;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId?: string;
  description?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  createdAt: string;
}
