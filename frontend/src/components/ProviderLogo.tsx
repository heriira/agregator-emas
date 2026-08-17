"use client";

import { useState } from "react";
import { MediaImage } from "iconoir-react";
import { cn } from "@/lib/utils";

interface ProviderLogoProps {
  logo: string | null;
  displayName: string;
  className?: string;
}

export function ProviderLogo({ logo, displayName, className }: ProviderLogoProps) {
  const [failedToLoad, setFailedToLoad] = useState(false);

  if (logo && !failedToLoad) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={displayName}
        className={cn("shrink-0 object-cover", className)}
        onError={() => setFailedToLoad(true)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={displayName}
      className={cn(
        "flex shrink-0 items-center justify-center bg-muted text-muted-foreground",
        className
      )}
    >
      <MediaImage className="h-1/2 w-1/2" />
    </div>
  );
}
