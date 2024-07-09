import React, { useState, useEffect, useRef } from "react";
import { Node, Edge } from "../../_types/types";
import { UnionFind } from "@/app/_utils/unionFind";

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

  useEffect(() => {
    const uf = new UnionFind(nodes.length);
    const nodeMap = new Map<number, number>(
      nodes.map((node, index) => [node.id, index])
    );

    // 모든 에지에 대해 Union 작업 수행
    edges.forEach((edge) => {
      const fromIndex = nodeMap.get(edge.from);
      const toIndex = nodeMap.get(edge.to);
      if (fromIndex !== undefined && toIndex !== undefined) {
        uf.union(fromIndex, toIndex);
      }
    });

    // 그룹화된 노드들을 저장할 객체 생성
    const groups: { [key: number]: Node[] } = {};
    nodes.forEach((node) => {
      const root = uf.find(nodeMap.get(node.id)!);
      if (!groups[root]) {
        groups[root] = [];
      }
      groups[root].push(node);
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
            block: "nearest",
          });
        }
      }
    }
  }, [selectedNodeId, groupedNodes, autoScroll]);

  return (
    <ul
      className={`list-none p-0 w-full max-h-[calc(100%-3rem)] overflow-y-auto overflow-x-hidden ${className}`}
    >
      {Object.keys(groupedNodes).map((groupId) => {
        const groupNodes = groupedNodes[Number(groupId)];
        const groupLabel = groupNodes[0]?.label || `Group ${groupId}`;
        return (
          <li key={groupId} className="mb-6">
            <div
              onClick={() => toggleGroup(Number(groupId))}
              className={`cursor-pointer p-4 border rounded-md flex justify-between items-center w-full box-border ${
                expandedGroups[Number(groupId)]
                  ? "bg-[#96A0FE] text-white"
                  : "bg-gray-100 text-[#96A0FE] border-gray-300"
              } transition-colors duration-300 shadow-md hover:shadow-lg`}
              aria-expanded={expandedGroups[Number(groupId)]}
            >
              <span className="font-semibold">{groupLabel}</span>
              <span className="ml-2">
                {expandedGroups[Number(groupId)] ? "-" : "+"}
              </span>
            </div>
            {expandedGroups[Number(groupId)] && (
              <ul className="list-none p-0 m-0 mt-2 transition-max-height duration-300 pl-4 border-l-4 border-[#96A0FE]">
                {groupNodes.map((node) => (
                  <li
                    key={node.id}
                    ref={(el) => {
                      nodeRefs.current[node.id] = el;
                    }}
                    onClick={() => onNodeClick(node.id)}
                    className={`cursor-pointer p-4 border rounded-md mb-2 transition-colors duration-300 w-full box-border ${
                      node.id === selectedNodeId
                        ? "bg-yellow-200 text-black border-yellow-300"
                        : "bg-white text-gray-800 border-gray-300 hover:bg-[#f0f4ff]"
                    } shadow-sm hover:shadow-md`}
                  >
                    <strong className="block mb-1">{node.label}</strong>
                    <span className="text-sm">{node.content}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default NodeList;
