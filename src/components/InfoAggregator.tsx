import { motion } from 'framer-motion';
import { FileText, MapPin, MessageSquare, AlertCircle } from 'lucide-react';
import { Appeal } from '../types';

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  content: string | undefined;
  color: string;
}

function InfoCard({ title, icon, content, color }: InfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow-sm p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">
        {content || '暂无信息'}
      </p>
    </motion.div>
  );
}

interface InfoAggregatorProps {
  appeal: Appeal;
}

export function InfoAggregator({ appeal }: InfoAggregatorProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <InfoCard
        title="旧台账信息"
        icon={<FileText className="w-4 h-4 text-white" />}
        content={appeal.oldLedgerInfo}
        color="bg-blue-900"
      />
      
      <InfoCard
        title="客户申诉内容"
        icon={<AlertCircle className="w-4 h-4 text-white" />}
        content={appeal.appealContent}
        color="bg-orange-500"
      />
      
      <InfoCard
        title="现场记录"
        icon={<MapPin className="w-4 h-4 text-white" />}
        content={appeal.siteRecord}
        color="bg-green-500"
      />
      
      <InfoCard
        title="沟通截图/专业意见"
        icon={<MessageSquare className="w-4 h-4 text-white" />}
        content={appeal.professionalOpinion}
        color="bg-purple-500"
      />
      
      {appeal.returnReason && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-2"
        >
          <InfoCard
            title="退回原因"
            icon={<AlertCircle className="w-4 h-4 text-white" />}
            content={appeal.returnReason}
            color="bg-red-500"
          />
        </motion.div>
      )}
      
      {appeal.supplementNote && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-2"
        >
          <InfoCard
            title="补充备注"
            icon={<MessageSquare className="w-4 h-4 text-white" />}
            content={appeal.supplementNote}
            color="bg-yellow-500"
          />
        </motion.div>
      )}
      
      {appeal.reviewConclusion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-2"
        >
          <InfoCard
            title="复核结论"
            icon={<FileText className="w-4 h-4 text-white" />}
            content={appeal.reviewConclusion}
            color="bg-green-500"
          />
        </motion.div>
      )}
    </div>
  );
}