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
import Tiptap from "../_components/Tiptap";
import Loading from "../_components/common/Loading";
import { Editor } from "@tiptap/react";

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

interface MeetingDetails {
  title: string;
  startTime: string;
  period: number;
  owner: string[];
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
  const [editor, setEditor] = useState<Editor | null>(null);
  const titleRef = useRef<HTMLInputElement>(null); // Ref for title input
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
        const eventSource = new EventSource(
          `${APPLICATION_SERVER_URL}api/meeting/${meetingId}/mom`
        );

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

  useEffect(() => {
    if (editor && meetingDetails) {
      editor.commands.setContent(meetingDetails.mom);
    }
  }, [editor, meetingDetails]);

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
    if (activeTab === "tab2" && containerRef.current) {
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

  const keyframesStyle = `@keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }`;

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
            {vertexes && vertexes.length > 0 ? (
              vertexes.map((vertex) => (
                <div key={vertex._id} className={styles.keywordItem}>
                  <div className={styles.keywordLabel}>
                    제목: {vertex.keyword}
                  </div>
                  <div className={styles.keywordContent}>
                    내용: {vertex.subject}
                  </div>
                </div>
              ))
            ) : (
              <div>No vertexes available</div>
            )}
          </div>
        );
      case "tab2":
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
      case "tab3":
        return (
          <div>
            {nodes.length > 0 ? (
              <NodeList
                nodes={nodes.get()}
                edges={edges.get()}
                selectedNodeId={selectedNodeId}
                onNodeClick={handleNodeClick}
                autoScroll={false} // Disable auto scroll
              />
            ) : (
              <div>No vertexes available</div>
            )}
          </div>
        );
      case "tab4":
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
      default:
        return null;
    }
  };

  const formatPeriod = (period: number) => {
    const hours = Math.floor(period / 3600000);
    const minutes = Math.floor((period % 3600000) / 60000);
    const seconds = Math.floor((period % 60000) / 1000);
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${seconds}초`;
    } else if (minutes > 0) {
      return `${minutes}분 ${seconds}초`;
    } else {
      return `${seconds}초`;
    }
  };

  const handleSave = async () => {
    if (editor && meetingId) {
      const title = titleRef.current?.value; // Use ref to get the title
      const content = editor.getHTML();

      const requestBody = {
        id: meetingId,
        title: title,
        mom: content,
      };
      console.log(requestBody);
      try {
        const response = await fetch(
          `${APPLICATION_SERVER_URL}api/meeting/mom/update`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          console.log("Meeting details updated successfully");
          alert("회의록이 저장되었습니다!");
        } else {
          console.error("Failed to update meeting details");
          alert("회의록이 저장되지 않았습니다!");
        }
      } catch (error) {
        console.error("Error updating meeting details: ", error);
        alert("회의록이 저장되지 않았습니다!");
      }
    }
  };

  const handleViewMeetings = () => {
    const userName = localStorage.getItem("userName");
    if (userName) {
      router.push(`/board?ownerId=${encodeURIComponent(userName)}`);
    } else {
      alert("User name is not available.");
    }
  };

  if (isLoading) {
    return <Loading disabled={true} text={"Loading..."} />;
  }

  return (
    <div className={styles.container}>
      <style>{keyframesStyle}</style>
      <Header>
        MIKO
        <button
          onClick={handleViewMeetings}
          className="absolute right-2 top-7 transform -translate-y-1/2 bg-[#3A2778] text-white py-2 px-4 rounded inline-flex items-center ml-4"
        >
          회의록 목록 보기
        </button>
      </Header>
      <main className={styles.main}>
        <section className={styles.left}>
          {meetingDetails ? (
            <div className="h-full flex flex-col">
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    회의 제목
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    defaultValue={meetingDetails.title} // Use defaultValue
                    ref={titleRef} // Attach ref
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
                      Array.isArray(meetingDetails.owner)
                        ? meetingDetails.owner
                            .map((owner, index) =>
                              index === 0 ? `${owner}👑` : `${owner}👤`
                            )
                            .join(", ")
                        : "No participants"
                    }
                    readOnly
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    회의 내용
                  </label>
                  <div
                    style={{
                      marginTop: "0.25rem",
                      display: "block",
                      width: "100%",
                      borderRadius: "0.5rem",
                      borderColor: "#d1d5db",
                      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                      overflowY: "auto",
                      overflowX: "hidden",
                      height: "50vh",
                      borderWidth: "2px",
                    }}
                  >
                    <Tiptap
                      content={meetingDetails.mom}
                      setEditor={setEditor}
                    />
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={handleSave}
                  className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-3 py-1.5 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <Loading disabled={true} text={"Loading..."} />
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
              키워드 요약
            </button>
            <button
              onClick={() => setActiveTab("tab2")}
              className={`${styles.tabButton} ${
                activeTab === "tab2" ? styles.activeTab : ""
              }`}
            >
              키워드 맵
            </button>
            <button
              onClick={() => setActiveTab("tab3")}
              className={`${styles.tabButton} ${
                activeTab === "tab3" ? styles.activeTab : ""
              }`}
            >
              그룹
            </button>
            <button
              onClick={() => setActiveTab("tab4")}
              className={`${styles.tabButton} ${
                activeTab === "tab4" ? styles.activeTab : ""
              }`}
            >
              음성 기록
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
  <Suspense fallback={<Loading disabled={true} text={"Loading..."} />}>
    <ResultPage />
  </Suspense>
);

export default Page;
