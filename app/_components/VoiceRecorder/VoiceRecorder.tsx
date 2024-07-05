"use client";

import { useEffect, useState, useRef } from "react";
import SettingsSlider from "./SettingSlider";
import { useSocket } from "../Socket/SocketContext";
import { handleMicrophoneError } from "../../_utils/voiceErrorHandler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

interface VoiceRecorderProps {
  sessionId?: string | null;
  subscriber: any | null;
  publisher: any | null;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  sessionId,
  subscriber,
  publisher,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [audioURLs, setAudioURLs] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimestampRef = useRef<number | null>(null);

  const [recordingMode, setRecordingMode] = useState<boolean>(false);
  const [silenceThreshold, setSilenceThreshold] = useState<number>(0.07);
  const [silenceDuration, setSilenceDuration] = useState<number>(1000);
  const [maxRecordingDuration, setMaxRecordingDuration] =
    useState<number>(20000);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { socket } = useSocket();

  useEffect(() => {
    async function init() {
      try {
        console.log("마이크 접근 요청 중...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true,
            sampleRate: 8000, // 8kHz 전화 음질
            channelCount: 1, // 모노 마이크 채널
          },
        });
        mediaStreamRef.current = stream;
        console.log("마이크 접근 허용됨:", stream);

        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = 3; // 오디오 신호를 크게 증폭
        gainNodeRef.current = gainNode;

        try {
          console.log("AudioWorklet 모듈 로드 중...");
          await audioContext.audioWorklet.addModule(
            new URL("./worklet-processor.js", import.meta.url).toString()
          );
          console.log("AudioWorklet 모듈 로드 성공.");
        } catch (err) {
          console.error("AudioWorklet 모듈 로드 에러:", err);
          setError("AudioWorklet 모듈 로드 에러");
          return;
        }

        const mediaStreamSource = audioContext.createMediaStreamSource(stream);
        createWorkletNode(audioContext, silenceThreshold, silenceDuration);

        mediaStreamSource.connect(gainNode).connect(workletNodeRef.current!);
        workletNodeRef.current!.connect(audioContext.destination);

        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus'});
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            console.log("데이터 수신:", event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          if (audioChunksRef.current.length > 0) {
            const timestamp = startTimestampRef.current ?? Date.now();
            const webmBlob = new Blob(audioChunksRef.current, {
              type: "audio/webm; codecs=opus",
            });
            const arrayBuffer = await webmBlob.arrayBuffer();
            const audioBuffer = await decodeAudioData(arrayBuffer);
            const wavBlob = audioBufferToWavBlob(audioBuffer);
            sendAudioToServer(wavBlob, timestamp);
            const url = URL.createObjectURL(wavBlob);
            setAudioURLs((prev) => [...prev, url]);
            audioChunksRef.current = [];
            console.log("녹음 저장됨:", url);
          }
        };
      } catch (err: any) {
        console.error("오디오 스트림 접근 에러:", err);
        handleMicrophoneError(err, setError);
      }
    }

    init();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ threshold: silenceThreshold });
    }
  }, [silenceThreshold]);

  useEffect(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ duration: silenceDuration });
    }
  }, [silenceDuration]);

  useEffect(() => {
    if (workletNodeRef.current) {
      if (recordingMode) {
        workletNodeRef.current.port.onmessage = (event) => {
          if (event.data.isSilent) {
            stopRecording(true);
          } else {
            startRecording();
          }
        };
      } else {
        workletNodeRef.current.port.onmessage = null;
      }
    }
  }, [recordingMode]);

  useEffect(() => {
    if (!publisher) {
      console.error("퍼블리셔가 아직 준비되지 않았습니다");
      return;
    }
    publisher.publishAudio(recordingMode);
  }, [recordingMode]);

  const createWorkletNode = (
    audioContext: AudioContext,
    threshold: number,
    duration: number
  ) => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
    }

    const workletNode = new AudioWorkletNode(
      audioContext,
      "silence-detector-processor",
      {
        processorOptions: { threshold, duration },
      }
    );

    workletNode.port.onmessage = (event) => {
      if (recordingMode) {
        if (event.data.isSilent) {
          stopRecording(true);
        } else {
          startRecording();
        }
      }
    };

    workletNodeRef.current = workletNode;
  };

  const startRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "recording"
    ) {
      startTimestampRef.current = Date.now(); // 녹음 시작 시의 타임스탬프 저장
      mediaRecorderRef.current.start();
      setRecording(true);
      console.log("녹음 시작됨");

      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      recordingTimeoutRef.current = setTimeout(() => {
        console.log("최대 녹음 시간 도달, 녹음 중지...");
        stopRecording(true);
      }, maxRecordingDuration);
    }
  };

  const stopRecording = (save: boolean = false) => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      console.log("녹음 중지됨");

      if (save && audioChunksRef.current.length > 0) {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm; codecs=opus" });
        const url = URL.createObjectURL(blob);
        setAudioURLs((prev) => [...prev, url]);
        audioChunksRef.current = [];
        console.log("녹음 저장됨");
      } else {
        audioChunksRef.current = []; // Save false 시, 버퍼 비우기
      }
    }
  };

  const decodeAudioData = async (arrayBuffer: ArrayBuffer): Promise<AudioBuffer> => {
    const audioContext = audioContextRef.current!;
    return await audioContext.decodeAudioData(arrayBuffer);
  };

  const audioBufferToWavBlob = (audioBuffer: AudioBuffer): Blob => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    // Write WAV container
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // Write format chunk
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numberOfChannels);
    setUint32(audioBuffer.sampleRate);
    setUint32(audioBuffer.sampleRate * 2 * numberOfChannels); // avg. bytes/sec
    setUint16(numberOfChannels * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this demo)

    // Write data chunk
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // Write interleaved data
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numberOfChannels; i++) { // interleave channels
        let sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767); // scale to 16-bit signed int
        view.setInt16(pos, sample, true); // write 16-bit sample
        pos += 2;
      }
      offset++; // next source sample
    }

    return new Blob([buffer], { type: 'audio/wav' });

    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  };

  const sendAudioToServer = (blob: Blob, timestamp: number) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (arrayBuffer) {
        console.log(arrayBuffer);
        socket.emit("stt", [sessionId, arrayBuffer, timestamp]);
        console.log("오디오 데이터 전송 중");
      } else {
        console.error("블롭을 읽는데 실패했습니다");
      }
    };
    reader.readAsArrayBuffer(blob);
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSilenceThreshold(parseFloat(event.target.value));
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSilenceDuration(parseInt(event.target.value));
  };

  const toggleRecordingMode = () => {
    if (!publisher) {
      console.error("퍼블리셔가 아직 준비되지 않았습니다");
      return;
    }
    setRecordingMode((prev) => !prev);
    if (recordingMode === false) {
      publisher.publishAudio(false);
    } else {
      publisher.publishAudio(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error ? (
        <p>{error}</p>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <SettingsSlider
              label="음성 인식 감도 :"
              min={0.01}
              max={1}
              step={0.01}
              value={silenceThreshold}
              onChange={handleSliderChange}
            />
            <SettingsSlider
              label="침묵 인식(초) :"
              min={0}
              max={5}
              step={0.5}
              value={silenceDuration / 1000}
              onChange={(e) =>
                handleDurationChange({
                  ...e,
                  target: {
                    ...e.target,
                    value: (parseFloat(e.target.value) * 1000).toString(),
                  },
                })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              className="bg-none border-none text-xl cursor-pointer text-gray-700 hover:text-gray-500"
              onClick={toggleRecordingMode}
            >
              <FontAwesomeIcon
                icon={recordingMode ? faMicrophone : faMicrophoneSlash}
              />
            </button>
            {recordingMode && recording && (
              <span className="flex items-center gap-2 text-sm text-red-500">
                <FontAwesomeIcon icon={faCircle} className="text-base" />
                음성 인식 중...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
