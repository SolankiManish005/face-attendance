import { ApiError } from "@/pkg/errors/http";
import type { HonoEnv } from "@/pkg/hono/env";
import type { HonoStorageFile } from "@hono-storage/core";
import { HonoDiskStorage } from "@hono-storage/node-disk";
import type { Context, MiddlewareHandler } from "hono";

/**
 * @description Middleware to store data in local storage
 */
export const localStorageMiddleware = ({
  dist,
  filenameFn,
  maxFileSize,
  maxFiles,
  field,
}: {
  dist: string;
  filenameFn?: (f: HonoStorageFile) => string;
  maxFileSize: number;
  maxFiles: number;
  field: string;
}): MiddlewareHandler<HonoEnv> => {
  const filename = (_c: Context, f: HonoStorageFile) => {
    return filenameFn
      ? filenameFn(f)
      : `${Date.now()}-${_c.get("requestId")}-${f.originalname}.${f.extension}`;
  };
  type HDSCustomFunction = NonNullable<
    ConstructorParameters<typeof HonoDiskStorage>[0]
  >["filename"];

  const distFn: HDSCustomFunction = async (_c, f) => {
    if (f.size > maxFileSize) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message: "File size too large",
      });
    }

    return dist;
  };

  const hds = new HonoDiskStorage({
    dest: distFn,
    filename,
  });

  if (maxFiles > 1) {
    return hds.multiple(field, { maxCount: maxFiles }) as any;
  }

  return hds.single(field) as any;
};
