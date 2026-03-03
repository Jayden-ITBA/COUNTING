# LoveDays 💖

LoveDays là ứng dụng lưu giữ khoảnh khắc tình yêu dành cho các cặp đôi. Ứng dụng giúp bạn đếm ngày bên nhau, lưu nhật ký, chia sẻ album ảnh và nhận thông báo về những cột mốc kỷ niệm quan trọng.

## ✨ Tính năng chính

- **Đếm ngày yêu**: Theo dõi thời gian bên nhau theo ngày, tuần, tháng.
- **Nhật ký tình yêu**: Lưu giữ những câu chuyện và cảm xúc hàng ngày kèm hình ảnh.
- **Album chung**: Nơi lưu trữ những khoảnh khắc đẹp nhất của hai người.
- **Thông báo**: Nhận thông báo khi đối phương cập nhật nhật ký hoặc đến ngày kỷ niệm.
- **Bảo mật**: Khóa ứng dụng bằng mã PIN để đảm bảo riêng tư.
- **PWA**: Cài đặt ứng dụng trực tiếp trên điện thoại như một ứng dụng native.

## 🚀 Công nghệ sử dụng

- **Frontend**: React 19, Vite 7, Tailwind CSS 4
- **Backend / Database**: Firebase (Authentication, Firestore, Storage)
- **Animation**: Framer Motion
- **Media**: Cloudinary
- **Testing**: Vitest, React Testing Library

## 🛠️ Hướng dẫn cài đặt

1. **Clone repository**:
   ```bash
   git clone https://github.com/Jayden-ITBA/COUNTING.git
   cd COUNTING
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường**:
   Tạo file `.env` ở thư mục gốc và thêm các thông tin sau:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
   ```

4. **Chạy ứng dụng ở chế độ phát triển**:
   ```bash
   npm run dev
   ```

5. **Chạy Unit Test**:
   ```bash
   npm test
   ```

## 📦 Triển khai (Deployment)

Dự án được cấu hình để triển khai dễ dàng trên **Vercel**. 
1. Kết nối repository GitHub với Vercel.
2. Thêm các biến môi trường trong file `.env` vào phần **Environment Variables** trên Vercel.
3. Nhấn **Deploy**.

## 📄 Giấy phép

Hành trình hạnh phúc của Jayden và Summer.
