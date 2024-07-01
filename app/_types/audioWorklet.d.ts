declare class AudioWorkletProcessor {
    constructor(options?: AudioWorkletNodeOptions);
    readonly port: MessagePort;
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}

declare function registerProcessor(name: string, processorCtor: (new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor)): void;

interface AudioWorkletNodeOptions extends AudioNodeOptions {
    numberOfInputs?: number;
    numberOfOutputs?: number;
    outputChannelCount?: number[];
    parameterData?: Record<string, number>;
    processorOptions?: any;
}

interface AudioWorkletNode extends AudioNode {
    port: MessagePort;
}

interface AudioWorklet {
    addModule(moduleURL: string, options?: WorkletOptions): Promise<void>;
}

interface BaseAudioContext extends EventTarget {
    readonly audioWorklet: AudioWorklet;
}

interface Window {
    webkitAudioContext: typeof AudioContext;
}
