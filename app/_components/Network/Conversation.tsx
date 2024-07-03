import React from "react";
import styles from "./styles/Conversation.module.css";

interface ConversationProps {
  messages: string[];
  className?: string;
}

const Conversation: React.FC<ConversationProps> = ({ messages, className }) => {
  return (
    <ul className={`max-w-md divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
      {messages.map((message, index) => (
        <li key={index} className={index === 0 ? "pt-3 pb-0 sm:pt-4" : "py-3 sm:py-4"}>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                User {index + 1}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 break-words whitespace-pre-wrap">
                {message}
              </p>
            </div>
            <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
              {/* Placeholder for any additional data */}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default Conversation;