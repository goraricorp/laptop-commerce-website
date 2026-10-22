const demoDatabase = [
  { id: 1, name: "Laptop", available: true },
  { id: 2, name: "Keyboard", available: true },
  { id: 3, name: "Monitor", available: false },
];

export async function getDemoMessage() {
  await Promise.resolve();
  return "Hello Express from Japtor";
}

export async function getDemoCount() {
  await Promise.resolve();
  return demoDatabase.length;
}

export async function getDemoAvailability() {
  await Promise.resolve();
  return demoDatabase.some((item) => item.available);
}

export async function getDemoItems() {
  await Promise.resolve();
  return demoDatabase.map((item) => ({ ...item }));
}
