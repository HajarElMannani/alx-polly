export type PollOption = {
  id: string;
  label: string;
  votes?: number;
};

export type Poll = {
  id: string;
  title: string;
  options: PollOption[];
  authorId?: string;
  createdAt?: string;
};

export type User = {
  id: string;
  email: string;
  name?: string;
};
