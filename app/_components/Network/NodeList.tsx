import React, { useState, useEffect } from "react";
import { Node, Edge } from "../../_types/types";
import styles from "./styles/NodeConversation.module.css";

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
    setExpandedGroups((prevExpandedGroups) => ({
      ...prevExpandedGroups,
      [groupId]: !prevExpandedGroups[groupId],
    }));
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
<ul className={`list-none p-0 w-full max-h-[calc(100%-3rem)] overflow-y-auto overflow-x-hidden ${styles['custom-scrollbar']} ${className}`}>      {Object.keys(groupedNodes).map((groupId) => (
      <li key={groupId} className="mb-2">
        <div
          onClick={() => toggleGroup(Number(groupId))}
          className={`cursor-pointer p-2 border rounded-md flex justify-between items-center ${
            expandedGroups[Number(groupId)]
              ? "bg-[#96a0fe] text-white"
              : "bg-white text-[#96a0fe] border-gray-300"
          } transition-colors duration-300`}
          aria-expanded={expandedGroups[Number(groupId)]}
        >
          <span>Group {groupId}</span>
          <span>{expandedGroups[Number(groupId)] ? "-" : "+"}</span>
        </div>
        {expandedGroups[Number(groupId)] && (
          <ul className="list-none p-0 m-0 transition-max-height duration-300 pl-4">
            {groupedNodes[Number(groupId)].map((node) => (
              <li
                key={node.id}
                onClick={() => onNodeClick(node.id)}
                className={`cursor-pointer p-2 border-3 rounded-md mb-1 transition-colors duration-300 box-border ${
                  node.id === selectedNodeId
                    ? "bg-[#96a0fe] text-white border-[#96a0fe]"
                    : "bg-white text-gray-800 border-gray-300"
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
          className={`cursor-pointer p-2 border-3 rounded-md mb-1 transition-colors duration-300 box-border ${
            node.id === selectedNodeId
              ? "bg-[#96a0fe] text-white border-[#96a0fe]"
              : "bg-white text-gray-800 border-gray-300"
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
