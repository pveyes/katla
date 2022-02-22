import { Menu, MenuButton, MenuList, MenuItem } from "@reach/menu-button";
import { memo } from "react";

interface Props {
  onSendEmoji: (emoji: string) => void;
}

function EmojiSelector(props: Props) {
  return (
    <Menu>
      <MenuButton>
        <svg
          viewBox="0 0 24 24"
          width={22}
          height={22}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
      </MenuButton>
      <EmojiBar onSelect={props.onSendEmoji} />
    </Menu>
  );
}

export default memo(EmojiSelector);

function EmojiBar({ onSelect }) {
  const emojis = ["🎉", "🥳", "😂", "😭", "❤️", "🤬"];

  return (
    <MenuList className="rounded-full bg-gray-100 border-gray-400 border dark:bg-gray-800 px-2 absolute top-2 z-10 slide-down">
      {emojis.map((emoji) => (
        <MenuItem
          key={emoji}
          className="p-2 text-xl select-none focus:outline-none transform transition-transform hover:scale-150 focus:scale-150"
          onSelect={() => onSelect(emoji)}
        >
          {emoji}
        </MenuItem>
      ))}
    </MenuList>
  );
}
