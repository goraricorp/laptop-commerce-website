import { z } from "zod";
import { catalogInputs } from "./catalog-admin.js";
const item = (schema) => schema.extend({ id: z.uuid() }).strict();
export const productEditorInput = z
  .object({
    requestId: z.uuid(),
    expectedVersion: z.number().int().nonnegative().nullable(),
    product: catalogInputs.products.omit({
      productType: true,
      expectedVersion: true,
    }),
    variants: z
      .array(
        item(catalogInputs["product-variants"].omit({ productId: true }))
          .extend({ attributeValueIds: z.array(z.uuid()).max(100).default([]) })
          .strict(),
      )
      .max(200),
    media: z
      .array(item(catalogInputs["product-media"].omit({ productId: true })))
      .max(200),
    content: z
      .array(
        item(
          catalogInputs["product-content-sections"].omit({ productId: true }),
        ),
      )
      .max(100),
    inventory: z
      .array(
        z
          .object({
            variantId: z.uuid(),
            locationId: z.uuid(),
            expectedOnHand: z.number().int().nonnegative(),
            expectedReserved: z.number().int().nonnegative(),
            quantityOnHand: z.number().int().nonnegative(),
            reorderLevel: z.number().int().nonnegative(),
            reason: z.string().trim().min(3).max(1000),
          })
          .strict(),
      )
      .max(200)
      .default([]),
  })
  .strict();
