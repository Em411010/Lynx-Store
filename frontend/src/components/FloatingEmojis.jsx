import './FloatingEmojis.css';

const FloatingEmojis = () => {
  const emojis = [
    '🍫', '🥤', '🧴', '🏠', '🍕', '🧼', '🧻', '🥛', '🧽', '🍪', '📦', '🛁',
    '🍫', '🥤', '🧴', '🏠', '🍕', '🧼', '🧻', '🥛', '🧽', '🍪', '📦', '🛁',
    '🍫', '🥤', '🧴', '🏠', '🍕', '🧼', '🧻', '🥛', '🧽', '🍪', '📦', '🛁',
    '🍫', '🥤', '🧴', '🏠', '🍕', '🧼', '🧻', '🥛', '🧽', '🍪', '📦', '🛁',
    '🍫', '🥤', '🧴', '🏠', '🍕', '🧼', '🧻', '🥛', '🧽', '🍪', '📦', '🛁',
    '🍫', '🥤', '🧴', '🏠', '🍕', '🧼', '🧻', '🥛', '🧽', '🍪', '📦', '🛁',
    '🍫', '🥤', '🧴', '🏠', '🍕', '🧼', '🧻', '🥛', '🧽', '🍪', '📦', '🛁',
    '🍫', '🥤', '🧴', '🏠', '🍕', '🧼', '🧻', '🥛', '🧽', '🍪', '📦', '🛁',
    '🍫', '🥤', '🧴', '🏠', '🍕', '🧼', '🧻', '🥛', '🧽', '🍪', '📦', '🛁',
  ];

  return (
    <div className="floating-emojis-bg">
      {emojis.map((emoji, index) => {
        const randomDrift = Math.random() * 200 - 100; // Random drift between -100px and +100px
        const randomDuration = 16 + Math.random() * 10; // Random duration between 16s-26s
        const randomLeft = Math.random() * 100; // Random left position between 0-100%
        return (
          <div
            key={index}
            className="floating-emoji-item"
            style={{
              '--drift': `${randomDrift}px`,
              '--duration': `${randomDuration}s`,
              '--left': `${randomLeft}%`,
            }}
          >
            {emoji}
          </div>
        );
      })}
    </div>
  );
};

export default FloatingEmojis;
