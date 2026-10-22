import { randomBytes } from 'crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const CODE_PREFIX = 'GORTH';
const CODE_RANDOM_LENGTH = 8;
const ORDER_TYPE_SUFFIX: Record<string, string> = {
	dineIn: 'T',
	takeaway: 'A',
	delivery: 'D',
	grocery: 'G',
};

export type WarehouseDocumentType = 'issue' | 'receipt' | 'transfer';
export const WAREHOUSE_TYPE_PREFIX: Record<WarehouseDocumentType, string> = {
	issue: 'I',
	receipt: 'E',
	transfer: 'S',
};

export const formatCodeDate = (date: Date) => {
	const year = date.getFullYear().toString().slice(-2);
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}${month}${day}`;
};

export const generateOrderCode = (orderType: string) => {
	const suffix = ORDER_TYPE_SUFFIX[orderType];
	if (!suffix) {
		throw new Error(`Unsupported order type: ${orderType}`);
	}

	const random = Array.from(randomBytes(CODE_RANDOM_LENGTH), (byte) => ALPHABET[byte % ALPHABET.length]).join('');

	return `${CODE_PREFIX}${formatCodeDate(new Date())}${random}${suffix}`;
};

export const generateWarehouseCode = (warehouseType: WarehouseDocumentType) => {
  const suffix = WAREHOUSE_TYPE_PREFIX[warehouseType];
  if (!suffix) {
    throw new Error(`Unsupported warehouse type: ${warehouseType}`);
  }

  const random = Array.from(randomBytes(CODE_RANDOM_LENGTH), (byte) => ALPHABET[byte % ALPHABET.length]).join('');
  return `${CODE_PREFIX}${formatCodeDate(new Date())}${random}${suffix}`;
};

export const generateReceiptCode = () => generateWarehouseCode('receipt');

export const generateIssueCode = () => generateWarehouseCode('issue');

export const normalizeBalanceDate = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const getIssueTransactionType = (purpose: string) => {
  switch (purpose) {
    case 'waste':
      return 'waste';
    case 'adjustment':
      return 'adjustment';
    case 'transfer':
      return 'transfer';
    default:
      return 'usage';
  }
};

export const computeItemPricing = (quantity: number, unitPrice?: number | null, totalPrice?: number | null) => {
  const safeQuantity = Number(quantity ?? 0);
  const safeUnitPrice = Number(unitPrice ?? 0);
  const safeTotalPrice = totalPrice !== undefined && totalPrice !== null
    ? Number(totalPrice)
    : safeQuantity * safeUnitPrice;
  return { quantity: safeQuantity, unitPrice: safeUnitPrice, totalPrice: safeTotalPrice };
};
