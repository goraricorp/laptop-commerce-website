import { readQueries } from "../database/read-queries.js";
import { Router } from "express";
import {
  and,
  count,
  desc,
  eq,
  gte,
  lt,
  sql,
  or,
  ilike,
  getTableColumns,
} from "drizzle-orm";
import { z } from "zod";
import { db } from "../database/index.js";
import {
  inventoryBalances,
  inventoryLocations,
  orders,
  products,
  user,
  orderItems,
  orderAddresses,
  payments,
  shipments,
  orderStatusHistories,
} from "../database/schema.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/admin.js";
export const statisticsInput = z
  .object({
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    search: z.string().trim().max(255).default(""),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Ngày bắt đầu phải trước ngày kết thúc.",
  });
const router = Router();
router.use("/admin/statistics", requireAuth, requireAdmin);
router.get("/admin/statistics", async (req, res) => {
  const { from, to, page, limit, search } = statisticsInput.parse(req.query);
  const range = and(
    from
      ? gte(orders.createdAt, new Date(`${from}T00:00:00+07:00`))
      : undefined,
    to
      ? lt(
          orders.createdAt,
          new Date(new Date(`${to}T00:00:00+07:00`).getTime() + 86400000),
        )
      : undefined,
  );
  const historyFilter = and(
    range,
    search
      ? or(
          ilike(orders.code, `%${search}%`),
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`),
          ilike(orders.guestEmail, `%${search}%`),
        )
      : undefined,
  );
  const [summary, users, catalog, inventory, recentOrders, historyCount] =
    await db.transaction(
      (tx) =>
        readQueries([
          tx
            .select({
              totalOrders: count(),
              collected:
                sql`coalesce(sum((select coalesce(sum(p.amount),0) from payment p where p.order_id=${sql.raw('"sales_order"."id"')} and p.status in ('completed','refunded'))),0)`.as(
                  "collected",
                ),
              refunded:
                sql`coalesce(sum((select coalesce(sum(r.amount),0) from refund r where r.order_id=${sql.raw('"sales_order"."id"')} and r.state='succeeded')),0)`.as(
                  "refunded",
                ),
              pendingOrders: sql`count(*) filter (where ${orders.orderStatus} in ('pending', 'confirmed', 'processing'))`,
            })
            .from(orders)
            .where(range),
          tx
            .select({
              total: count(),
            })
            .from(user),
          tx
            .select({
              total: count(),
            })
            .from(products),
          tx
            .select({
              total: count(),
              lowStock: sql`count(*) filter (where ${inventoryBalances.quantityOnHand} - ${inventoryBalances.quantityReserved} <= ${inventoryBalances.reorderLevel})`,
            })
            .from(inventoryBalances)
            .innerJoin(
              inventoryLocations,
              eq(inventoryLocations.id, inventoryBalances.locationId),
            )
            .where(eq(inventoryLocations.isActive, true)),
          tx
            .select({
              ...getTableColumns(orders),
              customerName: user.name,
              customerEmail: sql`coalesce(${user.email}, ${orders.guestEmail})`,
            })
            .from(orders)
            .leftJoin(user, eq(user.id, orders.userId))
            .where(historyFilter)
            .orderBy(desc(orders.createdAt), desc(orders.id))
            .limit(limit)
            .offset((page - 1) * limit),
          tx
            .select({
              total: count(),
            })
            .from(orders)
            .leftJoin(user, eq(user.id, orders.userId))
            .where(historyFilter),
        ]),
      {
        isolationLevel: "repeatable read",
        accessMode: "read only",
      },
    );
  return (
    res.set("Cache-Control", "no-store"),
    res.status(200).json({
      revenue: Number(summary[0].collected) - Number(summary[0].refunded),
      collected: Number(summary[0].collected),
      refunded: Number(summary[0].refunded),
      totalOrders: summary[0].totalOrders,
      pendingOrders: Number(summary[0].pendingOrders),
      totalUsers: users[0].total,
      totalProducts: catalog[0].total,
      totalBalances: inventory[0].total,
      lowStock: Number(inventory[0].lowStock),
      recentOrders,
      historyTotal: historyCount[0].total,
      page,
      limit,
    })
  );
});
router.get("/admin/statistics/orders/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const result = await db.transaction(
    async (tx) => {
      const [order] = await tx
        .select({
          ...getTableColumns(orders),
          customerName: user.name,
          customerEmail: user.email,
        })
        .from(orders)
        .leftJoin(user, eq(user.id, orders.userId))
        .where(eq(orders.id, id));
      if (!order) return null;
      const [items, addresses, paymentRows, shipmentRows, history] =
        await readQueries([
          tx.select().from(orderItems).where(eq(orderItems.orderId, id)),
          tx
            .select()
            .from(orderAddresses)
            .where(eq(orderAddresses.orderId, id)),
          tx
            .select({
              provider: payments.provider,
              amount: payments.amount,
              status: payments.status,
              paidAt: payments.paidAt,
            })
            .from(payments)
            .where(eq(payments.orderId, id)),
          tx.select().from(shipments).where(eq(shipments.orderId, id)),
          tx
            .select()
            .from(orderStatusHistories)
            .where(eq(orderStatusHistories.orderId, id))
            .orderBy(desc(orderStatusHistories.createdAt)),
        ]);
      return {
        ...order,
        items,
        addresses,
        payments: paymentRows,
        shipments: shipmentRows,
        history,
      };
    },
    {
      isolationLevel: "repeatable read",
      accessMode: "read only",
    },
  );
  if (!result)
    return res.status(404).json({
      message: "Không tìm thấy đơn hàng.",
    });
  return (res.set("Cache-Control", "no-store"), res.status(200).json(result));
});
export default router;
