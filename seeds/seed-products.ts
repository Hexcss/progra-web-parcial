// src/scripts/seed-products.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { Product, ProductDocument } from 'src/modules/products/entities/product.entity';
import { UsersService } from 'src/modules/users/users.service';
import { AppModule } from 'src/app.module';


type SeedProduct = Omit<Product, '_id' | 'createdBy'> & { createdBy?: Types.ObjectId };

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const users = app.get(UsersService);
    const productModel = app.get<Model<ProductDocument>>(getModelToken(Product.name));

    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@store.local';
    const admin = await users.findByEmail(adminEmail);
    if (!admin) {
      // eslint-disable-next-line no-console
      console.error(`Admin user with email "${adminEmail}" not found. Seed the admin first.`);
      process.exitCode = 1;
      return;
    }

    const adminId = new (require('mongoose').Types.ObjectId)(String(admin._id));

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
    for (const p of products) {
      const exists = await productModel.findOne({ name: p.name }).lean().exec();
      if (exists) {
        // eslint-disable-next-line no-console
        console.log(`Skip (exists): ${p.name}`);
        continue;
      }
      await productModel.create({ ...p, createdBy: adminId });
      createdCount++;
      // eslint-disable-next-line no-console
      console.log(`Created: ${p.name}`);
    }

    // eslint-disable-next-line no-console
    console.log(`Done. Inserted ${createdCount} new products.`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

run();
