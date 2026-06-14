import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { CATEGORIES, CONDITIONS } from '../types';
import { ArrowLeft, Camera, Plus, Trash2, Save } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { addRecord, addHistory, user } = useAppStore();

  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState('');
  const [weight, setWeight] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [remark, setRemark] = useState('');

  const handlePhotoAdd = () => {
    const prompt = encodeURIComponent(`${category || 'item'} product photo elegant`);
    const newPhoto = `https://neeko-copilot.bytedance.net/api/text_to_image?prompt=${prompt}&image_size=square`;
    setPhotos([...photos, newPhoto]);
  };

  const handlePhotoRemove = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!category || !model || !condition) {
      alert('请填写必填字段（品类、型号、成色）');
      return;
    }

    if (!user) {
      alert('请先登录');
      return;
    }

    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const id = `REC${String(now.getTime()).slice(-4)}`;

    addRecord({
      id,
      category,
      brand,
      model,
      condition,
      weight: parseFloat(weight) || 0,
      photos,
      estimatedValue: null,
      status: 'pending',
      rejectReason: null,
      remark,
      operatorId: user.id,
      operatorName: user.name,
      createdAt: timeStr,
      updatedAt: timeStr,
    });

    addHistory({
      id: `H${String(now.getTime()).slice(-4)}`,
      recordId: id,
      statusFrom: null,
      statusTo: 'pending',
      operatorId: user.id,
      operatorName: user.name,
      remark: '新增当品登记',
      createdAt: timeStr,
    });

    alert('登记成功！');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </button>
            <h1 className="text-lg font-bold text-gray-900">当品登记</h1>
            <button
              onClick={handleSubmit}
              className="btn-gold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存登记
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">基本信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">品类 <span className="text-red-500">*</span></label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                <option value="">请选择品类</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
              <input
                type="text"
                placeholder="品牌名称"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">型号 <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="产品型号"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">成色 <span className="text-red-500">*</span></label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="input-field"
              >
                <option value="">请选择成色</option>
                {CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">重量（g）</label>
              <input
                type="number"
                placeholder="输入重量"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">照片</label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                  <img
                    src={photo}
                    alt={`照片${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handlePhotoRemove(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              <button
                onClick={handlePhotoAdd}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-2"
              >
                <Camera className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400">添加照片</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              placeholder="请输入备注信息，如购买凭证、特殊说明等，备注信息将在估价复核时继续使用"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={4}
              className="input-field resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              备注信息将在估价复核环节继续使用，请详细描述当品情况
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
