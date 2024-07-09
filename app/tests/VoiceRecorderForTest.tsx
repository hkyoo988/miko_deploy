"use client";

import { useEffect, useState, useRef } from "react";
import SettingsSlider from "../_components/VoiceRecorder/SettingSlider";
import styles from "../_components/VoiceRecorder/VoiceRecorder.module.css";
import { handleMicrophoneError } from "../_utils/voiceErrorHandler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
  faCircle,
  faDownload,
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

  const [recordingMode, setRecordingMode] = useState<boolean>(false);
  const [silenceThreshold, setSilenceThreshold] = useState<number>(0.07);
  const [silenceDuration, setSilenceDuration] = useState<number>(1000);
  const [maxRecordingDuration, setMaxRecordingDuration] =
    useState<number>(20000);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);


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
            channelCount: 1,  // 모노 마이크 채널
          },
        });
        mediaStreamRef.current = stream;
        console.log("마이크 접근 허용됨:", stream);

        const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = 3; // 오디오 신호를 크게 증폭
        console.log("gain:", gainNode.gain.value);
        gainNodeRef.current = gainNode;

        try {
          console.log("AudioWorklet 모듈 로드 중...");
          await audioContext.audioWorklet.addModule(
              new URL("../_components/VoiceRecorder/worklet-processor.js", import.meta.url).toString()
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

        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' });
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            console.log("데이터 수신:", event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          if (audioChunksRef.current.length > 0) {
            const webmBlob = new Blob(audioChunksRef.current, { type: 'audio/webm; codecs=opus' });
            const arrayBuffer = await webmBlob.arrayBuffer();
            const audioBuffer = await decodeAudioData(arrayBuffer);
            const wavBlob = audioBufferToWavBlob(audioBuffer);
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
        const webmBlob = new Blob(audioChunksRef.current, { type: 'audio/webm; codecs=opus' });
        convertWebmToWav(webmBlob).then(wavBlob => {
          const url = URL.createObjectURL(wavBlob);
          setAudioURLs((prev) => [...prev, url]);
          audioChunksRef.current = [];
          console.log("녹음 저장됨:", url);
        });
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

  const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await decodeAudioData(arrayBuffer);
    return audioBufferToWavBlob(audioBuffer);
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSilenceThreshold(parseFloat(event.target.value));
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSilenceDuration(parseInt(event.target.value));
  };

  const toggleRecordingMode = () => {
    setRecordingMode((prev) => !prev);
  };

  const downloadAudio = (url: string) => {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "recording.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={styles.container}>
      {error ? (
        <p>{error}</p>
      ) : (
          <div className={styles.controls}>
            <div className={styles.sliderContainer}>
              <SettingsSlider
                  label="음성 인식 감도:"
                  min={0.01}
                  max={2}
                  step={0.01}
                  value={silenceThreshold}
                  onChange={handleSliderChange}
              />
              <SettingsSlider
                  label="침묵 인식 시간 (초):"
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
            <div className={styles.recordingControl}>
              <button
                  className={styles.recordingButton}
                  onClick={toggleRecordingMode}
              >
                <FontAwesomeIcon
                    icon={recordingMode ? faMicrophone : faMicrophoneSlash}
                />
              </button>
              {recordingMode && recording && (
                  <span className={styles.recordingIndicator}>
                <FontAwesomeIcon
                    icon={faCircle}
                    className={styles.recordingIcon}
                />
                음성 인식 중...
              </span>
              )}
            </div>
            <div className={styles.audioList}>
              {audioURLs.map((url, index) => (
                  <div key={index} className={styles.audioItem}>
                    <audio controls src={url}/>
                    <button
                        className={styles.downloadButton}
                        onClick={() => downloadAudio(url)}
                    >
                      <FontAwesomeIcon icon={faDownload}/> Download
                    </button>
                  </div>
              ))}
            </div>
          </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
