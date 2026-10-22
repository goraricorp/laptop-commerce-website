# Upload ảnh

Cấu hình server: AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, VITE_STORAGE_BUCKET; credentials chỉ ở server. VITE_PUBLIC_SERVER_URL phải là origin backend trực tiếp (không thêm `/api`); VITE_PUBLIC_CLIENT_URL phải khớp origin frontend. VITE_STORAGE_MAX_FILE_SIZE giới hạn bytes. VITE_STORAGE_ALLOWED_TYPES có thể giới hạn image/png,image/jpeg,image/webp.

`POST /storage/upload`: session + multipart một trường file; PNG, JPG/JPEG, WEBP; kiểm tra MIME/extension/chữ ký. Trả name, originalName, path và URL ổn định. URL ảnh trả về dùng origin backend trực tiếp, được lưu vào input hidden; entity chỉ cập nhật sau Save.

`DELETE /storage/object` nhận JSON `{key}`; chỉ chủ upload hoặc admin/master được xóa. Object đang được entity tham chiếu sẽ được giữ. GET cùng path với query key trả URL ký có hạn để xem ảnh công khai.

Ảnh tạm có manifest DB, bị xóa khi hủy/rời form hoặc Save lỗi. Thay/xóa ảnh đã lưu dọn object cũ nếu không còn reference. Lỗi storage giữ hàng đợi để retry. Pending hơn 24h được dọn bởi timer 15 phút hoặc `node scripts/cleanup-uploads.mjs`; cần scheduler ngoài trên serverless. Xem [LEGACY-PARITY.md](./docs/LEGACY-PARITY.md).

Migration mới đã được áp dụng lên database Neon sau khi được phê duyệt. Đã xác nhận upload/đọc/xóa ảnh tạm trên bucket public thật, giữ ảnh được bản ghi tham chiếu và tự dọn object sau khi xóa bản ghi. Test trình duyệt dùng API giả lập để kiểm tra UI.
