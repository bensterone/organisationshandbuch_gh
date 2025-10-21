import React, { useState, useRef, useEffect } from 'react';
import Picker from 'emoji-picker-react';

const EmojiPickerPopover = ({ onSelect, children }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!open) return;
      const anchor = anchorRef.current;
      const picker = pickerRef.current;
      if (picker && !picker.contains(e.target) && anchor && !anchor.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block" ref={anchorRef}>
      <button type="button" onClick={() => setOpen((v) => !v)}>
        {children}
      </button>

      {open && (
        <div
          ref={pickerRef}
          className="absolute z-50 mt-2"
          style={{ transform: 'translateX(-25%)' }}
        >
          <div className="bg-white rounded-xl shadow-2xl border p-2">
            <Picker
              onEmojiClick={(emojiData) => {
                onSelect?.(emojiData.emoji);
                setOpen(false);
              }}
              theme="light"
              width={300}
              height={380}
              searchDisabled={false}
              lazyLoadEmojis
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPickerPopover;
