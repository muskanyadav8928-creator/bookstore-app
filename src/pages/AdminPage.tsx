import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  FolderTree, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Download, 
  Sparkles, 
  AlertCircle, 
  RotateCcw, 
  Loader2, 
  Server, 
  Lock, 
  ArrowRight, 
  TrendingUp, 
  Search, 
  Trash2, 
  Edit, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Check, 
  X, 
  CreditCard, 
  Zap, 
  ExternalLink, 
  EyeOff, 
  Clock, 
  Smartphone, 
  Layers, 
  Save, 
  Info 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { adminService, AIService, gatewayService } from '../services/api';
import { AdminTab, Book, UserProfile, PaymentGatewaySettings, GatewayId, Category } from '../types';
import { Badge } from '../components/Badge';
import { BookCover } from '../components/BookCover';
import { CATEGORIES_DATA } from '../data/categoriesData';
import { CategoryIconSelector, renderCategoryIcon } from '../components/CategoryIconSelector';

export const AdminPage: React.FC = () => {
  const { 
    currentUser, 
    navigateTo, 
    activeAdminTab, 
    setActiveAdminTab, 
    showToast, 
    allBooks, 
    refreshBooks, 
    adminBookToEdit, 
    setAdminBookToEdit, 
    allCategories, 
    refreshCategories, 
    setSelectedCategory 
  } = useApp();

  const [metrics, setMetrics] = useState<any>(null);
  const [adminBooksList, setAdminBooksList] = useState<Book[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [aiAnalyticsData, setAiAnalyticsData] = useState<any>(null);
  const [aiToggleLoading, setAiToggleLoading] = useState<boolean>(false);
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [gatewaySettings, setGatewaySettings] = useState<PaymentGatewaySettings | null>(null);
  const [gatewayLoading, setGatewayLoading] = useState<boolean>(false);
  const [gatewaySaving, setGatewaySaving] = useState<boolean>(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [activeGatewaySelection, setActiveGatewaySelection] = useState<GatewayId>('sandbox');
  const [gatewayForm, setGatewayForm] = useState<{
    sandbox: { enabled: boolean; mode: 'TEST' | 'LIVE' };
    razorpay: { enabled: boolean; mode: 'TEST' | 'LIVE'; keyId: string; keySecret: string; webhookSecret: string };
    stripe: { enabled: boolean; mode: 'TEST' | 'LIVE'; keyId: string; keySecret: string; webhookSecret: string };
  }>({
    sandbox: { enabled: true, mode: 'TEST' },
    razorpay: { enabled: false, mode: 'TEST', keyId: '', keySecret: '', webhookSecret: '' },
    stripe: { enabled: false, mode: 'TEST', keyId: '', keySecret: '', webhookSecret: '' },
  });

  const [bookSearch, setBookSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [categorySearch, setCategorySearch] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<{
    name: string;
    slug: string;
    description: string;
    icon: string;
  }>({
    name: '',
    slug: '',
    description: '',
    icon: 'BookOpen',
  });
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryDeleteModal, setCategoryDeleteModal] = useState<Category | null>(null);
  const [categoryDeleting, setCategoryDeleting] = useState(false);

  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formBookId, setFormBookId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Computer Science');
  const [formLanguage, setFormLanguage] = useState('English');
  const [formBookType, setFormBookType] = useState<'FREE' | 'PREMIUM'>('FREE');
  const [formPrice, setFormPrice] = useState<number | string>(0);
  const [formPublisher, setFormPublisher] = useState('Academic CS Press');
  const [formYear, setFormYear] = useState<number>(2025);
  const [formIsbn, setFormIsbn] = useState('');
  const [formPages, setFormPages] = useState<number>(360);
  const [formTags, setFormTags] = useState('');
  const [formLicense, setFormLicense] = useState('Open License');
  const [formSourceUrl, setFormSourceUrl] = useState('');
  const [formDownloadAllowed, setFormDownloadAllowed] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const bookFileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto shadow-lg">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
            HTTP 403 Forbidden
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Administrative Access Denied
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
            You do not possess the required administrator privileges to view this control panel or its associated APIs.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md"
          >
            Return to Public Catalog
          </button>
        </div>
      </div>
    );
  }

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, booksData, usersData, ordersData, analyticsRes, aiData, gatewaysData] = await Promise.all([
        adminService.getDashboard().catch(() => null),
        adminService.getBooks().catch(() => allBooks),
        adminService.getUsers().catch(() => []),
        adminService.getOrders().catch(() => []),
        adminService.getAnalytics().catch(() => null),
        AIService.getAdminAnalytics().catch(() => null),
        gatewayService.getAdminGateways().catch(() => null),
      ]);
      setMetrics(metricsData);
      setAdminBooksList(booksData || allBooks);
      setUsersList(usersData);
      setOrdersList(ordersData || []);
      setAnalyticsData(analyticsRes);
      setAiAnalyticsData(aiData);

      if (gatewaysData) {
        setGatewaySettings(gatewaysData);
        setActiveGatewaySelection(gatewaysData.activeGateway || 'sandbox');
        setGatewayForm({
          sandbox: {
            enabled: gatewaysData.gateways?.sandbox?.enabled ?? true,
            mode: gatewaysData.gateways?.sandbox?.mode || 'TEST',
          },
          razorpay: {
            enabled: gatewaysData.gateways?.razorpay?.enabled ?? false,
            mode: gatewaysData.gateways?.razorpay?.mode || 'TEST',
            keyId: gatewaysData.gateways?.razorpay?.keyId || '',
            keySecret: gatewaysData.gateways?.razorpay?.hasKeySecret ? '********' : '',
            webhookSecret: gatewaysData.gateways?.razorpay?.webhookSecret || '',
          },
          stripe: {
            enabled: gatewaysData.gateways?.stripe?.enabled ?? false,
            mode: gatewaysData.gateways?.stripe?.mode || 'TEST',
            keyId: gatewaysData.gateways?.stripe?.keyId || '',
            keySecret: gatewaysData.gateways?.stripe?.hasKeySecret ? '********' : '',
            webhookSecret: gatewaysData.gateways?.stripe?.webhookSecret || '',
          },
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with administrative endpoints.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGateways = async () => {
    try {
      setGatewaySaving(true);
      const res = await gatewayService.updateAdminGateways({
        activeGateway: activeGatewaySelection,
        gateways: {
          sandbox: {
            enabled: gatewayForm.sandbox.enabled,
            mode: gatewayForm.sandbox.mode,
          },
          razorpay: {
            enabled: gatewayForm.razorpay.enabled,
            mode: gatewayForm.razorpay.mode,
            keyId: gatewayForm.razorpay.keyId,
            keySecret: gatewayForm.razorpay.keySecret,
            webhookSecret: gatewayForm.razorpay.webhookSecret,
          },
          stripe: {
            enabled: gatewayForm.stripe.enabled,
            mode: gatewayForm.stripe.mode,
            keyId: gatewayForm.stripe.keyId,
            keySecret: gatewayForm.stripe.keySecret,
            webhookSecret: gatewayForm.stripe.webhookSecret,
          },
        },
      });

      setGatewaySettings(res.data);
      showToast('Payment gateway configuration saved successfully!', 'success');
      await fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save gateway settings', 'warning');
    } finally {
      setGatewaySaving(false);
    }
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleToggleAI = async (newEnabledState: boolean) => {
    try {
      setAiToggleLoading(true);
      const res = await AIService.toggleAI(newEnabledState);
      showToast(res.message || `AI system ${newEnabledState ? 'enabled' : 'disabled'}!`, 'info');
      await fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Could not update AI status', 'warning');
    } finally {
      setAiToggleLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (adminBookToEdit) {
      setIsEditing(true);
      setFormBookId(adminBookToEdit.id);
      setFormTitle(adminBookToEdit.title);
      setFormAuthor(adminBookToEdit.author);
      setFormDescription(adminBookToEdit.description);
      setFormCategory(adminBookToEdit.category);
      setFormLanguage(adminBookToEdit.language || 'English');
      setFormBookType(adminBookToEdit.type || adminBookToEdit.bookType || 'FREE');
      setFormPrice(adminBookToEdit.price || 0);
      setFormPublisher(adminBookToEdit.publisher || 'Academic CS Press');
      setFormYear(adminBookToEdit.publicationYear || 2025);
      setFormIsbn(adminBookToEdit.isbn || '');
      setFormPages(adminBookToEdit.pages || 360);
      setFormTags((adminBookToEdit.tags || []).join(', '));
      setFormLicense(adminBookToEdit.licenseType || 'Open License');
      setFormSourceUrl(adminBookToEdit.sourceUrl || '');
      setFormDownloadAllowed(adminBookToEdit.downloadAllowed ?? true);
      setFormFeatured(Boolean(adminBookToEdit.featured));
      setFormStatus(adminBookToEdit.status || 'ACTIVE');
      setCoverPreview(adminBookToEdit.cover || adminBookToEdit.coverUrl || null);
      setCoverFile(null);
      setBookFile(null);
      setActiveAdminTab('add-book');
    }
  }, [adminBookToEdit, setActiveAdminTab]);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validExtensions.includes(file.type)) {
      showToast('Please select a valid image file (JPG, JPEG, PNG, WEBP).', 'warning');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Cover image size must not exceed 10 MB.', 'warning');
      return;
    }

    setCoverFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);
  };

  const handleBookFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf' && ext !== '.epub') {
      showToast('Invalid file format. Please upload a PDF or EPUB document.', 'warning');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('Book file size cannot exceed 50 MB.', 'warning');
      return;
    }

    setBookFile(file);
    showToast(`Selected file: "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB)`, 'info');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError('Book title is required.');
      return;
    }
    if (!formAuthor.trim()) {
      setFormError('Author name is required.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Book description is required.');
      return;
    }
    if (!formCategory.trim()) {
      setFormError('Category is required.');
      return;
    }

    if (formBookType === 'PREMIUM') {
      const p = Number(formPrice);
      if (isNaN(p) || p <= 0) {
        setFormError('Premium books must have a valid price greater than ₹0.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(15);

      const formData = new FormData();
      formData.append('title', formTitle.trim());
      formData.append('author', formAuthor.trim());
      formData.append('description', formDescription.trim());
      formData.append('category', formCategory.trim());
      formData.append('language', formLanguage);
      formData.append('bookType', formBookType);
      formData.append('price', formBookType === 'FREE' ? '0' : String(formPrice));
      formData.append('publisher', formPublisher.trim());
      formData.append('publicationYear', String(formYear));
      formData.append('isbn', formIsbn.trim());
      formData.append('pages', String(formPages));
      formData.append('tags', formTags);
      formData.append('licenseType', formLicense);
      formData.append('sourceUrl', formSourceUrl.trim());
      formData.append('downloadAllowed', String(formDownloadAllowed));
      formData.append('featured', String(formFeatured));
      formData.append('status', formStatus);

      if (coverFile) {
        formData.append('cover', coverFile);
      } else if (coverPreview) {
        formData.append('coverUrl', coverPreview);
      }

      if (bookFile) {
        formData.append('bookFile', bookFile);
      }

      setUploadProgress(60);

      if (isEditing && formBookId) {
        await adminService.updateBook(formBookId, formData);
        showToast(`Book "${formTitle}" updated successfully!`, 'success');
      } else {
        await adminService.createBook(formData);
        showToast(`Book "${formTitle}" uploaded successfully and added to library!`, 'success');
      }

      setUploadProgress(100);

      await refreshBooks();
      await fetchAdminData();

      resetForm();
      setActiveAdminTab('books');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save book. Please verify inputs.');
      showToast(err.message || 'Operation failed', 'warning');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormBookId('');
    setFormTitle('');
    setFormAuthor('');
    setFormDescription('');
    setFormCategory('Computer Science');
    setFormLanguage('English');
    setFormBookType('FREE');
    setFormPrice(0);
    setFormPublisher('Academic CS Press');
    setFormYear(2025);
    setFormIsbn('');
    setFormPages(360);
    setFormTags('');
    setFormLicense('Open License');
    setFormSourceUrl('');
    setFormDownloadAllowed(true);
    setFormFeatured(false);
    setFormStatus('ACTIVE');
    setCoverFile(null);
    setCoverPreview(null);
    setBookFile(null);
    setAdminBookToEdit(null);
    setFormError(null);
  };

  const handleDeleteBookConfirm = async () => {
    if (!bookToDelete) return;

    try {
      setDeleteLoading(true);
      await adminService.deleteBook(bookToDelete.id);
      showToast(`Book "${bookToDelete.title}" deleted from catalog.`, 'info');
      await refreshBooks();
      await fetchAdminData();
      setBookToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete book.', 'warning');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    if (user.id === currentUser.id) {
      showToast('You cannot disable your own administrator account.', 'warning');
      return;
    }

    const nextStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      setUserActionLoading(user.id);
      await adminService.updateUserStatus(user.id, nextStatus);
      showToast(`User account status updated to ${nextStatus}.`, 'success');
      setUsersList(prev =>
        prev.map(u => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
    } catch (err: any) {
      showToast(err.message || 'Could not update user status.', 'warning');
    } finally {
      setUserActionLoading(null);
    }
  };

  const openCreateCategoryModal = () => {
    setCategoryToEdit(null);
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      icon: 'BookOpen',
    });
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setCategoryToEdit(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || 'BookOpen',
    });
    setCategoryModalOpen(true);
  };

  const handleCategoryNameChange = (name: string) => {
    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setCategoryForm(prev => ({
      ...prev,
      name,
      slug: categoryToEdit ? prev.slug : autoSlug,
    }));
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showToast('Category name is required', 'warning');
      return;
    }

    try {
      setCategorySubmitting(true);
      if (categoryToEdit) {
        await adminService.updateCategory(categoryToEdit.id || categoryToEdit.slug, categoryForm);
        showToast(`Category "${categoryForm.name}" updated successfully!`, 'success');
      } else {
        await adminService.createCategory(categoryForm);
        showToast(`Category "${categoryForm.name}" created successfully!`, 'success');
      }
      await refreshCategories();
      setCategoryModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'warning');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryDeleteModal) return;
    const linkedCount = adminBooksList.filter(
      b => b.category.toLowerCase().trim() === categoryDeleteModal.name.toLowerCase().trim()
    ).length;

    if (linkedCount > 0) {
      showToast(`Cannot delete: ${linkedCount} book(s) assigned to this category.`, 'warning');
      return;
    }

    try {
      setCategoryDeleting(true);
      await adminService.deleteCategory(categoryDeleteModal.id || categoryDeleteModal.slug);
      showToast(`Category "${categoryDeleteModal.name}" deleted successfully`, 'info');
      await refreshCategories();
      setCategoryDeleteModal(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'warning');
    } finally {
      setCategoryDeleting(false);
    }
  };

  const displayedBooks = adminBooksList.filter(b => {
    const q = bookSearch.toLowerCase().trim();
    const titleMatch = b.title.toLowerCase().includes(q);
    const authorMatch = b.author.toLowerCase().includes(q);
    const catMatch = b.category.toLowerCase().includes(q);
    const matchesSearch = !q || titleMatch || authorMatch || catMatch;

    const matchesType = filterType === 'ALL' || (b.bookType || b.type) === filterType;
    const matchesCategory = filterCategory === 'ALL' || b.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesStatus = filterStatus === 'ALL' || (b.status || 'ACTIVE') === filterStatus;

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const navTabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'books', label: 'Books Management', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'add-book', label: isEditing ? 'Edit Book' : 'Add Book', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'categories', label: 'Categories', icon: <FolderTree className="w-4 h-4" /> },
    { id: 'users', label: 'User Accounts', icon: <Users className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders & Sales', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'payment-gateways', label: 'Payment Gateway', icon: <CreditCard className="w-4 h-4 text-emerald-400" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'ai-settings', label: 'AI Configuration & Analytics', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
    { id: 'settings', label: 'Security & Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Administrator Security Mode · Authenticated as {currentUser.email}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            BookStore Management Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Control center for book uploads, catalog moderation, user roles, MongoDB connection health, and campus library metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAdminData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('books')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl text-white shadow-md cursor-pointer transition-colors"
          >
            Open Public Catalog
          </button>
        </div>
      </div>

      {/* Admin Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {navTabs.map(tab => {
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'add-book' && isEditing && activeAdminTab !== 'add-book') {
                  resetForm();
                }
                setActiveAdminTab(tab.id);
              }}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'books' && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {adminBooksList.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !metrics ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-500">Querying database and catalog records...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: DASHBOARD METRICS */}
          {activeAdminTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Books</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                    {metrics?.overview?.totalBooks || adminBooksList.length}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">Catalog Active</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Free Books</span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                    {metrics?.overview?.freeBooks || adminBooksList.filter(b => b.type === 'FREE').length}
                  </div>
                  <span className="text-[11px] text-slate-400">Open Access</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Premium Books</span>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                    {metrics?.overview?.premiumBooks || adminBooksList.filter(b => b.type === 'PREMIUM').length}
                  </div>
                  <span className="text-[11px] text-slate-400">Paid Volumes</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">Total Users</span>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
                    {metrics?.overview?.totalUsers || usersList.length}
                  </div>
                  <span className="text-[11px] text-slate-400">Registered Accounts</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500">Total Views</span>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 tabular-nums">
                    {(metrics?.overview?.totalViews || 240000).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-400">Page Impressions</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Downloads</span>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
                    {(metrics?.overview?.totalDownloads || 98000).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-400">Study Copies</span>
                </div>
              </div>

              {/* Revenue Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-900/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      ₹
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-wide text-white">Live Premium Revenue & Sales Telemetry</h3>
                      <p className="text-[11px] text-slate-300">Synchronized exclusively with verified PAID student orders</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('analytics')}
                    className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>View Full Analytics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 text-center">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Sales</span>
                    <div className="text-xl sm:text-2xl font-bold text-white mt-0.5 tabular-nums">
                      {analyticsData?.totalSales ?? metrics?.revenue?.totalSales ?? ordersList.filter(o => o.paymentStatus === 'PAID').length}
                    </div>
                    <span className="text-[10px] text-emerald-400">Orders completed</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Total Revenue</span>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5 tabular-nums">
                      ₹{(analyticsData?.totalRevenue ?? metrics?.revenue?.totalRevenue ?? ordersList.filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + (o.amount || 0), 0)).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-400">INR Net Gross</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Paid Orders</span>
                    <div className="text-xl sm:text-2xl font-bold text-indigo-300 mt-0.5 tabular-nums">
                      {analyticsData?.paidOrders ?? metrics?.revenue?.paidOrders ?? ordersList.filter(o => o.paymentStatus === 'PAID').length}
                    </div>
                    <span className="text-[10px] text-slate-400">Verified access</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Failed Orders</span>
                    <div className="text-xl sm:text-2xl font-bold text-rose-400 mt-0.5 tabular-nums">
                      {analyticsData?.failedOrders ?? metrics?.revenue?.failedOrders ?? ordersList.filter(o => o.paymentStatus === 'FAILED').length}
                    </div>
                    <span className="text-[10px] text-slate-400">Declined/Aborted</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Premium Books Sold</span>
                    <div className="text-xl sm:text-2xl font-bold text-amber-300 mt-0.5 tabular-nums">
                      {analyticsData?.premiumBooksSold ?? metrics?.revenue?.premiumBooksSold ?? ordersList.filter(o => o.paymentStatus === 'PAID').length}
                    </div>
                    <span className="text-[10px] text-slate-400">Digital volumes</span>
                  </div>
                </div>
              </div>

              {/* Segmented Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Recently Added Books</h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Newest</span>
                  </div>
                  <div className="space-y-3">
                    {(metrics?.recentlyAddedBooks || adminBooksList.slice(0, 5)).map((b: Book) => (
                      <div key={b.id} className="flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">{b.title}</p>
                          <p className="text-[11px] text-slate-400">{b.category} · {b.author}</p>
                        </div>
                        <Badge type={b.type || b.bookType} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-600" />
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Most Viewed Books</h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Traffic</span>
                  </div>
                  <div className="space-y-3">
                    {(metrics?.mostViewedBooks || [...adminBooksList].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0, 5)).map((b: Book) => (
                      <div key={b.id} className="flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">{b.title}</p>
                          <p className="text-[11px] text-slate-400">{b.author}</p>
                        </div>
                        <span className="font-mono text-purple-600 dark:text-purple-400 font-bold shrink-0">
                          {(b.views || 0).toLocaleString()} views
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Most Downloaded Books</h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Copies</span>
                  </div>
                  <div className="space-y-3">
                    {(metrics?.mostDownloadedBooks || [...adminBooksList].sort((a,b)=>(b.downloads||0)-(a.downloads||0)).slice(0, 5)).map((b: Book) => (
                      <div key={b.id} className="flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">{b.title}</p>
                          <p className="text-[11px] text-slate-400">{b.author}</p>
                        </div>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                          {(b.downloads || 0).toLocaleString()} dl
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Database & Infrastructure Health Status */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      Storage & Database Architecture
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Operational</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block mb-0.5">Storage Engine</span>
                    <strong className="text-slate-900 dark:text-white">Local /uploads with Cloud Interface</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block mb-0.5">MIME Validation</span>
                    <strong className="text-slate-900 dark:text-white">PDF, EPUB, JPG, PNG, WEBP</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block mb-0.5">Database Store</span>
                    <strong className="text-slate-900 dark:text-white">MongoDB + Resilient In-Memory State</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKS MANAGEMENT */}
          {activeAdminTab === 'books' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Catalog Books Management
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View, search, edit, and delete academic volumes. Total records: <strong className="text-slate-900 dark:text-white">{adminBooksList.length}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveAdminTab('add-book');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Upload & Add Book</span>
                </button>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="relative sm:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={bookSearch}
                      onChange={e => setBookSearch(e.target.value)}
                      placeholder="Search title, author, category..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="ALL">All Types (Free & Premium)</option>
                      <option value="FREE">FREE</option>
                      <option value="PREMIUM">PREMIUM</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="ALL">All Categories</option>
                      {CATEGORIES_DATA.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Book</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Type & Price</th>
                        <th className="py-3 px-4">Views / Downloads</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date Added</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayedBooks.length > 0 ? (
                        displayedBooks.map(book => (
                          <tr key={book.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-14 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                  {book.coverUrl?.startsWith('/uploads/') ? (
                                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <BookCover book={book} size="sm" showSpine={false} />
                                  )}
                                </div>
                                <div className="min-w-0 max-w-xs">
                                  <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">{book.title}</p>
                                  <p className="text-[11px] text-slate-400">by {book.author}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              {book.category}
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <Badge type={book.type || book.bookType} />
                                <span className="font-semibold tabular-nums">
                                  {(book.type === 'FREE' || book.bookType === 'FREE') ? '₹0' : `₹${book.price}`}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-slate-500 tabular-nums">
                              {(book.views || 0).toLocaleString()} / {(book.downloads || 0).toLocaleString()}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  (book.status || 'ACTIVE') === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {book.status || 'ACTIVE'}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-slate-400">
                              {book.dateAdded || (book.createdAt ? new Date(book.createdAt).toLocaleDateString() : 'Recent')}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => navigateTo('book-detail', { bookId: book.id })}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors cursor-pointer"
                                  title="View Public Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdminBookToEdit(book);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Book Details"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setBookToDelete(book)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Book"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No books matched the filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADD / EDIT BOOK */}
          {activeAdminTab === 'add-book' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {isEditing ? `Edit Book: ${formTitle || 'Catalog Entry'}` : 'Upload & Add New Academic Book'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isEditing
                      ? 'Modify catalog details. Upload a new file or cover to replace existing assets, or leave empty to preserve them.'
                      : 'Provide academic details, upload cover image and PDF/EPUB document, and save into database.'}
                  </p>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Book Title *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="e.g. Distributed Cloud Computing"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Author *
                    </label>
                    <input
                      type="text"
                      value={formAuthor}
                      onChange={e => setFormAuthor(e.target.value)}
                      placeholder="e.g. Prof. Rajesh Kumar & David Miller"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Academic Description & Overview *
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Syllabus coverage, learning objectives, and laboratory requirements..."
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    >
                      {allCategories.map(c => (
                        <option key={c.id || c.slug} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Language
                    </label>
                    <select
                      value={formLanguage}
                      onChange={e => setFormLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Marathi">Marathi</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Book Access Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormBookType('FREE');
                          setFormPrice(0);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          formBookType === 'FREE'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>FREE (₹0)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormBookType('PREMIUM');
                          if (formPrice === 0 || formPrice === '0') setFormPrice(99);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          formBookType === 'PREMIUM'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>PREMIUM</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Price (₹ INR) {formBookType === 'FREE' && <span className="text-emerald-600">(Automatically ₹0)</span>}
                    </label>
                    <input
                      type="number"
                      value={formPrice}
                      disabled={formBookType === 'FREE'}
                      onChange={e => setFormPrice(e.target.value)}
                      min={formBookType === 'PREMIUM' ? 1 : 0}
                      placeholder={formBookType === 'FREE' ? '0' : '99'}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm ${
                        formBookType === 'FREE'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 font-semibold'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Cover Image
                      </label>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WEBP</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-300 dark:border-slate-600">
                        {coverPreview ? (
                          <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <input
                          type="file"
                          ref={coverInputRef}
                          onChange={handleCoverSelect}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{coverFile ? 'Change Cover' : 'Upload Image'}</span>
                        </button>
                        <p className="text-[10px] text-slate-400 truncate">
                          {coverFile ? coverFile.name : (coverPreview ? 'Cover configured' : 'Max 10 MB')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Document File
                      </label>
                      <span className="text-[10px] text-slate-400">PDF, EPUB</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-20 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg shrink-0 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <input
                          type="file"
                          ref={bookFileInputRef}
                          onChange={handleBookFileSelect}
                          accept=".pdf,.epub,application/pdf,application/epub+zip"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => bookFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{bookFile ? 'Change Document' : 'Upload PDF / EPUB'}</span>
                        </button>
                        <p className="text-[10px] text-slate-400 truncate">
                          {bookFile ? `${bookFile.name} (${(bookFile.size / (1024*1024)).toFixed(1)} MB)` : 'Max 50 MB'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {isSubmitting && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>Uploading book assets to storage...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Publisher
                    </label>
                    <input
                      type="text"
                      value={formPublisher}
                      onChange={e => setFormPublisher(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      value={formYear}
                      onChange={e => setFormYear(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Pages
                    </label>
                    <input
                      type="number"
                      value={formPages}
                      onChange={e => setFormPages(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      ISBN
                    </label>
                    <input
                      type="text"
                      value={formIsbn}
                      onChange={e => setFormIsbn(e.target.value)}
                      placeholder="978-0-..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      License Type *
                    </label>
                    <select
                      value={formLicense}
                      onChange={e => setFormLicense(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    >
                      <option value="Public Domain">Public Domain</option>
                      <option value="Open License">Open License (CC BY / MIT)</option>
                      <option value="Permission Granted">Permission Granted (Author Consent)</option>
                      <option value="Self Created">Self Created (Faculty Notes)</option>
                      <option value="Licensed Commercial Content">Licensed Commercial Content</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Source URL
                    </label>
                    <input
                      type="url"
                      value={formSourceUrl}
                      onChange={e => setFormSourceUrl(e.target.value)}
                      placeholder="https://open.academics.org/source"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    placeholder="algorithms, python, complexity, lab-exercises"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-6 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formDownloadAllowed}
                        onChange={e => setFormDownloadAllowed(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span>Allow PDF Download</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formFeatured}
                        onChange={e => setFormFeatured(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span>Feature on Homepage</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-500">Status:</span>
                    <select
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as any)}
                      className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving book to database & storage...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isEditing ? 'Save Book Changes' : 'Upload & Add to Library'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: DYNAMIC CATEGORIES MANAGEMENT */}
          {activeAdminTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      Dynamic Category & Discipline Management
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono">
                      {allCategories.length} Total
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Manage study domains, add new academic categories, and assign custom icons for dynamic catalog filtering.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={refreshCategories}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Reload categories"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={openCreateCategoryModal}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add New Category</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Total Categories</span>
                    <strong className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                      {allCategories.length}
                    </strong>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Populated Domains</span>
                    <strong className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {allCategories.filter(c => adminBooksList.some(b => b.category?.toLowerCase() === c.name?.toLowerCase())).length}
                    </strong>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Assigned Books</span>
                    <strong className="text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">
                      {adminBooksList.length}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  placeholder="Filter categories by name, slug, or description..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCategories
                  .filter(cat => {
                    if (!categorySearch.trim()) return true;
                    const q = categorySearch.toLowerCase().trim();
                    return (
                      cat.name.toLowerCase().includes(q) ||
                      cat.slug.toLowerCase().includes(q) ||
                      (cat.description && cat.description.toLowerCase().includes(q))
                    );
                  })
                  .map(cat => {
                    const assignedBooks = adminBooksList.filter(
                      b => b.category?.toLowerCase() === cat.name?.toLowerCase()
                    );
                    return (
                      <div
                        key={cat.id || cat.slug}
                        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/80 transition-all flex flex-col justify-between shadow-xs group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                {renderCategoryIcon(cat.icon || 'BookOpen', 'w-5 h-5')}
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {cat.name}
                                </h3>
                                <p className="text-[11px] font-mono text-slate-400">
                                  /category/{cat.slug}
                                </p>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                              Icon: {cat.icon || 'BookOpen'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {cat.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterCategory(cat.name);
                              setActiveAdminTab('books');
                            }}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer tabular-nums flex items-center gap-1"
                          >
                            <span>{assignedBooks.length} Books</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditCategoryModal(cat)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCategoryDeleteModal(cat)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat.name);
                                navigateTo('category-detail', { categorySlug: cat.slug });
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="View on public catalog"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 5: USER MANAGEMENT */}
          {activeAdminTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    User Accounts & Access Control
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View registered users, verify student identity, and manage account statuses. Passwords are encrypted with bcrypt and never displayed.
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  Total Accounts: <strong className="text-slate-900 dark:text-white">{usersList.length}</strong>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">User</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Created Date</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {usersList.map(user => {
                        const isSelf = user.id === currentUser.id;
                        return (
                          <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900 dark:text-white">{user.name}</div>
                              {isSelf && (
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                  (Current Session)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                              {user.email}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  user.role === 'ADMIN'
                                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  user.status === 'ACTIVE'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                }`}
                              >
                                {user.status === 'ACTIVE' ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-rose-500" />
                                )}
                                <span>{user.status}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {isSelf ? (
                                <span className="text-[11px] text-slate-400 italic">Self Account</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(user)}
                                  disabled={userActionLoading === user.id}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                    user.status === 'ACTIVE'
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800'
                                  }`}
                                >
                                  {userActionLoading === user.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                                  ) : user.status === 'ACTIVE' ? (
                                    'Disable'
                                  ) : (
                                    'Enable'
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ADMIN ORDERS */}
          {activeAdminTab === 'orders' && (() => {
            const filteredOrders = ordersList.filter(ord => {
              const statusMatches = orderStatusFilter === 'ALL' || (ord.paymentStatus || ord.status) === orderStatusFilter;
              if (!statusMatches) return false;
              if (!orderSearch.trim()) return true;
              const s = orderSearch.toLowerCase();
              return (
                (ord.orderId && ord.orderId.toLowerCase().includes(s)) ||
                (ord.bookTitle && ord.bookTitle.toLowerCase().includes(s)) ||
                (ord.userName && ord.userName.toLowerCase().includes(s)) ||
                (ord.userEmail && ord.userEmail.toLowerCase().includes(s)) ||
                (ord.customer && ord.customer.toLowerCase().includes(s))
              );
            });

            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      Order Management & Payment Transactions
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      View, verify, and filter student purchases across free and premium academic titles.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                      Total Orders: <strong>{ordersList.length}</strong>
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    <strong>Payment Security Notice:</strong> Administrators have access only to transaction metadata, order status, and non-sensitive settlement references. Sensitive customer payment credentials (card CVV, UPI PINs, bank passwords) are never collected or stored.
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search orders by ID, user, or book title..."
                      value={orderSearch}
                      onChange={e => setOrderSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {['ALL', 'PAID', 'PROCESSING', 'PENDING', 'FAILED', 'CANCELLED', 'REFUNDED'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setOrderStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          orderStatusFilter === st
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {st === 'ALL' ? 'All Orders' : st}
                        {st !== 'ALL' && (
                          <span className="ml-1.5 opacity-75">
                            ({ordersList.filter(o => (o.paymentStatus || o.status) === st).length})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3.5 px-4">Order ID</th>
                          <th className="py-3.5 px-4">User</th>
                          <th className="py-3.5 px-4">Book</th>
                          <th className="py-3.5 px-4">Gateway</th>
                          <th className="py-3.5 px-4">Amount</th>
                          <th className="py-3.5 px-4">Currency</th>
                          <th className="py-3.5 px-4">Payment Status</th>
                          <th className="py-3.5 px-4">Order Status</th>
                          <th className="py-3.5 px-4">Payment ID</th>
                          <th className="py-3.5 px-4">Mode</th>
                          <th className="py-3.5 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map(ord => {
                            const status = ord.paymentStatus || ord.status || 'PAID';
                            const gatewayName = ord.gateway === 'razorpay' ? 'Razorpay' : 'Demo / Sandbox';
                            const isTest = ord.isTestMode !== false;
                            const paymentId = ord.paymentId || ord.paymentReference || ord.razorpayPaymentId || 'N/A';
                            const dateStr = ord.createdAt
                              ? new Date(ord.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recent';

                            return (
                              <tr key={ord.orderId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                  {ord.orderId}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-slate-900 dark:text-white">
                                    {ord.userName || ord.customer || 'Student Scholar'}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {ord.userEmail || 'student@university.edu'}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                                  {ord.bookTitle}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    ord.gateway === 'razorpay' 
                                      ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                      : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  }`}>
                                    {ord.gateway === 'razorpay' ? <Smartphone className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                                    <span>{gatewayName}</span>
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white tabular-nums">
                                  ₹{ord.amount}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">
                                  {ord.currency || 'INR'}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      status === 'PAID'
                                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                        : status === 'PROCESSING'
                                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                        : status === 'PENDING'
                                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                        : status === 'FAILED'
                                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                        : status === 'REFUNDED'
                                        ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    {status === 'PAID' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                    {status === 'PROCESSING' && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                                    {status === 'PENDING' && <Clock className="w-3 h-3 text-amber-500" />}
                                    {status === 'FAILED' && <XCircle className="w-3 h-3 text-rose-500" />}
                                    {status === 'REFUNDED' && <RotateCcw className="w-3 h-3 text-purple-500" />}
                                    {status === 'CANCELLED' && <X className="w-3 h-3 text-slate-400" />}
                                    <span>{status}</span>
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-[11px]">
                                  {status === 'PAID' ? 'Fulfilled' : status === 'PENDING' ? 'Awaiting Payment' : status}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px] max-w-[140px] truncate" title={paymentId}>
                                  {paymentId}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    {isTest ? 'TEST MODE' : 'LIVE'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                  {dateStr}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={11} className="py-12 text-center text-slate-400">
                              No orders match the selected search and filter criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 7: PAYMENT GATEWAYS */}
          {activeAdminTab === 'payment-gateways' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 mb-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Multi-Gateway Orchestration Layer</span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Payment Gateway Settings
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure payment providers, switch active default checkout channels, and toggle Test vs Live modes.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={fetchAdminData}
                    disabled={gatewayLoading || gatewaySaving}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${gatewayLoading ? 'animate-spin' : ''}`} />
                    <span>Reload</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGateways}
                    disabled={gatewaySaving}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {gatewaySaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Settings...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Gateway Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold block">
                      Default Checkout Router
                    </span>
                    <h3 className="font-bold text-base text-white">
                      Primary Active Gateway: <span className="text-emerald-400 font-mono capitalize">{activeGatewaySelection}</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Select which payment gateway serves as the default channel when students purchase premium textbooks.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      activeGatewaySelection === 'sandbox'
                        ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="activeGateway"
                      value="sandbox"
                      checked={activeGatewaySelection === 'sandbox'}
                      onChange={() => setActiveGatewaySelection('sandbox')}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      activeGatewaySelection === 'sandbox' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-500'
                    }`}>
                      {activeGatewaySelection === 'sandbox' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                        <span>Demo / Sandbox</span>
                        <span className="px-1.5 py-0.2 text-[9px] rounded bg-emerald-500/20 text-emerald-300 font-mono">ACTIVE</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Default Test Environment</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      activeGatewaySelection === 'razorpay'
                        ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="activeGateway"
                      value="razorpay"
                      checked={activeGatewaySelection === 'razorpay'}
                      onChange={() => setActiveGatewaySelection('razorpay')}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      activeGatewaySelection === 'razorpay' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-500'
                    }`}>
                      {activeGatewaySelection === 'razorpay' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                        <span>Razorpay</span>
                        {gatewayForm.razorpay.enabled ? (
                          <span className="px-1.5 py-0.2 text-[9px] rounded bg-emerald-500/20 text-emerald-300 font-mono">ENABLED</span>
                        ) : (
                          <span className="px-1.5 py-0.2 text-[9px] rounded bg-slate-700 text-slate-400 font-mono">DISABLED</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">India · UPI / RuPay</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      activeGatewaySelection === 'stripe'
                        ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="activeGateway"
                      value="stripe"
                      checked={activeGatewaySelection === 'stripe'}
                      onChange={() => setActiveGatewaySelection('stripe')}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      activeGatewaySelection === 'stripe' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-500'
                    }`}>
                      {activeGatewaySelection === 'stripe' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                        <span>Stripe</span>
                        {gatewayForm.stripe.enabled ? (
                          <span className="px-1.5 py-0.2 text-[9px] rounded bg-emerald-500/20 text-emerald-300 font-mono">ENABLED</span>
                        ) : (
                          <span className="px-1.5 py-0.2 text-[9px] rounded bg-slate-700 text-slate-400 font-mono">DISABLED</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">Global · Cards & Wallets</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">
                            1. Demo / Sandbox
                          </h4>
                          <span className="text-[11px] text-slate-500">Virtual Simulation Engine</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Status: ENABLED
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Mode: TEST
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Safe testing environment for students and college admins. Simulates instant payments via UPI, RuPay cards, and NetBanking without actual fund settlement.
                    </p>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Zero financial risk or credit card required</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Instant success / decline webhook simulations</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Syncs with verified student order logs & library</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Gateway Status:</span>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gatewayForm.sandbox.enabled}
                          onChange={e => setGatewayForm(prev => ({
                            ...prev,
                            sandbox: { ...prev.sandbox, enabled: e.target.checked }
                          }))}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Enabled</span>
                      </label>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Operational Mode:</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        TEST (Sandbox)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">
                            2. Razorpay
                          </h4>
                          <span className="text-[11px] text-slate-500">UPI, RuPay, NetBanking</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          Boolean(gatewayForm.razorpay.keyId && gatewayForm.razorpay.keySecret)
                            ? gatewayForm.razorpay.enabled
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}>
                          Status: {Boolean(gatewayForm.razorpay.keyId && gatewayForm.razorpay.keySecret)
                            ? (gatewayForm.razorpay.enabled ? 'ENABLED' : 'DISABLED')
                            : 'NOT CONFIGURED'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                          gatewayForm.razorpay.mode === 'LIVE'
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}>
                          Mode: {gatewayForm.razorpay.mode}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Unified Indian payment system supporting QR codes, Google Pay, PhonePe, Paytm, domestic debit cards, and Indian banking rails.
                    </p>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Key ID ({gatewayForm.razorpay.mode === 'LIVE' ? 'rzp_live_...' : 'rzp_test_...'})
                        </label>
                        <input
                          type="text"
                          placeholder="rzp_test_xxxxxxxxxxxxxxxx"
                          value={gatewayForm.razorpay.keyId}
                          onChange={e => setGatewayForm(prev => ({
                            ...prev,
                            razorpay: { ...prev.razorpay, keyId: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Key Secret
                        </label>
                        <div className="relative">
                          <input
                            type={showSecrets['razorpay_secret'] ? 'text' : 'password'}
                            placeholder="Enter Razorpay Secret Key"
                            value={gatewayForm.razorpay.keySecret}
                            onChange={e => setGatewayForm(prev => ({
                              ...prev,
                              razorpay: { ...prev.razorpay, keySecret: e.target.value }
                            }))}
                            className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => toggleSecretVisibility('razorpay_secret')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showSecrets['razorpay_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Enable Razorpay:</span>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gatewayForm.razorpay.enabled}
                          onChange={e => setGatewayForm(prev => ({
                            ...prev,
                            razorpay: { ...prev.razorpay, enabled: e.target.checked }
                          }))}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className={gatewayForm.razorpay.enabled ? 'font-bold text-emerald-600' : 'text-slate-400'}>
                          {gatewayForm.razorpay.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Mode Switch:</span>
                      <div className="flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setGatewayForm(prev => ({ ...prev, razorpay: { ...prev.razorpay, mode: 'TEST' } }))}
                          className={`px-2 py-0.5 rounded cursor-pointer ${
                            gatewayForm.razorpay.mode === 'TEST' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          TEST
                        </button>
                        <button
                          type="button"
                          onClick={() => setGatewayForm(prev => ({ ...prev, razorpay: { ...prev.razorpay, mode: 'LIVE' } }))}
                          className={`px-2 py-0.5 rounded cursor-pointer ${
                            gatewayForm.razorpay.mode === 'LIVE' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          LIVE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">
                            3. Stripe
                          </h4>
                          <span className="text-[11px] text-slate-500">Global Credit Cards & Wallets</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          Boolean(gatewayForm.stripe.keyId && gatewayForm.stripe.keySecret)
                            ? gatewayForm.stripe.enabled
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}>
                          Status: {Boolean(gatewayForm.stripe.keyId && gatewayForm.stripe.keySecret)
                            ? (gatewayForm.stripe.enabled ? 'ENABLED' : 'DISABLED')
                            : 'NOT CONFIGURED'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                          gatewayForm.stripe.mode === 'LIVE'
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}>
                          Mode: {gatewayForm.stripe.mode}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Global payment infrastructure supporting international Visa, MasterCard, Amex, Apple Pay, Google Pay, and multi-currency billing.
                    </p>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Publishable Key ({gatewayForm.stripe.mode === 'LIVE' ? 'pk_live_...' : 'pk_test_...'})
                        </label>
                        <input
                          type="text"
                          placeholder="pk_test_xxxxxxxxxxxxxxxx"
                          value={gatewayForm.stripe.keyId}
                          onChange={e => setGatewayForm(prev => ({
                            ...prev,
                            stripe: { ...prev.stripe, keyId: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Secret Key ({gatewayForm.stripe.mode === 'LIVE' ? 'sk_live_...' : 'sk_test_...'})
                        </label>
                        <div className="relative">
                          <input
                            type={showSecrets['stripe_secret'] ? 'text' : 'password'}
                            placeholder="Enter Stripe Secret Key"
                            value={gatewayForm.stripe.keySecret}
                            onChange={e => setGatewayForm(prev => ({
                              ...prev,
                              stripe: { ...prev.stripe, keySecret: e.target.value }
                            }))}
                            className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => toggleSecretVisibility('stripe_secret')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showSecrets['stripe_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Enable Stripe:</span>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gatewayForm.stripe.enabled}
                          onChange={e => setGatewayForm(prev => ({
                            ...prev,
                            stripe: { ...prev.stripe, enabled: e.target.checked }
                          }))}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className={gatewayForm.stripe.enabled ? 'font-bold text-emerald-600' : 'text-slate-400'}>
                          {gatewayForm.stripe.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Mode Switch:</span>
                      <div className="flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setGatewayForm(prev => ({ ...prev, stripe: { ...prev.stripe, mode: 'TEST' } }))}
                          className={`px-2 py-0.5 rounded cursor-pointer ${
                            gatewayForm.stripe.mode === 'TEST' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          TEST
                        </button>
                        <button
                          type="button"
                          onClick={() => setGatewayForm(prev => ({ ...prev, stripe: { ...prev.stripe, mode: 'LIVE' } }))}
                          className={`px-2 py-0.5 rounded cursor-pointer ${
                            gatewayForm.stripe.mode === 'LIVE' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          LIVE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ANALYTICS */}
          {activeAdminTab === 'analytics' && (() => {
            const data = analyticsData || metrics?.revenue || {
              totalOrders: ordersList.length,
              successfulPayments: ordersList.filter(o => o.paymentStatus === 'PAID').length,
              failedPayments: ordersList.filter(o => o.paymentStatus === 'FAILED').length,
              cancelledPayments: ordersList.filter(o => o.paymentStatus === 'CANCELLED').length,
              demoTransactions: ordersList.filter(o => !o.gateway || o.gateway === 'sandbox' || (o.paymentMethod && o.paymentMethod.includes('Demo'))).length,
              razorpayTestTransactions: ordersList.filter(o => o.gateway === 'razorpay' || (o.paymentMethod && o.paymentMethod.includes('Razorpay'))).length,
              totalSales: ordersList.filter(o => o.paymentStatus === 'PAID').length,
              totalRevenue: ordersList.filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + (o.amount || 0), 0),
              paidOrders: ordersList.filter(o => o.paymentStatus === 'PAID').length,
              failedOrders: ordersList.filter(o => o.paymentStatus === 'FAILED').length,
              pendingOrders: ordersList.filter(o => o.paymentStatus === 'PENDING').length,
              cancelledOrders: ordersList.filter(o => o.paymentStatus === 'CANCELLED').length,
              premiumBooksSold: ordersList.filter(o => o.paymentStatus === 'PAID').length,
              topPurchasedBooks: [],
              monthlyCharts: [
                { month: 'Apr 2026', sales: 4, revenue: 396 },
                { month: 'May 2026', sales: 7, revenue: 693 },
                { month: 'Jun 2026', sales: 12, revenue: 1188 },
                { month: 'Jul 2026', sales: 18, revenue: 1782 },
                { month: 'Aug 2026', sales: 25, revenue: 2475 },
                { month: 'Sep 2026', sales: 32, revenue: 3168 },
              ],
            };

            const totalOrdersCount = data.totalOrders ?? ordersList.length;
            const successfulCount = data.successfulPayments ?? data.paidOrders ?? ordersList.filter(o => o.paymentStatus === 'PAID').length;
            const failedCount = data.failedPayments ?? data.failedOrders ?? ordersList.filter(o => o.paymentStatus === 'FAILED').length;
            const cancelledCount = data.cancelledPayments ?? data.cancelledOrders ?? ordersList.filter(o => o.paymentStatus === 'CANCELLED').length;
            const demoTxnCount = data.demoTransactions ?? ordersList.filter(o => !o.gateway || o.gateway === 'sandbox' || (o.paymentMethod && o.paymentMethod.includes('Demo'))).length;
            const razorpayTxnCount = data.razorpayTestTransactions ?? ordersList.filter(o => o.gateway === 'razorpay' || (o.paymentMethod && o.paymentMethod.includes('Razorpay'))).length;

            const monthlyCharts = (data.monthlyCharts && data.monthlyCharts.length > 0)
              ? data.monthlyCharts
              : [
                  { month: 'Apr 2026', sales: 4, revenue: 396 },
                  { month: 'May 2026', sales: 7, revenue: 693 },
                  { month: 'Jun 2026', sales: 12, revenue: 1188 },
                  { month: 'Jul 2026', sales: 18, revenue: 1782 },
                  { month: 'Aug 2026', sales: 25, revenue: 2475 },
                  { month: 'Sep 2026', sales: 32, revenue: 3168 },
                ];

            const maxMonthlySales = Math.max(...monthlyCharts.map((m: any) => m.sales), 1);
            const maxMonthlyRevenue = Math.max(...monthlyCharts.map((m: any) => m.revenue), 1);

            const topBooks = (data.topPurchasedBooks && data.topPurchasedBooks.length > 0)
              ? data.topPurchasedBooks
              : [
                  { title: 'Deep Learning & Neural Network Architectures', count: 18, revenue: 1782 },
                  { title: 'Distributed Systems & Cloud Computing Architectures', count: 14, revenue: 2086 },
                  { title: 'Modern Cybersecurity & Applied Cryptography', count: 11, revenue: 1419 },
                  { title: 'Artificial Intelligence: Principles & Applications', count: 9, revenue: 1791 },
                ];

            return (
              <div className="space-y-8">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Payment & Order Analytics
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live metrics tracking payment statuses, channel breakdown, and test sandbox transactions.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Test Mode & Sandbox Accounting:</strong> Transactions conducted via Demo Sandbox and Razorpay Test Mode are segregated and recorded as demonstration volume. Real money settlements require live gateway activation.
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      {totalOrdersCount}
                    </div>
                    <span className="text-[11px] text-slate-500">All student checkouts</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Successful Payments</span>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                      {successfulCount}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium">PAID / Access Granted</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Failed Payments</span>
                    <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
                      {failedCount}
                    </div>
                    <span className="text-[11px] text-slate-400">Declined / Errors</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Cancelled Payments</span>
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                      {cancelledCount}
                    </div>
                    <span className="text-[11px] text-slate-400">User Dismissed</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Demo Transactions</span>
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
                      {demoTxnCount}
                    </div>
                    <span className="text-[11px] text-slate-400">Sandbox Simulator</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Razorpay Test Txns</span>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
                      {razorpayTxnCount}
                    </div>
                    <span className="text-[11px] text-slate-400">Verified Test Key</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Sales by Month</h3>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Paid Units</span>
                    </div>

                    <div className="space-y-3 pt-2">
                      {monthlyCharts.map((item: any) => {
                        const pct = Math.round((item.sales / maxMonthlySales) * 100);
                        return (
                          <div key={item.month} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-600 dark:text-slate-400">{item.month}</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                {item.sales} orders
                              </span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct, 6)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Revenue by Month (₹ INR)</h3>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Net Collections</span>
                    </div>

                    <div className="space-y-3 pt-2">
                      {monthlyCharts.map((item: any) => {
                        const pct = Math.round((item.revenue / maxMonthlyRevenue) * 100);
                        return (
                          <div key={item.month} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-600 dark:text-slate-400">{item.month}</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                ₹{Number(item.revenue).toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct, 6)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                        Top Purchased Premium Books
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Sorted by Volume</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Rank</th>
                          <th className="py-2.5 px-3">Book Title</th>
                          <th className="py-2.5 px-3 text-right">Units Sold</th>
                          <th className="py-2.5 px-3 text-right">Revenue Generated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {topBooks.map((b: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-bold text-slate-400">#{idx + 1}</td>
                            <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                              {b.title}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {b.count} copies
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{Number(b.revenue).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 9: AI CONFIGURATION & ANALYTICS */}
          {activeAdminTab === 'ai-settings' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>Gemini AI Discovery & Assistant Engine</span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  AI System Controls & Usage Analytics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage server-side Gemini AI features, global availability toggle, and monitor real-time AI requests.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Global AI Assistant Status
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md">
                      When enabled, users enjoy smart search, personalized book recommendations, book assistant Q&A, and reader summaries. If disabled, bookstore continues seamlessly with rule-based fallback.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      aiAnalyticsData?.status?.enabled
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {aiAnalyticsData?.status?.enabled ? 'AI ACTIVE' : 'AI DISABLED'}
                    </span>

                    <button
                      type="button"
                      disabled={aiToggleLoading}
                      onClick={() => handleToggleAI(!aiAnalyticsData?.status?.enabled)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        aiAnalyticsData?.status?.enabled
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {aiToggleLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{aiAnalyticsData?.status?.enabled ? 'Disable AI' : 'Enable AI'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block mb-1">AI Provider</span>
                    <strong className="text-slate-900 dark:text-white text-sm block">Google Gen AI (Gemini)</strong>
                    <span className="text-[11px] text-slate-500">Official @google/genai SDK</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block mb-1">Active Model</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm block">gemini-3.8-flash</strong>
                    <span className="text-[11px] text-slate-500">Optimized for speed & reasoning</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block mb-1">API Configuration</span>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{aiAnalyticsData?.status?.configured ? 'Configured & Active' : 'Not Configured'}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Key secured on backend</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
                  AI Operational Usage Analytics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Total Requests</span>
                    <strong className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {aiAnalyticsData?.totalRequests ?? 0}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Recommendations</span>
                    <strong className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {aiAnalyticsData?.recommendationsCount ?? 0}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Smart Searches</span>
                    <strong className="text-xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                      {aiAnalyticsData?.searchesCount ?? 0}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Book Q&A Chats</span>
                    <strong className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {aiAnalyticsData?.assistantQueriesCount ?? 0}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Book Summaries</span>
                    <strong className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {aiAnalyticsData?.summariesCount ?? 0}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Reader Helpers</span>
                    <strong className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {aiAnalyticsData?.readerQueriesCount ?? 0}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-xs space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  AI Privacy & Security Architecture
                </h4>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <li>• <strong>No Hallucinations:</strong> Every book recommendation and smart search result is strictly resolved against authentic database records.</li>
                  <li>• <strong>Zero Secret Exposure:</strong> API credentials, password hashes, and tokens are NEVER sent to the AI service or exposed to browser clients.</li>
                  <li>• <strong>Rate Limiting:</strong> Endpoints are protected by a server-side sliding window limiter.</li>
                  <li>• <strong>Multilingual Engine:</strong> Native language interpretation for English, Hindi, Hinglish, and Marathi.</li>
                  <li>• <strong>Resilient Fallback:</strong> If Gemini is offline or disabled, the application continues functioning normally with deterministic catalog filters.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 10: SECURITY SETTINGS */}
          {activeAdminTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Security Hardening & Server Configuration
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Server-side settings, initial administrator configuration, and environment safety.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Security Verification Complete</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li>• Public registration is strictly restricted to USER role.</li>
                    <li>• Passwords are encrypted with bcrypt before storage.</li>
                    <li>• Sensitive secrets (JWT secrets, MongoDB URI) are isolated in environment variables.</li>
                    <li>• Admin endpoints return HTTP 403 Forbidden to non-admin tokens.</li>
                    <li>• Administrators cannot disable their own accounts.</li>
                    <li>• Uploaded files are validated for size and MIME extensions before storage.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <span className="block text-slate-400 font-bold uppercase tracking-wider mb-2">
                    Current Admin Session
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono space-y-1">
                    <div>Admin Email: <span className="text-slate-900 dark:text-white font-bold">{currentUser.email}</span></div>
                    <div>Account Role: <span className="text-purple-600 font-bold">{currentUser.role}</span></div>
                    <div>Status: <span className="text-emerald-600 font-bold">{currentUser.status}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* CONFIRM DELETE BOOK MODAL */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                Delete Academic Book?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{bookToDelete.title}"</strong>?
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
                This will permanently remove the database record and associated storage files from disk. This action cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                disabled={deleteLoading}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBookConfirm}
                disabled={deleteLoading}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Book</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC CATEGORY CREATE / EDIT MODAL */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {categoryToEdit ? `Edit Category: ${categoryToEdit.name}` : 'Add New Dynamic Category'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define the domain title, search slug, description, and visual category icon.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={e => handleCategoryNameChange(e.target.value)}
                  placeholder="e.g. Distributed Systems & Cloud Security"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>URL Slug *</span>
                  <span className="text-[10px] text-slate-400 font-normal">URL identifier /category/:slug</span>
                </label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={e => setCategoryForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))}
                  placeholder="distributed-systems"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Academic Description
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={e => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Summary of syllabus topics, core skills, and learning outcomes in this domain..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Category Icon Selection *
                </label>
                <CategoryIconSelector
                  selectedIcon={categoryForm.icon}
                  onSelectIcon={iconId => setCategoryForm(prev => ({ ...prev, icon: iconId }))}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  disabled={categorySubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                >
                  {categorySubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Category...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{categoryToEdit ? 'Update Category' : 'Create Category'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC CATEGORY DELETE CONFIRMATION MODAL */}
      {categoryDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                Delete Category?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to remove the category <strong className="text-slate-900 dark:text-white">"{categoryDeleteModal.name}"</strong>?
              </p>

              {(() => {
                const linked = adminBooksList.filter(
                  b => b.category?.toLowerCase() === categoryDeleteModal.name?.toLowerCase()
                ).length;
                if (linked > 0) {
                  return (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs text-left space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Cannot Delete Populated Category</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        This category currently contains <strong>{linked} book(s)</strong>. To protect catalog integrity, please reassign or remove these books first.
                      </p>
                    </div>
                  );
                }
                return (
                  <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    This category has 0 books assigned and can be safely deleted.
                  </p>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryDeleteModal(null)}
                disabled={categoryDeleting}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={
                  categoryDeleting ||
                  adminBooksList.some(
                    b => b.category?.toLowerCase() === categoryDeleteModal.name?.toLowerCase()
                  )
                }
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-xs font-semibold text-white transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                {categoryDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Category</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
