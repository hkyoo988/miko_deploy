"use client";

import React, {
  useState,
  useEffect,
  useRef,
  Suspense,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../_components/common/Header";
import Footer from "../_components/common/Footer";
import AudioPlayer from "../_components/AudioPlayer";
import styles from "./Result.module.css";
import { useSocket } from "../_components/Socket/SocketContext";
import NetworkGraph from "../_components/Network/NetworkGraph";
import useNetwork from "../_hooks/useNetwork";
import { Conversation, Edge } from "../_types/types";
import NodeList from "../_components/Network/NodeList";

interface Vertex {
  _id: string;
  keyword: string;
  subject: string;
  conversationIds: string[];
  __v: number;
}

interface NewEdge {
  _id: string;
  vertex1: number;
  vertex2: number;
  __v: number;
}

interface Participant {
  name: string;
  role: string;
}

interface MeetingDetails {
  title: string;
  startTime: string;
  period: number;
  participants: Participant[];
  mom: string;
}

const ResultPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tab1");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [vertexes, setVertexes] = useState<Vertex[]>([]);
  const [newEdges, setNewEdges] = useState<NewEdge[]>([]);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [highlightedConversation, setHighlightedConversation] = useState<
    string | null
  >(null);
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가
  const addedNodesRef = useRef<Set<string>>(new Set());
  const addedEdgesRef = useRef<Set<string | number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    addNode,
    selectedNodeId,
    handleNodeClick,
    edges,
    fitToScreen,
    nodes,
    network,
    initializeNetwork,
  } = useNetwork(containerRef, null, null);
  const { disconnectSocket } = useSocket();

  useEffect(() => {
    disconnectSocket();
  }, [disconnectSocket]);

  useEffect(() => {
    const fetchData = async () => {
      const meetingId = searchParams.get("meetingId");
      setMeetingId(meetingId);

      if (meetingId) {
        try {
          const response = await fetch(
            `https://miko-dev-a7d3f7eaf040.herokuapp.com/api/meeting/${meetingId}`
          );
          if (response.ok) {
            const data = await response.json();
            setConversations(data.conversations);
            setVertexes(data.vertexes);
            setNewEdges(data.edges);
            setIsLoading(false); // 데이터 로드 완료
          } else {
            router.push("/error"); // 데이터가 없을 경우 에러 페이지로 리다이렉트
          }
        } catch (error) {
          console.error("Error fetching data: ", error);
          router.push("/error"); // 오류가 발생할 경우 에러 페이지로 리다이렉트
        }
      } else {
        router.push("/error"); // meetingId가 없을 경우 에러 페이지로 리다이렉트
      }
    };

    fetchData();
  }, [searchParams, router]);

  useEffect(() => {
    const fetchMeetingDetails = async () => {
      if (meetingId) {
        try {
          const response = await fetch(
            `https://miko-dev-a7d3f7eaf040.herokuapp.com/api/meeting/${meetingId}/mom`
          );
          if (response.ok) {
            const data = await response.json();
            setMeetingDetails(data.momResponseDto);
          } else {
            router.push("/error"); // 데이터가 없을 경우 에러 페이지로 리다이렉트
          }
        } catch (error) {
          console.error("Error fetching meeting details: ", error);
          router.push("/error"); // 오류가 발생할 경우 에러 페이지로 리다이렉트
        }
      }
    };

    fetchMeetingDetails();
  }, [meetingId, router]);

  const handleSeek = useCallback((time: number) => {
    setSeekTime(time);
  }, []);

  const handleTimeUpdate = (currentTime: number) => {
    const closestConversation = conversations.reduce((prev, curr) => {
      return Math.abs(curr.time_offset / 1000 - currentTime) <
        Math.abs(prev.time_offset / 1000 - currentTime)
        ? curr
        : prev;
    });
    setHighlightedConversation(closestConversation._id);
  };

  const printMap = () => {
    if (vertexes && vertexes.length > 0) {
      vertexes.forEach((vertex) => {
        if (!addedNodesRef.current.has(vertex._id)) {
          addNode(vertex._id, vertex.keyword, vertex.subject, "#5A5A5A");
          addedNodesRef.current.add(vertex._id);
        }
      });
    }
    if (newEdges && newEdges.length > 0) {
      newEdges.forEach((edge) => {
        if (!addedEdgesRef.current.has(edge._id)) {
          const newEdge: Edge = {
            id: edge._id,
            from: edge.vertex1,
            to: edge.vertex2,
          };

          edges.add(newEdge);
          addedEdgesRef.current.add(edge._id);
        }
      });
    }
  };

  useEffect(() => {
    if (activeTab === "tab4" && containerRef.current) {
      initializeNetwork(containerRef.current);
      printMap();
    }
  }, [activeTab, containerRef.current]);

  useEffect(() => {
    if (highlightedConversation) {
      const element = document.getElementById(highlightedConversation);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightedConversation]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "tab1":
        return (
          <div>
            {nodes.length > 0 ? (
              <NodeList
                nodes={nodes.get()}
                edges={edges.get()}
                selectedNodeId={selectedNodeId}
                onNodeClick={handleNodeClick}
              />
            ) : (
              <div>No vertexes available</div>
            )}
          </div>
        );
      case "tab2":
        return (
          <div>
            {vertexes && vertexes.length > 0 ? (
              vertexes.map((vertex) => (
                <div key={vertex._id} className={styles.keywordItem}>
                  <div className={styles.keywordLabel}>
                    Label: {vertex.keyword}
                  </div>
                  <div className={styles.keywordContent}>
                    Content: {vertex.subject}
                  </div>
                </div>
              ))
            ) : (
              <div>No vertexes available</div>
            )}
          </div>
        );
      case "tab3":
        return (
          <div>
            {conversations && conversations.length > 0 ? (
              conversations.map((conversation) => (
                <div
                  id={conversation._id}
                  key={conversation._id}
                  className={`${styles.conversationItem} ${
                    highlightedConversation === conversation._id
                      ? styles.highlighted
                      : ""
                  }`}
                  onClick={() => handleSeek(conversation.time_offset / 1000)}
                >
                  <span className={styles.conversationUser}>
                    {conversation.user}
                  </span>
                  <span className={styles.conversationTimestamp}>
                    {new Date(conversation.timestamp).toLocaleTimeString()}
                  </span>
                  <div className={styles.conversationScript}>
                    {conversation.script}
                  </div>
                </div>
              ))
            ) : (
              <div>No conversations available</div>
            )}
          </div>
        );
      case "tab4":
        return (
          <div style={{ position: "relative", width: "100%", height: "90%" }}>
            <button onClick={fitToScreen} className={styles.button}>
              fitToScreen
            </button>
            <NetworkGraph
              containerRef={containerRef}
              selectedNodeId={selectedNodeId}
              handleNodeClick={handleNodeClick}
              socket={null}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const formatPeriod = (period: number) => {
    const minutes = Math.floor(period / 60000);
    const seconds = Math.floor((period % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (isLoading) {
    return <div>Loading...</div>; // 로딩 중일 때 표시할 내용
  }

  return (
    <div className={styles.container}>
      <Header>MIKO</Header>
      <main className={styles.main}>
        <section className={styles.left}>
          {meetingDetails ? (
            <div className={styles.meetingDetails}>
              <h2>{meetingDetails.title}</h2>
              <p>
                <strong>Start Time:</strong>{" "}
                {new Date(meetingDetails.startTime).toLocaleString()}
              </p>
              <p>
                <strong>Period:</strong> {formatPeriod(meetingDetails.period)}
              </p>
              <p>
                <strong>Participants:</strong>{" "}
                {Array.isArray(meetingDetails.participants)
                  ? meetingDetails.participants
                      .map(
                        (participant) =>
                          `${participant.name} (${participant.role})`
                      )
                      .join(", ")
                  : "No participants"}
              </p>
              <p>
                <strong>Summary:</strong> {meetingDetails.mom}
              </p>
            </div>
          ) : (
            <div>Loading meeting details...</div>
          )}
        </section>
        <section className={styles.right}>
          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab("tab1")}
              className={`${styles.tabButton} ${
                activeTab === "tab1" ? styles.activeTab : ""
              }`}
            >
              그룹
            </button>
            <button
              onClick={() => setActiveTab("tab2")}
              className={`${styles.tabButton} ${
                activeTab === "tab2" ? styles.activeTab : ""
              }`}
            >
              키워드 요약
            </button>
            <button
              onClick={() => setActiveTab("tab3")}
              className={`${styles.tabButton} ${
                activeTab === "tab3" ? styles.activeTab : ""
              }`}
            >
              음성 기록
            </button>
            <button
              onClick={() => setActiveTab("tab4")}
              className={`${styles.tabButton} ${
                activeTab === "tab4" ? styles.activeTab : ""
              }`}
            >
              네트워크 그래프
            </button>
          </div>
          <div className={styles.tabContent}>{renderTabContent()}</div>
        </section>
      </main>
      <Footer isFixed>
        {meetingId && (
          <div className={styles.footerPlayer}>
            <AudioPlayer
              meetingId={meetingId}
              seekTime={seekTime}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        )}
      </Footer>
    </div>
  );
};

const Page: React.FC = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ResultPage />
  </Suspense>
);

export default Page;
