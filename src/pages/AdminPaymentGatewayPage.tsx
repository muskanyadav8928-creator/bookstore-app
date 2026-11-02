import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  CheckCircle2, 
  Zap, 
  RefreshCw, 
  Save, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { gatewayService } from '../services/api';
import { PaymentGatewaySettings, GatewayId } from '../types';

export const AdminPaymentGatewayPage: React.FC = () => {
  const { currentUser, navigateTo, showToast } = useApp();

  const [gatewaySettings, setGatewaySettings] = useState<PaymentGatewaySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeGateway, setActiveGateway] = useState<GatewayId>('sandbox');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [formState, setFormState] = useState<{
    sandbox: { enabled: boolean; mode: 'TEST' | 'LIVE' };
    razorpay: { enabled: boolean; mode: 'TEST' | 'LIVE'; keyId: string; keySecret: string; webhookSecret: string };
    stripe: { enabled: boolean; mode: 'TEST' | 'LIVE'; keyId: string; keySecret: string; webhookSecret: string };
  }>({
    sandbox: { enabled: true, mode: 'TEST' },
    razorpay: { enabled: false, mode: 'TEST', keyId: '', keySecret: '', webhookSecret: '' },
    stripe: { enabled: false, mode: 'TEST', keyId: '', keySecret: '', webhookSecret: '' },
  });

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto shadow-lg">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
            HTTP 403 Forbidden · Admin Only
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Access Restricted to Administrators
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
            The Payment Gateway control center is restricted to system administrators. Normal users cannot view or modify gateway configurations.
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

  const loadGatewaySettings = async () => {
    try {
      setLoading(true);
      const data = await gatewayService.getAdminGateways();
      setGatewaySettings(data);
      setActiveGateway(data.activeGateway || 'sandbox');
      setFormState({
        sandbox: {
          enabled: data.gateways?.sandbox?.enabled ?? true,
          mode: data.gateways?.sandbox?.mode || 'TEST',
        },
        razorpay: {
          enabled: data.gateways?.razorpay?.enabled ?? false,
          mode: data.gateways?.razorpay?.mode || 'TEST',
          keyId: data.gateways?.razorpay?.keyId || '',
          keySecret: data.gateways?.razorpay?.hasKeySecret ? '********' : '',
          webhookSecret: data.gateways?.razorpay?.webhookSecret || '',
        },
        stripe: {
          enabled: data.gateways?.stripe?.enabled ?? false,
          mode: data.gateways?.stripe?.mode || 'TEST',
          keyId: data.gateways?.stripe?.keyId || '',
          keySecret: data.gateways?.stripe?.hasKeySecret ? '********' : '',
          webhookSecret: data.gateways?.stripe?.webhookSecret || '',
        },
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to load gateway settings', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGatewaySettings();
  }, []);

  const handleSave = async (customState = formState, customActive = activeGateway) => {
    try {
      setSaving(true);
      const res = await gatewayService.updateAdminGateways({
        activeGateway: customActive,
        gateways: {
          sandbox: {
            enabled: customState.sandbox.enabled,
            mode: customState.sandbox.mode,
          },
          razorpay: {
            enabled: customState.razorpay.enabled,
            mode: customState.razorpay.mode,
            keyId: customState.razorpay.keyId,
            keySecret: customState.razorpay.keySecret,
            webhookSecret: customState.razorpay.webhookSecret,
          },
          stripe: {
            enabled: customState.stripe.enabled,
            mode: customState.stripe.mode,
            keyId: customState.stripe.keyId,
            keySecret: customState.stripe.keySecret,
            webhookSecret: customState.stripe.webhookSecret,
          },
        },
      });

      setGatewaySettings(res.data);
      showToast('Payment gateway configuration saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save gateway settings', 'warning');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGateway = (gatewayId: 'sandbox' | 'razorpay' | 'stripe') => {
    const updatedState = {
      ...formState,
      [gatewayId]: {
        ...formState[gatewayId],
        enabled: !formState[gatewayId].enabled,
      },
    };
    setFormState(updatedState);
    handleSave(updatedState, activeGateway);
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => navigateTo('admin', { adminTab: 'dashboard' })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Dashboard</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              Payment Gateways
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Payment Gateway Configuration
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Enable, configure, and monitor payment processing integrations in Test Mode.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadGatewaySettings}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-semibold block text-indigo-950 dark:text-indigo-100">
            Enforced Test Environment Policy
          </strong>
          <p className="leading-relaxed">
            All gateways run strictly in <strong>TEST / SANDBOX MODE</strong>. Live/real-money transactions are disabled. Secret keys are stored server-side and never exposed to the frontend browser bundle.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs ${
          formState.sandbox.enabled 
            ? 'border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-500/10' 
            : 'border-slate-200 dark:border-slate-800 opacity-80'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shadow-xs">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Demo / Sandbox Gateway
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Mode: TEST
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Instant simulated checkout with Success, Failed, and Cancelled payment outcomes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold ${formState.sandbox.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {formState.sandbox.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={formState.sandbox.enabled}
                onClick={() => handleToggleGateway('sandbox')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formState.sandbox.enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    formState.sandbox.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Configuration Status</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Configured (Built-In)</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Currency</span>
              <strong className="text-slate-900 dark:text-white font-mono">INR (₹)</strong>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Simulation Engine</span>
              <strong className="text-slate-900 dark:text-white">Success / Decline / Cancel</strong>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs ${
          formState.razorpay.enabled 
            ? 'border-indigo-300 dark:border-indigo-800/80 ring-1 ring-indigo-500/10' 
            : 'border-slate-200 dark:border-slate-800 opacity-90'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shadow-xs">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Razorpay Test Gateway
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                    Mode: TEST
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    gatewaySettings?.gateways?.razorpay?.configured
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {gatewaySettings?.gateways?.razorpay?.configured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Server-side order creation and cryptographic HMAC SHA256 signature verification.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold ${formState.razorpay.enabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                {formState.razorpay.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={formState.razorpay.enabled}
                onClick={() => handleToggleGateway('razorpay')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formState.razorpay.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    formState.razorpay.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Razorpay Key ID (rzp_test_*)
                </label>
                <input
                  type="text"
                  value={formState.razorpay.keyId}
                  onChange={e => setFormState(prev => ({
                    ...prev,
                    razorpay: { ...prev.razorpay, keyId: e.target.value }
                  }))}
                  placeholder="rzp_test_YourKeyId"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Razorpay Key Secret (Server-Only)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Environment Variable</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecrets['razorpay_secret'] ? 'text' : 'password'}
                    value={formState.razorpay.keySecret}
                    onChange={e => setFormState(prev => ({
                      ...prev,
                      razorpay: { ...prev.razorpay, keySecret: e.target.value }
                    }))}
                    placeholder="Enter or replace secret in .env"
                    className="w-full pl-3.5 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('razorpay_secret')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSecrets['razorpay_secret'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs ${
          formState.stripe.enabled 
            ? 'border-purple-300 dark:border-purple-800/80 ring-1 ring-purple-500/10' 
            : 'border-slate-200 dark:border-slate-800 opacity-90'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg shadow-xs">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Stripe Test Gateway
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                    Mode: TEST
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    gatewaySettings?.gateways?.stripe?.configured
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {gatewaySettings?.gateways?.stripe?.configured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  International credit card and digital wallet sandbox with Stripe Elements / Payment Intents.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold ${formState.stripe.enabled ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}>
                {formState.stripe.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={formState.stripe.enabled}
                onClick={() => handleToggleGateway('stripe')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formState.stripe.enabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    formState.stripe.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Stripe Publishable Key (pk_test_*)
                </label>
                <input
                  type="text"
                  value={formState.stripe.keyId}
                  onChange={e => setFormState(prev => ({
                    ...prev,
                    stripe: { ...prev.stripe, keyId: e.target.value }
                  }))}
                  placeholder="pk_test_YourPublishableKey"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Stripe Secret Key (Server-Only)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Environment Variable</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecrets['stripe_secret'] ? 'text' : 'password'}
                    value={formState.stripe.keySecret}
                    onChange={e => setFormState(prev => ({
                      ...prev,
                      stripe: { ...prev.stripe, keySecret: e.target.value }
                    }))}
                    placeholder="Enter or replace secret in .env"
                    className="w-full pl-3.5 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('stripe_secret')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSecrets['stripe_secret'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => navigateTo('admin', { adminTab: 'orders' })}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          View All Orders & Sales Records →
        </button>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving Gateway Settings...' : 'Save Gateway Settings'}</span>
        </button>
      </div>
    </div>
  );
};
