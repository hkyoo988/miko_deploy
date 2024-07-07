import React, { useState, useEffect, useRef } from "react";
import { Node, Edge } from "../../_types/types";

interface NodeListProps {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: number | null;
  onNodeClick: (nodeId: number) => void;
  className?: string;
  autoScroll?: boolean; // New prop to enable/disable auto scroll
}

const NodeList: React.FC<NodeListProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onNodeClick,
  className,
  autoScroll = true, // Default value is true to maintain current behavior
}) => {
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: number]: boolean;
  }>({});
  const [groupedNodes, setGroupedNodes] = useState<{ [key: number]: Node[] }>(
    {}
  );
  const nodeRefs = useRef<{ [key: number]: HTMLLIElement | null }>({});

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

  useEffect(() => {
    if (selectedNodeId !== null && autoScroll) {
      let groupId: number | null = null;
      for (const [id, group] of Object.entries(groupedNodes)) {
        if (group.some((node) => node.id === selectedNodeId)) {
          groupId = Number(id);
          break;
        }
      }
      if (groupId !== null) {
        setExpandedGroups((prevExpandedGroups) => ({
          ...prevExpandedGroups,
          [groupId!]: true,
        }));
        if (nodeRefs.current[selectedNodeId]) {
          nodeRefs.current[selectedNodeId]!.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }
  }, [selectedNodeId, groupedNodes, autoScroll]);

  return (
    <ul
      className={`list-none p-0 w-full max-h-[calc(100%-3rem)] overflow-y-auto overflow-x-hidden ${className}`}
    >
      {Object.keys(groupedNodes).map((groupId) => (
        <li key={groupId} className="mb-4">
          <div
            onClick={() => toggleGroup(Number(groupId))}
            className={`cursor-pointer p-4 border rounded-md flex justify-between items-center w-full box-border ${
              expandedGroups[Number(groupId)]
                ? "bg-[#96A0FE] text-white"
                : "bg-white text-[#96A0FE] border-gray-300"
            } transition-colors duration-300 shadow-md`}
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
                  ref={(el) => {
                    nodeRefs.current[node.id] = el;
                  }}
                  onClick={() => onNodeClick(node.id)}
                  className={`cursor-pointer p-4 border rounded-md mb-2 transition-colors duration-300 w-full box-border ${
                    node.id === selectedNodeId
                      ? "bg-[#96A0FE] text-white border-[#96A0FE]"
                      : "bg-white text-gray-800 border-gray-300"
                  } shadow-sm hover:shadow-md`}
                >
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
            ref={(el) => {
              nodeRefs.current[node.id] = el;
            }}
            onClick={() => onNodeClick(node.id)}
            className={`cursor-pointer p-4 border rounded-md mb-2 transition-colors duration-300 w-full box-border ${
              node.id === selectedNodeId
                ? "bg-[#96A0FE] text-white border-[#96A0FE]"
                : "bg-white text-gray-800 border-gray-300"
            } shadow-sm hover:shadow-md`}
          >
            <strong>Label:</strong> {node.label} <br />
            <strong>Content:</strong>
            <div dangerouslySetInnerHTML={{ __html: node.content }} />
          </li>
        ))}
    </ul>
  );
};

export default NodeList;
