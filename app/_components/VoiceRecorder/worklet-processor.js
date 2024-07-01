class SilenceDetectorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.silenceThreshold = 0.07;  // 기본 침묵 임계값 0.07
    this.silenceDuration = 1000; // 기본 침묵 시간 1초
    this.lastActiveTime = currentTime;
    this.isSilent = true;

    this.port.onmessage = (event) => {
      if (event.data.threshold !== undefined) {
        this.silenceThreshold = event.data.threshold;
        // console.log(`Updated silence threshold: ${this.silenceThreshold}`);
      }
      if (event.data.duration !== undefined) {
        this.silenceDuration = event.data.duration;
        // console.log(`Updated silence duration: ${this.silenceDuration}`);
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const channelData = input[0];

    let isSilent = true;
    for (let i = 0; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) > this.silenceThreshold) {
        isSilent = false;
        this.lastActiveTime = currentTime;
        break;
      }
    }

    if (isSilent !== this.isSilent) {
      this.isSilent = isSilent;
    }

    if (currentTime - this.lastActiveTime > this.silenceDuration / 1000) {
      this.port.postMessage({ isSilent: true });
    } else {
      this.port.postMessage({ isSilent: false });
    }

    return true;
  }
}

registerProcessor('silence-detector-processor', SilenceDetectorProcessor);
