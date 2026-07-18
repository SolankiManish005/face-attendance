import { createWriteStream } from "node:fs";
import { join } from "node:path";

/**
 * @description
 * @param dest
 * @param file
 */
export const handleFileDestStorage = async (dest: string, file: File) => {
  const writeStream = createWriteStream(join(dest, file.name));
  const reader = file.stream().getReader();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    writeStream.write(value);
  }
  writeStream.end();

  return new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => {
      resolve();
    });
    writeStream.on("error", (err) => {
      reject(err);
    });
  });
};
