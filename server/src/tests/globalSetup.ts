import { MongoMemoryServer } from 'mongodb-memory-server';
import type { GlobalSetupContext } from 'vitest/node';

let server: MongoMemoryServer | undefined;

export default async function setup({ provide }: GlobalSetupContext) {
  server = await MongoMemoryServer.create();
  provide('mongoUri', server.getUri());
  return async () => {
    await server?.stop();
  };
}

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string;
  }
}
