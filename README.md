# Trương Hoàng Huy MSSV:2280601274 #



# NNPTUD-S5

Demo nhỏ hiển thị danh sách `posts` và `comments` sử dụng [JSON Server](https://github.com/typicode/json-server).

## Cấu trúc

```
db.json        # Dữ liệu mẫu (posts, comments, profile)
test.html      # Giao diện chính
main.js        # Logic fetch & render
styles.css     # Style tách riêng
```

## Chạy JSON Server

Cài đặt JSON Server (nếu chưa có):

```bash
npm install -g json-server
```

Chạy server:

```bash
json-server --watch db.json --port 3000
```

Các endpoint:

- `GET http://localhost:3000/posts`
- `GET http://localhost:3000/comments?postId=1`

## Mở giao diện

Mở trực tiếp file `test.html` trong trình duyệt (Chrome/Edge). Gõ từ khóa để lọc tiêu đề, click 1 hàng để xem bình luận.

## Mở rộng gợi ý

- Thêm form tạo mới post / comment.
- Thêm phân trang (?_page=1&_limit=10).
- Sử dụng module bundler (Vite/Webpack) nếu logic phức tạp.
- Viết test đơn giản bằng Playwright hoặc Jest (mock fetch).
- Chuẩn hóa ID tăng dần: `node normalize-db.js` (yêu cầu Node 18+ và chạy bằng `node --experimental-modules` nếu bản cũ).

## Chuẩn hóa ID (tuỳ chọn)

Nếu trong quá trình thao tác xuất hiện id dạng chuỗi (ví dụ "a4ab") và bạn muốn quay về dãy số liên tục:

```bash
node normalize-db.js
```

Script sẽ:
- Sắp xếp các bài viết: id số (tăng dần) trước, rồi tới id chuỗi giữ nguyên thứ tự.
- Gán lại id posts thành 1..n.
- Cập nhật lại `postId` trong comments, đồng thời đánh lại id cho comments từ 1..m.
- Lượt xem (`views`) ép về số.

Sau đó restart JSON Server để auto-increment tiếp tục từ id mới cuối cùng.

## Giấy phép

MIT