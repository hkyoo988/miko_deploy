"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Header from "../_components/common/Header";
import Footer from "../_components/common/Footer";
import AudioPlayer from "../_components/AudioPlayer";
import styles from "./Result.module.css";
import { useSocket } from "../_components/Socket/SocketContext";
import NetworkGraph from "../_components/Network/NetworkGraph";
import useNetwork from "../_hooks/useNetwork";

interface Conversation {
  _id: string;
  user: string;
  script: string;
  timestamp: string;
  __v: number;
}

interface Vertex {
  _id: string;
  keyword: string;
  subject: string;
  conversationIds: string[];
  __v: number;
}

const ResultPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tab1");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [vertexes, setVertexes] = useState<Vertex[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const { selectedNodeId, handleNodeClick } = useNetwork(
    containerRef,
    null,
    null
  );
  const { disconnectSocket } = useSocket();

  useEffect(() => {
    disconnectSocket();
  }, [disconnectSocket]);

  useEffect(() => {
    const fetchData = async () => {
      const meetingId = searchParams.get("meetingId");

      if (meetingId) {
        try {
          const response = await fetch(
            `https://miko-dev-a7d3f7eaf040.herokuapp.com/meeting/${meetingId}`
          );
          const data = await response.json();
          setConversations(data.conversations);
          setVertexes(data.vertexes);
        } catch (error) {
          console.error("Error fetching data: ", error);
        }
      }
    };

    fetchData();
  }, [searchParams]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "tab1":
        return <div></div>;
      case "tab2":
        return (
          <div>
            {vertexes.map((vertex) => (
              <div key={vertex._id} className={styles.keywordItem}>
                <div className={styles.keywordLabel}>
                  Label: {vertex.keyword}
                </div>
                <div className={styles.keywordContent}>
                  Content: {vertex.subject}
                </div>
              </div>
            ))}
          </div>
        );
      case "tab3":
        return (
          <div>
            {conversations.map((conversation) => (
              <div key={conversation._id} className={styles.conversationItem}>
                <span className={styles.conversationUser}>
                  {conversation.user}:
                </span>
                <span className={styles.conversationScript}>
                  {conversation.script}
                </span>
                <span className={styles.conversationTimestamp}>
                  {conversation.timestamp}
                </span>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <Header>MIKO</Header>
      <main className={styles.main}>
        <section className={styles.left}>
          노드 그래프 영역
          <div style={{ position: "relative", width: "100%", height: "500px" }}>
            <NetworkGraph
              containerRef={containerRef}
              selectedNodeId={selectedNodeId}
              handleNodeClick={handleNodeClick}
              socket={null}
            />
          </div>
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
          </div>
          <div className={styles.tabContent}>{renderTabContent()}</div>
        </section>
      </main>
      <Footer isFixed>
        <AudioPlayer />
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
