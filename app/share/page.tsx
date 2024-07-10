"use client"

import React, { useEffect } from "react";
import axios from "axios";
import LoadingModal from "../_components/common/LoadingModal";
import { useRouter } from "next/navigation";

const APPLICATION_SERVER_URL =
  process.env.NEXT_PUBLIC_MAIN_SERVER_URL || "http://localhost:8080/";

const Share: React.FC = () => {
    const router = useRouter();
    const query = new URLSearchParams(window.location.search);
    const storedPassword = query.get("password");
    const storedSessionId = query.get("sessionId");

    useEffect(() => {
        const getTokenAndRedirect = async () => {
            if (storedSessionId) {
                try {
                    const response = await axios.post(
                        `${APPLICATION_SERVER_URL}api/openvidu/sessions/${storedSessionId}/connections`,
                        {},
                        {
                            headers: { "Content-Type": "application/json" },
                        }
                    );
                    const token = response.data.token;
                    
                    const mySessionId = storedSessionId;
                    const randomUserName = "OpenVidu_User_" + Math.floor(Math.random() * 100);
                    const encodedPassword = encodeURIComponent(storedPassword || "");
    
                    const url = `/meetingRoom?sessionId=${encodeURIComponent(
                        mySessionId
                    )}&userName=${encodeURIComponent(randomUserName)}&token=${encodeURIComponent(
                        token
                    )}&password=${encodedPassword}`;
    
                    sessionStorage.setItem("Video", "off");
                    sessionStorage.setItem("Audio", "off");
    
                    router.push(url);
                } catch (error) {
                    console.error("Error");
                }
            }
        };
    
        getTokenAndRedirect();
    }, [storedSessionId, storedPassword, router]);
    

    return (
        <LoadingModal />
    );
};

export default Share;
