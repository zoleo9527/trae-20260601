import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import prisma from '@/lib/db';
import { requireAuth, serializeUser } from '@/lib/auth';
import Layout from '@/components/Layout';

interface ImportPageProps {
  user: ReturnType<typeof serializeUser>;
  booking: {
    id: string;
    bookingNo: string;
    companyName: string;
    scheduledDate: string;
    expectedCount: number;
  };
}

const sampleData = `姓名,性别,年龄,身份证号,电话,部门,职位
张三,男,35,110101199001010001,13800138001,研发部,工程师
李四,女,28,110101199702020002,13800138002,市场部,经理
王五,男,42,110101198303030003,13800138003,财务部,总监`;

export default function ImportPage({ user, booking }: ImportPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('paste');
  const [pasteData, setPasteData] = useState('');
  const [preview, setPreview] = useState<any[] | null>(null);

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const data = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });

    return data;
  };

  const handlePreview = () => {
    if (!pasteData.trim()) {
      alert('请输入数据');
      return;
    }
    const data = parseCSV(pasteData);
    if (data.length === 0) {
      alert('无法解析数据，请检查格式');
      return;
    }
    setPreview(data);
  };

  const handleImport = async () => {
    if (!preview) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: '手动导入.csv',
          personnel: preview,
        }),
      });

      if (res.ok) {
        router.push(`/bookings/${booking.id}`);
      } else {
        const data = await res.json();
        alert(data.error || '导入失败');
      }
    } catch (error) {
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setPasteData(text);
      setPreview(parseCSV(text));
    };
    reader.readAsText(file);
  };

  return (
    <Layout user={user} title="导入人员">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link href={`/bookings/${booking.id}`} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">导入体检人员</h1>
              <p className="text-gray-500">
                {booking.companyName} · {booking.bookingNo} · 预计 {booking.expectedCount} 人
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setImportMethod('paste')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  importMethod === 'paste'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                粘贴数据
              </button>
              <button
                onClick={() => setImportMethod('file')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  importMethod === 'file'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                上传文件
              </button>
            </div>

            {importMethod === 'paste' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    粘贴 CSV 格式数据
                  </label>
                  <textarea
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    rows={10}
                    placeholder="姓名,性别,年龄,身份证号,电话,部门,职位&#10;张三,男,35,110101199001010001,13800138001,研发部,工程师&#10;李四,女,28,110101199702020002,13800138002,市场部,经理"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setPasteData(sampleData)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    填入示例数据
                  </button>
                  <button
                    onClick={handlePreview}
                    className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                  >
                    预览数据
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600 mb-4">点击或拖拽上传 CSV 文件</p>
                  <label className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-medium rounded-lg cursor-pointer hover:bg-blue-600 transition">
                    选择文件
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  支持 CSV 格式，首行为表头：姓名,性别,年龄,身份证号,电话,部门,职位
                </p>
              </div>
            )}

            {preview && preview.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    数据预览 <span className="text-blue-600">({preview.length} 人)</span>
                  </h3>
                  <button
                    onClick={() => setPreview(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    清除预览
                  </button>
                </div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">姓名</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">性别</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">年龄</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">部门</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">职位</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.slice(0, 10).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{row.姓名 || row.name}</td>
                          <td className="px-3 py-2">{row.性别 || row.gender}</td>
                          <td className="px-3 py-2">{row.年龄 || row.age}</td>
                          <td className="px-3 py-2">{row.部门 || row.department}</td>
                          <td className="px-3 py-2">{row.职位 || row.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2">仅显示前 10 条数据，共 {preview.length} 条</p>
                )}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleImport}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    {loading ? '导入中...' : '确认导入'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const authResult = await requireAuth(context);
  if ('redirect' in authResult) {
    return { redirect: authResult.redirect };
  }

  const { id } = context.params as { id: string };

  const booking = await prisma.groupBooking.findUnique({
    where: { id },
    select: {
      id: true,
      bookingNo: true,
      companyName: true,
      scheduledDate: true,
      expectedCount: true,
    },
  });

  if (!booking) {
    return { notFound: true };
  }

  return {
    props: {
      user: serializeUser(authResult.user),
      booking: JSON.parse(JSON.stringify(booking)),
    },
  };
};
