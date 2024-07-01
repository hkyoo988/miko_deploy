import React from "react";

const AudioPlayer: React.FC = () => (
  <audio controls>
    <source src="/audio/sample.mp3" type="audio/mp3" />
    Your browser does not support the audio element.
  </audio>
);

export default AudioPlayer;
