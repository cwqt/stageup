import { IPerformance, LiveStreamState } from "@core/interfaces";

// https://devshawn.com/blog/apache-kafka-topic-naming-conventions/
export enum TopicType {
  StreamStateChanged = "stream-state-changed"
}

export type TopicDataUnion = {
  [TopicType.StreamStateChanged]: {
    performance_id: IPerformance["_id"];
    state: LiveStreamState;
  };
};
