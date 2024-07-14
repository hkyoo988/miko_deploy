"use client";

import React, { Suspense, useRef, useState } from "react";
import NetworkGraph from "../../_components/Network/NetworkGraph";
import Loading from "../../_components/common/Loading";
import useNetwork from "@/app/_hooks/useNetwork";

const Home: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [nodeLabel, setNodeLabel] = useState<string>("");
    const [nodePriority, setNodePriority] = useState<number>(1);
    const [nodeColor, setNodeColor] = useState<string>("#FF0000");
    const { selectedNodeId, handleNodeClick, handleNodeHover, addNode, setAction } = useNetwork(containerRef, null, null, null);

    const handleAddNode = () => {
        if (nodeLabel.trim() !== "") {
            addNode(null, nodeLabel, "Sample content", nodeColor, true, nodePriority); // 기본 값 설정
            setNodeLabel("");
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    value={nodeLabel}
                    onChange={(e) => setNodeLabel(e.target.value)}
                    placeholder="Enter node label"
                    style={{ marginRight: '10px' }}
                />
                <input
                    type="number"
                    value={nodePriority}
                    onChange={(e) => setNodePriority(parseInt(e.target.value))}
                    placeholder="Enter node priority"
                    style={{ marginRight: '10px' }}
                />
                <input
                    type="color"
                    value={nodeColor}
                    onChange={(e) => setNodeColor(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <button onClick={() => setAction("connect")} style={{ marginRight: '10px', borderWidth: '2px' }}>Connect</button>
                <button onClick={() => setAction("disconnect")} style={{ marginRight: '10px', borderWidth: '2px' }}>DisConnect</button>
                <button onClick={handleAddNode} style={{ borderWidth: '2px' }}>Add Node</button>
            </div>
            <div style={{ width: '80%', height: '80%' }}>
                <NetworkGraph
                    containerRef={containerRef}
                    selectedNodeId={selectedNodeId}
                    handleNodeClick={handleNodeClick}
                    handleNodeHover={handleNodeHover}
                    socket={null}
                />
            </div>
        </div>
    );
};

const Page: React.FC = () => (
    <Suspense fallback={<Loading disabled={true} text={"Loading..."} />}>
        <Home />
    </Suspense>
);

export default Page;
