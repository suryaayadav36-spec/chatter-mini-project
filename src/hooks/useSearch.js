import { useState, useCallback, useMemo } from 'react';

export function useSearch(conversations, messages, decryptedMessages) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const lower = query.toLowerCase();

    const contactResults = conversations
      .filter(c => c.name.toLowerCase().includes(lower))
      .map(c => ({
        type: 'contact',
        conversation: c,
        highlight: c.name,
      }));

    const messageResults = [];
    for (const conv of conversations) {
      const convMessages = messages[conv.id] || [];
      const decrypted = decryptedMessages[conv.id] || {};

      for (const msg of convMessages) {
        const plain = decrypted[msg.id];
        if (plain && plain.toLowerCase().includes(lower)) {
          messageResults.push({
            type: 'message',
            conversation: conv,
            message: msg,
            plaintext: plain,
          });
        }
      }
    }

    return [...contactResults, ...messageResults];
  }, [query, conversations, messages, decryptedMessages]);

  const clearSearch = useCallback(() => setQuery(''), []);

  return { query, setQuery, results, clearSearch };
}
