import React from "react";
import styles from "./styles/ControlPanel.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faLink,
  faUnlink,
  faExpand,
} from "@fortawesome/free-solid-svg-icons";

interface ControlPanelProps {
  newNodeLabel: string;
  newNodeContent: string;
  newNodeColor: string;
  setNewNodeLabel: (label: string) => void;
  setNewNodeContent: (content: string) => void;
  setNewNodeColor: (color: string) => void;
  addNode: (id: any) => void;
  setAction: (action: string) => void;
  fitToScreen: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  newNodeLabel,
  newNodeContent,
  newNodeColor,
  setNewNodeLabel,
  setNewNodeContent,
  setNewNodeColor,
  addNode,
  setAction,
  fitToScreen,
}) => {
  return (
    <div className={styles.controlPanel}>
      <input
        type="text"
        placeholder="Node Label"
        value={newNodeLabel}
        onChange={(e) => setNewNodeLabel(e.target.value)}
        className={styles.input}
      />
      <input
        type="text"
        placeholder="Node Content"
        value={newNodeContent}
        onChange={(e) => setNewNodeContent(e.target.value)}
        className={styles.input}
      />
      <input
        type="color"
        value={newNodeColor}
        onChange={(e) => setNewNodeColor(e.target.value)}
        className={styles.colorInput}
      />
      <button onClick={addNode} className={styles.button}>
        <FontAwesomeIcon icon={faPlus} /> Add Node
      </button>
      <button onClick={() => setAction("connect")} className={styles.button}>
        <FontAwesomeIcon icon={faLink} /> Connect
      </button>
      <button onClick={() => setAction("disconnect")} className={styles.button}>
        <FontAwesomeIcon icon={faUnlink} /> Disconnect
      </button>
      <button onClick={fitToScreen} className={styles.button}>
        <FontAwesomeIcon icon={faExpand} /> Fit to Screen
      </button>
    </div>
  );
};

export default ControlPanel;
