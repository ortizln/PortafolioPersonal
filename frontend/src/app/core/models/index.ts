export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roleId?: string;
  teamMemberId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
  roles?: string[];
  permissions?: string[];
  rbacRole?: Role;
  userRoles?: { role: Role }[];
  teamMember?: { id: string; fullName: string; professionalTitle: string; photoUrl?: string };
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
  permissions?: Permission[];
  _count?: { users?: number };
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module?: string;
}

export interface MediaFile {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  width?: number;
  height?: number;
  altText?: string;
  folder?: string;
  thumbnail?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message?: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'MESSAGE' | 'LEAD';
  link?: string;
  readAt?: string;
  createdAt: string;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST' | 'CLOSED';

export type PostStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface PostCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { posts?: number };
}

export interface PostTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  _count?: { posts?: number };
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  status: PostStatus;
  authorId?: string;
  author?: { id: string; name: string; email: string };
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  views: number;
  categories?: PostCategory[];
  tags?: PostTag[];
  createdAt: string;
  updatedAt: string;
}

export interface SeoMetadata {
  id: string;
  entityType: string;
  entityId: string;
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  robots?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
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
  achievements?: string[] | string;
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
  slug: string;
  description?: string;
  summary?: string;
  client?: string;
  clientId?: string;
  serviceId?: string;
  status: string;
  projectType?: string;
  visibility?: string;
  startDate?: string;
  endDate?: string;
  demoUrl?: string;
  githubUrl?: string;
  gitlabUrl?: string;
  videoUrl?: string;
  bannerImage?: string;
  architecture?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  metrics?: any;
  features?: any;
  isFeatured: boolean;
  isCaseStudy?: boolean;
  order: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  images?: ProjectImage[];
  technologies?: Technology[];
  categories?: Category[];
  clientRel?: Client;
  service?: Service;
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  teamMemberId: string;
  role?: string;
  description?: string;
  isLead: boolean;
  teamMember?: TeamMember;
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
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { projects?: number; skills?: number };
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
  status: LeadStatus;
  source?: string;
  notes?: string;
  assignedToId?: string;
  assignedUser?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
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
