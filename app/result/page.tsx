"use client";

import React, {
  useState,
  useEffect,
  useRef,
  Suspense,
  useCallback,
  CSSProperties,
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
import ReactMarkdown from "react-markdown";
import Tiptap from "../_components/Tiptap";

const APPLICATION_SERVER_URL =
  process.env.NEXT_PUBLIC_MAIN_SERVER_URL || "http://localhost:8080/";

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
  const [isLoading, setIsLoading] = useState(true);
  const addedNodesRef = useRef<Set<string>>(new Set());
  const addedEdgesRef = useRef<Set<string | number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverState, setPopoverState] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });

  useEffect(() => {
    if (popoverRef.current && popoverState.visible) {
      const popoverWidth = popoverRef.current.offsetWidth;
      const newX = popoverState.x - popoverWidth / 2;
      setPopoverState((prev) => ({ ...prev, x: newX }));
    }
  }, [popoverState.visible]);

  const {
    addNode,
    selectedNodeId,
    handleNodeClick,
    edges,
    fitToScreen,
    nodes,
    network,
    initializeNetwork,
    handleNodeHover,
  } = useNetwork(containerRef, null, null, setPopoverState);
  const { disconnectSocket } = useSocket();

  useEffect(() => {
    if (network) {
      network.on("hoverNode", (params) => {
        if (params.node) {
          handleNodeHover(params.node);
        } else {
          handleNodeHover(null);
        }
      });
    }
  }, [network, handleNodeHover]);

  useEffect(() => {
    console.log("Popover State:", popoverState);
  }, [popoverState]);

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
            `${APPLICATION_SERVER_URL}api/meeting/${meetingId}`
          );
          if (response.ok) {
            const data = await response.json();
            setConversations(data.conversations);
            setVertexes(data.vertexes);
            setNewEdges(data.edges);
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error fetching data: ", error);
        }
      }
    };

    fetchData();
  }, [searchParams, router]);

  useEffect(() => {
    const fetchMeetingDetails = () => {
      if (meetingId) {
        const eventSource = new EventSource(`${APPLICATION_SERVER_URL}api/meeting/${meetingId}/mom`);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setMeetingDetails(data);
          eventSource.close();
        };

        eventSource.onerror = (error) => {
          console.error("SSE error: ", error);
          eventSource.close();
        };

        return () => {
          eventSource.close();
        };
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

  const keyframesStyle = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

  const popoverStyle: CSSProperties = {
    position: "absolute",
    top: `${popoverState.y - 20}px`,
    left: `${popoverState.x}px`,
    backgroundColor: "#333",
    color: "white",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    visibility: popoverState.visible ? "visible" : "hidden",
    opacity: popoverState.visible ? 1 : 0,
    animation: popoverState.visible ? "fade-in 300ms ease" : "none",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
  };

  const arrowStyle: CSSProperties = {
    position: "absolute",
    width: "10px",
    height: "10px",
    backgroundColor: "#333",
    transform: "rotate(45deg)",
    zIndex: -1,
    top: "calc(100% - 5px)",
    left: "50%",
    marginLeft: "-5px",
  };

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
              handleNodeHover={handleNodeHover}
              socket={null}
            />
            {popoverState.visible && (
              <div style={popoverStyle} ref={popoverRef}>
                <p>{popoverState.content}</p>
                <div style={arrowStyle} data-popper-arrow></div>
              </div>
            )}
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
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <style>{keyframesStyle}</style>
      <Header>MIKO</Header>
      <main className={styles.main}>
        <section className={styles.left}>
          {meetingDetails ? (
            <div className="h-full flex flex-col">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    회의 제목
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    value={meetingDetails.title}
                    readOnly
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    진행일
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    value={new Date(meetingDetails.startTime).toLocaleString()}
                    readOnly
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    참가자
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    value={
                      Array.isArray(meetingDetails.participants)
                        ? meetingDetails.participants
                            .map(
                              (participant) =>
                                `${participant.name} (${participant.role})`
                            )
                            .join(", ")
                        : "No participants"
                    }
                    readOnly
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  회의 내용
                </label>
                <div
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 overflow-y-auto"
                  style={{ height: "calc(100% - 2rem)" }} // Adjusted height
                >
                  <Tiptap content={`<h2>위치 데이터 정확성에 대한 회의</h2>
    <ul>
        <li>짝쳐 위치값이 정확하지 않음</li>
        <li>위치 데이터를 받아와서 키우는 중</li>
        <li><strong>화재 위험</strong></li>
        <ul>
            <li>화재 예방 조치 및 안전 대책 토의</li>
            <li>일산 오른쪽에 있는 화재 취약 지역 인지</li>
            <li>일산 우측에 위치 확인</li>
            <li>왜 해당 지역을 의심하는지 의문 제기</li>
        </ul>
    </ul>

    <h2>술자리 주문</h2>
    <ul>
        <li>주문 및 음식 지시</li>
        <li>치가, 51번을 주문하고 메인 메뉴 결정</li>
        <li>위에 되아 망지를 주문함</li>
    </ul>

    <h2>코딩 피드백</h2>
    <ul>
        <li>코딩 관련 대화</li>
        <li>100포인트 이상을 얻는 방법에 대한 논의</li>
        <li>맞심 코드에 대한 피드백과 수정 제안</li>
    </ul>

    <h2>움직임 권장</h2>
    <ul>
        <li>움직이는 습관 유지 권장</li>
        <li>한지 업무 진행</li>
        <li>자세한 움직임 확인 요청</li>
        <li>한지 움직임에 대한 토론</li>
        <li>움직임 방향 조정 필요</li>
        <li>언니 웨이지를 통한 한지 움직임 방법에 대한 논의</li>
    </ul>`}/>
                </div>
              </div>
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
              키워드 맵
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
