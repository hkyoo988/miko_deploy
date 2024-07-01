import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_MAIN_SERVER_URL  || "http://localhost:3000"; // 소켓 서버 URL
console.log('SOCKET_URL:', SOCKET_URL);
const socket: Socket = io(SOCKET_URL, {
  autoConnect: false, // 자동 연결 비활성화
//   reconnectionAttempts: 5, // 재연결 시도 횟수
//   reconnectionDelay: 1000,
  withCredentials: true
});

export default socket;
