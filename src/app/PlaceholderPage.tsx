import { EmptyState, PageHeader } from "@/components";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

/** Stand-in for screens built in later milestones (history, stats, leaderboard: M3). */
export function PlaceholderPage({ title }: { title: string }) {
  useDocumentTitle(title);
  return (
    <>
      <PageHeader title={title} />
      <EmptyState title="Coming soon" action={{ label: "Go to scenarios", to: "/scenarios" }}>
        This screen arrives in a later milestone.
      </EmptyState>
    </>
  );
}
