import {
  Accordion,
  AccordionItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";
import type { Pod } from "@/api/types";
import { formatDuration } from "@/lib/format-duration";
import styles from "./ServiceTile.module.scss";

/** The pods behind one service, collapsed by default (FE-079). */
export function PodTable({ service, pods }: { service: string; pods: readonly Pod[] }) {
  return (
    <Accordion size="sm" className={styles.pods}>
      <AccordionItem title={`Pods (${pods.length})`}>
        {pods.length === 0 ? (
          <p className={styles.noPods}>No pods are running.</p>
        ) : (
          <Table size="xs" aria-label={`Pods of ${service}`} useZebraStyles={false}>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Phase</TableHeader>
                <TableHeader>Ready</TableHeader>
                <TableHeader>Restarts</TableHeader>
                <TableHeader>Age</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {pods.map((pod) => (
                <TableRow key={pod.name}>
                  <TableCell className={styles.mono}>{pod.name}</TableCell>
                  <TableCell>{pod.phase}</TableCell>
                  <TableCell>{pod.ready ? "Yes" : "No"}</TableCell>
                  <TableCell className={styles.mono}>{pod.restarts}</TableCell>
                  <TableCell className={styles.mono}>{formatDuration(pod.ageSeconds)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AccordionItem>
    </Accordion>
  );
}
