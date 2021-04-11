// transmit as having no type so we can use .onmessage
export type SseEvent<T> = { type: SseEventType, data?: T }

export enum SseEventType {
  Connected = "connected", // first time message
  Disconnected = "disconnected", // connection closed by server
  StreamStateChanged = "stream-state-changed",
}