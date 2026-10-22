# Kế hoạch triển khai

Kế hoạch chính và tiến độ được duy trì tại [implementation.md](implementation.md).

Đợt mới nhất: **9 migration Phase 1–6 đã áp dụng cloud ngày 22/10/2026 theo phê duyệt của người dùng**. Schema khớp snapshot cuối; 17 API checks qua Vite/Express kết nối cloud READ ONLY và Better Auth adapter/session read PASS. Code/nghiệm thu local DONE; rollout vẫn PARTIAL do deployment Vercel/Google/SMTP/storage policy/scheduler/provider sandbox thật chưa nghiệm thu. Backend Express 5 build bằng Vite; client/server chạy riêng, không Turbo.

- [Cloud migration, schema/API và giới hạn kiểm chứng ngày 22/10/2026](CLOUD-MIGRATION-2026-10-22.md).

- [Phase 6: Express/Vite, middleware, tests, CI và Vercel/migration runbook](PHASE-6-EXPRESS-VERCEL.md).
- [Phase 5: admin/product editor, tài khoản, 2FA, support, API/schema/tests và runbook](PHASE-5-ADMIN-ACCOUNTS-SUPPORT.md).
- [Phase 4: API, schema, tests, giới hạn và migration/scheduler runbook](PHASE-4-FULFILLMENT-RETURNS-JOBS.md).
- [Phase 1–2: catalog/inventory](PHASE-1-2-CATALOG-INVENTORY.md).
- [Phase 3: orders/Google](PHASE-3-ORDERS-GOOGLE.md).
