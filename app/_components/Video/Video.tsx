import React, { useState, useEffect, useRef, useCallback } from "react";
import { OpenVidu } from "openvidu-browser";
import { useRouter } from "next/navigation";
import styles from "./Video.module.css";
import UserVideoComponent from "./UserVideoComponent";
import { useSocket } from "../Socket/SocketContext";
import { useVideoContext } from "../Video/VideoContext";

interface Props {
  sessionId: string;
  userName: string;
  token: string;
  setLeaveSessionCallback: (callback: () => void) => void;
}

const Video: React.FC<Props> = ({
  sessionId,
  userName,
  token,
  setLeaveSessionCallback,
}) => {
  const [session, setSession] = useState<any>(undefined);
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const remoteVideoContainerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { socket } = useSocket();
  const { publisher, subscriber, setPublisher, setSubscriber } = useVideoContext();
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const currentPublisherRef = useRef<any>(null);

  const handlerJoinSessionEvent = () => {
    console.log("Join session");
  };

  useEffect(() => {
    const handleRoomId = (data: string) => {
      console.log("Leave session: ", data);
      const url = `/result?meetingId=${encodeURIComponent(data)}`;
      if (session) {
        session.unpublish(publisher);
        session.disconnect();
        setSession(undefined);
        setSubscribers([]);
        socket.disconnect();
        router.push(url);
      }
    };

    socket.on("roomId", handleRoomId);

    return () => {
      socket.off("roomId", handleRoomId);
    };
  }, [session, subscriber, socket, router])

  const handlerLeaveSessionEvent = useCallback(() => {
    socket.emit("roomId", sessionId);
  }, [socket]);

  const handlerErrorEvent = (error: any) => {
    console.log("Error in session", error);
  };

  const initializeSession = async (token: string) => {
    const openvidu = new OpenVidu();
    const mySession = openvidu.initSession();
    openvidu.setAdvancedConfiguration({
      publisherSpeakingEventsOptions: {
        interval: 100,   // Frequency of the polling of audio streams in ms (default 100)
        threshold: -50  // Threshold volume in dB (default -50)
      }
    });

    mySession.on("streamCreated", (event: any) => {
      const subscriber = mySession.subscribe(event.stream, undefined);
      setSubscribers((prevSubscribers) => [...prevSubscribers, subscriber]);
    });

    mySession.on("streamDestroyed", (event: any) => {
      setSubscribers((prevSubscribers) =>
        prevSubscribers.filter((sub) => sub !== event.stream.streamManager)
      );
    });

    mySession.on("exception", (exception: any) => {
      console.warn(exception);
    });

    setSession(mySession);

    try {
      await mySession.connect(token, { clientData: userName });

      const publisher = openvidu.initPublisher(undefined, {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: false,
        publishVideo: true,
        resolution: "640x480",
        frameRate: 30,
        insertMode: "APPEND",
        mirror: false,
      });

      publisher.updatePublisherSpeakingEventsOptions({
        interval: 100,   // Frequency of the polling of audio streams in ms
        threshold: -50  // Threshold volume in dB
      });

      await mySession.publish(publisher);
      if (localVideoRef.current) {
        publisher.addVideoElement(localVideoRef.current);
      }
      setPublisher(publisher);
      currentPublisherRef.current = publisher;
      handlerJoinSessionEvent();
    } catch (error) {
      handlerErrorEvent(error);
    }
    mySession.on("publisherStartSpeaking", (event: any) => {
      handleSpeechDetection(event, true);
    });

    mySession.on("publisherStopSpeaking", (event: any) => {
      handleSpeechDetection(event, false);
    });
  };

  const handleSpeechDetection = (event: any, isSpeaking: boolean) => {
    const currentPublisher = currentPublisherRef.current;
    const speakingPublisher = event.connection.connectionId;
    if (isSpeaking) {
      if (speakingPublisher === currentPublisher.session.connection.connectionId) {
        if (localVideoRef.current) {
          localVideoRef.current.classList.add(styles.speaking);
        }
      } else {
        const remoteVideoRef = remoteVideoRefs.current[event.streamId];
        if (remoteVideoRef) {
          remoteVideoContainerRefs.current[event.streamId]?.classList.add(styles.speaking);
        }
      }
    } else {
      if (speakingPublisher === currentPublisher.session.connection.connectionId) {
        if (localVideoRef.current) {
          localVideoRef.current.classList.remove(styles.speaking);
        }
      } else {
        const remoteVideoRef = remoteVideoRefs.current[event.streamId];
        if (remoteVideoRef) {
          remoteVideoContainerRefs.current[event.streamId]?.classList.remove(styles.speaking);
        }
      }
    }
  };

  useEffect(() => {
    if (token) {
      initializeSession(token);
    }
  }, [token]);

  useEffect(() => {
    subscribers.forEach((subscriber) => {
      if (
        remoteVideoRefs.current[subscriber.stream.streamId] &&
        subscriber.stream.stream
      ) {
        subscriber.addVideoElement(
          remoteVideoRefs.current[subscriber.stream.streamId]
        );
      }
    });
  }, [subscribers]);

  useEffect(() => {
    setLeaveSessionCallback(() => handlerLeaveSessionEvent);
  }, [setLeaveSessionCallback, handlerLeaveSessionEvent]);

  const handleNextPage = () => {
    if (currentPage < Math.ceil(subscribers.length / 5)) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const getVisibleSubscribers = () => {
    const start = currentPage * 5;
    return subscribers.slice(start, start + 5);
  };

  return (
    <div id={styles["video-container"]}>
      <div id={styles["local-video"]}>
        <video ref={localVideoRef} autoPlay={true} />
        <div className={styles.nicknameContainer}>
          <span>{userName}</span>
        </div>
      </div>
      <div id={styles["remote-videos-container"]}>
        {getVisibleSubscribers().map((sub) => (
          <div key={sub.stream.streamId}
            className={styles["remote-video"]}
            ref={(el) => {
              remoteVideoContainerRefs.current[sub.stream.streamId] = el;
              remoteVideoRefs.current[sub.stream.streamId] = el?.querySelector("video") || null;
            }}
          >
            <UserVideoComponent streamManager={sub} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Video;
