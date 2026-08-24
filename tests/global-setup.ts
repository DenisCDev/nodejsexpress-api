import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer | undefined;

export async function setup(): Promise<void> {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
}

export async function teardown(): Promise<void> {
  await mongo?.stop();
}
