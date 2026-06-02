import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/StatCard';
import { useProductStore } from '@/store/useProductStore';
import type { Flaw } from '@/types';
import { FLAW_SEVERITY_COLORS, FLAW_SEVERITY_LABELS } from '@/types';
import { formatCurrency } from '@/utils/format';
import { Camera, CheckCircle2, Clock, Edit3, Upload, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Photo() {
  const navigate = useNavigate();
  const [activeProduct, setActiveProduct] = useState<string | null>(null);
  const [photoRemark, setPhotoRemark] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isPhotographing, setIsPhotographing] = useState(false);

  const products = useProductStore((state) => state.products);
  const updatePhotos = useProductStore((state) => state.updatePhotos);
  const markPhotographing = useProductStore((state) => state.markPhotographing);

  const pendingPhotos = useMemo(() =>
    products.filter((p) => ['PENDING_PHOTO', 'PHOTOGRAPHING'].includes(p.status)),
    [products]
  );

  const photographing = useMemo(() =>
    products.filter((p) => p.status === 'PHOTOGRAPHING'),
    [products]
  );

  const activeProductData = useMemo(() =>
    products.find((p) => p.id === activeProduct),
    [products, activeProduct]
  );

  const handleStartPhotographing = (productId: string) => {
    markPhotographing(productId, '李摄影');
    setActiveProduct(productId);
    setIsPhotographing(true);
    setPhotoRemark('');
  };

  const handleAddPhoto = () => {
    if (!activeProduct || !newPhotoUrl.trim()) return;
    setActiveProduct(null);
    setNewPhotoUrl('');
    setTimeout(() => setActiveProduct(activeProduct), 0);
  };

  const handleRemovePhoto = (photoUrl: string) => {
    if (!activeProduct) return;
    setActiveProduct(null);
    setTimeout(() => setActiveProduct(activeProduct), 0);
  };

  const handleCompletePhoto = () => {
    if (!activeProductData) return;

    const photos = activeProductData.images.length > 0
      ? activeProductData.images
      : [
          `https://picsum.photos/seed/${activeProductData.id}-1/600/800`,
          `https://picsum.photos/seed/${activeProductData.id}-2/600/800`,
          `https://picsum.photos/seed/${activeProductData.id}-3/600/800`,
          `https://picsum.photos/seed/${activeProductData.id}-4/600/800`,
        ];

    updatePhotos(
      activeProductData.id,
      {
        photos,
        remark: photoRemark || '标准商品展示照，含正面、侧面、底部、细节特写',
      },
      '李摄影'
    );

    setActiveProduct(null);
    setPhotoRemark('');
    setIsPhotographing(false);
  };

  const mockPhotos = [
    `https://picsum.photos/seed/demo-1/600/800`,
    `https://picsum.photos/seed/demo-2/600/800`,
    `https://picsum.photos/seed/demo-3/600/800`,
    `https://picsum.photos/seed/demo-4/600/800`,
  ];

  return (
    <MainLayout
      title="拍照区"
      subtitle="商品拍照管理、图片上传和瑕疵标注"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            title="待拍照"
            value={pendingPhotos.filter(p => p.status === 'PENDING_PHOTO').length}
            icon={Camera}
            color="gold"
          />
          <StatCard
            title="拍照中"
            value={photographing.length}
            icon={Edit3}
            color="gold"
          />
          <StatCard
            title="今日已完成"
            value={0}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="待结算关联"
            value={0}
            icon={Clock}
            color="green"
          />
        </div>

        {activeProduct && activeProductData ? (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-semibold text-luxury-800">商品拍照</h3>
              <button
                onClick={() => {
                  setActiveProduct(null);
                  setIsPhotographing(false);
                }}
                className="text-sm text-charcoal-500 hover:text-luxury-800"
              >
                返回列表
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="flex gap-4 mb-6">
                  <div className="w-24 h-24 rounded-luxury overflow-hidden bg-ivory-100 flex-shrink-0">
                    {activeProductData.images[0] && (
                      <img
                        src={activeProductData.images[0]}
                        alt={activeProductData.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-luxury-800">{activeProductData.name}</h4>
                    <p className="text-charcoal-600 text-sm">{activeProductData.brand} · {activeProductData.model}</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p>
                        <span className="text-charcoal-500">客户预期价：</span>
                        <span className="text-charcoal-800">{formatCurrency(activeProductData.expectedPrice)}</span>
                      </p>
                      <p>
                        <span className="text-charcoal-500">瑕疵数：</span>
                        <span className="text-coral-600">{activeProductData.appraisal?.flaws?.length || 0} 处</span>
                      </p>
                    </div>
                  </div>
                </div>

                {activeProductData.appraisal?.flaws && activeProductData.appraisal.flaws.length > 0 && (
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-charcoal-700 mb-3">需重点拍摄瑕疵位置</h5>
                    <div className="space-y-2">
                      {activeProductData.appraisal.flaws.map((flaw: Flaw) => (
                        <div key={flaw.id} className="flex items-start gap-3 p-3 bg-ivory-50 rounded-luxury">
                          <span className={`status-badge text-xs ${FLAW_SEVERITY_COLORS[flaw.severity]}`}>
                            {FLAW_SEVERITY_LABELS[flaw.severity]}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-luxury-800 font-medium">{flaw.location}</p>
                            <p className="text-xs text-charcoal-600">{flaw.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="text-sm font-medium text-charcoal-700 mb-3">拍照备注</h5>
                  <textarea
                    value={photoRemark}
                    onChange={(e) => setPhotoRemark(e.target.value)}
                    className="input-field h-24 resize-none"
                    placeholder="记录拍摄情况、光线条件等..."
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-charcoal-700">
                    已上传图片（{mockPhotos.length}张）
                  </h5>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      className="input-field text-xs py-1.5 px-3 w-48"
                      placeholder="图片URL"
                    />
                    <button
                      onClick={handleAddPhoto}
                      className="btn-outline text-xs py-1.5 px-3"
                    >
                      <Upload className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {mockPhotos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative group rounded-luxury overflow-hidden aspect-square bg-ivory-100"
                    >
                      <img
                        src={photo}
                        alt={`照片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <button
                          onClick={() => handleRemovePhoto(photo)}
                          className="opacity-0 group-hover:opacity-100 bg-white/90 text-coral-600 p-2 rounded-full transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {index === 0 ? '主图' : `图${index + 1}`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-champagne-50 border border-champagne-200 rounded-luxury mt-4">
                  <p className="text-sm text-champagne-700 font-medium mb-2">📷 拍照指引</p>
                  <ul className="text-sm text-charcoal-600 space-y-1">
                    <li>• 正面全身照（主图）</li>
                    <li>• 侧面 45° 照</li>
                    <li>• 底部/内标细节</li>
                    <li>• 瑕疵部位特写</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-ivory-200 mt-4">
                  <button
                    onClick={() => {
                      setActiveProduct(null);
                      setIsPhotographing(false);
                    }}
                    className="btn-outline"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCompletePhoto}
                    className="btn-primary"
                  >
                    完成拍照，转入待上架
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <h3 className="font-display text-lg font-semibold text-luxury-800 mb-4">待拍照商品</h3>

            {pendingPhotos.length === 0 ? (
              <div className="text-center py-12 text-charcoal-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-jade-500" />
                <p>暂无待拍照商品</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPhotos.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-ivory-50 rounded-luxury hover:bg-ivory-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 rounded-luxury overflow-hidden bg-ivory-200 flex-shrink-0">
                        {product.images[0] && (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-luxury-800 truncate">{product.name}</h4>
                          <span className={`status-badge text-xs`}>
                            {product.status === 'PHOTOGRAPHING' ? '拍照中' : '待拍照'}
                          </span>
                        </div>
                        <p className="text-sm text-charcoal-600">{product.brand} · {product.customer.name}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-charcoal-500">
                          <span>瑕疵 {product.appraisal?.flaws?.length || 0} 处</span>
                          <span>预期价 {formatCurrency(product.expectedPrice)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartPhotographing(product.id)}
                      className={`px-5 py-2 rounded-luxury text-sm font-medium transition-all ${
                        product.status === 'PHOTOGRAPHING'
                          ? 'bg-champagne-500 text-luxury-800'
                          : 'bg-luxury-800 text-white hover:bg-luxury-700'
                      }`}
                    >
                      <Camera className="w-4 h-4 inline mr-1.5" />
                      {product.status === 'PHOTOGRAPHING' ? '继续拍照' : '开始拍照'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
