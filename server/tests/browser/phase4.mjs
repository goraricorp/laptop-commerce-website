import assert from "node:assert/strict";
import { chromium } from "playwright";
const web = "http://127.0.0.1:5199",
  api = "http://127.0.0.1:5172",
  uid = "00000000-0000-4000-8000-000000000041",
  oid = "00000000-0000-4000-8000-000000000042",
  iid = "00000000-0000-4000-8000-000000000043",
  rid = "00000000-0000-4000-8000-000000000044",
  riid = "00000000-0000-4000-8000-000000000045",
  wid = "00000000-0000-4000-8000-000000000046",
  fid = "00000000-0000-4000-8000-000000000047",
  now = new Date().toISOString();
let role = "master",
  shipment = null,
  fulfillment = {},
  returns = [],
  refunds = [],
  commands = [],
  failReturn = true;
const item = {
  id: iid,
  productName: "Laptop Phase 4",
  variantName: "SKU acceptance",
  sku: "PHASE4",
  quantity: 2,
  unitPrice: "100000",
  total: "200000",
  returnableQuantity: 2,
};
const order = {
  id: oid,
  userId: uid,
  code: "PHASE4-BROWSER",
  subtotal: "200000",
  discountTotal: "1",
  shippingTotal: "30000",
  grandTotal: "229999",
  orderStatus: "confirmed",
  paymentStatus: "unpaid",
  fulfillmentStatus: "unfulfilled",
  createdAt: now,
  updatedAt: now,
  itemCount: 2,
  items: [item],
  address: {
    recipientName: "Browser buyer",
    phone: "0901234567",
    addressLine: "Fixture",
    district: "Fixture",
    province: "Fixture",
  },
  payment: {
    provider: "cod",
    state: "created",
    currency: "VND",
    amount: "229999",
  },
  addresses: [],
  payments: [],
  history: [],
  shipments: [],
};
const browser = await chromium.launch({ headless: true }),
  page = await browser.newPage(),
  errors = [];
page.setDefaultTimeout(15000);
page.on("pageerror", (e) => errors.push(e.message));
await page.route(`${api}/**`, async (route) => {
  const req = route.request(),
    path = new URL(req.url()).pathname,
    method = req.method();
  const headers = { "access-control-allow-origin": web, "access-control-allow-credentials": "true", "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS", "access-control-allow-headers": "Accept,Content-Type,Authorization" };
  if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
  let data = { items: [], total: 0, page: 1, limit: 25 },
    status = 200;
  if (path === "/auth/get-session")
    data = {
      user: {
        id: uid,
        name: "Phase 4 buyer",
        email: "phase4@example.test",
        role,
        emailVerified: true,
      },
      session: {
        id: "fixture",
        userId: uid,
        token: "fixture",
        createdAt: now,
        updatedAt: now,
        expiresAt: "2030-01-01T00:00:00Z",
      },
    };
  if (
    path === "/me/cart" ||
    path === "/me/cart/merge" ||
    path === "/me/addresses" ||
    path === "/me/vouchers"
  )
    data = [];
  if (path === "/admin/orders")
    data = {
      items: [order],
      total: 1,
      limit: 25,
      asOf: now,
      nextCursor: null,
      hasMore: false,
    };
  if (path === `/admin/statistics/orders/${oid}`)
    data = { ...order, shipments: shipment ? [shipment] : [] };
  if (path === `/me/orders/${oid}`) data = order;
  if (path === "/inventory/location")
    data = {
      items: [
        { id: wid, name: "Kho kiểm hàng", code: "RETURN", isActive: true },
      ],
      total: 1,
      page: 1,
      limit: 100,
    };
  if (path === "/admin/fulfillment/operations")
    data = {
      backlog: [
        {
          kind: "refund",
          state: "pending",
          count: refunds.filter((r) => r.state === "pending").length,
        },
      ],
      refunds: [],
      jobs: [],
    };
  if (
    path === `/admin/fulfillment/orders/${oid}` ||
    path === `/me/orders/${oid}/fulfillment`
  )
    data = {
      orderId: oid,
      fulfillment,
      shipments: shipment ? [shipment] : [],
      events: [],
      items: [{ ...item, returnableQuantity: returns.length ? 1 : 2 }],
      returns,
      refunds,
      canRequestReturn: order.orderStatus === "completed",
    };
  if (
    (method === "POST" && path.includes("/fulfillment/")) ||
    (method === "POST" && path === `/me/orders/${oid}/returns`)
  ) {
    const body = req.postDataJSON();
    commands.push({ path, body });
    assert.match(body.commandId, /^[a-f0-9-]{36}$/);
    assert.ok(body.note.length >= 3);
    if (path.endsWith("/shipment")) {
      if (body.action === "prepare") {
        shipment = {
          id: rid,
          carrier: body.carrier,
          trackingNumber: body.trackingNumber,
          status: "processing",
        };
        order.orderStatus = "processing";
      }
      if (body.action === "handover") {
        shipment.status = "shipped";
        fulfillment.stockIssuedAt = now;
        order.fulfillmentStatus = "shipped";
      }
      if (body.action === "delivered") {
        assert.equal(body.codProof, "COD receipt fixture");
        shipment.status = "delivered";
        fulfillment.deliveredAt = now;
        order.orderStatus = "completed";
        order.paymentStatus = "paid";
        order.payment.state = "paid";
      }
      data = shipment;
    } else if (path.endsWith("/returns") && body.items) {
      if (failReturn) {
        failReturn = false;
        status = 502;
        data = { message: "Thử lại cùng thao tác khi mạng lỗi" };
      } else {
        assert.equal(body.items[0].quantity, 1);
        returns = [
          {
            id: rid,
            status: "requested",
            reason: body.note,
            events: [],
            items: [
              {
                id: riid,
                orderItemId: iid,
                quantity: 1,
                acceptedQuantity: null,
                restockQuantity: null,
                refundAmount: 0,
              },
            ],
          },
        ];
        data = returns[0];
      }
    } else if (path === `/admin/fulfillment/returns/${rid}`) {
      const next = {
        approve: "approved",
        receive: "received",
        inspect: "inspected",
        complete: "completed",
      }[body.action];
      returns[0].status = next;
      if (body.action === "inspect") {
        assert.equal(body.items[0].restockQuantity, 1);
        assert.equal(body.items[0].locationId, wid);
        Object.assign(returns[0].items[0], {
          acceptedQuantity: 1,
          restockQuantity: 1,
          refundAmount: 100000,
        });
      }
      data = returns[0];
    } else if (path.endsWith("/refunds")) {
      assert.equal(body.purpose, "return");
      assert.equal(body.shippingAmount, 0);
      refunds = [
        {
          id: fid,
          returnId: rid,
          amount: 100000,
          shippingAmount: 0,
          provider: "cod",
          state: "pending",
          reference: "browser-refund",
        },
      ];
      data = refunds[0];
    } else if (path.endsWith("/confirm")) {
      assert.equal(body.proof, "Refund receipt fixture");
      refunds[0].state = "succeeded";
      order.paymentStatus = "partially_refunded";
      data = refunds[0];
    }
  }
  return route.fulfill({
    status,
    headers,
    contentType: "application/json",
    body: JSON.stringify(data),
  });
});
async function form(title, fill = {}) {
  const target = page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  await target.waitFor();
  const noteIds = await page.locator('input[name="note"]').evaluateAll(inputs => inputs.map(input => input.id));
  assert.equal(new Set(noteIds).size, noteIds.length, 'Repeated command forms need unique label/control IDs');
  for (const [name, value] of Object.entries(fill))
    await target.getByLabel(name, { exact: true }).fill(value);
  await target
    .getByLabel("Lý do / ghi nhận", { exact: true })
    .fill("Browser acceptance proof");
  await target.getByRole("button", { name: title, exact: true }).click();
}
async function adminDetail() {
  await page.goto(`${web}/admin/orders`);
  await page.getByRole("button", { name: "Xem đơn", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Vận chuyển · trả hàng · hoàn tiền",
      exact: true,
    })
    .click();
}
try {
  await adminDetail();
  await form("Chuẩn bị giao", {
    "Đơn vị vận chuyển": "Fixture carrier",
    "Mã vận đơn": "TRACK-PHASE4",
  });
  await form("Bàn giao vận chuyển");
  await form("Xác nhận giao thành công", {
    "Chứng từ thu COD (bắt buộc với COD)": "COD receipt fixture",
  });
  await page.getByText(/Giao thành công:/).waitFor();
  assert.equal(shipment.status, "delivered");
  console.log(
    "PASS admin shipment prepare/handover/delivery and COD collection proof",
  );
  role = "user";
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${web}/purchase?orderId=${oid}`);
  await page
    .getByRole("button", {
      name: "Theo dõi giao hàng / yêu cầu trả hàng",
      exact: true,
    })
    .click();
  const target = page.locator("form").filter({
    has: page.getByRole("heading", {
      name: "Gửi yêu cầu trả hàng",
      exact: true,
    }),
  });
  await target.getByLabel("Số lượng trả PHASE4", { exact: true }).fill("1");
  await target
    .getByLabel("Lý do / ghi nhận", { exact: true })
    .fill("Browser acceptance proof");
  await target
    .getByRole("button", { name: "Gửi yêu cầu trả hàng", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Thử lại cùng thao tác khi mạng lỗi" })
    .waitFor();
  await target
    .getByRole("button", { name: "Gửi yêu cầu trả hàng", exact: true })
    .click();
  await page.getByText("Trả hàng: Chờ duyệt", { exact: true }).waitFor();
  const attempts = commands.filter(
    (c) => c.path === `/me/orders/${oid}/returns`,
  );
  assert.equal(attempts[0].body.commandId, attempts[1].body.commandId);
  console.log(
    "PASS mobile customer partial return and stable command ID after network failure",
  );
  role = "master";
  await page.setViewportSize({ width: 1280, height: 900 });
  await adminDetail();
  await form("Duyệt trả hàng");
  await form("Nhận hàng trả");
  const inspect = page.locator("form").filter({
    has: page.getByRole("heading", { name: "Lưu kiểm hàng", exact: true }),
  });
  await inspect
    .getByLabel("Số lượng nhập lại tồn bán được", { exact: true })
    .fill("1");
  await inspect.getByLabel("Kho nhận", { exact: true }).selectOption(wid);
  await inspect
    .getByLabel("Biên bản kiểm tra", { exact: true })
    .fill("Resellable product verified");
  await form("Lưu kiểm hàng");
  await form("Tạo yêu cầu hoàn tiền hàng trả");
  await form("Xác nhận đã hoàn COD", {
    "Chứng từ chuyển trả tiền": "Refund receipt fixture",
  });
  await page.getByText(/Hoàn 100.*Thành công/).waitFor();
  await form("Đóng hồ sơ trả hàng");
  await page.getByText("Trả hàng: Hoàn tất", { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS admin approval/receipt/inspection/warehouse/restock/refund proof/return completion; no runtime errors",
  );
} finally {
  await browser.close();
}
