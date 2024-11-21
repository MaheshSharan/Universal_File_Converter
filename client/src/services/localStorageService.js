// Using IndexedDB for file storage
const DB_NAME = 'fileConverterDB';
const FILE_STORE = 'files';
const CONVERTED_STORE = 'convertedFiles';
const DB_VERSION = 2;

import { openDB } from 'idb';

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      if (oldVersion < 1) {
        db.createObjectStore(FILE_STORE, { keyPath: 'id' });
      }
      if (oldVersion < 2) {
        db.createObjectStore(CONVERTED_STORE, { keyPath: 'id' });
      }
    },
  });
};

const storeFile = async (id, file, buffer) => {
  const db = await initDB();
  const expiresAt = Date.now() + (2 * 60 * 60 * 1000); // 2 hours from now
  await db.put(FILE_STORE, {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    buffer,
    expiresAt
  });
};

const storeConvertedFile = async (id, fileName, fileType, buffer) => {
  const db = await initDB();
  const expiresAt = Date.now() + (2 * 60 * 60 * 1000); // 2 hours from now
  await db.put(CONVERTED_STORE, {
    id,
    name: fileName,
    type: fileType,
    buffer,
    expiresAt,
    convertedAt: Date.now()
  });
};

const getFile = async (id) => {
  const db = await initDB();
  const file = await db.get(FILE_STORE, id);
  if (file && file.expiresAt > Date.now()) {
    return file;
  }
  return null;
};

const getConvertedFile = async (id) => {
  const db = await initDB();
  const file = await db.get(CONVERTED_STORE, id);
  if (file && file.expiresAt > Date.now()) {
    return file;
  }
  return null;
};

const cleanupExpiredFiles = async () => {
  const db = await initDB();
  const now = Date.now();
  
  // Cleanup original files
  const files = await db.getAll(FILE_STORE);
  for (const file of files) {
    if (file.expiresAt <= now) {
      await db.delete(FILE_STORE, file.id);
    }
  }
  
  // Cleanup converted files
  const convertedFiles = await db.getAll(CONVERTED_STORE);
  for (const file of convertedFiles) {
    if (file.expiresAt <= now) {
      await db.delete(CONVERTED_STORE, file.id);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredFiles, 60 * 60 * 1000);

export const localStorageService = {
  storeFile,
  storeConvertedFile,
  getFile,
  getConvertedFile,
  cleanupExpiredFiles
};
