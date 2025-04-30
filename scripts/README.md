# Scripts Quản lý Database

Thư mục này chứa các script để tạo và sao lưu cơ sở dữ liệu cho ứng dụng đọc truyện.

## Các Script

### 1. populate-database.ts

Script này tạo cấu trúc cơ sở dữ liệu và dữ liệu mẫu ban đầu.

**Tính năng:**
- Tạo các enum types trong PostgreSQL
- Tạo người dùng mẫu (admin, user)
- Tạo các thể loại truyện
- Tạo tác giả và nhóm dịch
- Tạo nội dung truyện và các chapter
- Tạo mẫu giao dịch thanh toán
- Tạo cài đặt thanh toán
- Tạo quảng cáo mẫu

### 2. extract-data.ts

Script này trích xuất dữ liệu hiện có từ cơ sở dữ liệu và lưu vào các file JSON, đồng thời tạo script SQL để tái tạo cơ sở dữ liệu từ các file sao lưu.

**Tính năng:**
- Trích xuất dữ liệu từ mọi bảng trong cơ sở dữ liệu
- Lưu dữ liệu vào các file JSON riêng biệt
- Tạo file SQL để tái tạo cấu trúc cơ sở dữ liệu
- Tạo thông tin tổng quan về dữ liệu đã sao lưu

## Cách sử dụng

### Tạo cơ sở dữ liệu và dữ liệu mẫu

```bash
cd scripts
npm run create-db
```

### Sao lưu dữ liệu hiện có

```bash
cd scripts
npm run backup
```

Dữ liệu sao lưu sẽ được lưu trong thư mục `scripts/backup`.

## Khôi phục dữ liệu

1. Sử dụng file SQL được tạo trong thư mục `scripts/backup/recreate_database.sql` để tạo lại cấu trúc cơ sở dữ liệu.
2. Bạn có thể sử dụng công cụ [JSON to SQL Converter](https://www.convertjson.com/json-to-sql.htm) để tạo các câu lệnh INSERT từ các file JSON đã sao lưu.

## Lưu ý

- Các script này sẽ kiểm tra xem dữ liệu đã tồn tại hay chưa trước khi tạo mới, để tránh tạo dữ liệu trùng lặp.
- Script sao lưu sẽ tạo ra các file JSON riêng biệt cho từng bảng, giúp dễ dàng quản lý và phục hồi dữ liệu khi cần thiết.
- Các mật khẩu trong script tạo dữ liệu mẫu được mã hóa bằng bcrypt, đảm bảo an toàn khi lưu trữ.