import React from "react";
import styles from "./styles/Conversation.module.css";

interface ConversationProps {
  messages: string[];
}

const Conversation: React.FC<ConversationProps> = ({ messages }) => {
  return (
    <ul className={styles.conversationList}>
      {messages.map((message, index) => (
        <li key={index} className={styles.messageItem}>
          {message}
        </li>
      ))}
    </ul>
  );
};

export default Conversation;
