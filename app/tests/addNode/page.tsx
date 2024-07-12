"use client";

import React, { Suspense, useRef, useState } from "react";
import NetworkGraph from "../../_components/Network/NetworkGraph";
import Loading from "../../_components/common/Loading";
import useNetwork from "@/app/_hooks/useNetwork";

const Home: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [nodeLabel, setNodeLabel] = useState<string>("");
    const { selectedNodeId, handleNodeClick, handleNodeHover, addNode } = useNetwork(containerRef, null, null, null);

    const handleAddNode = () => {
        if (nodeLabel.trim() !== "") {
            addNode(null, nodeLabel, "Sample content", "#FF0000", false, 1); // 기본 값 설정
            setNodeLabel("");
        }
    };

    return (
        <div>
            <input
                type="text"
                value={nodeLabel}
                onChange={(e) => setNodeLabel(e.target.value)}
                placeholder="Enter node label"
            />
            <button onClick={handleAddNode}>Add Node</button>
            <NetworkGraph
                containerRef={containerRef}
                selectedNodeId={selectedNodeId}
                handleNodeClick={handleNodeClick}
                handleNodeHover={handleNodeHover}
                socket={null}
            />
        </div>
    );
};

const Page: React.FC = () => (
    <Suspense fallback={<Loading disabled={true} text={"Loading..."} />}>
        <Home />
    </Suspense>
);

export default Page;
