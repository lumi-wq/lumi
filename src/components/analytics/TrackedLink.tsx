"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackSelectContent } from "@/lib/ga";

type Props = ComponentProps<typeof Link> & {
  contentType: string;
  contentId: string;
};

export function TrackedLink({ contentType, contentId, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackSelectContent(contentType, contentId);
        onClick?.(e);
      }}
    />
  );
}
