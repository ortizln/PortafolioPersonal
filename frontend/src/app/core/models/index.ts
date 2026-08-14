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
  id: string;
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
  id: string;
  url: string;
  projectId: string;
  thumbnailUrl?: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
  createdAt: string;
}

export interface Technology {
  id: string;
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
  id: string;
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
  id: string;
  name: string;
  level: string;
  percentage: number;
  certification?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Repository {
  id: string;
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
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: string;
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

export interface Company {
  id: string;
  name: string;
  legalName?: string;
  slug: string;
  slogan?: string;
  shortDescription?: string;
  description?: string;
  mission?: string;
  vision?: string;
  history?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  heroImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  foundedYear?: number;
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFeature {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  icon?: string;
  coverImage?: string;
  status: string;
  order: number;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  features?: ServiceFeature[];
  technologies?: { technology: Technology }[];
  _count?: { features?: number; technologies?: number };
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  description?: string;
  isPublic: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count?: { testimonials?: number };
}

export interface Testimonial {
  id: string;
  clientId?: string;
  authorName: string;
  authorPosition?: string;
  company?: string;
  content: string;
  rating?: number;
  photoUrl?: string;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string; logoUrl?: string; slug: string };
}

export interface TeamMember {
  id: string;
  slug: string;
  fullName: string;
  professionalTitle: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  about?: string;
  photoUrl?: string;
  role?: string;
  department?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  order: number;
  isActive: boolean;
  isPublic: boolean;
  isFounder: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  experiences?: Experience[];
  educations?: Education[];
  certifications?: Certification[];
  skills?: any;
  languages?: Language[];
  socialLinks?: SocialLink[];
  _count?: { experiences?: number; educations?: number; certifications?: number; skills?: number; languages?: number; socialLinks?: number };
}
