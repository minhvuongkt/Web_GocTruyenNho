import React from 'react';
import { MainLayout } from '@/components/layouts/main-layout';

function HomePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Chào mừng đến với GocTruyenNho</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Truyện mới cập nhật</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Khám phá các truyện mới nhất và cập nhật nhanh nhất tại đây.
          </p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Truyện hot</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Những truyện được yêu thích và đọc nhiều nhất trong tuần.
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Thể loại</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {['Hành động', 'Phiêu lưu', 'Tình cảm', 'Học đường', 'Viễn tưởng', 
            'Kinh dị', 'Thể thao', 'Hài hước', 'Võ thuật', 'Đam mỹ', 'Bách hợp'].map((genre) => (
            <div key={genre} className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3 text-center hover:bg-primary hover:text-white transition-colors duration-200">
              {genre}
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Truyện đề xuất</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
              <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-600"></div>
              <div className="p-3">
                <h3 className="font-medium truncate">Tên truyện {item}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chapter {item + 10}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;