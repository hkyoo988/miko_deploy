import React, { useState, useEffect } from "react";
import { Node, Edge } from "../../_types/types";
import styles from "./styles/NodeList.module.css";

interface NodeListProps {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: number | null;
  onNodeClick: (nodeId: number) => void;
  className?: string;
}

const NodeList: React.FC<NodeListProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onNodeClick,
  className,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: number]: boolean;
  }>({});
  const [groupedNodes, setGroupedNodes] = useState<{ [key: number]: Node[] }>(
    {}
  );

  const toggleGroup = (groupId: number) => {
    setExpandedGroups({
      ...expandedGroups,
      [groupId]: !expandedGroups[groupId],
    });
  };

  const getConnectedNodes = (nodeId: number, edges: Edge[]): Set<number> => {
    const connectedNodes = new Set<number>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const current = stack.pop();
      if (current && !connectedNodes.has(current)) {
        connectedNodes.add(current);
        edges.forEach((edge) => {
          if (edge.from === current && !connectedNodes.has(edge.to)) {
            stack.push(edge.to);
          } else if (edge.to === current && !connectedNodes.has(edge.from)) {
            stack.push(edge.from);
          }
        });
      }
    }

    return connectedNodes;
  };

  useEffect(() => {
    const groups: { [key: number]: Node[] } = {};
    const nodeGroupMap = new Map<number, number>();
    let nextGroupId = 1;

    nodes.forEach((node) => {
      if (!nodeGroupMap.has(node.id)) {
        const connectedNodes = Array.from(getConnectedNodes(node.id, edges));
        if (connectedNodes.length > 1) {
          const groupId = nextGroupId++;
          connectedNodes.forEach((connectedNodeId) => {
            nodeGroupMap.set(connectedNodeId, groupId);
          });
          groups[groupId] = connectedNodes.map(
            (id) => nodes.find((n) => n.id === id)!
          );
        }
      }
    });

    setGroupedNodes(groups);
  }, [nodes, edges]);

  return (
    <ul className={`${styles.nodeList} ${className}`}>
      {Object.keys(groupedNodes).map((groupId) => (
        <li key={groupId}>
          <div
            onClick={() => toggleGroup(Number(groupId))}
            className={`${styles.groupHeader} ${
              expandedGroups[Number(groupId)] ? styles.groupHeaderExpanded : ""
            }`}
            aria-expanded={expandedGroups[Number(groupId)]}
          >
            <span>Group {groupId}</span>
            <span>{expandedGroups[Number(groupId)] ? "-" : "+"}</span>
          </div>
          {expandedGroups[Number(groupId)] && (
            <ul className={styles.nodeList}>
              {groupedNodes[Number(groupId)].map((node) => (
                <li
                  key={node.id}
                  onClick={() => onNodeClick(node.id)}
                  className={`${styles.nodeItem} ${
                    node.id === selectedNodeId
                      ? styles.nodeItemSelected
                      : styles.nodeItemNotSelected
                  }`}
                >
                  <strong>ID:</strong> {node.id} <br />
                  <strong>Label:</strong> {node.label} <br />
                  <strong>Content:</strong>
                  <div dangerouslySetInnerHTML={{ __html: node.content }} />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
      {nodes
        .filter((node) => !Object.values(groupedNodes).flat().includes(node))
        .map((node) => (
          <li
            key={node.id}
            onClick={() => onNodeClick(node.id)}
            className={`${styles.nodeItem} ${
              node.id === selectedNodeId
                ? styles.nodeItemSelected
                : styles.nodeItemNotSelected
            }`}
          >
            <strong>ID:</strong> {node.id} <br />
            <strong>Label:</strong> {node.label} <br />
            <strong>Content:</strong>
            <div dangerouslySetInnerHTML={{ __html: node.content }} />
          </li>
        ))}
    </ul>
  );
};

export default NodeList;
