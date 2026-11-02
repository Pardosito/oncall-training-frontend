import { EmptyState, PageHeader } from "@/components";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Not found");
  return (
    <>
      <PageHeader title="Page not found" />
      <EmptyState
        title="There's nothing at this address"
        action={{ label: "Go to scenarios", to: "/scenarios" }}
      >
        Check the link, or pick a scenario to practice.
      </EmptyState>
    </>
  );
}
