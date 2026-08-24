import mongoose from 'mongoose';
import { afterAll, beforeEach } from 'vitest';

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key]!.deleteMany({});
    }
  }
});
