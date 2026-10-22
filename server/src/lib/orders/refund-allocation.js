// Integer VND only. Largest remainders + stable IDs preserve the saved order total.
export function vnd(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0)
    throw Object.assign(
      new Error("Số tiền VND không hợp lệ; cần đối soát chứng từ."),
      { status: 409 },
    );
  return n;
}
export function allocateOrder(order, items) {
  const goods = vnd(vnd(order.grandTotal) - vnd(order.shippingTotal));
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));
  const gross = sorted.reduce((n, row) => n + BigInt(vnd(row.total)), 0n);
  if (
    !gross ||
    BigInt(goods) > gross ||
    sorted.some(
      (r) =>
        !Number.isInteger(r.quantity) || r.quantity < 1 || r.quantity > 10000,
    )
  )
    throw Object.assign(
      new Error("Chứng từ cũ không đủ dữ liệu phân bổ; cần đối soát."),
      { status: 409 },
    );
  const rows = sorted.map((row) => {
    const part = BigInt(goods) * BigInt(vnd(row.total));
    return {
      orderItemId: row.id,
      orderId: order.id,
      quantity: row.quantity,
      gross: vnd(row.total),
      net: Number(part / gross),
      remainder: part % gross,
    };
  });
  let extra = goods - rows.reduce((n, r) => n + r.net, 0);
  for (const row of [...rows].sort((a, b) =>
    a.remainder === b.remainder
      ? a.orderItemId.localeCompare(b.orderItemId)
      : a.remainder > b.remainder
        ? -1
        : 1,
  ))
    if (extra-- > 0) row.net++;
  return rows.map((row) => {
    delete row.remainder;
    return { ...row, discount: row.gross - row.net };
  });
}
export function unitAmount(allocation, units) {
  const base = Math.floor(allocation.net / allocation.quantity),
    extra = allocation.net % allocation.quantity;
  return units.reduce((sum, index) => sum + base + (index < extra ? 1 : 0), 0);
}
export function settlementRefund(
  totalVnd,
  captured,
  alreadyVnd,
  alreadyProvider,
  amount,
  currency,
) {
  if (currency === "VND") return String(amount);
  // Cumulative rounding conserves the original capture down to its last cent.
  const cents = Math.round(Number(captured) * 100),
    used = Math.round(Number(alreadyProvider) * 100);
  const target = Number(
    (BigInt(cents) * BigInt(alreadyVnd + amount) +
      BigInt(Math.floor(totalVnd / 2))) /
      BigInt(totalVnd),
  );
  const refund = target - used;
  if (refund < 1 || refund > cents - used)
    throw Object.assign(
      new Error(
        "Khoản hoàn nhỏ hơn đơn vị tiền cổng thanh toán hoặc vượt số đã thu.",
      ),
      { status: 409 },
    );
  return (refund / 100).toFixed(2);
}
