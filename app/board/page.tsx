"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Header from "../_components/common/Header";
import Footer from "../_components/common/Footer";

interface Meeting {
  meeting_id: string;
  title: string;
  startTime: string;
  owner: string[];
}

const BoardPage: React.FC = () => {
  const [ownerId, setOwnerId] = useState<string>("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const router = useRouter();

  const handleSearch = async () => {
    if (!ownerId) {
      alert("Please enter an ownerId");
      return;
    }
    try {
      const response = await fetch(
        `https://miko-dev-a7d3f7eaf040.herokuapp.com/api/meeting/owner/${ownerId}`
      );
      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const handleMeetingClick = (meetingId: string) => {
    router.push(
      `https://miko-frontend-i3vt.vercel.app/result?meetingId=${meetingId}`
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header>MIKO Board</Header>
      <main className="flex flex-col items-center p-6 flex-1">
        <section className="mb-6 flex space-x-4">
          <input
            type="text"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            placeholder="Enter ownerId"
            className="p-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={handleSearch}
            className="p-2 bg-blue-500 text-white rounded-md"
          >
            Search
          </button>
        </section>
        <section className="w-full max-w-4xl">
          {meetings.length > 0 ? (
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr>
                  <th className="border border-gray-200 p-2">Meeting ID</th>
                  <th className="border border-gray-200 p-2">Title</th>
                  <th className="border border-gray-200 p-2">Start Time</th>
                  <th className="border border-gray-200 p-2">Owners</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((meeting) => (
                  <tr key={meeting.meeting_id}>
                    <td
                      className="border border-gray-200 p-2 text-blue-500 cursor-pointer"
                      onClick={() => handleMeetingClick(meeting.meeting_id)}
                    >
                      {meeting.meeting_id}
                    </td>
                    <td className="border border-gray-200 p-2">
                      {meeting.title}
                    </td>
                    <td className="border border-gray-200 p-2">
                      {new Date(meeting.startTime).toLocaleString()}
                    </td>
                    <td className="border border-gray-200 p-2">
                      {Array.isArray(meeting.owner)
                        ? meeting.owner.join(", ")
                        : meeting.owner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>No meetings found</div>
          )}
        </section>
      </main>
      <Footer isFixed>
        {/* children prop 추가 */}
        <div></div>
      </Footer>
    </div>
  );
};

const Page: React.FC = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <BoardPage />
  </Suspense>
);

export default Page;
