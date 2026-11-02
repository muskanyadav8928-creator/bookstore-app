import { Book, Category, UserProfile, OrderItem, PaymentGatewaySettings, PublicGatewayInfo, GatewayId, BookmarkItem } from '../types';
const API_BASE = '/api';

function getAuthHeaders(isFormData = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('bookstore_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error: any = new Error(data?.message || res.statusText || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export interface AIRecommendationItem {
  book: Book;
  reason: string;
}

export interface AISmartSearchResponse {
  books: Book[];
  intent: {
    query: string;
    explanation: string;
    category?: string;
    language?: string;
    isFree?: boolean;
    maxPrice?: number;
  };
  aiPowered: boolean;
  message?: string;
}

export interface AIBookSummary {
  shortSummary: string;
  keyTakeaways: string[];
  keyTopics: string[];
  targetAudience: string;
  aiPowered: boolean;
}

export const authService = {
  async getMe(): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ user: UserProfile }>(res);
  },

  async login(credentials: { email: string; password: string }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(credentials),
    });
    const data = await handleResponse<{ user: UserProfile; token: string }>(res);
    if (data.token) {
      localStorage.setItem('bookstore_token', data.token);
    }
    return data;
  },

  async register(info: { name: string; email: string; password: string; confirmPassword?: string }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(info),
    });
    const data = await handleResponse<{ user: UserProfile; token: string }>(res);
    if (data.token) {
      localStorage.setItem('bookstore_token', data.token);
    }
    return data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('bookstore_token');
    localStorage.removeItem('bookstore_user');
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).catch(() => {});
  },
};

export const wishlistService = {
  async get(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/wishlist`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ wishlist: string[] }>(res);
    return data.wishlist || [];
  },

  async toggle(bookId: string): Promise<{ action: 'added' | 'removed'; data: string[] }> {
    const res = await fetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bookId }),
    });
    return handleResponse<{ action: 'added' | 'removed'; data: string[] }>(res);
  },
};

export const BookService = {
  async getBooks(): Promise<Book[]> {
    const res = await fetch(`${API_BASE}/books`);
    const data = await handleResponse<{ books: Book[] }>(res);
    return data.books || [];
  },

  async getBook(id: string): Promise<Book> {
    const res = await fetch(`${API_BASE}/books/${id}`);
    const data = await handleResponse<{ book: Book }>(res);
    return data.book;
  },

  async recordBookView(id: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/books/${id}/view`, { method: 'POST' });
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  async getReaderInfo(id: string): Promise<{ hasAccess: boolean; data?: { book: Book; progress?: { currentPage: number }; bookmarks?: BookmarkItem[] } }> {
    const res = await fetch(`${API_BASE}/books/${id}/read`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ hasAccess: boolean; data?: { book: Book; progress?: { currentPage: number }; bookmarks?: BookmarkItem[] } }>(res);
  },

  getBookFileUrl(id: string): string {
    return `${API_BASE}/books/${id}/file`;
  },

  async saveProgress(bookId: string, currentPage: number, totalPages: number): Promise<void> {
    await fetch(`${API_BASE}/books/${bookId}/progress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPage, totalPages }),
    }).catch(() => {});
  },

  async addBookmark(bookId: string, page: number, note?: string): Promise<BookmarkItem> {
    const res = await fetch(`${API_BASE}/books/${bookId}/bookmark`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ page, note }),
    });
    const data = await handleResponse<{ bookmark: BookmarkItem }>(res);
    return data.bookmark;
  },

  async removeBookmark(bookId: string, page: number): Promise<void> {
    await fetch(`${API_BASE}/books/${bookId}/bookmark?page=${page}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  async downloadBook(book: Book): Promise<void> {
    const res = await fetch(`${API_BASE}/books/${book.id}/download`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Download failed');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedTitle = book.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${sanitizedTitle}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async getContinueReading(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/books/continue-reading`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ continueReading: any[] }>(res);
    return data.continueReading || [];
  },

  async simulatePurchase(bookId: string, paymentMethod: string): Promise<any> {
    const res = await fetch(`${API_BASE}/orders/simulate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bookId, paymentMethod }),
    });
    return handleResponse(res);
  },
};

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await handleResponse<{ categories: Category[] }>(res);
    return data.categories || [];
  },

  async getCategory(slug: string): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories/${slug}`);
    const data = await handleResponse<{ category: Category }>(res);
    return data.category;
  },
};

export const adminService = {
  async getDashboard(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getBooks(): Promise<Book[]> {
    const res = await fetch(`${API_BASE}/admin/books`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ books: Book[] }>(res);
    return data.books || [];
  },

  async getUsers(): Promise<UserProfile[]> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ users: UserProfile[] }>(res);
    return data.users || [];
  },

  async getOrders(): Promise<OrderItem[]> {
    const res = await fetch(`${API_BASE}/admin/orders`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ orders: OrderItem[] }>(res);
    return data.orders || [];
  },

  async getAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/analytics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createBook(formData: FormData): Promise<{ data: Book }> {
    const res = await fetch(`${API_BASE}/admin/books`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return handleResponse<{ data: Book }>(res);
  },

  async updateBook(id: string, formData: FormData): Promise<{ data: Book }> {
    const res = await fetch(`${API_BASE}/admin/books/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return handleResponse<{ data: Book }>(res);
  },

  async deleteBook(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/books/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async updateUserStatus(id: string, status: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/users/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async createCategory(payload: any): Promise<{ data: Category }> {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ data: Category }>(res);
  },

  async updateCategory(idOrSlug: string, payload: any): Promise<{ data: Category }> {
    const res = await fetch(`${API_BASE}/admin/categories/${idOrSlug}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ data: Category }>(res);
  },

  async deleteCategory(idOrSlug: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/categories/${idOrSlug}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean }>(res);
  },
};

export const AIService = {
  async getAdminAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/analytics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async toggleAI(enabled: boolean): Promise<{ message: string; enabled: boolean }> {
    const res = await fetch(`${API_BASE}/ai/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ enabled }),
    });
    return handleResponse<{ message: string; enabled: boolean }>(res);
  },

  async getRecommendations(params: {
    currentBookId?: string;
    readBookIds?: string[];
    wishlistBookIds?: string[];
    purchasedBookIds?: string[];
    preferredCategories?: string[];
    limit?: number;
  }): Promise<{ recommendations: AIRecommendationItem[]; aiPowered: boolean }> {
    const res = await fetch(`${API_BASE}/ai/recommendations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return handleResponse<{ recommendations: AIRecommendationItem[]; aiPowered: boolean }>(res);
  },

  async smartSearch(query: string): Promise<AISmartSearchResponse> {
    const res = await fetch(`${API_BASE}/ai/smart-search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query }),
    });
    return handleResponse<AISmartSearchResponse>(res);
  },

  async askBookAssistant(bookId: string, question: string, history: any[]): Promise<{ reply: string; aiPowered: boolean }> {
    const res = await fetch(`${API_BASE}/ai/book-assistant`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bookId, question, history }),
    });
    return handleResponse<{ reply: string; aiPowered: boolean }>(res);
  },

  async getBookSummary(bookId: string): Promise<AIBookSummary> {
    const res = await fetch(`${API_BASE}/ai/book-summary`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bookId }),
    });
    return handleResponse<AIBookSummary>(res);
  },

  async askReaderAssistant(params: {
    bookId: string;
    chapterTitle?: string;
    snippet: string;
    action: 'explain' | 'summarize' | 'simplify' | 'ask';
    userQuestion?: string;
  }): Promise<{ result: string; aiPowered: boolean }> {
    const res = await fetch(`${API_BASE}/ai/reader-assistant`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return handleResponse<{ result: string; aiPowered: boolean }>(res);
  },
};

export const gatewayService = {
  async getAdminGateways(): Promise<PaymentGatewaySettings> {
    const res = await fetch(`${API_BASE}/admin/gateways`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PaymentGatewaySettings>(res);
  },

  async updateAdminGateways(payload: any): Promise<{ data: PaymentGatewaySettings }> {
    const res = await fetch(`${API_BASE}/admin/gateways`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ data: PaymentGatewaySettings }>(res);
  },

  async getActiveGateways(): Promise<{ activeGateway: GatewayId; gateways: PublicGatewayInfo[] }> {
    const res = await fetch(`${API_BASE}/gateways/active`);
    return handleResponse<{ activeGateway: GatewayId; gateways: PublicGatewayInfo[] }>(res);
  },
};

export const OrderService = {
  async getMyOrders(): Promise<OrderItem[]> {
    const res = await fetch(`${API_BASE}/orders/my-orders`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<{ orders: OrderItem[] }>(res);
    return data.orders || [];
  },

  async createOrder(bookId: string): Promise<{ data: OrderItem }> {
    const res = await fetch(`${API_BASE}/orders/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bookId }),
    });
    return handleResponse<{ data: OrderItem }>(res);
  },

  async payOrder(orderId: string, action: 'SUCCESS' | 'FAIL', paymentMethod?: string): Promise<{ data: OrderItem }> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, paymentMethod }),
    });
    return handleResponse<{ data: OrderItem }>(res);
  },

  async cancelOrder(orderId: string): Promise<{ data: OrderItem }> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: OrderItem }>(res);
  },

  async createRazorpayOrder(bookId: string): Promise<{ data: any }> {
    const res = await fetch(`${API_BASE}/orders/razorpay/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bookId }),
    });
    return handleResponse<{ data: any }>(res);
  },

  async verifyRazorpayPayment(payload: {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ data: OrderItem }> {
    const res = await fetch(`${API_BASE}/orders/razorpay/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ data: OrderItem }>(res);
  },
};
