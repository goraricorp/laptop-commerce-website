# Templates chưa được app sử dụng

Các file này được giữ nguyên nội dung và đường dẫn tương đối để tham khảo; không thuộc source chạy.
`manifest.json` ghi từng file và phương pháp đối chiếu import: entrypoint, mọi TanStack route,
client tests, static imports/exports/dynamic literal imports và TypeScript directory indexes.
Các barrel logo TypeScript được giữ lại trong src vì footer sử dụng.

Không nhập trực tiếp archive vào app. Khi tái sử dụng, chuyển module cần thiết trở lại src,
sửa dependency/validation và chạy lint/build/tests. `client/pkg` là legacy riêng, giữ nguyên.
