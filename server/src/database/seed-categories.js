import { db } from './index.js'; // đường dẫn db của bạn
import { categories } from './schema.js'; // file schema của bạn

const CATEGORY_SEED = [
  { name: 'Laptop', slug: 'laptop', position: 1 },
  { name: 'Màn hình', slug: 'monitor', position: 2 },
  { name: 'Màn hình di động', slug: 'portable-monitor', position: 3 },
  { name: 'Bàn phím', slug: 'keyboard', position: 4 },
  { name: 'Chuột', slug: 'mouse', position: 5 },
  { name: 'Arm màn hình', slug: 'monitor-arm', position: 6 },
  { name: 'Cổng chuyển', slug: 'hub-adapter', position: 7 },
  { name: 'Sạc', slug: 'charger', position: 8 },
  { name: 'Balo', slug: 'backpack', position: 9 },
  { name: 'Loa', slug: 'speaker', position: 10 },
  { name: 'RAM', slug: 'ram', position: 11 },
  { name: 'Ổ cứng', slug: 'storage', position: 12 },
  { name: 'Ghế công thái học', slug: 'ergonomic-chair', position: 13 },
  { name: 'Bàn nâng hạ', slug: 'standing-desk', position: 14 },
  { name: 'Máy chơi game', slug: 'game-console', position: 15 },
]

async function seedCategories() {
  for (const cat of CATEGORY_SEED) {
    await db
      .insert(categories)
      .values({
        name: cat.name,
        slug: cat.slug,
        position: cat.position,
        isActive: true,
      })
      .onConflictDoNothing({ target: categories.slug }) // tránh trùng nếu chạy lại
  }
  console.log('✅ Seed categories xong')
}

seedCategories().catch(console.error)