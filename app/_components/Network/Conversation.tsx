import React, { useEffect, useRef, useState } from "react";

interface ConversationProps {
  messages: string[];
  className?: string;
}

const Conversation: React.FC<ConversationProps> = ({ messages, className }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [myUserName, setMyUserName] = useState<string | null>(null);
  const [myUserImage, setMyUserImage] = useState<string | null>(null);

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    const storedUserImage = localStorage.getItem("userImage");
    if (storedUserName) {
      setMyUserName(storedUserName);
    }
    if (storedUserImage) {
      setMyUserImage(storedUserImage);
    }
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollContainerRef} className={`relative h-full overflow-auto ${className}`}>
      <ul>
        {messages.map((message, index) => {
          // console.log(message);
          const [name, image, ...contentArr] = message.split("|");
          const content = contentArr.join("|");
          const isMyMessage = name === myUserName;
          const userImage = image;

          return (
            <li key={index} className={`py-4 sm:py-5 ${isMyMessage ? "text-right" : "text-left"}`}>
              <div className={`flex items-center ${isMyMessage ? "justify-end" : "justify-start"} space-x-2`}>
                {!isMyMessage && (
                  <img
                    src={userImage || "default-user-image.png"}
                    alt={name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {name}
                  </p>
                  <div className={`message ${isMyMessage ? "bg-yellow-300 right" : "bg-white left"} p-3 rounded-lg shadow-md`}>
                    <p className={`text-base ${isMyMessage ? "text-right" : "text-left"} text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap`}>
                      {content}
                    </p>
                  </div>
                </div>
                {isMyMessage && (
                  <img
                    src={myUserImage || "default-user-image.png"}
                    alt={name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Conversation;
