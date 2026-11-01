import type { KeyboardEvent, MouseEvent } from "react";
import { useNavigate } from "react-router";

/**
 * For Carbon components that render a plain <a href> (ClickableTile): navigate inside the SPA on
 * a normal click, but let modified clicks (new tab, new window) behave like a regular link.
 */
export function useSpaLinkClick() {
  const navigate = useNavigate();
  return (to: string) =>
    (event: MouseEvent<HTMLAnchorElement> | KeyboardEvent<HTMLAnchorElement>) => {
      if (
        "button" in event &&
        (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      ) {
        return;
      }
      event.preventDefault();
      void navigate(to);
    };
}
