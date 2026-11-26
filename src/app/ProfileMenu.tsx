import { Logout, UserAvatar } from "@carbon/icons-react";
import { Button, HeaderGlobalAction, HeaderPanel } from "@carbon/react";
import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router";
import { useCurrentUser, useSignOut } from "@/auth";
import styles from "./AppShell.module.scss";

/**
 * Carbon UI Shell account switcher: the user avatar in the header opens a panel with who is
 * signed in and the sign-out button. Closes on Escape, on a click outside and on navigation.
 */
export function ProfileMenu() {
  const user = useCurrentUser();
  const signOut = useSignOut();
  const { pathname } = useLocation();
  // Open for one path only, so navigating closes it without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null);
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenOn(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={rootRef} className={styles.profile}>
      <HeaderGlobalAction
        aria-label="Account"
        aria-expanded={open}
        aria-controls={panelId}
        isActive={open}
        tooltipAlignment="end"
        onClick={() => setOpen(!open)}
      >
        <UserAvatar size={20} />
      </HeaderGlobalAction>
      <HeaderPanel expanded={open} aria-label="Account">
        {open ? (
          <div id={panelId} className={styles.panelBody}>
            <UserAvatar size={32} aria-hidden="true" />
            <p className={styles.panelLabel}>Signed in as</p>
            <p className={styles.panelName}>{user.username}</p>
            <Button kind="secondary" size="md" renderIcon={Logout} onClick={signOut}>
              Sign out
            </Button>
          </div>
        ) : null}
      </HeaderPanel>
    </div>
  );
}
