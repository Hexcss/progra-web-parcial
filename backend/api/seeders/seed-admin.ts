import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { UsersService } from 'src/modules/users/users.service';
import { AppModule } from 'src/app.module';
import { Role } from 'src/common/enums/role.enum';


async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const users = app.get(UsersService);

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@store.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  const displayName = process.env.SEED_ADMIN_DISPLAY_NAME ?? 'Admin';

  const exists = await users.findByEmail(email);
  if (exists) {
    // eslint-disable-next-line no-console
    console.log('Admin already exists:', email);
    await app.close();
    return;
  }

  const created = await users.createUser({ email, password, displayName }, Role.ADMIN);
  // eslint-disable-next-line no-console
  console.log('Admin created:', created.email);
  await app.close();
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
