===== THƯ VIỆN CÂY THUỐC VIỆT NAM =====

CÁC FILES:
  index.html  — Trang web chính
  style.css   — CSS thiết kế
  app.js      — Logic ứng dụng
  data.js     — Dữ liệu 655 loại cây thuốc

THƯ MỤC CẦN TẠO:
  images/     — Đặt hình ảnh sách tại đây
               Tên file: page_0XX.jpeg (ví dụ: page_030.jpeg)

CÁCH SỬ DỤNG:
  1. Giải nén toàn bộ vào cùng 1 thư mục
  2. Tạo thư mục "images" và đặt các file page_0XX.jpeg vào
  3. Mở index.html bằng trình duyệt
     (Hoặc dùng local server: python -m http.server 8000)

LƯU Ý:
  - Hình ảnh Wikipedia được tải trực tiếp từ internet
  - Cần kết nối internet để xem hình ảnh thực tế
  - Hình ảnh sách (images/) hoạt động offline

TÍNH NĂNG:
  ✓ Danh mục 655 loại cây thuốc, 23 chương bệnh
  ✓ Tìm kiếm theo tên (có/không dấu, tiếng Anh, khoa học)
  ✓ Tra cây thuốc theo chứng bệnh (bộ lọc tác dụng)
  ✓ Xem hình ảnh thực tế từ Wikipedia (slideshow)
  ✓ Xem hình ảnh trang sách (images/)
  ✓ Floating image trên trang sách — click để xem slideshow
  ✓ Phân trang, bộ lọc theo chương, sắp xếp
