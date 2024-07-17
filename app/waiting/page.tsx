"use client"

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import logo from "../../public/MIKO_LOGO_Square.png";
import WaitingVideoComponent from "./WaitingVideoComponent";
import LoadingModal from "../_components/common/LoadingModal";

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
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | null>(null);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // 로딩 상태 추가

  const router = useRouter();

  useEffect(() => {
    if (session?.user?.name) {
      setMyUserName(session.user.name);
      localStorage.setItem("userName", session.user.name); // 유저 이름을 로컬스토리지에 저장
      if (session?.user?.image)
        localStorage.setItem("userImage", session.user.image); // 유저 사진을 로컬스토리지에 저장
    } else {
      const randomUserName = "OpenVidu_User_" + Math.floor(Math.random() * 100);
      setMyUserName(randomUserName);
    }
    console.log("User session data:", session);
  }, [session]);

  const base64Encode = (str: string) => {
    // UTF-8 바이트 배열로 변환
    const utf8Bytes = new TextEncoder().encode(str);

    // Uint8Array를 문자열로 변환
    const binaryString = Array.from(utf8Bytes).map(byte => String.fromCharCode(byte)).join('');

    // Base64로 인코딩
    const base64String = btoa(binaryString);

    // URL-safe Base64로 변환
    const base64UrlString = base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return base64UrlString;
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop()); // 권한 요청 후 트랙 정지

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
    setIsLoading(true); // 로딩 시작
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
        )}&token=${encodeURIComponent(token)}&p=${encodeURIComponent(
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
      } finally {
        setIsLoading(false); // 로딩 종료
      }
    }
  };

  const handleCreateSession = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // setIsLoading(true); // 로딩 시작
    const encodedPassword = base64Encode(password);
    const requestData = {
      nickname: myUserName,
      room: mySessionId,
      password: encodedPassword,
      image: localStorage.getItem('userImage')
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

  const handleJoinSession = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // setIsLoading(true); // 로딩 시작
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
      console.error("Failed to Join room:", response.statusText);
      alert("Failed to Join room");
    }
  };

  const getToken = async (isCreate: boolean) => {
    const encodedSessionId = base64Encode(mySessionId);
    const sessionId = isCreate ? await createSession(mySessionId) : encodedSessionId;
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
    <div className="flex justify-center items-center min-h-screen bg-[#96A0FE] m-0 font-sans">
      {isLoading && <LoadingModal />}
      <div className="bg-white p-5 rounded-lg shadow-lg text-center w-full max-w-5xl flex flex-col md:flex-row items-center h-auto md:h-auto">
        <WaitingVideoComponent
          selectedVideoDeviceId={selectedVideoDeviceId}
          selectedAudioDeviceId={selectedAudioDeviceId}
        />
        <div className="w-full max-w-xl flex-1 p-5 md:p-3">
          <Image
            src={logo}
            alt="MIKO Logo"
            width={100}
            height={100}
            className="mx-auto"
          />
          <h1 className="text-3xl mb-5 text-gray-800">Welcome to MIKO</h1>
          <div id="join" className="join">
            <div id="join-dialog">
              {session ? (
                <div>
                  <p className="text-lg text-gray-700 mb-3">
                    <span className="font-bold text-gray-900">{session.user?.name}</span>님 반갑습니다!
                  </p>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <p className="text-lg text-gray-700 mb-3">
                  Not logged in. <a href="/">Go to Login</a>
                </p>
              )}
              <form className="flex flex-col items-center">
                <div className="w-full mb-4 text-left">
                  <label className="block mb-2 text-gray-700">이름</label>
                  <input
                    type="text"
                    id="userName"
                    value={myUserName}
                    onChange={handleChangeUserName}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="w-full mb-4 text-left">
                  <label className="block mb-2 text-gray-700">방 제목</label>
                  <input
                    type="text"
                    id="sessionId"
                    placeholder={mySessionId}
                    onChange={handleChangeSessionId}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="w-full mb-4 text-left">
                  <label className="block mb-2 text-gray-700">비밀번호</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={handleChangePassword}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="w-full mb-4 text-left">
                  <label className="block mb-2 text-gray-700">비디오 장치</label>
                  <select
                    id="videoDevice"
                    onChange={(e) => setSelectedVideoDeviceId(e.target.value)}
                    value={selectedVideoDeviceId || ""}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="off">끄기</option>
                    {videoDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full mb-4 text-left">
                  <label className="block mb-2 text-gray-700">오디오 장치</label>
                  <select
                    id="audioDevice"
                    onChange={(e) => setSelectedAudioDeviceId(e.target.value)}
                    value={selectedAudioDeviceId || ""}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="off">끄기</option>
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleCreateSession}
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  >
                    방 생성
                  </button>
                  <button
                    type="button"
                    onClick={handleJoinSession}
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  >
                    방 참가
                  </button>
                  {session && (
                    <button
                      type="button"
                      onClick={handleViewMeetings}
                      className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
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
