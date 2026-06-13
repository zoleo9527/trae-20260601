import React from 'react';
import { Card, Tag, Button } from 'antd';
import { FileIcon, Download } from 'lucide-react';
import type { Evidence } from '../../types';

interface EvidenceViewerProps {
  evidence: Evidence[];
}

const EvidenceViewer: React.FC<EvidenceViewerProps> = ({ evidence }) => {
  return (
    <div className="space-y-4">
      {evidence.map((e, index) => (
        <Card
          key={index}
          className={`border-l-4 ${
            e.role === '企业HR' ? 'border-l-orange-500' : 'border-l-green-500'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <Tag color={e.role === '企业HR' ? 'orange' : 'green'}>
              {e.role}提交
            </Tag>
          </div>
          <p className="text-sm text-gray-800 mb-3">{e.description}</p>
          <div className="space-y-2">
            {e.files.map((file, fileIndex) => (
              <div
                key={fileIndex}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <FileIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{file}</span>
                </div>
                <Button
                  type="link"
                  size="small"
                  icon={<Download className="w-3 h-3" />}
                  className="flex items-center gap-1"
                >
                  下载
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default EvidenceViewer;