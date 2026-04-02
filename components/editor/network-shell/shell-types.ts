import type { ReactNode } from "react";

export type XShellProps = {
  format: "single_image" | "thread_card";
  displayName: string;
  handle: string;
  tweetText?: string;
  children: ReactNode;
  className?: string;
};

export type LinkedInShellProps = {
  format: "single_image" | "portrait" | "document_cover";
  fullName: string;
  jobTitle?: string;
  postText?: string;
  children: ReactNode;
  className?: string;
};
