"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../_components/common/Header";

const APPLICATION_SERVER_URL =
  process.env.NEXT_PUBLIC_MAIN_SERVER_URL || "http://localhost:8080/";

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
  const [itemsPerPage] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const userName = searchParams.get("ownerId");
    if (userName) {
      setOwnerId(userName);
      handleSearch(userName);
    }
  }, [searchParams]);

  const handleSearch = async (ownerId: string) => {
    if (!ownerId) {
      alert("Please enter an ownerId");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${APPLICATION_SERVER_URL}api/meeting/owner/${ownerId}`
      );
      const data = await response.json();
      const sortedData = data.sort((a: Meeting, b: Meeting) => {
        const dateA = new Date(a.startTime).getTime();
        const dateB = new Date(b.startTime).getTime();
        return dateB - dateA;
      });
      setMeetings(sortedData);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
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
        `${APPLICATION_SERVER_URL}api/meeting/${meetingId}`,
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
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    const sortedMeetings = [...meetings].sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();
      return newSortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
    setSortOrder(newSortOrder);
    setMeetings(sortedMeetings);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const indexOfLastMeeting = currentPage * itemsPerPage;
  const indexOfFirstMeeting = indexOfLastMeeting - itemsPerPage;
  const currentMeetings = meetings.slice(
    indexOfFirstMeeting,
    indexOfLastMeeting
  );

  const emptyRows = itemsPerPage - currentMeetings.length;
  const emptyRowsArray = Array.from({ length: emptyRows }, (_, index) => index);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(meetings.length / itemsPerPage); i++) {
      pageNumbers.push(i);
    }
    return (
      <div className="flex justify-center mt-4">
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`mx-1 px-3 py-1 border rounded ${
              number === currentPage
                ? "bg-blue-500 text-white"
                : "bg-white text-blue-500 border-blue-500"
            } hover:bg-blue-500 hover:text-white`}
          >
            {number}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-white-100">
      <Header>MIKO Board</Header>
      <main className="flex flex-col items-center p-6 flex-1">
        <section className="w-full max-w-4xl">
          {loading ? (
            <div className="flex justify-center items-center">
              <div className="w-16 h-16 border-4 border-[#96A0FE] border-dashed rounded-full animate-spin"></div>
              {/* 로딩 스피너 */}
            </div>
          ) : meetings.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse borde-4 border-gray-200 bg-white">
                  <thead>
                    <tr>
                      <th className="border border-gray-200 p-2 bg-[#96A0FE] text-white">
                        Title
                      </th>
                      <th
                        className="border border-gray-200 p-2 bg-[#96A0FE] text-white cursor-pointer"
                        onClick={handleSort}
                      >
                        Start Time {sortOrder === "asc" ? "↑" : "↓"}
                      </th>
                      <th className="border border-gray-200 p-2 bg-[#96A0FE] text-white">
                        Owners
                      </th>
                      <th className="border border-gray-200 p-2 bg-[#96A0FE] text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMeetings.map((meeting) => (
                      <tr
                        key={meeting.meeting_id}
                        className="hover:bg-gray-100"
                      >
                        <td
                          className="border border-gray-200 p-2 text-blue-500 cursor-pointer"
                          onClick={() => handleMeetingClick(meeting.meeting_id)}
                        >
                          {meeting.title}
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          {new Date(meeting.startTime).toLocaleString()}
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          {Array.isArray(meeting.owner)
                            ? meeting.owner.join(", ")
                            : meeting.owner}
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          <button
                            onClick={() => handleDelete(meeting.meeting_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                    {emptyRowsArray.map((index) => (
                      <tr key={`empty-${index}`} className="hover:bg-gray-100">
                        <td className="border border-gray-200 p-2">&nbsp;</td>
                        <td className="border border-gray-200 p-2">&nbsp;</td>
                        <td className="border border-gray-200 p-2">&nbsp;</td>
                        <td className="border border-gray-200 p-2">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPageNumbers()}
            </>
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500">
              No meetings found
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const Page: React.FC = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <BoardPage />
  </Suspense>
);

export default Page;
