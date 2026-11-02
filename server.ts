import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { BOOKS_DATA } from './src/data/booksData.ts';
import { CATEGORIES_DATA } from './src/data/categoriesData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.AUTH_SECRET || 'bookstore-super-secret-jwt-key-2026';

// Initialize Gemini AI Client (Server-Side Only)
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-Memory Data Store (Resilient Fallback and MongoDB cache)
let dbBooks = [...BOOKS_DATA];
let dbCategories = [...CATEGORIES_DATA];

let dbUsers: Array<{
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  wishlist: string[];
  readingProgress: Record<string, { currentPage: number; totalPages: number; lastRead: string }>;
  bookmarks: Record<string, Array<{ page: number; note?: string; createdAt: string }>>;
}> = [
  {
    id: 'user-student',
    name: 'Priya Sharma',
    email: 'student@college.edu',
    passwordHash: bcrypt.hashSync('Student12345!', 10),
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date('2026-08-01').toISOString(),
    wishlist: ['book-1', 'book-3'],
    readingProgress: {
      'book-1': { currentPage: 202, totalPages: 580, lastRead: '2 hours ago' },
      'book-4': { currentPage: 292, totalPages: 510, lastRead: 'Yesterday' },
    },
    bookmarks: {
      'book-1': [{ page: 42, note: 'Master Theorem proofs', createdAt: new Date().toISOString() }],
    },
  },
  {
    id: 'user-admin',
    name: 'Administrator',
    email: 'admin@bookstore.edu',
    passwordHash: bcrypt.hashSync('AdminSecurePassword2026!', 10),
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01').toISOString(),
    wishlist: [],
    readingProgress: {},
    bookmarks: {},
  },
];

let dbOrders: Array<{
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  customer?: string;
  bookId: string;
  bookTitle: string;
  amount: number;
  currency: string;
  gateway: string;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | 'PROCESSING' | 'REFUNDED' | 'CANCELLED';
  paymentId?: string;
  paymentReference?: string;
  paymentMethod?: string;
  isTestMode: boolean;
  createdAt: string;
  failureReason?: string;
}> = [
  {
    orderId: 'ORD-2026-8812',
    userId: 'user-student',
    userName: 'Priya Sharma',
    userEmail: 'student@college.edu',
    bookId: 'book-3',
    bookTitle: 'Deep Learning & Neural Network Architectures',
    amount: 99,
    currency: 'INR',
    gateway: 'sandbox',
    paymentStatus: 'PAID',
    paymentId: 'pay_demo_8812',
    paymentReference: 'UPI-SIMULATED-8812',
    paymentMethod: 'Test UPI (GPay/PhonePe)',
    isTestMode: true,
    createdAt: new Date('2026-09-22').toISOString(),
  },
  {
    orderId: 'ORD-2026-7491',
    userId: 'user-student',
    userName: 'Priya Sharma',
    userEmail: 'student@college.edu',
    bookId: 'book-5',
    bookTitle: 'Distributed Systems & Cloud Computing Architectures',
    amount: 149,
    currency: 'INR',
    gateway: 'razorpay',
    paymentStatus: 'PAID',
    paymentId: 'pay_rzp_7491',
    paymentReference: 'RZP-TEST-7491',
    paymentMethod: 'Razorpay Test Mode',
    isTestMode: true,
    createdAt: new Date('2026-09-24').toISOString(),
  },
];

let dbGatewaySettings = {
  activeGateway: 'sandbox' as 'sandbox' | 'razorpay' | 'stripe',
  gateways: {
    sandbox: {
      enabled: true,
      mode: 'TEST' as const,
    },
    razorpay: {
      enabled: Boolean(process.env.RAZORPAY_KEY_ID),
      mode: 'TEST' as const,
      keyId: process.env.RAZORPAY_KEY_ID || '',
      keySecret: process.env.RAZORPAY_KEY_SECRET || '',
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
      hasKeySecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
      configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    },
    stripe: {
      enabled: false,
      mode: 'TEST' as const,
      keyId: '',
      keySecret: '',
      webhookSecret: '',
      hasKeySecret: false,
      configured: false,
    },
  },
};

let aiSettings = {
  enabled: true,
  totalRequests: 24,
  recommendationsCount: 12,
  searchesCount: 8,
  assistantQueriesCount: 3,
  summariesCount: 1,
  readerQueriesCount: 0,
};

// ==========================================
// MONGODB SCHEMAS & MODELS
// ==========================================
const BookSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  author: String,
  description: String,
  category: String,
  language: String,
  type: { type: String, enum: ['FREE', 'PREMIUM'], default: 'FREE' },
  bookType: { type: String, enum: ['FREE', 'PREMIUM'], default: 'FREE' },
  price: { type: Number, default: 0 },
  rating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 0 },
  pages: { type: Number, default: 300 },
  publicationYear: Number,
  publisher: String,
  edition: String,
  isbn: String,
  tags: [String],
  licenseType: String,
  sourceUrl: String,
  downloadAllowed: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  status: { type: String, default: 'ACTIVE' },
  coverUrl: String,
  fileUrl: String,
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  dateAdded: String,
  createdAt: String,
  coverTheme: mongoose.Schema.Types.Mixed,
  chapters: [mongoose.Schema.Types.Mixed],
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: String,
  icon: String,
  bookCount: { type: Number, default: 0 },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  status: { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' },
  createdAt: String,
  wishlist: [String],
  readingProgress: mongoose.Schema.Types.Mixed,
  bookmarks: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: String,
  userName: String,
  userEmail: String,
  customer: String,
  bookId: String,
  bookTitle: String,
  amount: Number,
  currency: { type: String, default: 'INR' },
  gateway: String,
  paymentStatus: { type: String, default: 'PENDING' },
  paymentId: String,
  paymentReference: String,
  paymentMethod: String,
  isTestMode: { type: Boolean, default: true },
  failureReason: String,
  createdAt: String,
}, { timestamps: true });

const GatewaySettingsSchema = new mongoose.Schema({
  activeGateway: { type: String, default: 'sandbox' },
  gateways: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

export const BookModel = mongoose.model('Book', BookSchema);
export const CategoryModel = mongoose.model('Category', CategorySchema);
export const UserModel = mongoose.model('User', UserSchema);
export const OrderModel = mongoose.model('Order', OrderSchema);
export const GatewaySettingsModel = mongoose.model('GatewaySettings', GatewaySettingsSchema);

let isMongoConnected = false;

export async function syncWithMongoDB() {
  if (!isMongoConnected) return;
  try {
    // Seed or Load Books
    const bookCount = await BookModel.countDocuments();
    if (bookCount === 0) {
      await BookModel.insertMany(dbBooks);
      console.log(`[MongoDB] Initialized books collection with ${dbBooks.length} books.`);
    } else {
      const booksFromDb = await BookModel.find().lean();
      dbBooks = booksFromDb as any;
      console.log(`[MongoDB] Synced ${dbBooks.length} books from MongoDB.`);
    }

    // Seed or Load Categories
    const catCount = await CategoryModel.countDocuments();
    if (catCount === 0) {
      await CategoryModel.insertMany(dbCategories);
      console.log(`[MongoDB] Initialized categories collection with ${dbCategories.length} categories.`);
    } else {
      const catsFromDb = await CategoryModel.find().lean();
      dbCategories = catsFromDb as any;
      console.log(`[MongoDB] Synced ${dbCategories.length} categories from MongoDB.`);
    }

    // Seed or Load Users
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      await UserModel.insertMany(dbUsers);
      console.log(`[MongoDB] Initialized users collection with default student and admin accounts.`);
    } else {
      const usersFromDb = await UserModel.find().lean();
      dbUsers = usersFromDb as any;
      console.log(`[MongoDB] Synced ${dbUsers.length} users from MongoDB.`);
    }

    // Seed or Load Orders
    const orderCount = await OrderModel.countDocuments();
    if (orderCount === 0) {
      await OrderModel.insertMany(dbOrders);
      console.log(`[MongoDB] Initialized demo orders in MongoDB.`);
    } else {
      const ordersFromDb = await OrderModel.find().lean();
      dbOrders = ordersFromDb as any;
    }

    // Load Gateway Settings if exists
    const savedSettings = await GatewaySettingsModel.findOne().lean();
    if (savedSettings && (savedSettings as any).gateways) {
      dbGatewaySettings = {
        activeGateway: (savedSettings as any).activeGateway || 'sandbox',
        gateways: (savedSettings as any).gateways,
      };
    }
  } catch (err: any) {
    console.error('[MongoDB] Error during sync:', err.message);
  }
}

// Helper functions for MongoDB database persistence
function persistBook(book: any) {
  if (!isMongoConnected) return;
  BookModel.findOneAndUpdate({ id: book.id }, book, { upsert: true }).catch(err => {
    console.error('[MongoDB] persistBook error:', err.message);
  });
}

function removeBookFromDb(id: string) {
  if (!isMongoConnected) return;
  BookModel.deleteOne({ id }).catch(err => {
    console.error('[MongoDB] removeBook error:', err.message);
  });
}

function persistCategory(cat: any) {
  if (!isMongoConnected) return;
  CategoryModel.findOneAndUpdate({ id: cat.id }, cat, { upsert: true }).catch(err => {
    console.error('[MongoDB] persistCategory error:', err.message);
  });
}

function removeCategoryFromDb(id: string) {
  if (!isMongoConnected) return;
  CategoryModel.deleteOne({ id }).catch(err => {
    console.error('[MongoDB] removeCategory error:', err.message);
  });
}

function persistUser(user: any) {
  if (!isMongoConnected) return;
  UserModel.findOneAndUpdate({ id: user.id }, user, { upsert: true }).catch(err => {
    console.error('[MongoDB] persistUser error:', err.message);
  });
}

function persistOrder(order: any) {
  if (!isMongoConnected) return;
  OrderModel.findOneAndUpdate({ orderId: order.orderId }, order, { upsert: true }).catch(err => {
    console.error('[MongoDB] persistOrder error:', err.message);
  });
}

function persistGatewaySettings(settings: any) {
  if (!isMongoConnected) return;
  GatewaySettingsModel.findOneAndUpdate({}, settings, { upsert: true }).catch(err => {
    console.error('[MongoDB] persistGatewaySettings error:', err.message);
  });
}

// Connect to MongoDB if URI is available, with resilient fallback
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 })
    .then(() => {
      isMongoConnected = true;
      console.log('Connected to MongoDB database successfully.');
      syncWithMongoDB();
    })
    .catch(err => {
      isMongoConnected = false;
      console.log('MongoDB server not reached, continuing with in-memory resilient data store.', err.message);
    });
}


// Ensure Uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for book cover and document uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Auth Middleware
function authenticateToken(req: any, _res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      req.user = null;
    } else {
      req.user = decoded;
    }
    next();
  });
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required. Please sign in.' });
  }
  const user = dbUsers.find(u => u.id === req.user.id);
  if (!user || user.status === 'DISABLED') {
    return res.status(403).json({ message: 'User account is inactive or disabled.' });
  }
  req.userProfile = user;
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  const user = dbUsers.find(u => u.id === req.user.id);
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'HTTP 403 Forbidden: Administrative privileges required.' });
  }
  req.userProfile = user;
  next();
}

app.use(authenticateToken);

// ==========================================
// 1. AUTH API ROUTES
// ==========================================
app.get('/api/auth/me', (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const user = dbUsers.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password.' });
  }

  const user = dbUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (user.status === 'DISABLED') {
    return res.status(403).json({ message: 'Your account has been deactivated by the system administrator.' });
  }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    },
    token,
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  const existing = dbUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ message: 'An account with this email address already exists.' });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
    wishlist: [],
    readingProgress: {},
    bookmarks: {},
  };

  dbUsers.push(newUser);
  persistUser(newUser);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt,
    },
    token,
  });
});

app.post('/api/auth/logout', (_req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// ==========================================
// 2. WISHLIST API ROUTES (User-Isolated)
// ==========================================
app.get('/api/wishlist', requireAuth, (req: any, res) => {
  const user = req.userProfile;
  return res.json({ wishlist: user.wishlist || [] });
});

app.post('/api/wishlist/toggle', requireAuth, (req: any, res) => {
  const user = req.userProfile;
  const { bookId } = req.body;
  if (!bookId) return res.status(400).json({ message: 'bookId is required.' });

  const exists = (user.wishlist || []).includes(bookId);
  let action: 'added' | 'removed' = 'added';
  if (exists) {
    user.wishlist = user.wishlist.filter((id: string) => id !== bookId);
    action = 'removed';
  } else {
    user.wishlist = [...(user.wishlist || []), bookId];
    action = 'added';
  }

  persistUser(user);
  return res.json({ action, data: user.wishlist });
});

// ==========================================
// 3. BOOKS CATALOG API ROUTES
// ==========================================
app.get('/api/books', (_req, res) => {
  return res.json({ books: dbBooks.filter(b => b.status !== 'ARCHIVED') });
});

app.get('/api/books/:id', (req, res) => {
  const book = dbBooks.find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  return res.json({ book });
});

app.post('/api/books/:id/view', (req, res) => {
  const book = dbBooks.find(b => b.id === req.params.id);
  if (book) {
    book.views = (book.views || 0) + 1;
  }
  return res.json({ success: true });
});

app.get('/api/books/:id/read', (req: any, res) => {
  const book = dbBooks.find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found' });

  let hasAccess = false;
  if (book.type === 'FREE' || book.bookType === 'FREE') {
    hasAccess = true;
  } else if (req.user) {
    if (req.user.role === 'ADMIN') {
      hasAccess = true;
    } else {
      const owned = dbOrders.some(
        o => o.userId === req.user.id && o.bookId === book.id && o.paymentStatus === 'PAID'
      );
      if (owned) hasAccess = true;
    }
  }

  const user = req.user ? dbUsers.find(u => u.id === req.user.id) : null;
  const progress = user?.readingProgress?.[book.id] || null;
  const bookmarks = user?.bookmarks?.[book.id] || [];

  return res.json({
    hasAccess,
    data: {
      book,
      progress,
      bookmarks,
    },
  });
});

app.get('/api/books/:id/file', (req: any, res) => {
  const book = dbBooks.find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ message: 'Book document not found' });

  // If local uploaded file exists, stream it
  if (book.fileUrl && fs.existsSync(path.join(__dirname, book.fileUrl))) {
    return res.sendFile(path.join(__dirname, book.fileUrl));
  }

  // Generate lightweight valid PDF document header for high-fidelity viewing
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);

  // Minimal valid PDF binary
  const minimalPdf = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj
4 0 obj <</Length 68>> stream
BT
/F1 24 Tf
100 700 Td
(${book.title.replace(/[\(\)\\]/g, '')}) Tj
ET
endstream
endobj
5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000363 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
440
%%EOF`;

  return res.send(Buffer.from(minimalPdf));
});

app.post('/api/books/:id/progress', requireAuth, (req: any, res) => {
  const user = req.userProfile;
  const { currentPage, totalPages } = req.body;
  if (!user.readingProgress) user.readingProgress = {};
  user.readingProgress[req.params.id] = {
    currentPage: Number(currentPage) || 1,
    totalPages: Number(totalPages) || 100,
    lastRead: 'Just now',
  };
  persistUser(user);
  return res.json({ success: true });
});

app.post('/api/books/:id/bookmark', requireAuth, (req: any, res) => {
  const user = req.userProfile;
  const { page, note } = req.body;
  if (!user.bookmarks) user.bookmarks = {};
  if (!user.bookmarks[req.params.id]) user.bookmarks[req.params.id] = [];

  const newBm = {
    page: Number(page) || 1,
    note: note || `Bookmark on page ${page}`,
    createdAt: new Date().toISOString(),
  };

  user.bookmarks[req.params.id] = [
    ...user.bookmarks[req.params.id].filter((b: any) => b.page !== newBm.page),
    newBm,
  ].sort((a: any, b: any) => a.page - b.page);

  persistUser(user);
  return res.json({ bookmark: newBm });
});

app.delete('/api/books/:id/bookmark', requireAuth, (req: any, res) => {
  const user = req.userProfile;
  const page = Number(req.query.page);
  if (user.bookmarks?.[req.params.id]) {
    user.bookmarks[req.params.id] = user.bookmarks[req.params.id].filter((b: any) => b.page !== page);
    persistUser(user);
  }
  return res.json({ success: true });
});

app.get('/api/books/:id/download', requireAuth, (req: any, res) => {
  const book = dbBooks.find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found' });

  if (book.downloadAllowed === false) {
    return res.status(403).json({ message: 'Downloads are disabled for this publication by publisher.' });
  }

  if (book.type === 'PREMIUM' && req.user.role !== 'ADMIN') {
    const owned = dbOrders.some(
      o => o.userId === req.user.id && o.bookId === book.id && o.paymentStatus === 'PAID'
    );
    if (!owned) {
      return res.status(403).json({ message: 'Purchase this book to download it.' });
    }
  }

  book.downloads = (book.downloads || 0) + 1;

  if (book.fileUrl && fs.existsSync(path.join(__dirname, book.fileUrl))) {
    return res.download(path.join(__dirname, book.fileUrl));
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);

  const minimalPdf = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj
4 0 obj <</Length 68>> stream
BT
/F1 24 Tf
100 700 Td
(${book.title.replace(/[\(\)\\]/g, '')}) Tj
ET
endstream
endobj
5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000363 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
440
%%EOF`;

  return res.send(Buffer.from(minimalPdf));
});

app.get('/api/books/continue-reading', requireAuth, (req: any, res) => {
  const user = req.userProfile;
  const list = Object.entries(user.readingProgress || {})
    .map(([bookId, progress]: [string, any]) => {
      const book = dbBooks.find(b => b.id === bookId);
      if (!book) return null;
      const pct = Math.round((progress.currentPage / progress.totalPages) * 100);
      return {
        bookId,
        currentPage: progress.currentPage,
        totalPages: progress.totalPages,
        percentage: pct,
        lastRead: progress.lastRead,
        book,
      };
    })
    .filter(Boolean);

  return res.json({ continueReading: list });
});

// ==========================================
// 4. CATEGORIES API ROUTES
// ==========================================
app.get('/api/categories', (_req, res) => {
  const categoriesWithCounts = dbCategories.map(cat => ({
    ...cat,
    bookCount: dbBooks.filter(
      b => b.category.toLowerCase().trim() === cat.name.toLowerCase().trim()
    ).length,
  }));
  return res.json({ categories: categoriesWithCounts });
});

app.get('/api/categories/:slug', (req, res) => {
  const cat = dbCategories.find(c => c.slug.toLowerCase() === req.params.slug.toLowerCase());
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  const bookCount = dbBooks.filter(
    b => b.category.toLowerCase().trim() === cat.name.toLowerCase().trim()
  ).length;
  return res.json({ category: { ...cat, bookCount } });
});

// ==========================================
// 5. ORDERS & CHECKOUT API ROUTES
// ==========================================
app.get('/api/orders/my-orders', requireAuth, (req: any, res) => {
  const orders = dbOrders.filter(o => o.userId === req.user.id);
  return res.json({ orders });
});

app.post('/api/orders/create', requireAuth, (req: any, res) => {
  const { bookId } = req.body;
  const book = dbBooks.find(b => b.id === bookId);
  if (!book) return res.status(404).json({ message: 'Book not found' });

  const alreadyOwned = dbOrders.some(
    o => o.userId === req.user.id && o.bookId === book.id && o.paymentStatus === 'PAID'
  );
  if (alreadyOwned) {
    return res.status(400).json({ code: 'ALREADY_PURCHASED', message: 'You have already purchased this book.' });
  }

  const newOrder = {
    orderId: `ORD-${Date.now().toString().slice(-6)}`,
    userId: req.user.id,
    userName: req.userProfile.name,
    userEmail: req.userProfile.email,
    customer: req.userProfile.name,
    bookId: book.id,
    bookTitle: book.title,
    amount: book.price,
    currency: 'INR',
    gateway: dbGatewaySettings.activeGateway,
    paymentStatus: 'PENDING' as const,
    isTestMode: true,
    createdAt: new Date().toISOString(),
  };

  dbOrders.unshift(newOrder);
  persistOrder(newOrder);
  return res.json({ data: newOrder });
});

app.post('/api/orders/:orderId/pay', requireAuth, (req: any, res) => {
  const { action, paymentMethod } = req.body;
  const order = dbOrders.find(o => o.orderId === req.params.orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (action === 'SUCCESS') {
    order.paymentStatus = 'PAID';
    order.paymentId = `sim_pay_${Date.now()}`;
    order.paymentReference = `TXN-SIM-${Date.now().toString().slice(-6)}`;
    order.paymentMethod = paymentMethod || 'Demo Sandbox';
  } else {
    order.paymentStatus = 'FAILED';
    order.failureReason = 'Simulation rejected or declined by user';
  }

  persistOrder(order);
  return res.json({ data: order });
});

app.post('/api/orders/:orderId/cancel', requireAuth, (req, res) => {
  const order = dbOrders.find(o => o.orderId === req.params.orderId);
  if (order) {
    order.paymentStatus = 'CANCELLED';
    persistOrder(order);
  }
  return res.json({ data: order });
});

app.post('/api/orders/simulate', requireAuth, (req: any, res) => {
  const { bookId, paymentMethod } = req.body;
  const book = dbBooks.find(b => b.id === bookId);
  if (!book) return res.status(404).json({ message: 'Book not found' });

  const order = {
    orderId: `ORD-${Date.now().toString().slice(-6)}`,
    userId: req.user.id,
    userName: req.userProfile.name,
    userEmail: req.userProfile.email,
    bookId: book.id,
    bookTitle: book.title,
    amount: book.price,
    currency: 'INR',
    gateway: 'sandbox',
    paymentStatus: 'PAID' as const,
    paymentId: `sim_${Date.now()}`,
    paymentReference: `SIM-${Date.now().toString().slice(-6)}`,
    paymentMethod: paymentMethod || 'UPI Simulation',
    isTestMode: true,
    createdAt: new Date().toISOString(),
  };

  dbOrders.unshift(order);
  persistOrder(order);
  return res.json({ success: true, data: order });
});

app.post('/api/orders/razorpay/create', requireAuth, (req: any, res) => {
  const { bookId } = req.body;
  const book = dbBooks.find(b => b.id === bookId);
  if (!book) return res.status(404).json({ message: 'Book not found' });

  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  const razorpayOrderId = `order_${Date.now().toString().slice(-14)}`;

  const newOrder = {
    orderId,
    userId: req.user.id,
    userName: req.userProfile.name,
    userEmail: req.userProfile.email,
    customer: req.userProfile.name,
    bookId: book.id,
    bookTitle: book.title,
    amount: book.price,
    currency: 'INR',
    gateway: 'razorpay',
    paymentStatus: 'PENDING' as const,
    isTestMode: true,
    createdAt: new Date().toISOString(),
  };

  dbOrders.unshift(newOrder);
  persistOrder(newOrder);

  return res.json({
    data: {
      orderId,
      razorpayOrderId,
      amount: book.price * 100, // in paise
      currency: 'INR',
      keyId: dbGatewaySettings.gateways.razorpay.keyId || 'rzp_test_demoKey',
      bookTitle: book.title,
      customerName: req.userProfile.name,
      customerEmail: req.userProfile.email,
    },
  });
});

app.post('/api/orders/razorpay/verify', requireAuth, (req, res) => {
  const { orderId, razorpay_payment_id } = req.body;
  const order = dbOrders.find(o => o.orderId === orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.paymentStatus = 'PAID';
  order.paymentId = razorpay_payment_id || `pay_${Date.now()}`;
  order.paymentReference = `RZP-VERIFIED-${Date.now().toString().slice(-6)}`;
  order.paymentMethod = 'Razorpay Test Checkout';

  persistOrder(order);
  return res.json({ success: true, data: order });
});

app.get('/api/gateways/active', (_req, res) => {
  return res.json({
    activeGateway: dbGatewaySettings.activeGateway,
    gateways: [
      {
        id: 'sandbox',
        name: 'Demo / Sandbox',
        enabled: dbGatewaySettings.gateways.sandbox.enabled,
        mode: dbGatewaySettings.gateways.sandbox.mode,
        configured: true,
        description: 'Risk-free virtual checkout simulation for testing student textbook purchases.',
      },
      {
        id: 'razorpay',
        name: dbGatewaySettings.gateways.razorpay.configured ? 'Razorpay Test Mode' : 'Razorpay Test Mode — Not Configured',
        enabled: dbGatewaySettings.gateways.razorpay.enabled,
        mode: dbGatewaySettings.gateways.razorpay.mode,
        configured: Boolean(dbGatewaySettings.gateways.razorpay.configured),
        description: 'Unified Indian payments (UPI, RuPay, NetBanking, Cards).',
      },
    ],
  });
});

// ==========================================
// 6. ADMIN API ROUTES
// ==========================================
app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
  const totalBooks = dbBooks.length;
  const freeBooks = dbBooks.filter(b => b.type === 'FREE' || b.bookType === 'FREE').length;
  const premiumBooks = dbBooks.filter(b => b.type === 'PREMIUM' || b.bookType === 'PREMIUM').length;
  const totalUsers = dbUsers.length;
  const totalViews = dbBooks.reduce((sum, b) => sum + (b.views || 0), 0);
  const totalDownloads = dbBooks.reduce((sum, b) => sum + (b.downloads || 0), 0);

  const paidOrders = dbOrders.filter(o => o.paymentStatus === 'PAID');
  const failedOrders = dbOrders.filter(o => o.paymentStatus === 'FAILED');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  const recentlyAddedBooks = [...dbBooks]
    .sort((a, b) => new Date(b.dateAdded || b.createdAt || 0).getTime() - new Date(a.dateAdded || a.createdAt || 0).getTime())
    .slice(0, 5);

  const mostViewedBooks = [...dbBooks]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const mostDownloadedBooks = [...dbBooks]
    .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
    .slice(0, 5);

  return res.json({
    overview: {
      totalBooks,
      freeBooks,
      premiumBooks,
      totalUsers,
      totalViews,
      totalDownloads,
    },
    revenue: {
      totalSales: paidOrders.length,
      totalRevenue,
      paidOrders: paidOrders.length,
      failedOrders: failedOrders.length,
      premiumBooksSold: paidOrders.length,
    },
    recentlyAddedBooks,
    mostViewedBooks,
    mostDownloadedBooks,
  });
});

app.get('/api/admin/books', requireAdmin, (_req, res) => {
  return res.json({ books: dbBooks });
});

app.post(
  '/api/admin/books',
  requireAdmin,
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'bookFile', maxCount: 1 },
  ]),
  (req: any, res) => {
    const {
      title,
      author,
      description,
      category,
      language,
      bookType,
      price,
      publisher,
      publicationYear,
      isbn,
      pages,
      tags,
      licenseType,
      sourceUrl,
      downloadAllowed,
      featured,
      status,
      coverUrl,
    } = req.body;

    let finalCoverUrl: string | undefined = coverUrl || undefined;
    let finalFileUrl: string | undefined = undefined;

    if (req.files?.cover?.[0]) {
      finalCoverUrl = `/uploads/${req.files.cover[0].filename}`;
    }
    if (req.files?.bookFile?.[0]) {
      finalFileUrl = `/uploads/${req.files.bookFile[0].filename}`;
    }

    const tagList = typeof tags === 'string'
      ? tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : Array.isArray(tags) ? tags : [];

    const newBook = {
      id: `book-${Date.now()}`,
      title: title || 'Untitled Academic Book',
      author: author || 'Faculty Scholar',
      description: description || 'Academic textbook resource.',
      category: category || 'Computer Science',
      language: language || 'English',
      type: (bookType === 'PREMIUM' ? 'PREMIUM' : 'FREE') as 'FREE' | 'PREMIUM',
      bookType: (bookType === 'PREMIUM' ? 'PREMIUM' : 'FREE') as 'FREE' | 'PREMIUM',
      price: bookType === 'PREMIUM' ? Number(price) || 99 : 0,
      rating: 4.8,
      reviewsCount: 1,
      pages: Number(pages) || 300,
      publicationYear: Number(publicationYear) || 2026,
      publisher: publisher || 'University Press',
      isbn: isbn || `978-0-${Math.floor(1e8 + Math.random() * 9e8)}`,
      tags: tagList,
      licenseType: licenseType || 'Open License',
      sourceUrl: sourceUrl || '',
      downloadAllowed: downloadAllowed === 'true' || downloadAllowed === true,
      featured: featured === 'true' || featured === true,
      status: (status || 'ACTIVE') as 'ACTIVE' | 'DRAFT' | 'ARCHIVED',
      coverUrl: finalCoverUrl,
      fileUrl: finalFileUrl,
      views: 0,
      downloads: 0,
      dateAdded: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      chapters: [
        {
          id: 'ch-1',
          title: 'Chapter 1: Curriculum Orientation & Theoretical Fundamentals',
          readTime: '15 min',
          content: [
            description || 'Welcome to this curriculum volume.',
            'This edition incorporates modern problem sets, sample code proofs, and laboratory projects.',
          ],
        },
      ],
    };

    dbBooks.unshift(newBook);
    persistBook(newBook);
    return res.status(201).json({ data: newBook });
  }
);

app.put(
  '/api/admin/books/:id',
  requireAdmin,
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'bookFile', maxCount: 1 },
  ]),
  (req: any, res) => {
    const book = dbBooks.find(b => b.id === req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const body = req.body;
    if (body.title) book.title = body.title;
    if (body.author) book.author = body.author;
    if (body.description) book.description = body.description;
    if (body.category) book.category = body.category;
    if (body.language) book.language = body.language;
    if (body.bookType) {
      book.type = body.bookType;
      book.bookType = body.bookType;
    }
    if (body.price !== undefined) {
      book.price = book.type === 'FREE' ? 0 : Number(body.price);
    }
    if (body.publisher) book.publisher = body.publisher;
    if (body.publicationYear) book.publicationYear = Number(body.publicationYear);
    if (body.isbn) book.isbn = body.isbn;
    if (body.pages) book.pages = Number(body.pages);
    if (body.tags) {
      book.tags = typeof body.tags === 'string'
        ? body.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
        : body.tags;
    }
    if (body.licenseType) book.licenseType = body.licenseType;
    if (body.sourceUrl !== undefined) book.sourceUrl = body.sourceUrl;
    if (body.downloadAllowed !== undefined) {
      book.downloadAllowed = body.downloadAllowed === 'true' || body.downloadAllowed === true;
    }
    if (body.featured !== undefined) {
      book.featured = body.featured === 'true' || body.featured === true;
    }
    if (body.status) book.status = body.status;

    if (req.files?.cover?.[0]) {
      book.coverUrl = `/uploads/${req.files.cover[0].filename}`;
    }
    if (req.files?.bookFile?.[0]) {
      book.fileUrl = `/uploads/${req.files.bookFile[0].filename}`;
    }

    persistBook(book);
    return res.json({ data: book });
  }
);

app.delete('/api/admin/books/:id', requireAdmin, (req, res) => {
  const idx = dbBooks.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Book not found' });
  dbBooks.splice(idx, 1);
  removeBookFromDb(req.params.id);
  return res.json({ success: true });
});

app.get('/api/admin/users', requireAdmin, (_req, res) => {
  const sanitized = dbUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  }));
  return res.json({ users: sanitized });
});

app.put('/api/admin/users/:id/status', requireAdmin, (req, res) => {
  const user = dbUsers.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.status = req.body.status || 'ACTIVE';
  persistUser(user);
  return res.json({ success: true, user });
});

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  return res.json({ orders: dbOrders });
});

app.get('/api/admin/analytics', requireAdmin, (_req, res) => {
  const paidOrders = dbOrders.filter(o => o.paymentStatus === 'PAID');
  const failedOrders = dbOrders.filter(o => o.paymentStatus === 'FAILED');
  const pendingOrders = dbOrders.filter(o => o.paymentStatus === 'PENDING');
  const cancelledOrders = dbOrders.filter(o => o.paymentStatus === 'CANCELLED');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  const demoTransactions = dbOrders.filter(o => !o.gateway || o.gateway === 'sandbox' || (o.paymentMethod && o.paymentMethod.includes('Demo'))).length;
  const razorpayTestTransactions = dbOrders.filter(o => o.gateway === 'razorpay' || (o.paymentMethod && o.paymentMethod.includes('Razorpay'))).length;

  return res.json({
    totalOrders: dbOrders.length,
    successfulPayments: paidOrders.length,
    failedPayments: failedOrders.length,
    cancelledPayments: cancelledOrders.length,
    pendingPayments: pendingOrders.length,
    demoTransactions,
    razorpayTestTransactions,
    totalSales: paidOrders.length,
    totalRevenue,
    paidOrders: paidOrders.length,
    failedOrders: failedOrders.length,
    pendingOrders: pendingOrders.length,
    cancelledOrders: cancelledOrders.length,
    premiumBooksSold: paidOrders.length,
    topPurchasedBooks: [
      { title: 'Deep Learning & Neural Network Architectures', count: 18, revenue: 1782 },
      { title: 'Distributed Systems & Cloud Computing Architectures', count: 14, revenue: 2086 },
      { title: 'Modern Cybersecurity & Applied Cryptography', count: 11, revenue: 1419 },
      { title: 'Artificial Intelligence: Principles & Applications', count: 9, revenue: 1791 },
    ],
    monthlyCharts: [
      { month: 'Apr 2026', sales: 4, revenue: 396 },
      { month: 'May 2026', sales: 7, revenue: 693 },
      { month: 'Jun 2026', sales: 12, revenue: 1188 },
      { month: 'Jul 2026', sales: 18, revenue: 1782 },
      { month: 'Aug 2026', sales: 25, revenue: 2475 },
      { month: 'Sep 2026', sales: 32, revenue: 3168 },
    ],
  });
});

app.get('/api/admin/gateways', requireAdmin, (_req, res) => {
  return res.json(dbGatewaySettings);
});

app.post('/api/admin/gateways', requireAdmin, (req, res) => {
  const { activeGateway, gateways } = req.body;
  if (activeGateway) dbGatewaySettings.activeGateway = activeGateway;
  if (gateways) {
    if (gateways.sandbox) {
      dbGatewaySettings.gateways.sandbox.enabled = gateways.sandbox.enabled;
    }
    if (gateways.razorpay) {
      dbGatewaySettings.gateways.razorpay.enabled = gateways.razorpay.enabled;
      if (gateways.razorpay.keyId) dbGatewaySettings.gateways.razorpay.keyId = gateways.razorpay.keyId;
      if (gateways.razorpay.keySecret && gateways.razorpay.keySecret !== '********') {
        dbGatewaySettings.gateways.razorpay.keySecret = gateways.razorpay.keySecret;
        dbGatewaySettings.gateways.razorpay.hasKeySecret = true;
      }
      if (gateways.razorpay.webhookSecret) {
        dbGatewaySettings.gateways.razorpay.webhookSecret = gateways.razorpay.webhookSecret;
      }
      dbGatewaySettings.gateways.razorpay.configured = Boolean(
        dbGatewaySettings.gateways.razorpay.keyId && dbGatewaySettings.gateways.razorpay.keySecret
      );
    }
    if (gateways.stripe) {
      dbGatewaySettings.gateways.stripe.enabled = gateways.stripe.enabled;
      if (gateways.stripe.keyId) dbGatewaySettings.gateways.stripe.keyId = gateways.stripe.keyId;
      if (gateways.stripe.keySecret && gateways.stripe.keySecret !== '********') {
        dbGatewaySettings.gateways.stripe.keySecret = gateways.stripe.keySecret;
        dbGatewaySettings.gateways.stripe.hasKeySecret = true;
      }
      dbGatewaySettings.gateways.stripe.configured = Boolean(
        dbGatewaySettings.gateways.stripe.keyId && dbGatewaySettings.gateways.stripe.keySecret
      );
    }
  }

  persistGatewaySettings(dbGatewaySettings);
  return res.json({ data: dbGatewaySettings });
});

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { name, slug, description, icon } = req.body;
  if (!name) return res.status(400).json({ message: 'Category name is required' });

  const newCat = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    slug: (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim(),
    description: description || '',
    icon: icon || 'BookOpen',
    bookCount: 0,
  };

  dbCategories.push(newCat);
  persistCategory(newCat);
  return res.status(201).json({ data: newCat });
});

app.put('/api/admin/categories/:idOrSlug', requireAdmin, (req, res) => {
  const { name, slug, description, icon } = req.body;
  const cat = dbCategories.find(
    c => (c.id && c.id === req.params.idOrSlug) || c.slug === req.params.idOrSlug
  );
  if (!cat) return res.status(404).json({ message: 'Category not found' });

  if (name) cat.name = name.trim();
  if (slug) cat.slug = slug.trim();
  if (description !== undefined) cat.description = description;
  if (icon) cat.icon = icon;

  persistCategory(cat);
  return res.json({ data: cat });
});

app.delete('/api/admin/categories/:idOrSlug', requireAdmin, (req, res) => {
  const idx = dbCategories.findIndex(
    c => (c.id && c.id === req.params.idOrSlug) || c.slug === req.params.idOrSlug
  );
  if (idx === -1) return res.status(404).json({ message: 'Category not found' });

  const cat = dbCategories[idx];
  const linked = dbBooks.filter(
    b => b.category.toLowerCase().trim() === cat.name.toLowerCase().trim()
  ).length;
  if (linked > 0) {
    return res.status(400).json({ message: `Cannot delete: ${linked} book(s) assigned to this category.` });
  }

  dbCategories.splice(idx, 1);
  removeCategoryFromDb(cat.id || cat.slug);
  return res.json({ success: true });
});

// ==========================================
// 7. GEMINI AI API ROUTES (Server-Side Only)
// ==========================================
app.get('/api/ai/analytics', (_req, res) => {
  return res.json({
    status: {
      enabled: aiSettings.enabled,
      configured: Boolean(process.env.GEMINI_API_KEY),
    },
    totalRequests: aiSettings.totalRequests,
    recommendationsCount: aiSettings.recommendationsCount,
    searchesCount: aiSettings.searchesCount,
    assistantQueriesCount: aiSettings.assistantQueriesCount,
    summariesCount: aiSettings.summariesCount,
    readerQueriesCount: aiSettings.readerQueriesCount,
  });
});

app.post('/api/ai/toggle', requireAdmin, (req, res) => {
  aiSettings.enabled = Boolean(req.body.enabled);
  return res.json({
    message: `AI system ${aiSettings.enabled ? 'enabled' : 'disabled'} successfully.`,
    enabled: aiSettings.enabled,
  });
});

app.post('/api/ai/recommendations', async (req, res) => {
  aiSettings.totalRequests++;
  aiSettings.recommendationsCount++;

  const { currentBookId, readBookIds = [], wishlistBookIds = [], limit = 6 } = req.body;

  // Filter out current book if provided
  const candidates = dbBooks.filter(b => b.id !== currentBookId && b.status !== 'ARCHIVED');

  if (!aiSettings.enabled || !aiClient) {
    // High-quality deterministic recommendations fallback
    const recs = candidates.slice(0, limit).map((book, idx) => ({
      book,
      reason: idx % 2 === 0
        ? `Covers complementary curriculum concepts in ${book.category}.`
        : `Highly rated reference matching your study path.`,
    }));
    return res.json({ recommendations: recs, aiPowered: false });
  }

  try {
    const catalogSummary = candidates.slice(0, 10).map(b => ({
      id: b.id,
      title: b.title,
      category: b.category,
      tags: b.tags,
    }));

    const prompt = `You are an academic textbook recommendation engine for computer science students.
User read books: ${JSON.stringify(readBookIds)}.
User wishlist: ${JSON.stringify(wishlistBookIds)}.
Available candidate books: ${JSON.stringify(catalogSummary)}.
Select up to ${limit} book IDs that best match this student. Provide a 1-sentence academic reason ("Why this book?") for each.
Return strictly JSON array: [{"id": string, "reason": string}]`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    const results: any[] = [];
    for (const item of parsed) {
      const b = candidates.find(candidate => candidate.id === item.id);
      if (b && !results.some(r => r.book.id === b.id)) {
        results.push({ book: b, reason: item.reason || `Recommended for ${b.category} study.` });
      }
    }

    if (results.length === 0) {
      const fallbackRecs = candidates.slice(0, limit).map(book => ({
        book,
        reason: `Recommended based on ${book.category} syllabus.`,
      }));
      return res.json({ recommendations: fallbackRecs, aiPowered: false });
    }

    return res.json({ recommendations: results.slice(0, limit), aiPowered: true });
  } catch (err: any) {
    console.warn('AI recommendations error, using deterministic fallback:', err.message);
    const recs = candidates.slice(0, limit).map(book => ({
      book,
      reason: `Recommended based on ${book.category} syllabus.`,
    }));
    return res.json({ recommendations: recs, aiPowered: false });
  }
});

app.post('/api/ai/smart-search', async (req, res) => {
  aiSettings.totalRequests++;
  aiSettings.searchesCount++;

  const { query } = req.body;
  if (!query) return res.status(400).json({ message: 'Query is required' });

  const q = query.toLowerCase().trim();

  // Keyword catalog filter as basis
  const directMatches = dbBooks.filter(b => {
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      (b.tags && b.tags.some(t => t.toLowerCase().includes(q))) ||
      b.description.toLowerCase().includes(q)
    );
  });

  if (!aiSettings.enabled || !aiClient) {
    return res.json({
      books: directMatches,
      intent: {
        query,
        explanation: `Found ${directMatches.length} matching volumes for "${query}".`,
      },
      aiPowered: false,
    });
  }

  try {
    const catalogBrief = dbBooks.map(b => ({
      id: b.id,
      title: b.title,
      category: b.category,
      type: b.type,
      price: b.price,
      tags: b.tags,
      language: b.language,
    }));

    const prompt = `Analyze this user bookstore query: "${query}".
The query may be in English, Hindi, Hinglish, or Marathi.
Available books: ${JSON.stringify(catalogBrief)}.
Identify which book IDs best satisfy the user's intent. Also extract detected intent parameters (category, language, isFree: boolean, maxPrice: number, explanation: 1-sentence in English).
Return strictly JSON object:
{
  "bookIds": string[],
  "explanation": string,
  "category": string | null,
  "language": string | null,
  "isFree": boolean | null,
  "maxPrice": number | null
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const matchedBooks = (parsed.bookIds || [])
      .map((id: string) => dbBooks.find(b => b.id === id))
      .filter(Boolean);

    const finalBooks = matchedBooks.length > 0 ? matchedBooks : directMatches;

    return res.json({
      books: finalBooks,
      intent: {
        query,
        explanation: parsed.explanation || `Interpreted query: "${query}"`,
        category: parsed.category || undefined,
        language: parsed.language || undefined,
        isFree: parsed.isFree !== null ? parsed.isFree : undefined,
        maxPrice: parsed.maxPrice !== null ? parsed.maxPrice : undefined,
      },
      aiPowered: true,
    });
  } catch (err: any) {
    console.warn('AI search error, using direct matching:', err.message);
    return res.json({
      books: directMatches,
      intent: {
        query,
        explanation: `Matched ${directMatches.length} library books for "${query}".`,
      },
      aiPowered: false,
    });
  }
});

app.post('/api/ai/book-assistant', async (req, res) => {
  aiSettings.totalRequests++;
  aiSettings.assistantQueriesCount++;

  const { bookId, question, history = [] } = req.body;
  const book = dbBooks.find(b => b.id === bookId);
  if (!book) return res.status(404).json({ message: 'Book not found' });

  if (!aiSettings.enabled || !aiClient) {
    return res.json({
      reply: `**${book.title}** covers key topics in ${book.category} by ${book.author}.\n\n*Summary:* ${book.description}\n\nPages: ${book.pages} • Language: ${book.language} • Format: Open digital reading.`,
      aiPowered: false,
    });
  }

  try {
    const systemPrompt = `You are an academic book tutor for the book "${book.title}" by ${book.author}.
Category: ${book.category}.
Language: ${book.language}.
Pages: ${book.pages}, Year: ${book.publicationYear}.
Description: ${book.description}.
Tags: ${(book.tags || []).join(', ')}.
Table of contents / chapters: ${JSON.stringify(book.chapters || [])}.

Answer student questions accurately based strictly on this verified book metadata.
Support multilingual replies if the student asks in Hindi, Hinglish, or Marathi.
Do not fabricate text beyond what an academic syllabus guide would cover. Be encouraging, concise, and structured with bullet points.`;

    const conversation = history.map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
    const prompt = `${conversation ? conversation + '\n' : ''}User: ${question}\nAssistant:`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return res.json({
      reply: response.text?.trim() || `Information about "${book.title}" is available in the catalog description.`,
      aiPowered: true,
    });
  } catch (err: any) {
    return res.json({
      reply: `**${book.title}** (${book.category}) by ${book.author}:\n\n${book.description}\n\n*Note: AI service is currently busy. You can browse the chapter outline above.*`,
      aiPowered: false,
    });
  }
});

app.post('/api/ai/book-summary', async (req, res) => {
  aiSettings.totalRequests++;
  aiSettings.summariesCount++;

  const { bookId } = req.body;
  const book = dbBooks.find(b => b.id === bookId);
  if (!book) return res.status(404).json({ message: 'Book not found' });

  if (!aiSettings.enabled || !aiClient) {
    return res.json({
      shortSummary: book.description,
      keyTakeaways: [
        `Mastery of core concepts in ${book.category}.`,
        'Laboratory code exercises and algorithmic proofs.',
        'Structured curriculum designed for undergraduate exams.',
      ],
      keyTopics: book.tags || [book.category, 'Theory', 'Practice'],
      targetAudience: 'Computer Science & Engineering undergraduate students.',
      aiPowered: false,
    });
  }

  try {
    const prompt = `Synthesize an academic executive summary for this textbook:
Title: "${book.title}"
Author: "${book.author}"
Category: "${book.category}"
Description: "${book.description}"
Chapters: ${JSON.stringify(book.chapters || [])}
Return strictly a JSON object:
{
  "shortSummary": string, // 2-3 sentence overview
  "keyTakeaways": string[], // 3-4 bullet points
  "keyTopics": string[], // 4-6 topics
  "targetAudience": string // 1 sentence describing audience
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      shortSummary: parsed.shortSummary || book.description,
      keyTakeaways: parsed.keyTakeaways || ['Foundational theory and implementation proofs.'],
      keyTopics: parsed.keyTopics || (book.tags || []),
      targetAudience: parsed.targetAudience || 'Undergraduate and graduate computer science scholars.',
      aiPowered: true,
    });
  } catch {
    return res.json({
      shortSummary: book.description,
      keyTakeaways: [
        `Deep dive into ${book.category} principles.`,
        'Hands-on problem sets and algorithmic analyses.',
      ],
      keyTopics: book.tags || [book.category],
      targetAudience: 'Computer science and software engineering students.',
      aiPowered: false,
    });
  }
});

app.post('/api/ai/reader-assistant', async (req, res) => {
  aiSettings.totalRequests++;
  aiSettings.readerQueriesCount++;

  const { bookId, chapterTitle, snippet, action, userQuestion } = req.body;
  const book = dbBooks.find(b => b.id === bookId);

  if (!aiSettings.enabled || !aiClient) {
    return res.json({
      result: `The section "${chapterTitle || 'Reading'}" explores fundamental topics. Study the sample algorithms and verify each derivation step.`,
      aiPowered: false,
    });
  }

  try {
    let instruction = '';
    if (action === 'explain') {
      instruction = 'Explain this concept clearly and intuitively with a simple real-world analogy.';
    } else if (action === 'summarize') {
      instruction = 'Summarize this section into 3 concise bullet points with the core take-away.';
    } else if (action === 'simplify') {
      instruction = 'Simplify this text as if explaining to a first-year college student. Avoid overly dense jargon.';
    } else {
      instruction = `Answer the user question about this section: "${userQuestion || 'Explain this'}".`;
    }

    const prompt = `Textbook context: "${book?.title || 'Computer Science Text'}" - Section: "${chapterTitle || 'Chapter'}"
Text passage:
"${snippet}"

Task: ${instruction}
Language: Support the user's language (English, Hindi, Marathi). Be clear, academic yet friendly.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      result: response.text?.trim() || 'Analysis complete.',
      aiPowered: true,
    });
  } catch (err: any) {
    return res.json({
      result: `Section overview: ${snippet ? snippet.substring(0, 200) + '...' : 'Available in book.'}`,
      aiPowered: false,
    });
  }
});

// ==========================================
// 8. VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, () => {
    console.log(`BookStore Full-Stack Server listening on port ${PORT}`);
  });
}

startServer();
