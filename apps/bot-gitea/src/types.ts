export interface GiteaPullRequestPayload {
  action: string;
  repository: {
    clone_url: string;
    full_name: string;
    owner: {
      username: string;
      login?: string;
    };
    name: string;
  };
  pull_request: {
    number: number;
    head: {
      ref: string;
      sha: string;
    };
  };
}

export interface GiteaComment {
  id: number;
  body: string;
}
