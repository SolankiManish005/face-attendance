import { appEnv } from "@/pkg/env/env";
import type { LabeledFaceDescriptors } from "@vladmandic/face-api";
import { seconds } from "itty-time";
import type { User } from "lucia";
import { type StorageValue, createStorage } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";
import redisDriver from "unstorage/drivers/redis";

function createCachedStorage<T extends StorageValue = StorageValue>(base: string, ttl: number) {
  return createStorage<T>({
    driver:
      appEnv.CACHE_DRIVER === "memory"
        ? memoryDriver()
        : redisDriver({
            url: appEnv.REDIS_URL!,
            ttl,
            base,
          }),
  });
}

export const faceApiDescriptorsMemoryDriver = memoryDriver();

export const storage = {
  authUsers: createCachedStorage<User>("auth-users", seconds("1 hour")),
  faceApiDescriptors: createStorage<LabeledFaceDescriptors>({
    driver: faceApiDescriptorsMemoryDriver,
  }),
};
