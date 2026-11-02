import { useEffect } from "react";

export const APP_TITLE = "On-Call Training";

/** "Scenarios" → "Scenarios · On-Call Training". */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_TITLE}` : APP_TITLE;
  }, [title]);
}
