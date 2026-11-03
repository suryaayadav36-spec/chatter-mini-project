import React, { useState } from 'react';
import './EmojiPicker.css';

const EMOJI_CATEGORIES = [
  {
    label: '😊', name: 'Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😔','😪','🤤','😴','😷','🤒','🤕','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️'],
  },
  {
    label: '👍', name: 'Gestures',
    emojis: ['👍','👎','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👋','🤚','🖐','✋','🖖','👏','🙌','🤝','🙏','✍️','💪','🦾','🦿','🦵','🦶','👃','👂','🦻','🫀','🫁','🧠','🦷','🦴','👀','👁','👅','👄','💋','🩸'],
  },
  {
    label: '❤️', name: 'Hearts',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚'],
  },
  {
    label: '🎉', name: 'Celebration',
    emojis: ['🎉','🎊','🎈','🎀','🎁','🎗','🎟','🎫','🏆','🥇','🥈','🥉','🏅','🎖','🎪','🤹','🎭','🎨','🖼','🎬','🎤','🎧','🎼','🎵','🎶','🎷','🎸','🎹','🎺','🎻','🥁','🪘','🎙','📻','🎮','🕹','🎲','🎯','🎳','🏹','🪃','🥏','🪁','🤿','🎣','🏋️','🤸','🤺','🏇','⛷️','🏂','🪂','🏌️'],
  },
  {
    label: '🐶', name: 'Animals',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃'],
  },
  {
    label: '🍕', name: 'Food',
    emojis: ['🍕','🍔','🌮','🌯','🥗','🍜','🍝','🍛','🍣','🍱','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍷','🍸','🍹','🍺','🥂','🥃','☕','🍵','🧃','🥤','🧋','🧊','🥄','🍴','🍽','🥢','🧂'],
  },
];

const REACTION_EMOJIS = ['❤️','👍','😂','😮','😢','👏','🔥','🎉'];

export function ReactionBar({ onReact, onClose }) {
  return (
    <div className="reaction-bar" onClick={e => e.stopPropagation()}>
      {REACTION_EMOJIS.map(emoji => (
        <button
          key={emoji}
          className="reaction-option"
          onClick={() => { onReact(emoji); onClose(); }}
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState('');

  const filteredEmojis = search
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => e.includes(search))
    : EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <div className="emoji-picker" onClick={e => e.stopPropagation()}>
      <div className="emoji-search-wrap">
        <input
          className="emoji-search"
          placeholder="Search emoji…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      {!search && (
        <div className="emoji-categories">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              className={`emoji-cat-btn ${activeCategory === i ? 'active' : ''}`}
              onClick={() => setActiveCategory(i)}
              title={cat.name}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}
      <div className="emoji-grid">
        {filteredEmojis.map((emoji, i) => (
          <button
            key={i}
            className="emoji-btn"
            onClick={() => { onSelect(emoji); }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
