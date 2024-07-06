"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import logo from "../../public/MIKO_LOGO_Square.png";
import styles from "./Waiting.module.css";
import WaitingVideoComponent from "./WaitingVideoComponent";

const APPLICATION_SERVER_URL =
  process.env.NEXT_PUBLIC_MAIN_SERVER_URL || "http://localhost:8080/";

const WaitingPage: React.FC = () => {
  const { data: session } = useSession();
  const [mySessionId, setMySessionId] =
    useState<string>("방 제목을 입력하세요.");
  const [myUserName, setMyUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<
    string | null
  >(null);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<
    string | null
  >(null);

  const router = useRouter();

  useEffect(() => {
    if (session?.user?.name) {
      setMyUserName(session.user.name);
      localStorage.setItem("userName", session.user.name); // 유저 이름을 로컬스토리지에 저장
    } else {
      const randomUserName = "OpenVidu_User_" + Math.floor(Math.random() * 100);
      setMyUserName(randomUserName);
    }
    console.log("User session data:", session);
  }, [session]);

  const base64Encode = (str: string) => {
    return btoa(encodeURIComponent(str));
  };

  const handleChangeSessionId = (e: ChangeEvent<HTMLInputElement>) => {
    setMySessionId(e.target.value);
  };

  const handleChangeUserName = (e: ChangeEvent<HTMLInputElement>) => {
    setMyUserName(e.target.value);
  };

  const handleChangePassword = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  useEffect(() => {
    const getDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const audioDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );
      setVideoDevices(videoDevices);
      setAudioDevices(audioDevices);
      if (videoDevices.length > 0) {
        setSelectedVideoDeviceId(videoDevices[0].deviceId);
      }
      if (audioDevices.length > 0) {
        setSelectedAudioDeviceId(audioDevices[0].deviceId);
      }
    };

    getDevices();
  }, []);

  const joinSession = async (event: FormEvent, isCreate: boolean) => {
    event.preventDefault();
    if (mySessionId && myUserName) {
      console.log("Joining session with ID:", mySessionId);
      try {
        const token = await getToken(isCreate);
        console.log("Token received:", token);

        const encodedPassword = base64Encode(password);

        const url = `/meetingRoom?sessionId=${encodeURIComponent(
          mySessionId
        )}&userName=${encodeURIComponent(
          myUserName
        )}&token=${encodeURIComponent(token)}&password=${encodeURIComponent(
          encodedPassword
        )}`;

        sessionStorage.setItem(
          "Video",
          selectedVideoDeviceId ? selectedVideoDeviceId : "off"
        );
        sessionStorage.setItem(
          "Audio",
          selectedAudioDeviceId ? selectedAudioDeviceId : "off"
        );

        router.push(url);
      } catch (error) {
        console.error("Error joining session:", error);
      }
    }
  };

  const handleCreateSession = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    const encodedPassword = base64Encode(password);
    const requestData = {
      nickname: myUserName,
      room: mySessionId,
      password: encodedPassword,
    };
    console.log(requestData);
    const response = await fetch(`${APPLICATION_SERVER_URL}create/room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (response.ok) {
      await joinSession(event, true);
    } else {
      console.error("Failed to create room:", response.statusText);
      alert("Failed to create room");
    }
  };

  const handleJoinSession = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();

    const encodedPassword = base64Encode(password);

    const requestData = {
      room: mySessionId,
      password: encodedPassword,
    };

    const response = await fetch(`${APPLICATION_SERVER_URL}join/room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (response.ok) {
      await joinSession(event, true);
    } else {
      console.error("Failed to create room:", response.statusText);
      alert("Failed to create room");
    }
  };

  const getToken = async (isCreate: boolean) => {
    const sessionId = isCreate ? await createSession(mySessionId) : mySessionId;
    const token = await createToken(sessionId);
    return token;
  };

  const createSession = async (sessionId: string) => {
    const response = await axios.post(
      `${APPLICATION_SERVER_URL}api/openvidu/sessions`,
      { customSessionId: sessionId },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data.sessionId;
  };

  const createToken = async (sessionId: string) => {
    const response = await axios.post(
      `${APPLICATION_SERVER_URL}api/openvidu/sessions/${sessionId}/connections`,
      {},
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data.token;
  };

  const handleViewMeetings = () => {
    const userName = localStorage.getItem("userName");
    if (userName) {
      router.push(`/board?ownerId=${encodeURIComponent(userName)}`);
    } else {
      alert("User name is not available.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <WaitingVideoComponent
          selectedVideoDeviceId={selectedVideoDeviceId}
          selectedAudioDeviceId={selectedAudioDeviceId}
        />
        <div className={styles.formContainer}>
          <Image
            src={logo}
            alt="MIKO Logo"
            width={100}
            height={100}
            className={styles.logo}
          />
          <h1 className={styles.title}>Welcome to MIKO</h1>
          <div id="join" className={styles.join}>
            <div id="join-dialog">
              {session ? (
                <div>
                  <p className={styles.info}>
                    <span className={styles.bold}>{session.user?.name}</span>님
                    반갑습니다!
                  </p>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className={styles.logoutButton}
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <p className={styles.info}>
                  Not logged in. <a href="/">Go to Login</a>
                </p>
              )}
              <form className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>이름</label>
                  <input
                    type="text"
                    id="userName"
                    value={myUserName}
                    onChange={handleChangeUserName}
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>방 제목</label>
                  <input
                    type="text"
                    id="sessionId"
                    placeholder={mySessionId}
                    onChange={handleChangeSessionId}
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>비밀번호</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={handleChangePassword}
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>비디오 장치</label>
                  <select
                    id="videoDevice"
                    onChange={(e) => setSelectedVideoDeviceId(e.target.value)}
                    value={selectedVideoDeviceId || ""}
                    className={styles.input}
                  >
                    <option value="off">끄기</option>
                    {videoDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>오디오 장치</label>
                  <select
                    id="audioDevice"
                    onChange={(e) => setSelectedAudioDeviceId(e.target.value)}
                    value={selectedAudioDeviceId || ""}
                    className={styles.input}
                  >
                    <option value="off">끄기</option>
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={handleCreateSession}
                    className={styles.button}
                  >
                    방 생성
                  </button>
                  <button
                    type="button"
                    onClick={handleJoinSession}
                    className={styles.button}
                  >
                    방 참가
                  </button>
                  {session && (
                    <button
                      type="button"
                      onClick={handleViewMeetings}
                      className={styles.button}
                    >
                      회의록 보기
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingPage;
