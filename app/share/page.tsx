"use client"

import React, { useEffect } from "react";
import axios from "axios";
import LoadingModal from "../_components/common/LoadingModal";
import { useRouter } from "next/navigation";



const APPLICATION_SERVER_URL =
  process.env.NEXT_PUBLIC_MAIN_SERVER_URL || "http://localhost:8080/";

const Share: React.FC = () => {
    const router = useRouter();

    const base64Encode = (str: string) => {
        return btoa(encodeURIComponent(str));
      };

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const storedPassword = query.get("p");
        const storedSessionId = query.get("sessionId");
        const getTokenAndRedirect = async () => {
            if (storedSessionId) {
                try {
                    const encodedSessionId = base64Encode(storedSessionId);
                    const response = await axios.post(
                        `${APPLICATION_SERVER_URL}api/openvidu/sessions/${storedPassword}/connections`,
                        {},
                        {
                            headers: { "Content-Type": "application/json" },
                        }
                    );
                    const token = response.data.token;
                    
                    const mySessionId = encodedSessionId;
                    const randomUserName = "OpenVidu_User_" + Math.floor(Math.random() * 100);
                    const encodedPassword = encodeURIComponent(storedPassword || "");
    
                    const url = `/meetingRoom?sessionId=${encodeURIComponent(
                        storedSessionId
                    )}&userName=${encodeURIComponent(randomUserName)}&token=${encodeURIComponent(
                        token
                    )}&p=${encodedPassword}`;
    
                    sessionStorage.setItem("Video", "off");
                    sessionStorage.setItem("Audio", "off");
    
                    router.push(url);
                } catch (error) {
                    console.error("Error");
                }
            }
        };
    
        getTokenAndRedirect();
    }, []);
    

    return (
        <LoadingModal />
    );
};

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
export default Share;


