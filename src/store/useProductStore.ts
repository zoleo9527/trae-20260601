import { create } from 'zustand';
import type { Product, ProductStatus, StatusLog, User, PhotoData } from '@/types';
import { mockProducts } from '@/data/products';
import { generateId } from '@/utils/format';

interface ProductState {
  products: Product[];
  loading: boolean;
  getProductById: (id: string) => Product | undefined;
  getProductsByStatus: (statuses: ProductStatus[]) => Product[];
  getProductsByRole: (role: User['role']) => Product[];
  updateProductStatus: (
    productId: string,
    status: ProductStatus,
    log: Omit<StatusLog, 'id' | 'timestamp'>
  ) => void;
  updateAppraisal: (productId: string, appraisal: Product['appraisal']) => void;
  updatePrice: (
    productId: string,
    newPrice: number,
    reason: string,
    operator: string
  ) => void;
  requestPriceChange: (
    productId: string,
    requestedPrice: number,
    reason: string,
    operator: string
  ) => void;
  approvePriceChange: (productId: string, operator: string) => void;
  confirmSettlement: (productId: string, operator: string) => void;
  markDocsComplete: (productId: string) => void;
  handleWithdraw: (productId: string, reason: string) => void;
  listProduct: (productId: string, operator: string) => void;
  resolveDispute: (productId: string, conclusion: 'genuine' | 'counterfeit', operator: string) => void;
  updatePhotos: (productId: string, photoData: PhotoData, operator: string) => void;
  markPhotographing: (productId: string, operator: string) => void;
  sellProduct: (productId: string, salePrice: number, operator: string) => void;
  getStats: () => { pending: number; exception: number; completed: number };
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: mockProducts,
  loading: false,

  getProductById: (id) => get().products.find((p) => p.id === id),

  getProductsByStatus: (statuses) =>
    get().products.filter((p) => statuses.includes(p.status)),

  getProductsByRole: (role) => {
    const { products } = get();
    switch (role) {
      case 'receiver':
        return products.filter((p) =>
          ['RECEIVED', 'MISSING_DOCS', 'PENDING_APPRAISAL'].includes(p.status)
        );
      case 'appraiser':
        return products.filter((p) =>
          ['PENDING_APPRAISAL', 'APPRAISING', 'APPRAISAL_DISPUTE', 'APPRAISAL_PASSED', 'APPRAISAL_FAILED'].includes(p.status)
        );
      case 'operator':
        return products.filter((p) =>
          ['APPRAISAL_PASSED', 'PENDING_LISTING', 'LISTED', 'PRICE_CHANGING', 'CUSTOMER_WITHDRAW', 'SOLD'].includes(p.status)
        );
      case 'finance':
        return products.filter((p) =>
          ['SOLD', 'PENDING_SETTLEMENT', 'SETTLED'].includes(p.status)
        );
      default:
        return products;
    }
  },

  updateProductStatus: (productId, status, log) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              status,
              statusLogs: [
                ...p.statusLogs,
                {
                  ...log,
                  id: generateId(),
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : p
      ),
    })),

  updateAppraisal: (productId, appraisal) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? { ...p,
              appraisal,
              appraisalAt: new Date().toISOString(),
              isDisputed: appraisal?.conclusion === 'disputed',
            }
          : p
      ),
    })),

  updatePrice: (productId, newPrice, reason, operator) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              currentPrice: newPrice,
              priceHistory: [
                ...p.priceHistory,
                {
                  id: generateId(),
                  oldPrice: p.currentPrice,
                  newPrice,
                  reason,
                  operator,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : p
      ),
    })),

  confirmSettlement: (productId, operator) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId && p.settlement
          ? {
              ...p,
              status: 'SETTLED',
              settledAt: new Date().toISOString(),
              settlement: {
                ...p.settlement,
                status: 'paid',
                confirmedAt: new Date().toISOString(),
                operator,
              },
              statusLogs: [
                ...p.statusLogs,
                {
                  id: generateId(),
                  status: 'SETTLED',
                  description: `结算完成，已打款 ${p.settlement.settlementAmount.toLocaleString()} 至客户银行卡`,
                  operator,
                  timestamp: new Date().toISOString(),
                  visibleToCustomer: true,
                },
              ],
            }
          : p
      ),
    })),

  markDocsComplete: (productId) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              status: 'PENDING_APPRAISAL',
              documents: {
                ...p.documents,
                hasCertificate: true,
                hasInvoice: true,
                missingNotes: undefined,
              },
              statusLogs: [
                ...p.statusLogs,
                {
                  id: generateId(),
                  status: 'PENDING_APPRAISAL',
                  description: '客户已补交全部资料，转入待鉴定队列',
                  operator: '张敏',
                  timestamp: new Date().toISOString(),
                  visibleToCustomer: false,
                },
              ],
            }
          : p
      ),
    })),

  handleWithdraw: (productId, reason) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              status: 'CUSTOMER_WITHDRAW',
              customerWithdraw: true,
              withdrawReason: reason,
              statusLogs: [
                ...p.statusLogs,
                {
                  id: generateId(),
                  status: 'CUSTOMER_WITHDRAW',
                  description: `客户申请撤回寄卖，原因：${reason}`,
                  operator: '赵客服',
                  timestamp: new Date().toISOString(),
                  visibleToCustomer: true,
                },
              ],
            }
          : p
      ),
    })),

  listProduct: (productId, operator) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              status: 'LISTED',
              listedAt: new Date().toISOString(),
              statusLogs: [
                ...p.statusLogs,
                {
                  id: generateId(),
                  status: 'LISTED',
                  description: `商品已上架销售，售价 ¥${p.currentPrice.toLocaleString()}`,
                  operator,
                  timestamp: new Date().toISOString(),
                  visibleToCustomer: true,
                },
              ],
            }
          : p
      ),
    })),

  resolveDispute: (productId, conclusion, operator) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId && p.appraisal
          ? {
              ...p,
              status: conclusion === 'genuine' ? 'PENDING_PHOTO' : 'APPRAISAL_FAILED',
              isDisputed: false,
              appraisal: {
                ...p.appraisal,
                conclusion,
              },
              statusLogs: [
                ...p.statusLogs,
                {
                  id: generateId(),
                  status: conclusion === 'genuine' ? 'PENDING_PHOTO' : 'APPRAISAL_FAILED',
                  description: `资深鉴定师复核结论：${conclusion === 'genuine' ? '正品，转入拍照环节' : '仿品'}`,
                  operator,
                  timestamp: new Date().toISOString(),
                  visibleToCustomer: true,
                },
              ],
            }
          : p
      ),
    })),

  requestPriceChange: (productId, requestedPrice, reason, operator) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              status: 'PRICE_CHANGING',
              priceRequest: {
                requestedPrice,
                reason,
                operator,
                timestamp: new Date().toISOString(),
              },
              statusLogs: [
                ...p.statusLogs,
                {
                  id: generateId(),
                  status: 'PRICE_CHANGING',
                  description: `申请改价至 ¥${requestedPrice.toLocaleString()}，原因：${reason}`,
                  operator,
                  timestamp: new Date().toISOString(),
                  visibleToCustomer: false,
                },
              ],
            }
          : p
      ),
    })),

  approvePriceChange: (productId, operator) =>
    set((state) => ({
      products: state.products.map((p) => {
        if (p.id === productId && p.priceRequest) {
          const newPrice = p.priceRequest.requestedPrice;
          const reason = p.priceRequest.reason;
          return {
            ...p,
            status: 'LISTED',
            currentPrice: newPrice,
            priceRequest: undefined,
            priceHistory: [
              ...p.priceHistory,
              {
                id: generateId(),
                oldPrice: p.currentPrice,
                newPrice,
                reason,
                operator,
                timestamp: new Date().toISOString(),
              },
            ],
            statusLogs: [
              ...p.statusLogs,
              {
                id: generateId(),
                status: 'LISTED',
                description: `改价审批通过，新售价 ¥${newPrice.toLocaleString()}`,
                operator,
                timestamp: new Date().toISOString(),
                visibleToCustomer: true,
              },
            ],
          };
        }
        return p;
      }),
    })),

  markPhotographing: (productId, operator) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              status: 'PHOTOGRAPHING',
              statusLogs: [
                ...p.statusLogs,
                {
                  id: generateId(),
                  status: 'PHOTOGRAPHING',
                  description: '摄影师开始商品拍照',
                  operator,
                  timestamp: new Date().toISOString(),
                  visibleToCustomer: false,
                },
              ],
            }
          : p
      ),
    })),

  updatePhotos: (productId, photoData, operator) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              status: 'PENDING_LISTING',
              images: photoData.photos,
              photoData: {
                ...photoData,
                photographedAt: new Date().toISOString(),
                photographer: operator,
              },
              statusLogs: [
                ...p.statusLogs,
                {
                  id: generateId(),
                  status: 'PENDING_LISTING',
                  description: `拍照完成，共 ${photoData.photos.length} 张图片，转入待上架`,
                  operator,
                  timestamp: new Date().toISOString(),
                  visibleToCustomer: true,
                },
              ],
            }
          : p
      ),
    })),

  sellProduct: (productId, salePrice, operator) =>
    set((state) => ({
      products: state.products.map((p) => {
        if (p.id === productId) {
          const commissionRate = 0.12;
          const commission = Math.round(salePrice * commissionRate);
          const settlementAmount = salePrice - commission;
          return {
            ...p,
            status: 'PENDING_SETTLEMENT',
            soldAt: new Date().toISOString(),
            currentPrice: salePrice,
            settlement: {
              id: generateId(),
              salePrice,
              commissionRate,
              commission,
              settlementAmount,
              status: 'pending',
              operator,
            },
            statusLogs: [
              ...p.statusLogs,
              {
                id: generateId(),
                status: 'SOLD',
                description: `商品已成交，成交价 ¥${salePrice.toLocaleString()}`,
                operator,
                timestamp: new Date().toISOString(),
                visibleToCustomer: true,
              },
              {
                id: generateId(),
                status: 'PENDING_SETTLEMENT',
                description: `进入结算流程，待结算金额 ¥${settlementAmount.toLocaleString()}`,
                operator,
                timestamp: new Date().toISOString(),
                visibleToCustomer: true,
              },
            ],
          };
        }
        return p;
      }),
    })),

  getStats: () => {
    const { products } = get();
    return {
      pending: products.filter((p) =>
        ['PENDING_APPRAISAL', 'PENDING_PHOTO', 'PHOTOGRAPHING', 'PENDING_LISTING', 'LISTED', 'SOLD', 'PENDING_SETTLEMENT'].includes(p.status)
      ).length,
      exception: products.filter((p) =>
        ['MISSING_DOCS', 'APPRAISAL_DISPUTE', 'CUSTOMER_WITHDRAW', 'PRICE_CHANGING'].includes(p.status)
      ).length,
      completed: products.filter((p) =>
        ['APPRAISAL_FAILED', 'SETTLED', 'RETURNED'].includes(p.status)
      ).length,
    };
  },
}));
