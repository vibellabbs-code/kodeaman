export interface TeamConfig {
  teamId: string;
  teamName: string;
  members: Array<{
    name: string;
    email?: string;
    role: "admin" | "developer" | "viewer";
  }>;
  projects: string[];
}
