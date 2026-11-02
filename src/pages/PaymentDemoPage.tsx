import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Lock, 
  ShoppingCart, 
  BookOpen, 
  Info, 
  Ban 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookCover } from '../components/BookCover';
import { Badge } from '../components/Badge';
import { OrderService, gatewayService } from '../services/api';
import { PublicGatewayInfo, GatewayId } from '../types';

export const PaymentDemoPage: React.FC = () => {
  const { 
    selectedBookId, 
    allBooks, 
    currentUser, 
    navigateTo, 
    showToast, 
    openReader, 
    addPurchasedBook 
  } = useApp();

  const [order, setOrder] = useState<any>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(true);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PAID' | 'FAILED' | 'CANCELLED'>('IDLE');
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [availableGateways, setAvailableGateways] = useState<PublicGatewayInfo[]>([
    {
      id: 'sandbox',
      name: 'Demo / Sandbox',
      enabled: true,
      mode: 'TEST',
      configured: true,
      description: 'Risk-free virtual checkout simulation for testing student textbook purchases.',
    },
    {
      id: 'razorpay',
      name: 'Razorpay Test Mode — Not Configured',
      enabled: false,
      mode: 'TEST',
      configured: false,
      description: 'Unified Indian payments (UPI, RuPay, NetBanking, Cards).',
    },
  ]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<GatewayId>('sandbox');

  const book = allBooks.find(b => b.id === selectedBookId) || null;

  useEffect(() => {
    gatewayService.getActiveGateways().then(res => {
      if (res.gateways && res.gateways.length > 0) {
        setAvailableGateways(res.gateways);
        const defaultGw = res.gateways.find(g => g.id === res.activeGateway && g.enabled) || res.gateways[0];
        if (defaultGw) {
          setSelectedGatewayId(defaultGw.id);
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) {
      showToast('Please sign in to proceed with checkout.', 'info');
      navigateTo('login');
      return;
    }

    if (!selectedBookId || !book) {
      navigateTo('books');
      return;
    }

    let isMounted = true;
    setIsCreatingOrder(true);

    OrderService.createOrder(selectedBookId)
      .then(res => {
        if (!isMounted) return;
        setOrder(res.data);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        if (err.data?.code === 'ALREADY_PURCHASED' || err.message?.includes('already purchased')) {
          showToast('You already own this book! Opening reader...', 'info');
          openReader(book);
        } else {
          showToast(err.message || 'Failed to initialize order', 'warning');
        }
      })
      .finally(() => {
        if (isMounted) setIsCreatingOrder(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBookId, currentUser]);

  const handleExecuteDemoPayment = async (action: 'SUCCESS' | 'FAIL' | 'CANCEL') => {
    if (!order?.orderId) return;

    if (action === 'CANCEL') {
      try {
        await OrderService.cancelOrder(order.orderId);
      } catch {}
      setPaymentStatus('CANCELLED');
      showToast('Payment cancelled.', 'info');
      return;
    }

    setIsPaying(true);

    try {
      const methodLabel = selectedMethod === 'upi' ? 'Test UPI (GPay/PhonePe)' : selectedMethod === 'card' ? 'Test RuPay Card' : 'Test NetBanking';
      const res = await OrderService.payOrder(order.orderId, action, methodLabel);

      if (action === 'SUCCESS') {
        setPaymentStatus('PAID');
        setOrder(res.data);
        if (book) {
          addPurchasedBook(book);
        }
        showToast('Payment successful. The book has been added to your library.', 'success');
      } else {
        setPaymentStatus('FAILED');
        setOrder(res.data);
        showToast('Payment failed. No premium access was granted.', 'warning');
      }
    } catch {
      if (action === 'FAIL') {
        setPaymentStatus('FAILED');
      }
    } finally {
      setIsPaying(false);
    }
  };

  const handleExecuteRazorpayPayment = async () => {
    if (!book) return;

    setIsPaying(true);

    try {
      const rzpOrderRes = await OrderService.createRazorpayOrder(book.id);
      const rzpData = rzpOrderRes.data;

      if (typeof window !== 'undefined' && (window as any).Razorpay && rzpData.keyId) {
        const options = {
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency || 'INR',
          name: 'BookStore',
          description: `Premium E-Book: ${rzpData.bookTitle}`,
          order_id: rzpData.razorpayOrderId.startsWith('order_') ? rzpData.razorpayOrderId : undefined,
          prefill: {
            name: rzpData.customerName || currentUser?.name || 'Student Customer',
            email: rzpData.customerEmail || currentUser?.email || 'student@college.edu',
          },
          theme: {
            color: '#4f46e5',
          },
          handler: async (response: any) => {
            try {
              setIsPaying(true);
              const verifyRes = await OrderService.verifyRazorpayPayment({
                orderId: rzpData.orderId,
                razorpay_order_id: response.razorpay_order_id || rzpData.razorpayOrderId,
                razorpay_payment_id: response.razorpay_payment_id || `pay_test_${Date.now()}`,
                razorpay_signature: response.razorpay_signature || 'test_verified_signature',
              });

              setPaymentStatus('PAID');
              setOrder(verifyRes.data);
              addPurchasedBook(book);
              showToast('Payment successful. The book has been added to your library.', 'success');
            } catch {
              setPaymentStatus('FAILED');
              showToast('Payment failed. No premium access was granted.', 'warning');
            } finally {
              setIsPaying(false);
            }
          },
          modal: {
            ondismiss: async () => {
              try {
                await OrderService.cancelOrder(rzpData.orderId);
              } catch {}
              setPaymentStatus('CANCELLED');
              showToast('Payment cancelled.', 'info');
              setIsPaying(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function () {
          setPaymentStatus('FAILED');
          showToast('Payment failed. No premium access was granted.', 'warning');
          setIsPaying(false);
        });
        rzp.open();
      } else {
        const simPaymentId = `pay_test_${Date.now()}`;
        const verifyRes = await OrderService.verifyRazorpayPayment({
          orderId: rzpData.orderId,
          razorpay_order_id: rzpData.razorpayOrderId,
          razorpay_payment_id: simPaymentId,
          razorpay_signature: 'test_verified_signature',
        });

        setPaymentStatus('PAID');
        setOrder(verifyRes.data);
        addPurchasedBook(book);
        showToast('Payment successful. The book has been added to your library.', 'success');
        setIsPaying(false);
      }
    } catch (err: any) {
      setIsPaying(false);
      if (err.data?.code === 'ALREADY_PURCHASED') {
        showToast('You already own this book! Opening reader...', 'info');
        openReader(book);
      } else {
        showToast(err.message || 'Razorpay checkout error', 'warning');
      }
    }
  };

  if (!book) return null;

  if (paymentStatus === 'PAID') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-600 font-bold">
              Transaction Approved · Test Mode
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
              Purchase Successful!
            </h1>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium max-w-md mx-auto">
              Payment successful. The book has been added to your library.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-left text-xs space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Order Reference:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{order?.orderId}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Payment Channel:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{order?.paymentMethod || 'Razorpay Test Mode'}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Payment Reference / ID:</span>
              <span className="font-mono text-emerald-600 font-medium">{order?.paymentReference || 'TXN-TEST-VERIFIED'}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Book Title:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{book.title}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white text-sm">
              <span>Amount Paid:</span>
              <span className="font-mono text-emerald-600">₹{book.price}.00 INR</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => openReader(book)}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Now</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('library')}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
            >
              Go to My Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'FAILED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-rose-200 dark:border-rose-900/60 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <XCircle className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-mono tracking-widest text-rose-600 font-bold">
              Transaction Declined · Test Mode
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
              Payment Failed
            </h1>
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium max-w-md mx-auto">
              Payment failed. No premium access was granted.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-left text-xs space-y-1.5 text-rose-900 dark:text-rose-200">
            <div className="flex justify-between">
              <span className="font-semibold">Order ID:</span>
              <span className="font-mono">{order?.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Reason:</span>
              <span>{order?.failureReason || 'Declined or simulation rejected by user'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setPaymentStatus('IDLE')}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span>Try Again</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('book-detail', { bookId: book.id })}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
            >
              Back to Book
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'CANCELLED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Ban className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-mono tracking-widest text-slate-500 font-bold">
              Transaction Terminated
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
              Payment Cancelled
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
              Payment cancelled. You have not been charged and access was not modified.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setPaymentStatus('IDLE')}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span>Resume Checkout</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('book-detail', { bookId: book.id })}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
            >
              Back to Book
            </button>
          </div>
        </div>
      </div>
    );
  }

  const razorpayGateway = availableGateways.find(g => g.id === 'razorpay');
  const isRazorpayConfigured = Boolean(razorpayGateway?.configured);
  const isRazorpaySelected = selectedGatewayId === 'razorpay';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <button
          type="button"
          onClick={() => navigateTo('book-detail', { bookId: book.id })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Book Details</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Book & Order Summary */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-indigo-600" />
              <span>Order Summary</span>
            </h2>
            <Badge type={book.type} />
          </div>

          <div className="flex gap-4 items-center">
            <div className="w-20 shrink-0 rounded-lg overflow-hidden shadow-md">
              <BookCover book={book} size="sm" showSpine={false} />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
                {book.category}
              </span>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {book.title}
              </h3>
              <p className="text-xs text-slate-500">by <strong className="text-slate-700 dark:text-slate-300">{book.author}</strong></p>
              <p className="text-[11px] text-slate-400">{book.pages} Pages · Year {book.publicationYear}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Order ID:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {isCreatingOrder ? 'Generating...' : order?.orderId}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Customer:</span>
              <span>{currentUser?.name || 'Student Customer'}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Currency:</span>
              <span className="font-semibold">INR (₹)</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Selected Method:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {isRazorpaySelected ? 'Razorpay Test Mode' : 'Demo / Sandbox'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
              <span>Total Price:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">₹{book.price}.00 INR</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Server-side price verification · Never trusted from frontend</span>
          </div>
        </div>

        {/* Right: Payment Method & Gateway Selection */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Payment Method</span>
            </h2>
            <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
              TEST MODE ONLY
            </span>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Select Gateway
            </label>

            <div className="space-y-3">
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedGatewayId === 'sandbox'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600 text-indigo-900 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethodGateway"
                    value="sandbox"
                    checked={selectedGatewayId === 'sandbox'}
                    onChange={() => setSelectedGatewayId('sandbox')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-2">
                      <span>Demo / Sandbox</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Demo Payment — No Real Money
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Risk-free virtual checkout simulation for student testing.
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                  TEST
                </span>
              </label>

              <label
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isRazorpayConfigured
                    ? selectedGatewayId === 'razorpay'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600 text-indigo-900 dark:text-indigo-200 cursor-pointer'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 opacity-60 cursor-not-allowed text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethodGateway"
                    value="razorpay"
                    disabled={!isRazorpayConfigured}
                    checked={selectedGatewayId === 'razorpay' && isRazorpayConfigured}
                    onChange={() => isRazorpayConfigured && setSelectedGatewayId('razorpay')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-2">
                      <span>{isRazorpayConfigured ? 'Razorpay — Test Mode' : 'Razorpay Test Mode — Not Configured'}</span>
                      {isRazorpayConfigured ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                          TEST MODE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          DISABLED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isRazorpayConfigured 
                        ? 'Unified Indian payments: UPI (GPay/PhonePe), RuPay cards, and NetBanking.' 
                        : 'Configure Razorpay Key ID and Secret in Admin Panel → Payment Gateway to enable.'}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                  TEST
                </span>
              </label>
            </div>
          </div>

          {selectedGatewayId === 'sandbox' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <strong>Demo Payment — No Real Money:</strong> Simulates textbook purchase and library sync without financial charges.
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Simulated Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('upi')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      selectedMethod === 'upi'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-xs font-semibold">Test UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('card')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      selectedMethod === 'card'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs font-semibold">Test Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('netbanking')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      selectedMethod === 'netbanking'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs font-semibold">Net Banking</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleExecuteDemoPayment('SUCCESS')}
                  disabled={isPaying || isCreatingOrder}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simulate SUCCESSFUL Payment (₹{book.price})</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleExecuteDemoPayment('FAIL')}
                    disabled={isPaying || isCreatingOrder}
                    className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Simulate FAILED</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteDemoPayment('CANCEL')}
                    disabled={isPaying || isCreatingOrder}
                    className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Simulate CANCEL</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedGatewayId === 'razorpay' && isRazorpayConfigured && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Razorpay Test Mode Integration</span>
                </div>
                <p className="leading-relaxed opacity-90 text-[11px]">
                  When you click Pay, a Razorpay checkout modal opens using test credentials. Once verified via cryptographic HMAC signature on the server, full reading access is granted.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleExecuteRazorpayPayment}
                  disabled={isPaying || isCreatingOrder}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Razorpay Checkout...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₹{book.price}.00 with Razorpay (Test Mode)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('CANCELLED');
                    showToast('Payment cancelled.', 'info');
                  }}
                  disabled={isPaying}
                  className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Cancel Transaction</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
