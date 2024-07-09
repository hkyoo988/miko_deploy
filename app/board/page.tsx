"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaTrash } from "react-icons/fa"; // React Icons에서 휴지통 아이콘 가져오기
import Header from "../_components/common/Header";
import Loading from "../_components/common/Loading";

const APPLICATION_SERVER_URL =
  process.env.NEXT_PUBLIC_MAIN_SERVER_URL || "http://localhost:8080/";

interface Meeting {
  meeting_id: string;
  title: string;
  startTime: string;
  owner: string[];
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

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
    const totalPages = Math.ceil(meetings.length / itemsPerPage);
    const pageNumbers = [];
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
    const endPage = Math.min(startPage + 4, totalPages);

    if (startPage > 1) {
      pageNumbers.push(
        <button
          key="prev"
          onClick={() => handlePageChange(startPage - 1)}
          className="mx-1 px-3 py-1 border rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          &laquo;
        </button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`mx-1 px-3 py-1 border rounded ${
            i === currentPage
              ? "bg-[#96A0FE] text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      pageNumbers.push(
        <button
          key="next"
          onClick={() => handlePageChange(endPage + 1)}
          className="mx-1 px-3 py-1 border rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          &raquo;
        </button>
      );
    }

    return <div className="flex justify-center mt-4">{pageNumbers}</div>;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header>MIKO Board</Header>
      <main className="flex flex-col items-center justify-center p-6 flex-1">
        <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-[#96A0FE]">Meetings</h1>
          <button
            onClick={() => router.push("/waiting")}
            className="px-4 py-2 bg-[#96A0FE] text-white rounded-lg shadow-md hover:bg-blue-700"
          >
            Back to Waiting Room
          </button>
        </div>
        <section className="w-full max-w-6xl">
          {loading ? (
            <Loading disabled={true} text={"Loading..."} />
          ) : meetings.length > 0 ? (
            <>
              <div className="overflow-x-auto shadow-lg rounded-lg">
                <table className="min-w-full border-collapse border border-gray-300 bg-white">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-3 bg-[#96A0FE] text-white">
                        Title
                      </th>
                      <th
                        className="border border-gray-300 p-3 bg-[#96A0FE] text-white cursor-pointer"
                        onClick={handleSort}
                      >
                        Start Time {sortOrder === "asc" ? "↑" : "↓"}
                      </th>
                      <th className="border border-gray-300 p-3 bg-[#96A0FE] text-white">
                        Participants
                      </th>
                      <th className="border border-gray-300 p-3 bg-[#96A0FE] text-white">
                        Delete
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
                          className="border border-gray-300 p-3 text-[#96A0FE] cursor-pointer"
                          onClick={() => handleMeetingClick(meeting.meeting_id)}
                        >
                          {truncateText(meeting.title, 15)}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {new Date(meeting.startTime).toLocaleString()}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {truncateText(
                            Array.isArray(meeting.owner)
                              ? meeting.owner.join(", ")
                              : meeting.owner,
                            20
                          )}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <button
                            onClick={() => handleDelete(meeting.meeting_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {emptyRowsArray.map((index) => (
                      <tr key={`empty-${index}`} className="hover:bg-gray-100">
                        <td className="border border-gray-300 p-3">&nbsp;</td>
                        <td className="border border-gray-300 p-3">&nbsp;</td>
                        <td className="border border-gray-300 p-3">&nbsp;</td>
                        <td className="border border-gray-300 p-3">&nbsp;</td>
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
