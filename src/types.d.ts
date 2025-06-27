// TypeScript declarations for compatibility with Angular v16

declare module "web-audio-beat-detector-worker/build/es2019/interfaces/web-audio-beat-detector-worker-custom-definition" {
  interface ITempoSettings {
    // Add your tempo settings interface if needed
  }

  interface TMessage {
    [key: string]: any;
    analyze?: {
      params: {
        channelData: Float32Array;
        sampleRate: number;
        tempoSettings?: ITempoSettings;
      };
      response: { result: number };
    };
    guess?: {
      params: {
        channelData: Float32Array;
        sampleRate: number;
        tempoSettings?: ITempoSettings;
      };
      response: { result: { bpm: number; offset: number; tempo: number } };
    };
  }
}

declare module "web-audio-beat-detector" {
  export function analyze(buffer: AudioBuffer): Promise<number>;
  export function guess(
    buffer: AudioBuffer
  ): Promise<{ bpm: number; offset: number; tempo: number }>;
}
