import {
  getDemoAvailability,
  getDemoCount,
  getDemoItems,
  getDemoMessage,
} from "../services/demo.js";
export async function getHello(req, res) {
  const message = await getDemoMessage();
  return res.status(200).json({
    message,
  });
}
export async function getCount(req, res) {
  const count = await getDemoCount();
  return res.status(200).json({
    count,
  });
}
export async function getAvailability(req, res) {
  const available = await getDemoAvailability();
  return res.status(200).json({
    available,
  });
}
export async function getOverview(req, res) {
  const [message, count, available, items] = await Promise.all([
    getDemoMessage(),
    getDemoCount(),
    getDemoAvailability(),
    getDemoItems(),
  ]);
  return res.status(200).json({
    message,
    count,
    available,
    items,
  });
}
