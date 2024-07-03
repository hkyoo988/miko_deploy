import React from "react";

interface SharingRoomProps {
  isOpen: boolean;
  onClose: () => void;
  roomLink: string;
}

const SharingRoom: React.FC<SharingRoomProps> = ({
  isOpen,
  onClose,
  roomLink,
}) => {
  if (!isOpen) return null;

  const handleCopyLink = () => {
    console.log("Copy Link button clicked");
    navigator.clipboard.writeText(roomLink);
    alert("Room link copied to clipboard!");
  };

  const handleClose = () => {
    console.log("Close button clicked");
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "5px",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h2>Share Room</h2>
        <p>Copy the link below to share the room:</p>
        <input
          type="text"
          value={roomLink}
          readOnly
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
        <button
          onClick={handleCopyLink}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Copy Link
        </button>
        <button
          onClick={handleClose}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ccc",
            color: "black",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginLeft: "10px",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SharingRoom;
