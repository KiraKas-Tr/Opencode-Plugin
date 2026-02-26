export type AgentConfig = {
  model?: string;
  temperature?: number;
  top_p?: number;
  prompt?: string;
  tools?: {
    [key: string]: boolean;
  };
  disabled?: boolean;
  description?: string;
  mode?: "subagent" | "primary" | "all";
  color?: string;
  maxSteps?: number;
  permission?: {
    edit?: "ask" | "allow" | "deny";
    bash?:
      | ("ask" | "allow" | "deny")
      | {
          [key: string]: "ask" | "allow" | "deny";
        };
    webfetch?: "ask" | "allow" | "deny";
    doom_loop?: "ask" | "allow" | "deny";
    external_directory?: "ask" | "allow" | "deny";
  };
  [key: string]: unknown;
};

export type CommandConfig = {
  template: string;
  description?: string;
  agent?: string;
  subtask?: boolean;
  model?: string;
};
