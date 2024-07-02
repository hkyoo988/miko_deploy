import React, { useEffect, useRef } from 'react';

interface VideoComponentProps {
  selectedVideoDeviceId: string | null;
  selectedAudioDeviceId: string | null;
}

const VideoComponent: React.FC<VideoComponentProps> = ({ selectedVideoDeviceId, selectedAudioDeviceId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraStream = async (videoDeviceId: string | null, audioDeviceId: string | null) => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      if (videoDeviceId === 'off' && audioDeviceId === 'off') {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoDeviceId && videoDeviceId !== 'off' ? { deviceId: { exact: videoDeviceId } } : false,
          audio: audioDeviceId && audioDeviceId !== 'off' ? { deviceId: { exact: audioDeviceId } } : false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices: ", err);
      }
    };

    getCameraStream(selectedVideoDeviceId, selectedAudioDeviceId);
  }, [selectedVideoDeviceId, selectedAudioDeviceId]);

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '600px', 
      height: 'auto', 
      borderRadius: '12px', 
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)', 
      overflow: 'hidden', 
      marginBottom: '20px',
      textAlign: 'center'
    }}>
      <video 
        ref={videoRef} 
        width="640" 
        height="480" 
        autoPlay 
        style={{ 
          width: '100%', 
          height: 'auto', 
          borderRadius: '12px' 
        }} 
      ></video>
    </div>
  );
};

export default VideoComponent;
