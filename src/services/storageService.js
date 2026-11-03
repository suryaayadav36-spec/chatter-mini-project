// ─── CipherChat Storage Service (IndexedDB) ──────────────────────────────────

const DB_NAME = 'CipherChatDB';
const DB_VERSION = 1;

let db = null;

export async function initDB() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Conversations store
      if (!database.objectStoreNames.contains('conversations')) {
        const convStore = database.createObjectStore('conversations', { keyPath: 'id' });
        convStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Messages store
      if (!database.objectStoreNames.contains('messages')) {
        const msgStore = database.createObjectStore('messages', { keyPath: 'id' });
        msgStore.createIndex('conversationId', 'conversationId', { unique: false });
        msgStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Key info store
      if (!database.objectStoreNames.contains('keyInfo')) {
        database.createObjectStore('keyInfo', { keyPath: 'conversationId' });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}

function txPromise(store, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(store, mode);
    const s = tx.objectStore(store);
    const req = fn(s);
    if (req) {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } else {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }
  });
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function saveConversation(conversation) {
  await initDB();
  return txPromise('conversations', 'readwrite', (store) =>
    store.put({ ...conversation, updatedAt: Date.now() })
  );
}

export async function loadConversations() {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction('conversations', 'readonly');
    const store = tx.objectStore('conversations');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteConversation(id) {
  await initDB();
  return txPromise('conversations', 'readwrite', (store) => store.delete(id));
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function saveMessage(message) {
  await initDB();
  return txPromise('messages', 'readwrite', (store) => store.put(message));
}

export async function loadMessages(conversationId) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction('messages', 'readonly');
    const store = tx.objectStore('messages');
    const index = store.index('conversationId');
    const req = index.getAll(conversationId);
    req.onsuccess = () => {
      const msgs = (req.result || []).sort((a, b) => a.timestamp - b.timestamp);
      resolve(msgs);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function updateMessage(message) {
  await initDB();
  return txPromise('messages', 'readwrite', (store) => store.put(message));
}

export async function deleteMessage(messageId) {
  await initDB();
  return txPromise('messages', 'readwrite', (store) => store.delete(messageId));
}

export async function clearConversationMessages(conversationId) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    const index = store.index('conversationId');
    const req = index.openCursor(conversationId);
    req.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllMessages() {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction('messages', 'readonly');
    const store = tx.objectStore('messages');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ─── Key Info ─────────────────────────────────────────────────────────────────

export async function saveKeyInfo(conversationId, keyInfo) {
  await initDB();
  return txPromise('keyInfo', 'readwrite', (store) =>
    store.put({ conversationId, ...keyInfo })
  );
}

export async function loadKeyInfo(conversationId) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction('keyInfo', 'readonly');
    const store = tx.objectStore('keyInfo');
    const req = store.get(conversationId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
