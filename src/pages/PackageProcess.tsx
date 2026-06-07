import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Gift,
  Wine,
  Check,
  AlertTriangle,
  Plus,
  Minus
} from 'lucide-react';
import { usePackageStore } from '../stores/packageStore';
import { useBookingStore } from '../stores/bookingStore';
import { useAuthStore } from '../stores/authStore';
import { DrinkGift } from '../types';

const PackageProcess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';
  const { packages, addPackageOrder, validateDrinkGifts } = usePackageStore();
  const { getBookingById } = useBookingStore();
  const { currentUser } = useAuthStore();

  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [drinkGifts, setDrinkGifts] = useState<DrinkGift[]>([]);
  const [validation, setValidation] = useState<{ valid: boolean; issues: string[] }>({ valid: true, issues: [] });

  const booking = bookingId ? getBookingById(bookingId) : undefined;
  const pkg = selectedPackage ? packages.find((p) => p.id === selectedPackage) : undefined;

  useEffect(() => {
    if (pkg) {
      setDrinkGifts(pkg.drinkGifts.map((g) => ({ ...g })));
    } else {
      setDrinkGifts([]);
    }
  }, [pkg]);

  useEffect(() => {
    if (selectedPackage && drinkGifts.length > 0) {
      const result = validateDrinkGifts(selectedPackage, drinkGifts);
      setValidation(result);
    } else {
      setValidation({ valid: true, issues: [] });
    }
  }, [selectedPackage, drinkGifts, validateDrinkGifts]);

  const updateGiftQuantity = (index: number, delta: number) => {
    setDrinkGifts((prev) =>
      prev.map((g, i) =>
        i === index ? { ...g, quantity: Math.max(0, g.quantity + delta) } : g
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) {
      alert('请选择套餐');
      return;
    }
    if (!validation.valid) {
      if (!confirm('酒水赠送存在异常，是否继续？')) return;
    }
    const orderId = addPackageOrder({
      bookingId,
      packageId: selectedPackage,
      status: 'processing',
      actualPrice: pkg?.price || 0,
      drinkGifts,
      operator: currentUser,
    });
    if (bookingId) {
      navigate(`/bookings/${bookingId}`);
    } else {
      navigate('/packages');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(bookingId ? `/bookings/${bookingId}` : '/packages')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">套餐订单处理</h2>
      </div>

      {booking && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400">关联预订</p>
          <p className="font-medium mt-1">
            包厢{booking.roomNumber} · {booking.customerName}
          </p>
        </div>
      )}

      {!validation.valid && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-400 mb-1">酒水赠送口径异常</p>
              <ul className="text-sm text-slate-300 space-y-1">
                {validation.issues.map((issue, idx) => (
                  <li key={idx}>· {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-400" />
            选择套餐
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {packages.filter((p) => p.active).map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPackage(p.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedPackage === p.id
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium">{p.name}</p>
                  {selectedPackage === p.id && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className="text-emerald-400 text-lg font-bold">¥{p.price}</p>
                <p className="text-xs text-slate-400 mt-1">{p.description}</p>
              </div>
            ))}
          </div>
        </div>

        {pkg && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Wine className="w-5 h-5 text-amber-400" />
              酒水赠送明细
            </h3>
            <div className="space-y-3">
              {drinkGifts.map((gift, idx) => {
                const standard = pkg.drinkGifts.find((g) => g.name === gift.name);
                const isOver = standard && gift.quantity > standard.quantity;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isOver ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Wine className={`w-4 h-4 ${isOver ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="font-medium">{gift.name}</span>
                      {standard && (
                        <span className="text-xs text-slate-500">
                          (标准: {standard.quantity})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateGiftQuantity(idx, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium">{gift.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateGiftQuantity(idx, 1)}
                        className="w-7 h-7 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(bookingId ? `/bookings/${bookingId}` : '/packages')}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!selectedPackage}
            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            确认下单
          </button>
        </div>
      </form>
    </div>
  );
};

export default PackageProcess;
