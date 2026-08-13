import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import { del, get, put } from "@vercel/blob";

const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads");

export async function storeUpload(file, { userId, category }) {
  const extension = path.extname(file.originalname).toLowerCase();
  const filename = `${crypto.randomUUID()}${extension}`;

  if (process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN is required for production uploads");
    }
    const pathname = `users/${userId}/${category}/${filename}`;
    const blob = await put(pathname, file.buffer, {
      access: "private",
      contentType: file.mimetype,
      addRandomSuffix: false,
    });
    return `blob:${blob.pathname}`;
  }

  await fs.mkdir(uploadsDirectory, { recursive: true });
  await fs.writeFile(path.join(uploadsDirectory, filename), file.buffer, { flag: "wx" });
  return `/uploads/${filename}`;
}

export async function sendStoredFile(res, reference) {
  if (reference?.startsWith("blob:")) {
    const result = await get(reference.slice(5), { access: "private" });
    if (!result || result.statusCode !== 200) return false;

    res.set({
      "Content-Type": result.blob.contentType,
      "Content-Length": String(result.blob.size),
      "Cache-Control": "private, max-age=300",
      ETag: result.blob.etag,
    });
    Readable.fromWeb(result.stream).pipe(res);
    return true;
  }

  if (typeof reference !== "string") return false;
  const filename = path.basename(reference);
  if (!filename) return false;
  return new Promise((resolve, reject) => {
    res.sendFile(filename, { root: uploadsDirectory, dotfiles: "deny" }, (error) => {
      if (!error) return resolve(true);
      if (error.code === "ENOENT") return resolve(false);
      reject(error);
    });
  });
}

export async function deleteStoredFile(reference) {
  if (reference?.startsWith("blob:")) {
    await del(reference.slice(5));
    return;
  }
  if (typeof reference !== "string" || !reference.startsWith("/uploads/")) return;
  const filename = path.basename(reference);
  if (!filename) return;
  try {
    await fs.unlink(path.join(uploadsDirectory, filename));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
