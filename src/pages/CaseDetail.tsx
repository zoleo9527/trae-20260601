import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    ClipboardCheck,
    Edit,
    Package,
    Search,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ReasonTag, StatusTag } from '../components/StatusTag';
import { Timeline, type TimelineItem } from '../components/Timeline';
import { useAppStore } from '../store/appStore';

export function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, reinspections, traces } = useAppStore();

  const currentCase = cases.find((c) => c.id === id);
  const reinspect = reinspections[id || ''];
  const trace = currentCase?.batchNo ? traces[currentCase.batchNo] : null;

  if (!currentCase) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <div className="text-lg font-medium text-slate-600">案件不存在</div>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const timelineItems: TimelineItem[] = [
    {
      id: '1',
      title: '退货登记',
      description: `${currentCase.customerName} 反馈 ${currentCase.returnReason === 'odor' ? '异味问题' : currentCase.returnReason === 'spec' ? '规格不符' : '其他问题'}，退货 ${currentCase.returnQuantity} ${currentCase.unit}`,
      time: currentCase.registeredAt,
      user: currentCase.registeredBy,
      status: 'done' as const,
      type: 'register',
    },
    {
      id: '2',
      title: '批次溯源',
      description: `追溯批号 ${currentCase.batchNo}：原料来自 ${trace?.rawMaterial.supplier || '未知'}，${trace?.production.teamNo || '未知班组'} 生产，库存剩余 ${trace?.coldStorage.remainingStock || 0} kg`,
      time: currentCase.registeredAt,
      status: (reinspect ? 'done' : 'current') as 'done' | 'current',
      type: 'inspect',
    },
    ...(reinspect
      ? [
          {
            id: '3',
            title: '复检完成',
            description: `结论：${reinspect.conclusion === 'false_alarm' ? '误报' : reinspect.conclusion === 'quality_issue' ? '确认质量问题' : '补差价处理'}。${reinspect.remark}`,
            time: reinspect.inspectTime,
            user: reinspect.inspector,
            status: 'done' as const,
            type: 'inspect' as const,
          },
        ]
      : []),
    ...(reinspect?.productionSupplement
      ? [
          {
            id: '4',
            title: '生产情况补充',
            description: reinspect.productionSupplement.content,
            time: reinspect.productionSupplement.supplementTime,
            user: reinspect.productionSupplement.teamLeader,
            status: 'done' as const,
            type: 'production' as const,
          },
        ]
      : []),
    ...(reinspect?.stockConfirmation
      ? [
          {
            id: '5',
            title: '库存确认',
            description: `同批次剩余库存 ${reinspect.stockConfirmation.remainingStock} kg。${reinspect.stockConfirmation.remark}`,
            time: reinspect.stockConfirmation.confirmTime,
            user: reinspect.stockConfirmation.warehouseKeeper,
            status: 'done' as const,
            type: 'stock' as const,
          },
        ]
      : []),
    ...(currentCase.status === 'recalling'
      ? [
          {
            id: '6',
            title: '召回进行中',
            description: '已启动召回流程，正在通知相关客户并安排退货',
            time: '处理中',
            status: 'current' as const,
            type: 'recall' as const,
          },
        ]
      : []),
    ...(currentCase.closedAt
      ? [
          {
            id: '7',
            title: '案件关闭',
            description: currentCase.conclusionRemark || '案件处理完毕，已关闭',
            time: currentCase.closedAt,
            user: currentCase.closedBy,
            status: 'done' as const,
            type: 'close' as const,
          },
        ]
      : []),
  ].filter((item) => item.time !== '') as TimelineItem[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">{currentCase.caseNo}</h2>
            <StatusTag type="case" status={currentCase.status} />
            {currentCase.conclusion && (
              <StatusTag type="conclusion" status={currentCase.conclusion} />
            )}
          </div>
          <p className="text-slate-500 mt-1">
            {currentCase.customerName} · {currentCase.productName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/return/${id}/trace`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors font-medium"
          >
            <Search className="w-4 h-4" />
            批次溯源
          </Link>
          {currentCase.status !== 'closed' && (
            <Link
              to={`/return/${id}/reinspect`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-md hover:bg-[#2a4d7a] transition-colors shadow-sm font-medium"
            >
              <Edit className="w-4 h-4" />
              {reinspect ? '编辑复检' : '开始复检'}
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-5">案件信息</h3>
            <div className="grid grid-cols-2 gap-6">
              <DetailItem label="客户名称" value={currentCase.customerName} />
              <DetailItem label="产品名称" value={currentCase.productName} />
              <DetailItem label="产品批号" value={currentCase.batchNo} mono />
              <DetailItem
                label="退货数量"
                value={`${currentCase.returnQuantity} ${currentCase.unit}`}
              />
              <DetailItem label="退货原因">
                <ReasonTag reason={currentCase.returnReason} />
              </DetailItem>
              <DetailItem label="登记人" value={currentCase.registeredBy} />
              <DetailItem label="登记时间" value={currentCase.registeredAt} />
              {currentCase.closedAt && (
                <DetailItem label="关闭时间" value={currentCase.closedAt} />
              )}
              {currentCase.closedBy && (
                <DetailItem label="关闭人" value={currentCase.closedBy} />
              )}
              {currentCase.priceAdjustment !== undefined && (
                <DetailItem
                  label="补偿金额"
                  value={`¥ ${currentCase.priceAdjustment}`}
                  highlight
                />
              )}
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="text-sm font-medium text-slate-700 mb-2">客户反馈详情</div>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-md">
                {currentCase.reasonDetail}
              </p>
            </div>
            {currentCase.customerPhotos.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="text-sm font-medium text-slate-700 mb-3">客户提供照片</div>
                <div className="grid grid-cols-4 gap-3">
                  {currentCase.customerPhotos.map((photo, i) => (
                    <div
                      key={i}
                      className="aspect-[4/3] rounded-md overflow-hidden border border-slate-200"
                    >
                      <img
                        src={photo}
                        alt={`客户照片 ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {reinspect && reinspect.photos.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                复检照片
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {reinspect.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="rounded-lg overflow-hidden border border-slate-200"
                  >
                    <div className="aspect-[4/3]">
                      <img
                        src={photo.url}
                        alt={photo.description || '复检照片'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {photo.description && (
                      <div className="p-3 bg-slate-50 border-t border-slate-100">
                        <p className="text-xs text-slate-600">{photo.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-5">处理进度</h3>
            <Timeline items={timelineItems} />
          </div>

          {currentCase.status === 'recalling' && (
            <Link
              to="/recalls"
              className="block bg-red-50 border border-red-200 rounded-lg p-5 hover:bg-red-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-red-700">召回进行中</div>
                  <div className="text-sm text-red-600">点击查看召回进度 →</div>
                </div>
              </div>
            </Link>
          )}

          {currentCase.status === 'closed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-green-700">案件已关闭</div>
                  <div className="text-sm text-green-600">所有流程已处理完毕</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DetailItemProps {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}

function DetailItem({ label, value, children, mono, highlight }: DetailItemProps) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1.5">{label}</div>
      <div
        className={`${mono ? 'font-mono' : ''} ${
          highlight ? 'font-semibold text-[#1E3A5F]' : 'text-slate-800'
        }`}
      >
        {value || children}
      </div>
    </div>
  );
}
