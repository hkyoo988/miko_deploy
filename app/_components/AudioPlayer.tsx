import React, { useEffect, useState, useRef } from "react";
import { FaPlay, FaPause, FaForward, FaBackward } from "react-icons/fa";
import styles from "../styles/AudioPlayer.module.css";

const APPLICATION_SERVER_URL =
  process.env.NEXT_PUBLIC_MAIN_SERVER_URL || "http://localhost:8080/";

interface AudioPlayerProps {
  meetingId: string;
  seekTime: number | null;
  onTimeUpdate: (currentTime: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  meetingId,
  seekTime,
  onTimeUpdate,
}) => {
  const [audioSrc, setAudioSrc] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const response = await fetch(
          `${APPLICATION_SERVER_URL}api/meeting/${meetingId}/record`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAudioSrc(url);
      } catch (error) {
        console.error("Error fetching audio: ", error);
      }
    };

    fetchAudio();
  }, [meetingId]);

  useEffect(() => {
    if (seekTime !== null && audioRef.current) {
      audioRef.current.currentTime = seekTime;
      audioRef.current.play();
    }
  }, [seekTime]);

  useEffect(() => {
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        onTimeUpdate(audioRef.current.currentTime);
        if (sliderRef.current) {
          const percentage = (audioRef.current.currentTime / duration) * 100;
          sliderRef.current.style.setProperty(
            "--seek-before-width",
            `${percentage}%`
          );
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener("timeupdate", handleTimeUpdate);
      audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener("timeupdate", handleTimeUpdate);
        audioElement.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
      }
    };
  }, [onTimeUpdate, duration]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(event.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const rewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 5;
    }
  };

  const forward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 5;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className={styles.audioPlayer}>
      <audio ref={audioRef} src={audioSrc} className={styles.hiddenAudio} />
      <input
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={handleSeek}
        className={styles.seekSlider}
        ref={sliderRef}
      />
      <div className={styles.controls}>
        <span className={styles.time}>{formatTime(currentTime)}</span>
        <button onClick={rewind} className={styles.controlButton}>
          <FaBackward />
        </button>
        <button onClick={togglePlayPause} className={styles.playPauseButton}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button onClick={forward} className={styles.controlButton}>
          <FaForward />
        </button>
        <span className={styles.time}>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default AudioPlayer;
