import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  CreditCard, 
  Smartphone, 
  Building2, 
  ShieldCheck, 
  CheckCircle, 
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookCover } from './BookCover';
import { BookService } from '../services/api';

export const CheckoutModal: React.FC = () => {
  const { checkoutBook, closeCheckout, addPurchasedBook, navigateTo, currentUser } = useApp();
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  if (!checkoutBook) return null;

  const handleSimulatePurchase = async () => {
    setIsProcessing(true);
    try {
      if (currentUser) {
        await BookService.simulatePurchase(checkoutBook.id, selectedMethod.toUpperCase());
      }
      addPurchasedBook(checkoutBook);
      setIsComplete(true);
    } catch {
      // Still allow local preview
      addPurchasedBook(checkoutBook);
      setIsComplete(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    closeCheckout();
    setIsComplete(false);
    navigateTo('library');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Checkout Simulation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phase 1 Frontend Demonstration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCheckout}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Payment Notice Box */}
        <div className="my-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-700 dark:text-amber-300">Demo Payment — No Real Money:</strong> This is a simulation sandbox for testing textbook access. Real payment gateways (Razorpay / Stripe) can be configured and toggled in Admin Panel → Payment Gateway.
          </p>
        </div>

        {isComplete ? (
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Purchase Simulated Successfully!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                "{checkoutBook.title}" has been added to your Student Library. You can now read or bookmark it.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm"
              >
                Go to My Library
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Book Item Summary */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="w-14 shrink-0">
                <BookCover book={checkoutBook} size="sm" showSpine={false} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  PREMIUM E-BOOK
                </span>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                  {checkoutBook.title}
                </h4>
                <p className="text-xs text-slate-500 truncate">by {checkoutBook.author}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{checkoutBook.pages} pages</span>
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    ₹{checkoutBook.price}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector (Demo) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Simulated Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('upi')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    selectedMethod === 'upi'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs font-semibold">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    selectedMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs font-semibold">Card / RuPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('netbanking')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    selectedMethod === 'netbanking'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="text-xs font-semibold">NetBanking</span>
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>E-Book Price</span>
                <span className="tabular-nums">₹{checkoutBook.price}.00</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Student Academic Discount</span>
                <span className="text-emerald-600 font-medium">Free Campus Access</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Platform Convenience Fee</span>
                <span>₹0.00</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white text-sm">
                <span>Total Amount</span>
                <span className="tabular-nums text-indigo-600 dark:text-indigo-400">
                  ₹{checkoutBook.price}.00
                </span>
              </div>
            </div>

            {/* Simulated Pay Action */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeCheckout}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatePurchase}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing Demo Payment...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Simulate Payment of ₹{checkoutBook.price}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
