import { useState } from 'react';
import type { InspectionReport, User, AccidentAnnotation } from '~/types';
import { formatDate, getStatusLabel, getStatusColor, getAccidentSeverityLabel, getAccidentSeverityColor } from '~/utils/formatters';

interface InspectionReportProps {
  report: InspectionReport;
  inspector?: User;
  annotators?: Record<string, User>;
  verifiers?: Record<string, User>;
}

export default function InspectionReport({ report, inspector, annotators = {}, verifiers = {} }: InspectionReportProps) {
  const [showAccidentDetails, setShowAccidentDetails] = useState(false);
  
  const failedItems = report.items.filter(item => item.status === 'fail');
  const passRate = (report.items.filter(item => item.status === 'pass').length / report.items.length) * 100;
  const accidentItems = report.items.filter(item => item.isAccident);

  const allAccidentAnnotations: AccidentAnnotation[] = [];
  report.items.forEach(item => {
    if (item.accidentAnnotations && item.accidentAnnotations.length > 0) {
      allAccidentAnnotations.push(...item.accidentAnnotations);
    }
  });

  const getAnnotatorName = (annotatorId: string) => {
    return annotators[annotatorId]?.name || '未知';
  };

  const getVerifierName = (verifierId: string | null | undefined) => {
    if (!verifierId) return null;
    return verifiers[verifierId]?.name || '未知';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">检测报告</h2>
            <div className="flex items-center space-x-4 mt-2 text-blue-100 text-sm">
              <span>👤 检测人: {inspector?.name || '未知'}</span>
              <span>📅 检测时间: {formatDate(new Date(report.createdAt))}</span>
            </div>
          </div>
          {report.hasAccidentRecords && (
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="text-sm font-semibold">存在事故记录</div>
                <div className="text-xs">共 {report.accidentCount} 处</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{report.overallScore.toFixed(1)}</div>
            <div className="text-sm text-gray-500 mt-1">综合评分</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{passRate.toFixed(0)}%</div>
            <div className="text-sm text-gray-500 mt-1">通过率</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">{failedItems.length}</div>
            <div className="text-sm text-gray-500 mt-1">待处理项</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-3xl font-bold ${report.hasAccidentRecords ? 'text-red-600' : 'text-gray-400'}`}>
              {report.accidentCount}
            </div>
            <div className="text-sm text-gray-500 mt-1">事故记录</div>
          </div>
        </div>

        {report.hasAccidentRecords && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-red-900 flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                事故/损伤标注
              </h3>
              <button
                onClick={() => setShowAccidentDetails(!showAccidentDetails)}
                className="text-sm text-red-700 hover:text-red-900 underline"
              >
                {showAccidentDetails ? '收起详情' : '查看详情'}
              </button>
            </div>
            <div className="space-y-3">
              {accidentItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg p-3 border border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <span className="text-sm text-gray-500">({item.category})</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.note}</p>
                      {item.accidentAnnotations && item.accidentAnnotations.length > 0 && (
                        <div className="space-y-2">
                          {item.accidentAnnotations.map(annotation => (
                            <div key={annotation.id} className="bg-yellow-50 rounded p-2 text-sm">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getAccidentSeverityColor(annotation.severity)}`}>
                                  {getAccidentSeverityLabel(annotation.severity)}
                                </span>
                                <span className="text-gray-500">位置: {annotation.location}</span>
                              </div>
                              <p className="text-gray-700 mb-1">{annotation.description}</p>
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <span>标注人: {getAnnotatorName(annotation.annotatedBy)}</span>
                                <span>标注时间: {formatDate(new Date(annotation.annotatedAt))}</span>
                              </div>
                              {annotation.verifiedBy && (
                                <div className="mt-1 text-xs text-green-600">
                                  ✓ 已核实: {getVerifierName(annotation.verifiedBy)} ({formatDate(new Date(annotation.verifiedAt!))})
                                </div>
                              )}
                              {annotation.note && (
                                <p className="mt-1 text-xs text-gray-600 italic">备注: {annotation.note}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.criticalIssues.length > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-2 flex items-center">
              <span className="text-xl mr-2">🔴</span>
              关键问题 ({report.criticalIssues.length})
            </h3>
            <ul className="space-y-1">
              {report.criticalIssues.map((issue, index) => (
                <li key={index} className="text-sm text-orange-800 flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">检测结论</h3>
          <p className="text-gray-600 bg-blue-50 p-4 rounded-lg">{report.conclusion}</p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">建议事项</h3>
          <ul className="space-y-2">
            {report.recommendations.split('\n').map((item, index) => (
              <li key={index} className="flex items-start text-gray-600">
                <span className="text-blue-500 mr-2">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">检测项目明细</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-700">类别</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">项目</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">状态</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">得分</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">备注</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">事故</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.items.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.isAccident ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 text-gray-900">{item.category}</td>
                    <td className="px-4 py-3 text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.score}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.note}</td>
                    <td className="px-4 py-3 text-center">
                      {item.isAccident && (
                        <span className="text-red-500 text-lg" title="存在事故标注">⚠️</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
