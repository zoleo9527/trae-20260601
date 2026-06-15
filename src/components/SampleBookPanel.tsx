import { useState } from 'react';
import { useAppStore } from '../store';
import { Palette, Package, ChevronRight, Search } from 'lucide-react';

export default function SampleBookPanel() {
  const sampleBooks = useAppStore((state) => state.sampleBooks);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = sampleBooks;

  const selectedBookData = sampleBooks.find(b => b.id === selectedBook);

  const getStockStatus = (stock: number) => {
    if (stock > 100) return { label: '充足', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (stock > 30) return { label: '正常', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    return { label: '紧张', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-800">样板册分类</h3>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索色号或名称..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {filteredBooks.map((book) => (
              <button
                key={book.id}
                onClick={() => setSelectedBook(book.id)}
                className={`w-full p-4 text-left transition-colors ${
                  selectedBook === book.id ? 'bg-purple-50 border-l-4 border-purple-500' : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <div className="font-medium text-slate-800">{book.name}</div>
                <div className="text-sm text-slate-500">{book.category} - {book.colors.length} 种颜色</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedBookData ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">{selectedBookData.name}</h3>
                  <p className="text-slate-500">{selectedBookData.category}</p>
                </div>
                <span className="text-sm text-slate-400">{selectedBookData.colors.length} 种颜色</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedBookData.colors.map((color) => {
                  const stockStatus = getStockStatus(color.stock);
                  return (
                    <div key={color.colorNo} className="bg-slate-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-slate-100">
                        <img 
                          src={color.imageUrl} 
                          alt={color.colorName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-800">{color.colorNo}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${stockStatus.bgColor} ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">{color.colorName}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <Package className="w-3 h-3" />
                        <span>库存：{color.stock} 片</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Palette className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">请选择样板册</h3>
            <p className="text-slate-500">从左侧选择一个样板册查看颜色详情</p>
          </div>
        )}
      </div>
    </div>
  );
}
