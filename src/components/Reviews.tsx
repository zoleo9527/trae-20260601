import { useState } from 'react';
import { Search, Filter, Star, MessageSquare, Calendar, User, ChevronRight } from 'lucide-react';

interface Review {
  id: number;
  orderNo: string;
  customerName: string;
  serviceType: string;
  rating: number;
  comment: string;
  createdAt: string;
  staffName: string;
}

const mockReviews: Review[] = [
  {
    id: 1,
    orderNo: 'ORD20240101006',
    customerName: '吴先生',
    serviceType: '深度清洁',
    rating: 5,
    comment: '服务非常专业，阿姨很细心，家里打扫得很干净。下次还会继续使用！',
    createdAt: '2024-01-17 17:30:00',
    staffName: '王阿姨',
  },
  {
    id: 2,
    orderNo: 'ORD20240101003',
    customerName: '孙女士',
    serviceType: '月嫂服务',
    rating: 5,
    comment: '月嫂非常专业，对宝宝很有耐心，服务态度很好。',
    createdAt: '2024-01-16 18:00:00',
    staffName: '王阿姨',
  },
  {
    id: 3,
    orderNo: 'ORD20240101002',
    customerName: '钱先生',
    serviceType: '深度清洁',
    rating: 4,
    comment: '整体服务不错，就是厨房清洁还可以再仔细一些。',
    createdAt: '2024-01-15 16:30:00',
    staffName: '李阿姨',
  },
  {
    id: 4,
    orderNo: 'ORD20240101004',
    customerName: '李先生',
    serviceType: '日常保洁',
    rating: 5,
    comment: '非常满意！阿姨准时到达，工作认真负责。',
    createdAt: '2024-01-16 12:00:00',
    staffName: '李阿姨',
  },
];

export default function Reviews() {
  const [reviews] = useState<Review[]>(mockReviews);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      review.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = !ratingFilter || review.rating === Number(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">客户评价</h2>
          <p className="text-gray-500 mt-1">查看客户反馈和评价</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索订单号、客户名、评价内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部评分</option>
                  <option value="5">5星好评</option>
                  <option value="4">4星</option>
                  <option value="3">3星</option>
                  <option value="2">2星</option>
                  <option value="1">1星</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredReviews.map((review) => (
            <div key={review.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-800">{review.customerName}</span>
                    <span className="text-sm text-gray-500">{review.serviceType}</span>
                    <span className="text-sm text-gray-400">{review.orderNo}</span>
                  </div>
                  <div className="flex items-center space-x-1 mt-2">
                    {renderStars(review.rating)}
                  </div>
                  <div className="flex items-start space-x-2 mt-3">
                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{review.createdAt}</span>
                      </div>
                      <span>服务人员: {review.staffName}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
