import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import StatusTimeline from '@/components/StatusTimeline';
import CustomerSummary from '@/components/CustomerSummary';
import ActionHistory from '@/components/ActionHistory';
import PriceChart from '@/components/PriceChart';
import { useProductStore } from '@/store/useProductStore';
import { STATUS_LABELS, STATUS_COLORS, FLAW_SEVERITY_LABELS, FLAW_SEVERITY_COLORS } from '@/types';
import { formatCurrency, formatDate, maskPhone, maskIdCard } from '@/utils/format';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle2, XCircle, Clock, Package, User, Phone, CreditCard, Shield, Camera } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getProductById = useProductStore((state) => state.getProductById);

  const product = useMemo(() => getProductById(id || ''), [id, getProductById]);

  if (!product) {
    return (
      <MainLayout title="商品详情" subtitle="商品信息不存在">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 mx-auto text-coral-500 mb-4" />
          <p className="text-xl text-charcoal-600 mb-4">未找到该商品</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            返回
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="商品详情"
      subtitle={`${product.brand} ${product.name}`}
    >
      <div className="space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-charcoal-600 hover:text-luxury-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex gap-6">
                <div className="w-48 h-48 flex-shrink-0 rounded-luxury overflow-hidden bg-ivory-100">
                  {product.images[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-luxury-800 mb-1">
                        {product.name}
                      </h2>
                      <p className="text-charcoal-600">{product.brand} · {product.model}</p>
                    </div>
                    <span className={`status-badge text-sm ${STATUS_COLORS[product.status]}`}>
                      {STATUS_LABELS[product.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-champagne-600" />
                      <span className="text-charcoal-500">商品编号：</span>
                      <span className="font-mono text-luxury-800">{product.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-champagne-600" />
                      <span className="text-charcoal-500">序列号：</span>
                      <span className="font-mono text-luxury-800">{product.serialNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-champagne-600" />
                      <span className="text-charcoal-500">收货日期：</span>
                      <span className="text-luxury-800">{formatDate(product.receivedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-charcoal-500">品类：</span>
                      <span className="text-luxury-800">{product.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t border-ivory-200">
                    <div>
                      <p className="text-sm text-charcoal-500 mb-1">客户预期价</p>
                      <p className="text-lg text-charcoal-600 line-through">
                        {formatCurrency(product.expectedPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-charcoal-500 mb-1">当前售价</p>
                      <p className="text-2xl font-bold text-champagne-600">
                        {formatCurrency(product.currentPrice)}
                      </p>
                    </div>
                    {product.soldAt && (
                      <div>
                        <p className="text-sm text-charcoal-500 mb-1">成交时间</p>
                        <p className="text-lg font-semibold text-jade-600">
                          {formatDate(product.soldAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-champagne-600" />
                  <h3 className="font-display text-lg font-semibold text-luxury-800">客户信息</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-charcoal-500 w-16">姓名</span>
                    <span className="text-luxury-800">{product.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-charcoal-400" />
                    <span className="text-charcoal-500 w-12">电话</span>
                    <span className="text-luxury-800">{maskPhone(product.customer.phone)}</span>
                  </div>
                  {product.customer.idCard && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-charcoal-400" />
                      <span className="text-charcoal-500 w-12">证件</span>
                      <span className="text-luxury-800">{maskIdCard(product.customer.idCard)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-champagne-600" />
                  <h3 className="font-display text-lg font-semibold text-luxury-800">资料完整性</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal-600">原厂证书</span>
                    {product.documents.hasCertificate ? (
                      <span className="flex items-center gap-1 text-jade-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" /> 齐全
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-coral-600 text-sm">
                        <XCircle className="w-4 h-4" /> 缺失
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal-600">购买发票</span>
                    {product.documents.hasInvoice ? (
                      <span className="flex items-center gap-1 text-jade-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" /> 齐全
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-coral-600 text-sm">
                        <XCircle className="w-4 h-4" /> 缺失
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal-600">原包装盒</span>
                    {product.documents.hasBox ? (
                      <span className="flex items-center gap-1 text-jade-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" /> 齐全
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-coral-600 text-sm">
                        <XCircle className="w-4 h-4" /> 缺失
                      </span>
                    )}
                  </div>
                </div>
                {product.documents.missingNotes && (
                  <div className="mt-4 p-3 bg-coral-50 border border-coral-200 rounded-luxury">
                    <p className="text-sm text-coral-600">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      {product.documents.missingNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {product.appraisal && (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-champagne-600" />
                  <h3 className="font-display text-lg font-semibold text-luxury-800">鉴定报告</h3>
                </div>

                <div className={`p-4 rounded-luxury mb-4 ${
                  product.appraisal.conclusion === 'genuine'
                    ? 'bg-jade-50 border border-jade-200'
                    : product.appraisal.conclusion === 'counterfeit'
                    ? 'bg-coral-50 border border-coral-200'
                    : 'bg-champagne-50 border border-champagne-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {product.appraisal.conclusion === 'genuine' ? (
                      <CheckCircle2 className="w-6 h-6 text-jade-600" />
                    ) : product.appraisal.conclusion === 'counterfeit' ? (
                      <XCircle className="w-6 h-6 text-coral-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-champagne-600" />
                    )}
                    <span className={`font-semibold text-lg ${
                      product.appraisal.conclusion === 'genuine'
                        ? 'text-jade-700'
                        : product.appraisal.conclusion === 'counterfeit'
                        ? 'text-coral-700'
                        : 'text-champagne-700'
                    }`}>
                      {product.appraisal.conclusion === 'genuine'
                        ? '正品'
                        : product.appraisal.conclusion === 'counterfeit'
                        ? '仿品'
                        : '存疑待复核'}
                    </span>
                    <span className="ml-auto text-sm text-charcoal-500">
                      鉴定师：{product.appraisal.appraiser}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-charcoal-700 mb-2">鉴定备注</p>
                  <p className="text-sm text-charcoal-600 bg-ivory-50 p-3 rounded-luxury">
                    {product.appraisal.remark}
                  </p>
                </div>

                {product.appraisal.flaws.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-charcoal-700 mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      瑕疵记录（{product.appraisal.flaws.length}处）
                    </p>
                    <div className="space-y-2">
                      {product.appraisal.flaws.map((flaw) => (
                        <div
                          key={flaw.id}
                          className="flex items-start gap-3 p-3 bg-ivory-50 rounded-luxury"
                        >
                          <span className={`status-badge text-xs ${FLAW_SEVERITY_COLORS[flaw.severity]}`}>
                            {FLAW_SEVERITY_LABELS[flaw.severity]}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-luxury-800 font-medium">
                              {flaw.location}
                            </p>
                            <p className="text-sm text-charcoal-600 mt-0.5">
                              {flaw.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {product.priceHistory.length > 0 && (
              <PriceChart
                priceHistory={product.priceHistory}
                currentPrice={product.currentPrice}
                expectedPrice={product.expectedPrice}
              />
            )}
          </div>

          <div className="space-y-6">
            <CustomerSummary product={product} />

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-champagne-600" />
                <h3 className="font-display text-lg font-semibold text-luxury-800">状态时间线</h3>
              </div>
              <StatusTimeline
                logs={product.statusLogs}
                currentStatus={product.status}
              />
            </div>
          </div>
        </div>

        <ActionHistory logs={product.statusLogs} />
      </div>
    </MainLayout>
  );
}
