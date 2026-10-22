import { z } from "zod";

export const uuidSchema = z.uuid("Invalid identifier");
export const moneySchema = z.coerce
  .number()
  .nonnegative("Amount cannot be negative");
export const quantitySchema = z.coerce
  .number()
  .int()
  .positive("Quantity must be at least 1");
export const decimalSchema = z.union([
  z.number(),
  z.string().regex(/^\d+(?:\.\d+)?$/),
]);
export const dateTimeSchema = z.iso.datetime({ offset: true });
export const nullableUuidSchema = uuidSchema.nullable();

export function resourceSchemas(
  entity,
  create,
  update = z.object(create.shape).partial(),
) {
  return {
    entity,
    create,
    update: update.refine((value) => Object.keys(value).length > 0, {
      message: "At least one field is required",
    }),
  };
}
