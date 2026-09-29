import { RawRow } from '../types';

/**
 * Generates a realistic 120-day historical retail sales dataset.
 * Includes natural seasonality, weekly cycles, and upward momentum.
 * Has formatted currency strings and thousands separators to demonstrate robust data cleaning.
 */
function createSampleRows(): RawRow[] {
  const categories = [
    { name: 'Electronics', products: ['Smart Speaker Pro', 'Wireless ANC Headphones', 'Mechanical Keyboard', '4K USB-C Monitor'] },
    { name: 'Home & Living', products: ['Ergonomic Desk Chair', 'Bamboo Standing Desk', 'Ceramic Pour-Over Set', 'Aroma Diffuser'] },
    { name: 'Apparel', products: ['Merino Wool Sweater', 'Waterproof Trail Jacket', 'Organic Cotton Tee', 'Minimalist Backpack'] },
    { name: 'Office Supplies', products: ['Full Grain Leather Notebook', 'Matte Aluminum Pen', 'Desk Cable Organizer', 'Monitor Light Bar'] },
  ];

  const rows: RawRow[] = [];
  const startDate = new Date(2026, 0, 1); // Jan 1, 2026

  for (let day = 0; day < 120; day++) {
    const currentDate = new Date(startDate.getTime() + day * 86400000);
    const dateStr = currentDate.toISOString().slice(0, 10);

    // Pick 1 to 2 transactions per day to reflect rich variety
    const txCount = day % 7 === 5 || day % 7 === 6 ? 2 : 1; // weekends slightly higher

    for (let t = 0; t < txCount; t++) {
      const catObj = categories[(day + t) % categories.length];
      const prodName = catObj.products[(day * 3 + t) % catObj.products.length];
      
      // Base trend + weekly oscillation + random variance
      const baseTrend = 450 + day * 4.2;
      const dayOfWeek = currentDate.getDay(); // 0 is Sun, 6 is Sat
      const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 140 : 0;
      const midWeekLift = (dayOfWeek === 3 || dayOfWeek === 4) ? 50 : 0;
      const noise = ((day * 17 + t * 31) % 100) - 50;
      
      const rawPrice = Math.round(baseTrend + weekendBoost + midWeekLift + noise);
      const quantity = 1 + ((day + t) % 4);

      // Demonstrate realistic data formatting: some with $, some with commas, some plain
      let formattedRevenue: string | number;
      if (day % 5 === 0) {
        formattedRevenue = `$${rawPrice.toLocaleString('en-US')}.00`;
      } else if (day % 7 === 0) {
        formattedRevenue = `${rawPrice.toLocaleString('en-US')}.50`;
      } else {
        formattedRevenue = rawPrice;
      }

      rows.push({
        Date: dateStr,
        Revenue: formattedRevenue,
        Category: catObj.name,
        Product: prodName,
        Quantity: quantity,
      });
    }
  }

  return rows;
}

export const SAMPLE_DATA: RawRow[] = createSampleRows();
