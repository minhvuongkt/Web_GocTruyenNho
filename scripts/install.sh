#!/bin/bash

# Kiểm tra xem thư mục node_modules đã tồn tại hay chưa
if [ ! -d "node_modules" ]; then
  echo "📦 Cài đặt các gói phụ thuộc..."
  npm install
else
  echo "✅ Các gói phụ thuộc đã được cài đặt."
fi

# Kiểm tra xem có cài đặt tsx không
if ! command -v tsx &> /dev/null; then
  echo "📦 Cài đặt tsx globally..."
  npm install -g tsx
else
  echo "✅ tsx đã được cài đặt."
fi

echo "🎉 Cài đặt hoàn tất. Bạn có thể chạy các script sau:"
echo "  - npm run create-db : Tạo cơ sở dữ liệu và dữ liệu mẫu"
echo "  - npm run backup    : Sao lưu dữ liệu hiện tại"