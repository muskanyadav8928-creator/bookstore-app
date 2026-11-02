export type BookType = 'FREE' | 'PREMIUM';
export type BookStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface Chapter {
  id: string;
  title: string;
  readTime: string;
  content: string[];
}

export interface CoverTheme {
  gradient: string;
  accent: string;
  pattern: 'network' | 'code' | 'circuit' | 'grid' | 'database' | 'shield' | 'math' | 'ai';
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  language: string;
  type: BookType;
  bookType?: BookType;
  price: number;
  rating: number;
  reviewsCount: number;
  pages: number;
  publicationYear: number;
  publisher: string;
  edition?: string;
  isbn?: string;
  tags?: string[];
  licenseType?: string;
  sourceUrl?: string;
  downloadAllowed?: boolean;
  featured?: boolean;
  status?: BookStatus;
  cover?: string;
  coverUrl?: string;
  fileUrl?: string;
  views: number;
  downloads: number;
  dateAdded: string;
  createdAt?: string;
  coverTheme?: CoverTheme;
  chapters?: Chapter[];
}

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  bookCount?: number;
}

export interface LibraryItem {
  id: string;
  bookId: string;
  status: 'reading' | 'completed' | 'bookmarked';
  progress: number;
  currentPage: number;
  lastRead?: string;
  note?: string;
}

export interface BookmarkItem {
  page: number;
  note?: string;
  createdAt?: string;
}

export interface PurchaseRecord {
  orderId: string;
  bookId: string;
  date: string;
  amount: number;
  paymentMethod: string;
  status: 'Completed' | 'PAID' | 'FAILED' | 'PENDING';
}

export interface OrderItem {
  orderId: string;
  bookId: string;
  bookTitle: string;
  amount: number;
  currency?: string;
  gateway?: string;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | 'PROCESSING' | 'REFUNDED' | 'CANCELLED';
  status?: string;
  userName?: string;
  userEmail?: string;
  customer?: string;
  paymentId?: string;
  paymentReference?: string;
  razorpayPaymentId?: string;
  paymentMethod?: string;
  isTestMode?: boolean;
  isDemo?: boolean;
  createdAt: string;
  failureReason?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED';
  createdAt?: string;
}

export type GatewayId = 'sandbox' | 'razorpay' | 'stripe';

export interface PaymentGatewaySettings {
  activeGateway: GatewayId;
  gateways: {
    sandbox: {
      enabled: boolean;
      mode: 'TEST' | 'LIVE';
    };
    razorpay: {
      enabled: boolean;
      mode: 'TEST' | 'LIVE';
      keyId?: string;
      hasKeySecret?: boolean;
      webhookSecret?: string;
      configured?: boolean;
    };
    stripe: {
      enabled: boolean;
      mode: 'TEST' | 'LIVE';
      keyId?: string;
      hasKeySecret?: boolean;
      webhookSecret?: string;
      configured?: boolean;
    };
  };
}

export interface PublicGatewayInfo {
  id: GatewayId;
  name: string;
  enabled: boolean;
  mode: 'TEST' | 'LIVE';
  configured: boolean;
  description: string;
}

export type ActivePage = 
  | 'home' 
  | 'books' 
  | 'free-books' 
  | 'premium-books' 
  | 'categories' 
  | 'category-detail' 
  | 'book-detail' 
  | 'reader' 
  | 'payment-demo' 
  | 'checkout' 
  | 'purchase-history' 
  | 'wishlist' 
  | 'library' 
  | 'login' 
  | 'register' 
  | 'profile' 
  | 'admin' 
  | 'admin-payment-gateway';

export type AdminTab = 
  | 'dashboard' 
  | 'books' 
  | 'add-book' 
  | 'categories' 
  | 'users' 
  | 'orders' 
  | 'payment-gateways' 
  | 'analytics' 
  | 'ai-settings' 
  | 'settings';

export type SortOption = 
  | 'latest' 
  | 'popular' 
  | 'rating' 
  | 'price-asc' 
  | 'price-desc' 
  | 'title-az';
