import { useEffect, useCallback, useState } from "react";
import { useSocket } from "../_components/Socket/SocketContext";
import { Edge, Node } from "../_types/types";
import { DataSet } from "vis-network";

const useSocketHandlers = (
  edges: DataSet<Edge>,
  addNode: (id: any, label: string, content: string, color: string, playSound: boolean, d: number) => void,
  nodes: DataSet<Node>,
  delay: number = 100
) => {
  const { socket } = useSocket();
  const [nextNodeId, setNextNodeId] = useState<string>("");
  const [newNodeLabel, setNewNodeLabel] = useState<string>("");
  const [newNodeContent, setNewNodeContent] = useState<string>("");
  const [newDepth, setNewDepth] = useState<number>(10);

  const [queue, setQueue] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const depth: number[] = [40, 30, 20, 15];

  const handleAddNode = useCallback(
    (id: any) => {
      addNode(id, newNodeLabel, newNodeContent, "#5A5A5A", true, newDepth);
      setNextNodeId("");
      setNewNodeLabel("");
      setNewNodeContent("");
      setNewDepth(10);
    },
    [newNodeLabel, newNodeContent, addNode]
  );

  const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  useEffect(() => {
    const handleSummarize = (data: {
      _id: string;
      keyword: string;
      subject: string;
      priority: number;
      conversationIds: [];
    }) => {
      setNextNodeId(data._id);
      setNewNodeLabel(data.keyword);
      setNewNodeContent(data.subject);
      setNewDepth(data.priority);
      console.log("subtitle", data);
    };

    socket.on("vertex", handleSummarize);

    return () => {
      socket.off("vertex", handleSummarize);
    };
  }, [socket]);

  useEffect(() => {
    if (newNodeLabel && newNodeContent) {
      handleAddNode(nextNodeId);
    }
  }, [newNodeLabel, newNodeContent, nextNodeId, newDepth, handleAddNode]);

  useEffect(() => {
    const handleConnect = (data: {
      _id: string;
      vertex1: number;
      vertex2: number;
      action: string;
    }) => {
      const newEdge: Edge = {
        id: data._id,
        from: data.vertex1,
        to: data.vertex2,
      };

      if (!edges.get(newEdge.id)) {
        edges.add(newEdge);
      }
    };

    socket.on("edge", handleConnect);

    return () => {
      socket.off("edge", handleConnect);
    };
  }, [socket, edges]);

  useEffect(() => {
    const handledDisConnect = (data: {
      _id: string;
      vertex1: number;
      vertex2: number;
      action: string;
    }) => {
      if (edges.get(data._id)) {
        edges.remove(data._id);
      } else {
        console.log(`Edge with id ${data._id} already exists`);
      }
    };
    socket.on("del_edge", handledDisConnect);

    return () => {
      socket.off("del_edge", handledDisConnect);
    };
  }, [socket, edges]);

  useEffect(() => {
    const handleVertexBatch = (data: any[]) => {
      setQueue((prevQueue) => [
        ...prevQueue,
        ...data.map((item) => ({ type: "vertex", data: item })),
      ]);
    };

    socket.on("vertexBatch", handleVertexBatch);

    return () => {
      socket.off("vertexBatch", handleVertexBatch);
    };
  }, [socket]);

  useEffect(() => {
    const handleEdgeBatch = (data: any[]) => {
      setQueue((prevQueue) => [
        ...prevQueue,
        ...data.map((item) => ({ type: "edge", data: item })),
      ]);
    };

    socket.on("edgeBatch", handleEdgeBatch);

    return () => {
      socket.off("edgeBatch", handleEdgeBatch);
    };
  }, [socket]);

  useEffect(() => {
    const handleUpdateNode = (data: {_id: number, depth: number}) => {
      let size: number;

      if (data.depth < 0) {
          size = Math.abs(data.depth) + depth[0];
      } else {
          size = depth[data.depth] || 10; // depth[d]가 유효하지 않으면 기본값 10을 사용합니다.
      }
      nodes.update({id: data._id, })
    };

    socket.on("updateNode", handleUpdateNode);
  }, [socket])

  useEffect(() => {
    const processQueue = async () => {
      if (!processing && queue.length > 0) {
        setProcessing(true);
        const { type, data } = queue[0];
        if (type === "vertex") {
          addNode(data._id, data.keyword, data.subject, "#5A5A5A", true, data.priority);
        } else if (type === "edge") {
          const newEdge: Edge = {
            id: data._id,
            from: data.vertex1,
            to: data.vertex2,
          };
          if (!edges.get(newEdge.id)) {
            edges.add(newEdge);
          }
        }

        await sleep(delay); // Use the customizable delay here

        setQueue((prevQueue) => prevQueue.slice(1));
        setProcessing(false);
      }
    };

    processQueue();
  }, [queue, processing, delay]);

  return {
    newNodeLabel,
    newNodeContent,
    nextNodeId,
    setNewNodeLabel,
    setNewNodeContent,
  };
};

export default useSocketHandlers;
