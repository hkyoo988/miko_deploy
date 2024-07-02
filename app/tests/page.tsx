"use client";

import React, { useEffect, useState, useRef } from 'react';
import VoiceComponent from './VoiceRecorderForTest';
import { MainSocketProvider, useSocket } from '../_components/Socket/SocketContext';
import socket from '../_lib/socket';

const Home: React.FC = () => {
    const { connectSocket, disconnectSocket } = useSocket();
    const [messages, setMessages] = useState<string[]>([]);
    const handleNewMessage = useRef((message: string) => {
        setMessages((prevMessages) => [...prevMessages, message]);
    });
    const nickname = 'testUser';
    const sessionId = 'testRoomName';
    useEffect(() => {

        // 소켓 연결
        connectSocket(nickname);

        // 연결 후 방 입장
        socket.on('connect', () => {
            socket.emit('enter_room', sessionId);

            socket.on('entered_room', () => {
                console.log('Entered room:', sessionId);

              });
        });

        const handleMessage = (message: string) => {
            console.log("Received message from server:", message);
            handleNewMessage.current(message);
        };

        socket.on("script", handleMessage);



        // 컴포넌트가 언마운트될 때 이벤트 리스너를 제거합니다.
        return () => {
            socket.off("connect");
            socket.off("entered_room");
            socket.off("script");
            socket.off("enter_room");
        };

    }, [connectSocket, disconnectSocket]);

    return (
        <div>
            <h1>Welcome to Voice Test</h1>
            <VoiceComponent sessionId={sessionId} subscriber={null} publisher={null}/>
            <div>
                {messages.map((message, index) => (
                    <p key={index}>{message}</p>
                ))}
            </div>
        </div>
    );
};

const WrappedHome: React.FC = () => (
    <MainSocketProvider>
        <Home />
    </MainSocketProvider>
);

export default WrappedHome;
