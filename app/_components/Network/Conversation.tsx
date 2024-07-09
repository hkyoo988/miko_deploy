import React, { useEffect, useRef } from "react";

interface ConversationProps {
  messages: string[];
  className?: string;
}

const Conversation: React.FC<ConversationProps> = ({ messages, className }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollContainerRef} className={`relative h-full overflow-auto ${className}`}>
      <ul className="max-w-md divide-y divide-gray-200 dark:divide-gray-700">
        {messages.map((message, index) => {
          const [name, ...contentArr] = message.split(": ");
          const content = contentArr.join(": ");
          return (
            <li key={index} className="py-4 sm:py-5">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {name}
                  </p>
                  <p className="text-base text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap">
                    {content}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Conversation;
