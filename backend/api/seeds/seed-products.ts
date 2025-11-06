// src/scripts/seed-products.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { AppModule } from 'src/app.module';
import { UsersService } from 'src/modules/users/users.service';
import { Role } from 'src/common/enums/role.enum';
import { Product } from 'src/modules/products/entities/product.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { Discount } from 'src/modules/discounts/entities/discount.entity';

type SeedProduct = Omit<Product, '_id' | 'createdBy' | 'categoryId'> & { createdBy?: Types.ObjectId; categoryId?: Types.ObjectId };

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const users = app.get(UsersService);
    const productModel = app.get<Model<Product>>(getModelToken(Product.name));
    const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
    const reviewModel = app.get<Model<Review>>(getModelToken(Review.name));
    const discountModel = app.get<Model<Discount>>(getModelToken(Discount.name));

    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@store.local';
    const admin = await users.findByEmail(adminEmail);
    if (!admin) {
      console.error(`Admin user with email "${adminEmail}" not found. Seed the admin first.`);
      process.exitCode = 1;
      return;
    }
    const adminId = new (require('mongoose').Types.ObjectId)(String(admin._id));

    const ensureUser = async (email: string, displayName: string) => {
      const existing = await users.findByEmail(email);
      if (existing) return existing;
      return users.createUser({ email, password: 'user123', displayName }, Role.USER);
    };

    const userAlice = await ensureUser('alice@store.local', 'Alice');
    const userBob = await ensureUser('bob@store.local', 'Bob');
    const userCarol = await ensureUser('carol@store.local', 'Carol');

    const categorySeeds: Array<{ name: string; icon: string }> = [
      { name: 'Laptops', icon: 'laptop' },
      { name: 'Monitors', icon: 'monitor' },
      { name: 'Peripherals', icon: 'keyboard' },
      { name: 'Audio', icon: 'headphones' },
      { name: 'Accessories', icon: 'cable' },
      { name: 'Storage', icon: 'hard-drive' },
      { name: 'Networking', icon: 'wifi' },
      { name: 'Power', icon: 'battery-charging' },
      { name: 'Wearables', icon: 'watch' },
    ];


    const categoryMap = new Map<string, Types.ObjectId>();
    for (const c of categorySeeds) {
      const found = await categoryModel.findOne({ name: c.name }).exec();
      if (found) {
        categoryMap.set(c.name, found._id as Types.ObjectId);
      } else {
        const created = await categoryModel.create({ name: c.name, icon: c.icon });
        categoryMap.set(c.name, created._id as Types.ObjectId);
      }
    }

    const products: SeedProduct[] = [
      {
        name: 'Ultrabook Pro 14',
        description: '14" ultrabook with Intel i7, 16GB RAM, 512GB NVMe SSD.',
        price: 1299.99,
        stock: 25,
        imageUrl: 'https://picsum.photos/seed/ultrabook-pro-14/640/480',
        category: 'Laptops',
        tags: ['intel', 'ultrabook', 'ssd', '16gb'],
      },
      {
        name: 'Gaming Laptop X15',
        description: '15.6" 240Hz, RTX 4070, Ryzen 9, 32GB RAM, 1TB NVMe.',
        price: 2199.0,
        stock: 12,
        imageUrl: 'https://picsum.photos/seed/gaming-x15/640/480',
        category: 'Laptops',
        tags: ['gaming', 'rtx4070', 'ryzen9', '240hz'],
      },
      {
        name: '4K IPS Monitor 27"',
        description: '27-inch 4K IPS display with HDR10 and USB-C.',
        price: 379.9,
        stock: 40,
        imageUrl: 'https://picsum.photos/seed/4k-ips-27/640/480',
        category: 'Monitors',
        tags: ['4k', 'ips', 'usb-c', 'hdr10'],
      },
      {
        name: 'Mechanical Keyboard TKL',
        description: 'Tenkeyless mechanical keyboard with hot-swap switches.',
        price: 119.99,
        stock: 80,
        imageUrl: 'https://picsum.photos/seed/mech-tkl/640/480',
        category: 'Peripherals',
        tags: ['keyboard', 'mechanical', 'hotswap', 'tkl'],
      },
      {
        name: 'Wireless Mouse Pro',
        description: 'Low-latency wireless mouse, 26K DPI, USB-C charging.',
        price: 89.0,
        stock: 150,
        imageUrl: 'https://picsum.photos/seed/wireless-mouse-pro/640/480',
        category: 'Peripherals',
        tags: ['mouse', 'wireless', 'usb-c', 'gaming'],
      },
      {
        name: 'Noise-Cancelling Headphones',
        description: 'Bluetooth over-ear ANC headphones, 40h battery.',
        price: 199.99,
        stock: 60,
        imageUrl: 'https://picsum.photos/seed/anc-headphones/640/480',
        category: 'Audio',
        tags: ['bluetooth', 'anc', 'over-ear'],
      },
      {
        name: 'USB-C Hub 9-in-1',
        description: '9-in-1 USB-C hub with HDMI 4K, PD 100W, SD/TF.',
        price: 59.9,
        stock: 200,
        imageUrl: 'https://picsum.photos/seed/typec-hub-9/640/480',
        category: 'Accessories',
        tags: ['usb-c', 'hub', 'hdmi', 'pd'],
      },
      {
        name: '1TB NVMe SSD Gen4',
        description: 'PCIe 4.0 NVMe SSD up to 7,000 MB/s read.',
        price: 139.99,
        stock: 100,
        imageUrl: 'https://picsum.photos/seed/nvme-gen4-1tb/640/480',
        category: 'Storage',
        tags: ['nvme', 'gen4', 'pcie4', 'ssd'],
      },
      {
        name: 'Wi-Fi 6E Router AXE7800',
        description: 'Tri-band Wi-Fi 6E router with 2.5G WAN/LAN.',
        price: 279.0,
        stock: 35,
        imageUrl: 'https://picsum.photos/seed/router-axe7800/640/480',
        category: 'Networking',
        tags: ['wifi6e', 'router', '2.5g'],
      },
      {
        name: '1080p60 Streaming Webcam',
        description: 'Full HD webcam with dual mics and auto exposure.',
        price: 69.99,
        stock: 120,
        imageUrl: 'https://picsum.photos/seed/webcam-1080p/640/480',
        category: 'Peripherals',
        tags: ['webcam', '1080p', 'streaming'],
      },
      {
        name: 'Podcast USB Microphone',
        description: 'Cardioid USB mic with gain knob and mute button.',
        price: 99.0,
        stock: 75,
        imageUrl: 'https://picsum.photos/seed/podcast-usb-mic/640/480',
        category: 'Audio',
        tags: ['microphone', 'usb', 'podcast'],
      },
      {
        name: '65W GaN Charger',
        description: 'Compact 65W GaN USB-C PD charger.',
        price: 39.9,
        stock: 180,
        imageUrl: 'https://picsum.photos/seed/gan65w/640/480',
        category: 'Power',
        tags: ['charger', 'gan', 'usb-c', 'pd'],
      },
      {
        name: '20,000mAh Power Bank',
        description: 'High capacity power bank, 30W PD, USB-A + USB-C.',
        price: 49.9,
        stock: 140,
        imageUrl: 'https://picsum.photos/seed/powerbank-20k/640/480',
        category: 'Power',
        tags: ['powerbank', 'pd', 'usb-c'],
      },
      {
        name: 'Smartwatch Active',
        description: 'AMOLED display, GPS, SpO2, 7-day battery.',
        price: 179.0,
        stock: 55,
        imageUrl: 'https://picsum.photos/seed/smartwatch-active/640/480',
        category: 'Wearables',
        tags: ['smartwatch', 'gps', 'spo2'],
      },
      {
        name: 'Bluetooth Speaker Mini',
        description: 'Portable speaker, IPX7, 12h battery.',
        price: 39.99,
        stock: 160,
        imageUrl: 'https://picsum.photos/seed/bt-speaker-mini/640/480',
        category: 'Audio',
        tags: ['speaker', 'bluetooth', 'portable'],
      },
      {
        name: 'NVMe SSD Enclosure USB 10Gbps',
        description: 'M.2 NVMe enclosure, USB 3.2 Gen2 10Gbps.',
        price: 29.9,
        stock: 110,
        imageUrl: 'https://picsum.photos/seed/nvme-enclosure/640/480',
        category: 'Storage',
        tags: ['nvme', 'enclosure', 'usb3.2'],
      },
    ];

    let createdCount = 0;
    const productDocs: Array<{ _id: Types.ObjectId; name: string; category: string }> = [];
    for (const p of products) {
      const exists = await productModel.findOne({ name: p.name }).lean().exec();
      const categoryId = categoryMap.get(p.category ?? '') || null;
      if (exists) {
        await productModel.updateOne(
          { _id: exists._id },
          { $set: { categoryId: categoryId ?? undefined, createdBy: exists['createdBy'] ?? adminId } }
        ).exec();
        productDocs.push({ _id: exists._id as Types.ObjectId, name: exists.name, category: exists['category'] ?? '' });
        console.log(`Skip (exists): ${p.name}`);
        continue;
      }
      const created = await productModel.create({ ...p, categoryId: categoryId ?? undefined, createdBy: adminId });
      productDocs.push({ _id: created._id as Types.ObjectId, name: created.name, category: created.category ?? '' });
      createdCount++;
      console.log(`Created: ${p.name}`);
    }
    console.log(`Done. Inserted ${createdCount} new products.`);

    const reviewSeeds: Array<{
      productName: string;
      userEmail: string;
      score: number;
      comment: string;
    }> = [
        { productName: 'Ultrabook Pro 14', userEmail: 'alice@store.local', score: 4.6, comment: 'Ligero y muy rápido para trabajo diario.' },
        { productName: 'Ultrabook Pro 14', userEmail: 'bob@store.local', score: 4.2, comment: 'Excelente batería, teclado cómodo.' },
        { productName: 'Gaming Laptop X15', userEmail: 'carol@store.local', score: 4.8, comment: 'FPS altísimos y buena refrigeración.' },
        { productName: '4K IPS Monitor 27"', userEmail: 'alice@store.local', score: 4.4, comment: 'Colores precisos y USB-C útil.' },
        { productName: 'Noise-Cancelling Headphones', userEmail: 'bob@store.local', score: 4.7, comment: 'ANC sólido y sonido cálido.' },
        { productName: 'Bluetooth Speaker Mini', userEmail: 'carol@store.local', score: 4.1, comment: 'Portátil y resistente al agua.' },
        { productName: '1TB NVMe SSD Gen4', userEmail: 'alice@store.local', score: 4.9, comment: 'Velocidades impresionantes.' },
      ];

    for (const r of reviewSeeds) {
      const product = productDocs.find(p => p.name === r.productName);
      if (!product) continue;
      const user = await users.findByEmail(r.userEmail);
      if (!user) continue;
      const exists = await reviewModel.findOne({
        productId: product._id,
        userId: new (require('mongoose').Types.ObjectId)(String(user._id)),
        comment: r.comment,
      }).lean().exec();
      if (exists) {
        console.log(`Skip review (exists): ${r.productName} by ${r.userEmail}`);
        continue;
      }
      await reviewModel.create({
        productId: product._id,
        userId: new (require('mongoose').Types.ObjectId)(String(user._id)),
        score: r.score,
        comment: r.comment,
      });
      console.log(`Created review: ${r.productName} by ${r.userEmail}`);
    }

    const now = new Date();
    const in3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in10 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    const discountSeeds: Array<{ productName: string; percent: number; start: Date; end: Date }> = [
      { productName: 'Gaming Laptop X15', percent: 12, start: now, end: in10 },
      { productName: 'Noise-Cancelling Headphones', percent: 20, start: now, end: in3 },
    ];

    for (const d of discountSeeds) {
      const product = productDocs.find(p => p.name === d.productName);
      if (!product) continue;
      const exists = await discountModel.findOne({
        productId: product._id,
        discountPercent: d.percent,
        startDate: { $lte: d.end },
        endDate: { $gte: d.start },
      }).lean().exec();
      if (exists) {
        console.log(`Skip discount (overlap exists): ${d.productName} - ${d.percent}%`);
        continue;
      }
      await discountModel.create({
        productId: product._id,
        discountPercent: d.percent,
        startDate: d.start,
        endDate: d.end,
      });
      console.log(`Created discount: ${d.productName} - ${d.percent}%`);
    }

    console.log('Seed completed.');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

run();
