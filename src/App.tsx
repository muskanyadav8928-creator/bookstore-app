import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { BooksPage } from './pages/BooksPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { BookDetailsPage } from './pages/BookDetailsPage';
import { WishlistPage } from './pages/WishlistPage';
import { LibraryPage } from './pages/LibraryPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { AdminPaymentGatewayPage } from './pages/AdminPaymentGatewayPage';
import { ReaderPage } from './pages/ReaderPage';
import { PaymentDemoPage } from './pages/PaymentDemoPage';
import { PurchaseHistoryPage } from './pages/PurchaseHistoryPage';
import { BookReaderModal } from './components/BookReaderModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ToastContainer } from './components/Toast';

const AppContent: React.FC = () => {
  const { activePage } = useApp();

  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'books':
      case 'free-books':
      case 'premium-books':
        return <BooksPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'category-detail':
        return <CategoryDetailPage />;
      case 'book-detail':
        return <BookDetailsPage />;
      case 'reader':
        return <ReaderPage />;
      case 'payment-demo':
      case 'checkout':
        return <PaymentDemoPage />;
      case 'purchase-history':
        return <PurchaseHistoryPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'library':
        return <LibraryPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminPage />;
      case 'admin-payment-gateway':
        return <AdminPaymentGatewayPage />;
      default:
        return <HomePage />;
    }
  };

  const isReaderView = activePage === 'reader';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {!isReaderView && <Header />}

      <main className="flex-1 w-full">
        {renderActivePage()}
      </main>

      <BookReaderModal />
      <CheckoutModal />

      <ToastContainer />

      {!isReaderView && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
