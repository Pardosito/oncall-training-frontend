import {
  Button,
  InlineNotification,
  SkeletonPlaceholder,
  SkeletonText,
  Stack,
  Tile,
} from "@carbon/react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { isApiError } from "@/api/errors";
import { errorMessage } from "@/api/error-messages";
import styles from "./states.module.scss";

type EmptyStateProps = {
  title: string;
  children?: ReactNode;
  action?: { label: string; to: string };
};

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <Tile className={styles.empty}>
      <Stack gap={4}>
        <h2 className={styles.title}>{title}</h2>
        {children ? <p className={styles.text}>{children}</p> : null}
        {action ? (
          <div>
            <Button as={Link} to={action.to} kind="tertiary" size="md">
              {action.label}
            </Button>
          </div>
        ) : null}
      </Stack>
    </Tile>
  );
}

type ErrorStateProps = {
  error: unknown;
  title?: string;
  onRetry?: () => void;
};

/** Page-level error with mapped copy and an optional Retry (CONVENTIONS §5.7). */
export function ErrorState({ error, title = "Something went wrong", onRetry }: ErrorStateProps) {
  const requestId = import.meta.env.DEV && isApiError(error) ? error.requestId : undefined;
  return (
    <Stack gap={4}>
      <InlineNotification
        kind="error"
        lowContrast
        hideCloseButton
        title={title}
        subtitle={requestId ? `${errorMessage(error)} (request ${requestId})` : errorMessage(error)}
      />
      {onRetry ? (
        <div>
          <Button kind="secondary" size="md" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </Stack>
  );
}

export function PageSkeleton() {
  return (
    <Stack gap={6} aria-busy="true" aria-label="Loading">
      <SkeletonText heading width="40%" />
      <SkeletonText paragraph lineCount={2} />
      <SkeletonPlaceholder className={styles.block} />
    </Stack>
  );
}
