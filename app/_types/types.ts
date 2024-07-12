export interface Node {
  id: number;
  label: string;
  content: string;
  color?: string;
  size: number;
  font: { size: number }
  // mass: number;
}

export interface Edge {
  id: number | string;
  from: number;
  to: number;
}

export interface Conversation {
  _id: string;
  user: string;
  script: string;
  timestamp: string;
  time_offset: number;
  __v: number;
}
