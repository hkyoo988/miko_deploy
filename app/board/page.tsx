"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10); // 페이지당 항목 수
  const [sortOrder, setSortOrder] = useState<string>("asc"); // 정렬 순서
  const [loading, setLoading] = useState<boolean>(false); // 로딩 상태 관리
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const userName = searchParams.get("ownerId");
    if (userName) {
      setOwnerId(userName);
      handleSearch(userName); // 컴포넌트가 마운트될 때 자동으로 검색
    }
  }, [searchParams]);

  const handleSearch = async (ownerId: string) => {
    if (!ownerId) {
      alert("Please enter an ownerId");
      return;
    }
    setLoading(true); // 데이터 로드 시작
    try {
      const response = await fetch(
        `https://miko-dev-a7d3f7eaf040.herokuapp.com/api/meeting/owner/${ownerId}`
      );
      const data = await response.json();
      setMeetings(data);
      setCurrentPage(1); // 검색 시 페이지를 1로 초기화
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false); // 데이터 로드 완료
    }
  };

  const handleMeetingClick = (meetingId: string) => {
    router.push(
      `https://miko-frontend-i3vt.vercel.app/result?meetingId=${meetingId}`
    );
  };

  const handleDelete = async (meetingId: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) {
      return;
    }
    try {
      const response = await fetch(
        `https://miko-dev-a7d3f7eaf040.herokuapp.com/api/meeting/${meetingId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setMeetings(
          meetings.filter((meeting) => meeting.meeting_id !== meetingId)
        );
      } else {
        console.error("Failed to delete meeting:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting meeting: ", error);
    }
  };

  const handleSort = () => {
    const sortedMeetings = [...meetings].sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
    setMeetings(sortedMeetings);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // 현재 페이지에 표시할 데이터 계산
  const indexOfLastMeeting = currentPage * itemsPerPage;
  const indexOfFirstMeeting = indexOfLastMeeting - itemsPerPage;
  const currentMeetings = meetings.slice(
    indexOfFirstMeeting,
    indexOfLastMeeting
  );

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(meetings.length / itemsPerPage); i++) {
      pageNumbers.push(i);
    }
    return pageNumbers.map((number) => (
      <button
        key={number}
        onClick={() => handlePageChange(number)}
        className={`mx-1 px-3 py-1 border rounded ${
          number === currentPage ? "bg-blue-500 text-white" : "bg-white"
        }`}
      >
        {number}
      </button>
    ));
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
            onClick={() => handleSearch(ownerId)}
            className="p-2 bg-blue-500 text-white rounded-md"
          >
            Search
          </button>
        </section>
        <section className="w-full max-w-4xl">
          {loading ? (
            <div className="flex justify-center items-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>{" "}
              {/* 로딩 스피너 */}
            </div>
          ) : meetings.length > 0 ? (
            <>
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr>
                    <th className="border border-gray-200 p-2">Meeting ID</th>
                    <th className="border border-gray-200 p-2">Title</th>
                    <th
                      className="border border-gray-200 p-2 cursor-pointer"
                      onClick={handleSort}
                    >
                      Start Time {sortOrder === "asc" ? "↑" : "↓"}
                    </th>
                    <th className="border border-gray-200 p-2">Owners</th>
                    <th className="border border-gray-200 p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMeetings.map((meeting) => (
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
                      <td className="border border-gray-200 p-2">
                        <button
                          onClick={() => handleDelete(meeting.meeting_id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4">{renderPageNumbers()}</div>
            </>
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
