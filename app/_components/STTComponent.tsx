// app/components/STTComponent.tsx
"use client";

import React, { useState, useEffect } from "react";

interface STTComponentProps {
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  onKeywordsExtracted: (keyword: string, interimTranscript: string) => void; // 새로운 prop 추가
  keywords?: string[];
}

const STTComponent: React.FC<STTComponentProps> = ({
  setTranscript,
  onKeywordsExtracted,
  keywords: initialKeywords = [],
}) => {
  const URL = process.env.NEXT_PUBLIC_MAIN_SERVER_URL || "http://127.0.0.1:5000";
  const [isListening, setIsListening] = useState(false);
  const [localTranscript, setLocalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const speechRecognition: SpeechRecognition = new SpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;
      speechRecognition.lang = "ko-KR";

      speechRecognition.onstart = () => {
        console.log("음성 인식 시작");
      };

      speechRecognition.onend = () => {
        console.log("음성 인식 종료");
        setIsListening(false);
      };

      speechRecognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setLocalTranscript((prev) => prev + finalTranscript);
        setInterimTranscript(interimTranscript);
        setTranscript((prev) => prev + finalTranscript); // 상위 컴포넌트로 전달
        console.log("음성 인식 결과:", finalTranscript, interimTranscript);
      };

      speechRecognition.onerror = (event: any) => {
        console.error("음성 인식 오류:", event.error);
      };

      setRecognition(speechRecognition);
    } else {
      console.warn("Web Speech API is not supported in this browser.");
    }
  }, [setTranscript]);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
      console.log("음성 인식 시작됨");
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      console.log("음성 인식 중지됨");
    }
  };

  const extractKeywords = async () => {
    try {
      console.log(URL + "api/middleware/summarize");
      const response = await fetch(URL + "api/middleware/summarize", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: localTranscript }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("data:", data);
      // keyword가 단일 문자열이라면 배열로 감싸서 상태에 설정
      setKeywords([data.keyword]);
      onKeywordsExtracted(data.keyword, localTranscript); // 키워드와 transcript 전달
      setLocalTranscript(""); // 추출 후 STT 데이터 비우기
    } catch (error) {
      console.error("Error extracting keywords:", error);
    }
  };

  return (
    <div>
      <h1>Speech Recognition Example</h1>
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? "Stop Recognition" : "Start Recognition"}
      </button>
      <button onClick={extractKeywords} disabled={!localTranscript}>
        Extract Keywords
      </button>
      <p>
        <strong>Interim Transcript:</strong> {interimTranscript}
      </p>
      <div>
        <strong>Keywords:</strong>
        <ul>
          {keywords.length > 0 ? (
            keywords.map((keyword, index) => <li key={index}>{keyword}</li>)
          ) : (
            <li>No keywords extracted</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default STTComponent;
