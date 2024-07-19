import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faLink,
  faUnlink,
  faExpand,
  faChevronUp,
  faChevronDown,
  faShareSquare,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";

interface ControlPanelProps {
  newNodeLabel: string;
  newNodeContent: string;
  newNodeColor: string;
  handleKeyword: (id: any) => void;
  setAction: (action: string | null) => void;
  fitToScreen: () => void;
  handleSharingRoom: () => void;
  handleLeaveSession: () => void;
  handleRemoveNode: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  newNodeLabel,
  newNodeContent,
  newNodeColor,
  handleKeyword,
  setAction,
  fitToScreen,
  handleSharingRoom,
  handleLeaveSession,
  handleRemoveNode,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleActionClick = (action: string) => {
    if (activeAction === action) {
      setActiveAction(null); // 이미 활성화된 액션을 다시 클릭하면 비활성화
      setAction(null);
    } else {
      setActiveAction(action); // 다른 액션을 클릭하면 해당 액션을 활성화
      setAction(action);
    }
  };

  useEffect(() => {
    if (activeAction === "connect" || activeAction === "disconnect") {
      const timeout = setTimeout(() => {
        setActiveAction(null);
        setAction(null);
      }, 5000); 
      return () => clearTimeout(timeout);
    }
  }, [activeAction, setAction]);

  return (
    <div className="bottom-0 left-0 w-full bg-transparent shadow-md border-t border-gray-200 backdrop-blur-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-full h-10 text-indigo-500 cursor-pointer transition duration-300 bg-white bg-opacity-50 hover:bg-gray-100"
      >
        <FontAwesomeIcon
          icon={isOpen ? faChevronDown : faChevronUp}
          className="w-5 h-5"
        />
      </button>
      {isOpen && (
        <div className="flex flex-wrap items-center justify-center p-4 bg-gray-50 bg-opacity-75 backdrop-blur-lg space-x-2">
          <button
            onClick={handleRemoveNode}
            className="flex items-center justify-center px-4 py-2 text-white text-sm font-medium cursor-pointer transition duration-300 bg-[#96A0FE] hover:bg-[#7b86e5] rounded-md"
          >
            <FontAwesomeIcon icon={faMinus} className="w-5 h-5 mr-2" />
            Remove
          </button>
          <button
            onClick={handleKeyword}
            className="flex items-center justify-center px-4 py-2 text-white text-sm font-medium cursor-pointer transition duration-300 bg-[#96A0FE] hover:bg-[#7b86e5] rounded-md"
          >
            <FontAwesomeIcon icon={faPlus} className="w-5 h-5 mr-2" />
            KeyWords
          </button>
          <button
            onClick={() => handleActionClick("connect")}
            className={`flex items-center justify-center px-4 py-2 text-white text-sm font-medium cursor-pointer transition duration-300 rounded-md ${
              activeAction === "connect" ? "bg-green-500 hover:bg-green-600" : "bg-[#96A0FE] hover:bg-[#7b86e5]"
            }`}
          >
            <FontAwesomeIcon icon={faLink} className="w-5 h-5 mr-2" />
            Connect
          </button>
          <button
            onClick={() => handleActionClick("disconnect")}
            className={`flex items-center justify-center px-4 py-2 text-white text-sm font-medium cursor-pointer transition duration-300 rounded-md ${
              activeAction === "disconnect" ? "bg-red-500 hover:bg-red-600" : "bg-[#96A0FE] hover:bg-[#7b86e5]"
            }`}
          >
            <FontAwesomeIcon icon={faUnlink} className="w-5 h-5 mr-2" />
            Disconnect
          </button>
          <button
            onClick={fitToScreen}
            className="flex items-center justify-center px-4 py-2 text-white text-sm font-medium cursor-pointer transition duration-300 bg-[#96A0FE] hover:bg-[#7b86e5] rounded-md"
          >
            <FontAwesomeIcon icon={faExpand} className="w-5 h-5 mr-2" />
            Fit to Screen
          </button>
          <button
            onClick={handleSharingRoom}
            className="flex items-center justify-center px-4 py-2 text-white text-sm font-medium cursor-pointer transition duration-300 bg-[#96A0FE] hover:bg-[#7b86e5] rounded-md"
          >
            <FontAwesomeIcon icon={faShareSquare} className="w-5 h-5 mr-2" />
            Share
          </button>
          <button
            onClick={handleLeaveSession}
            className="flex items-center justify-center px-4 py-2 text-white text-sm font-medium cursor-pointer transition duration-300 bg-red-500 hover:bg-red-600 rounded-md"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5 mr-2" />
            Leave
          </button>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
