// ─── CipherChat Simulation Service ───────────────────────────────────────────
// Generates contextual, natural-feeling simulated responses

const responsePool = {
  greetings: [
    "Hey! Great to connect with you here on CipherChat! 👋",
    "Hello! Nice to chat with you in a secure environment.",
    "Hi there! How's it going? Glad this is end-to-end encrypted 😄",
    "Hey! What's up? Always good to know our chats are private.",
    "Hello! I love that every message here is encrypted before it even leaves your device.",
  ],
  privacy: [
    "I think privacy is a fundamental right, not a luxury. Don't you agree?",
    "It's fascinating how the Web Crypto API makes browser-native encryption possible now.",
    "ECDH key exchange is elegantly simple — two parties, no shared secret needed beforehand.",
    "AES-GCM is great because it provides both confidentiality and authentication in one pass.",
    "I was reading about HKDF earlier. Deriving keys from shared secrets is such clever design.",
    "Signal Protocol inspired so many modern secure messaging apps. The double ratchet algorithm is genius.",
    "It's wild to think that strong encryption used to be classified as a weapon by some governments.",
    "Zero-knowledge architectures are the future. Client-side encryption is just the beginning.",
    "Perfect forward secrecy is what I really appreciate about modern E2E encrypted apps.",
    "Privacy by design means encryption should be the default, not an opt-in feature.",
  ],
  tech: [
    "Have you been working on anything interesting lately?",
    "What do you think about the future of decentralized communication?",
    "IndexedDB is surprisingly powerful for client-side storage, isn't it?",
    "I love how much you can do in the browser without any server nowadays.",
    "React hooks changed everything about how we write UI logic. useReducer is my favorite.",
    "Vite's hot module replacement is so fast compared to older bundlers.",
    "CSS custom properties make theming so clean. No preprocessor needed.",
    "Web workers would be perfect for running crypto operations off the main thread.",
    "Service workers + IndexedDB = offline-first apps that feel native.",
    "The browser is basically an OS at this point. WebAssembly made that even more true.",
  ],
  acknowledgments: [
    "That's a really good point! 💡",
    "I couldn't agree more.",
    "Interesting perspective. I hadn't thought of it that way.",
    "Totally makes sense! Thanks for sharing.",
    "Ha, true! 😄",
    "Right? Exactly what I was thinking.",
    "Well said. 👏",
    "That's fair, honestly.",
    "Hmm, you might be onto something there.",
    "Noted! I'll think about that.",
  ],
  questions: [
    "What are you working on these days?",
    "Have you tried any other secure messaging apps?",
    "How did you find out about CipherChat?",
    "Do you care a lot about digital privacy?",
    "What's your take on browser-based cryptography?",
    "Are you a developer? This app seems like something a tech person would appreciate.",
    "What kind of projects are you into?",
    "Have you read anything interesting about cryptography lately?",
  ],
  philosophy: [
    "\"Privacy is not something that I'm merely entitled to, it's an absolute prerequisite.\" — Marlon Brando",
    "In the age of surveillance capitalism, choosing encrypted communication is a small but meaningful act.",
    "The ability to have a private conversation might be the most human thing there is.",
    "Encryption is the digital equivalent of a sealed envelope. Everyone deserves that.",
    "It's strange that we accept end-to-end encryption as 'advanced' — it should just be the default.",
    "Data is the new oil, but privacy is the new clean water. Both matter enormously.",
  ],
  short: [
    "😊",
    "👍",
    "That's cool!",
    "Nice one!",
    "Makes sense.",
    "Fair enough.",
    "Agreed!",
    "Absolutely.",
    "lol yeah",
    "For sure!",
    "💯",
    "Haha, right!",
    "Oh interesting!",
    "Word.",
    "Yep!",
  ],
  encryption: [
    "And just so you know, everything we're saying here is encrypted with AES-GCM 256-bit. Pretty neat!",
    "Each message gets a unique IV (initialization vector), so even identical messages look different when encrypted.",
    "Our key exchange used ECDH with the P-256 elliptic curve. No pre-shared secret required!",
    "The encryption key was derived with HKDF-SHA-256 from our shared secret. Industry-standard stuff.",
    "All the ciphertext is stored in IndexedDB — no plaintext ever hits storage.",
  ],
};

const lastUsedIndices = {};

function pickRandom(arr, category) {
  if (!lastUsedIndices[category]) lastUsedIndices[category] = new Set();
  const used = lastUsedIndices[category];

  let available = arr.map((_, i) => i).filter(i => !used.has(i));
  if (available.length === 0) {
    used.clear();
    available = arr.map((_, i) => i);
  }

  const idx = available[Math.floor(Math.random() * available.length)];
  used.add(idx);
  return arr[idx];
}

function classifyMessage(text) {
  const lower = text.toLowerCase();

  if (/^(hi|hey|hello|sup|yo|greetings|howdy|what'?s up|hiya)\b/.test(lower)) return 'greetings';
  if (/encrypt|crypto|key|cipher|aes|ecdh|hkdf|rsa|secure|privacy|private|signal|e2e/.test(lower)) {
    return Math.random() > 0.4 ? 'privacy' : 'encryption';
  }
  if (/code|react|vite|javascript|js|ts|api|database|web|app|dev|software|program/.test(lower)) return 'tech';
  if (/think|believe|feel|opinion|thought|wonder|philosophy|meaning/.test(lower)) return 'philosophy';
  if (/\?$/.test(lower.trim())) return 'questions';
  if (lower.length < 20) return 'short';
  if (/thank|thanks|cool|great|nice|awesome|amazing|love|good|perfect/.test(lower)) return 'acknowledgments';

  // Default: pick from a mix
  const categories = ['acknowledgments', 'tech', 'privacy', 'short', 'questions'];
  return categories[Math.floor(Math.random() * categories.length)];
}

export async function generateResponse(userMessage, contactName) {
  const category = classifyMessage(userMessage);
  const pool = responsePool[category] || responsePool.acknowledgments;

  let response = pickRandom(pool, category);

  // Occasionally append a random follow-up from a different category
  if (Math.random() > 0.65 && category !== 'short') {
    const followUpCategories = ['questions', 'short', 'encryption'];
    const followUpCategory = followUpCategories[Math.floor(Math.random() * followUpCategories.length)];
    if (followUpCategory !== category) {
      const followUp = pickRandom(responsePool[followUpCategory], followUpCategory + '_followup');
      response += ' ' + followUp;
    }
  }

  return response;
}

export function getTypingDelay() {
  return 1500 + Math.random() * 2500; // 1.5s – 4s
}

export function getDeliveredDelay() {
  return 400 + Math.random() * 300; // 0.4s – 0.7s
}

export function getReadDelay() {
  return 1200 + Math.random() * 800; // 1.2s – 2s
}

// Initial seed messages per contact for a realistic conversation history
export const seedMessages = {
  alice: [
    { text: "Hey! Finally set up CipherChat. This encryption thing is pretty cool 🔐", from: 'peer' },
    { text: "I know right? Every message is encrypted with AES-GCM before it even leaves your device.", from: 'me' },
    { text: "So our chat history in IndexedDB is all ciphertext? No one could just read it?", from: 'peer' },
    { text: "Exactly. Each message gets a unique IV too, so identical messages look completely different when encrypted.", from: 'me' },
    { text: "That's genuinely impressive for something built entirely in the browser. No server at all!", from: 'peer' },
  ],
  bob: [
    { text: "Yo, testing this out. Messages actually encrypted?", from: 'peer' },
    { text: "100%. ECDH key exchange, HKDF derivation, AES-GCM encryption. All browser-native.", from: 'me' },
    { text: "Sick. So not even the app developer can read these?", from: 'peer' },
    { text: "Right — there's no server. Everything is local. Only you and your browser can decrypt.", from: 'me' },
  ],
  sarah: [
    { text: "Hi! I love that this uses real cryptography, not just fake security theater 😄", from: 'peer' },
    { text: "Same! Browser-native Web Crypto API is powerful. No external libraries needed.", from: 'me' },
    { text: "I've been reading about the Signal Protocol lately. CipherChat kind of reminds me of its design philosophy.", from: 'peer' },
  ],
  david: [
    { text: "Interesting project. ECDH P-256 for key exchange?", from: 'peer' },
    { text: "Yes! P-256 with HKDF-SHA256 for key derivation, then AES-GCM-256 for message encryption.", from: 'me' },
    { text: "Clean. Does each message use a fresh IV?", from: 'peer' },
    { text: "Absolutely — 96-bit random IV per message, authenticated encryption with GCM.", from: 'me' },
    { text: "Solid implementation. Happy to test it out 👍", from: 'peer' },
  ],
};
