import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Camera,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  Image
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { bodyMeasurements, members, weightTrendData } from '../data/mockData';

export default function BodyMeasurements() {
  const [searchParams] = useSearchParams();
  const urlMemberId = searchParams.get('memberId');
  const [selectedMember, setSelectedMember] = useState(urlMemberId || 'm2');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompareIndex, setSelectedCompareIndex] = useState(0);

  const member = members.find((m) => m.id === selectedMember);
  const memberMeasurements = bodyMeasurements.filter(
    (m) => m.memberId === selectedMember
  );

  const latestMeasurement = memberMeasurements[memberMeasurements.length - 1];
  const previousMeasurement = memberMeasurements[memberMeasurements.length - 2];

  const getDiff = (current: number, previous: number) => {
    const diff = current - previous;
    return {
      value: diff.toFixed(1),
      positive: diff < 0,
      icon: diff === 0 ? Minus : diff < 0 ? TrendingDown : TrendingUp,
    };
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">体测记录</h1>
            <p className="text-gray-500 mt-1">追踪会员身体数据变化</p>
          </div>
          <Button>
            <Camera className="w-4 h-4 mr-1" />
            新增体测
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-500 mb-1">选择会员</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-600">对比模式</span>
            </label>
          </div>
        </div>

        {member && latestMeasurement && (
          <>
            <Card>
              <Card.Body>
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {member.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="info">上次体测：{latestMeasurement.date}</Badge>
                      <span className="text-sm text-gray-500">
                        共 {memberMeasurements.length} 条记录
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[
                    { label: '体重', value: latestMeasurement.weight, unit: 'kg', key: 'weight' },
                    { label: '体脂率', value: latestMeasurement.bodyFat, unit: '%', key: 'bodyFat' },
                    { label: '肌肉量', value: latestMeasurement.muscle, unit: 'kg', key: 'muscle' },
                    { label: 'BMI', value: latestMeasurement.bmi, unit: '', key: 'bmi' },
                    { label: '腰围', value: latestMeasurement.waist, unit: 'cm', key: 'waist' },
                    { label: '臀围', value: latestMeasurement.hips, unit: 'cm', key: 'hips' },
                  ].map((item) => {
                    const diff = previousMeasurement
                      ? getDiff(
                          latestMeasurement[item.key as keyof typeof latestMeasurement] as number,
                          previousMeasurement[item.key as keyof typeof previousMeasurement] as number
                        )
                      : null;
                    const IconComponent = diff?.icon;
                    return (
                      <div
                        key={item.key}
                        className="p-4 bg-gray-50 rounded-xl text-center"
                      >
                        <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {item.value}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            {item.unit}
                          </span>
                        </p>
                        {diff && IconComponent && (
                          <div
                            className={`flex items-center justify-center gap-1 text-xs mt-1 ${
                              diff.positive ? 'text-teal-600' : 'text-coral-600'
                            }`}
                          >
                            <IconComponent className="w-3 h-3" />
                            <span>
                              {diff.value.startsWith('-') ? diff.value : `+${diff.value}`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-sm text-orange-800">
                    <span className="font-medium">教练备注：</span>
                    {latestMeasurement.notes}
                  </p>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-gray-900">趋势图表</h2>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="weight"
                      stroke="#ff6b35"
                      strokeWidth={2}
                      dot={{ fill: '#ff6b35' }}
                      name="体重 (kg)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bodyFat"
                      stroke="#4ecdc4"
                      strokeWidth={2}
                      dot={{ fill: '#4ecdc4' }}
                      name="体脂率 (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>

            {compareMode && (
              <Card>
                <Card.Header>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">数据对比</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedCompareIndex(Math.max(0, selectedCompareIndex - 1))
                        }
                        disabled={selectedCompareIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-500 min-w-[120px] text-center">
                        {memberMeasurements[selectedCompareIndex]?.date || '-'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedCompareIndex(
                            Math.min(memberMeasurements.length - 1, selectedCompareIndex + 1)
                          )
                        }
                        disabled={selectedCompareIndex === memberMeasurements.length - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-700 mb-4">基准数据</h3>
                      <div className="space-y-3">
                        {[
                          {
                            label: '体重',
                            current: latestMeasurement.weight,
                            compare: memberMeasurements[selectedCompareIndex]?.weight,
                            unit: 'kg',
                          },
                          {
                            label: '体脂率',
                            current: latestMeasurement.bodyFat,
                            compare: memberMeasurements[selectedCompareIndex]?.bodyFat,
                            unit: '%',
                          },
                          {
                            label: '肌肉量',
                            current: latestMeasurement.muscle,
                            compare: memberMeasurements[selectedCompareIndex]?.muscle,
                            unit: 'kg',
                          },
                          {
                            label: 'BMI',
                            current: latestMeasurement.bmi,
                            compare: memberMeasurements[selectedCompareIndex]?.bmi,
                            unit: '',
                          },
                        ].map((item) => {
                          const diff =
                            item.compare !== undefined
                              ? (item.current - item.compare).toFixed(1)
                              : null;
                          return (
                            <div
                              key={item.label}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="text-gray-600">{item.label}</span>
                              <div className="text-right">
                                <span className="font-medium">
                                  {item.current}{item.unit}
                                </span>
                                {diff !== null && (
                                  <span
                                    className={`ml-2 text-sm ${
                                      Number(diff) < 0 ? 'text-teal-600' : 'text-coral-600'
                                    }`}
                                  >
                                    ({Number(diff) > 0 ? '+' : ''}
                                    {diff})
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700 mb-4">体测照片</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {latestMeasurement.photos.map((photo, index) => (
                          <div
                            key={index}
                            className="aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden"
                          >
                            <img
                              src={photo}
                              alt={`体测照片 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-gray-900">历史记录</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  {memberMeasurements
                    .slice()
                    .reverse()
                    .map((record, index) => (
                      <div
                        key={record.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center">
                          <Image className="w-6 h-6 text-navy-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{record.date}</p>
                          <p className="text-sm text-gray-500">
                            体重 {record.weight}kg · 体脂 {record.bodyFat}% · 肌肉 {record.muscle}kg
                          </p>
                        </div>
                        {index === 0 && (
                          <Badge variant="success">最新</Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          查看详情
                        </Button>
                      </div>
                    ))}
                </div>
              </Card.Body>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
