import { Logout } from "@carbon/icons-react";
import {
  Content,
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  SkipToContent,
} from "@carbon/react";
import { Link, Outlet, useLocation } from "react-router";
import { useCurrentUser, useSignOut } from "@/auth";
import styles from "./AppShell.module.scss";

const NAV = [
  { to: "/scenarios", label: "Scenarios" },
  { to: "/history", label: "History" },
  { to: "/stats", label: "Stats" },
  { to: "/leaderboard", label: "Leaderboard" },
] as const;

/** Carbon UI Shell: header, navigation and the main content area (ARCHITECTURE §2–§3). */
export function AppShell() {
  const { pathname } = useLocation();
  const user = useCurrentUser();
  const signOut = useSignOut();

  return (
    <>
      <Header aria-label="On-Call Training">
        <SkipToContent />
        <HeaderName as={Link} to="/" prefix="">
          On-Call Training
        </HeaderName>
        {user ? (
          <HeaderNavigation aria-label="Main">
            {NAV.map(({ to, label }) => {
              const active = pathname === to || pathname.startsWith(`${to}/`);
              return (
                <HeaderMenuItem
                  key={to}
                  as={Link}
                  to={to}
                  isActive={active}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </HeaderMenuItem>
              );
            })}
          </HeaderNavigation>
        ) : null}
        {user ? (
          <HeaderGlobalBar>
            <span className={styles.user}>{user.username}</span>
            <HeaderGlobalAction aria-label="Sign out" tooltipAlignment="end" onClick={signOut}>
              <Logout size={20} />
            </HeaderGlobalAction>
          </HeaderGlobalBar>
        ) : null}
      </Header>
      <Content id="main-content" className={styles.content}>
        <Outlet />
      </Content>
    </>
  );
}
