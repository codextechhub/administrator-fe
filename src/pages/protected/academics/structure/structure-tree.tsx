import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useBranchLens } from "@/hooks/use-branch-lens";
import { useSessionLens } from "@/hooks/use-session-lens";
import { useGetStructureTreeQuery } from "@/redux/services/academics/academics-api";
import type { TreeRow } from "@/redux/services/academics/academics-types";

// ─────────────────────────────────────────────────────────────────────────────
// The structure tree.
//
// The API returns a FLAT pre-order list with a `depth` on each row and no
// "has children" flag, so both facts are derived here: a row has children when
// the next row is deeper, and a row is visible when every one of its ancestors
// is open. Deriving beats asking the server for a nested document - the flat
// list is one query per level of the tree rather than one per parent, which is
// the whole reason this screen is safe to serve unpaginated.
//
// Depth is fetched lazily. The default stops at levels with counts, and that
// cap is what keeps the payload bounded; classes and subjects are only asked
// for once somebody actually opens a level.
// ─────────────────────────────────────────────────────────────────────────────

interface Node extends TreeRow {
  hasChildren: boolean;
  /** Index of this row's parent in the flat list, or -1 for the root. */
  parent: number;
}

function toNodes(rows: TreeRow[]): Node[] {
  // The last row seen at each depth is the parent of anything one level deeper.
  const lastAtDepth: number[] = [];
  return rows.map((row, i) => {
    lastAtDepth[row.depth] = i;
    return {
      ...row,
      hasChildren: i + 1 < rows.length && rows[i + 1].depth > row.depth,
      parent: row.depth === 0 ? -1 : lastAtDepth[row.depth - 1] ?? -1,
    };
  });
}

export function StructureTree() {
  const { branch, applies: multiBranch } = useBranchLens();
  const { current } = useSessionLens();

  // Once true it stays true: collapsing a level does not make the extra rows
  // expensive again, and refetching back down would drop the reader's state.
  const [full, setFull] = useState(false);
  // The root is open by default. Everything below starts closed, so the first
  // paint is the programme list rather than four hundred rows.
  const [open, setOpen] = useState<Record<string, boolean>>({ session: true });
  // "Expand all" cannot be a snapshot of the open map: the classes and subjects
  // it is meant to reveal have not been fetched at the moment it is pressed, so
  // a map written then would stop at the levels and the reader would have to
  // press it a second time for the rows that had just arrived. Holding it as a
  // MODE instead means the deeper rows are already open when they land.
  const [expandAll, setExpandAll] = useState(false);

  const { data, isLoading, isFetching } = useGetStructureTreeQuery({
    branch,
    session: current?.id,
    full,
  });

  const nodes = useMemo(() => toNodes(data?.data.rows ?? []), [data]);

  const openMap = useMemo(() => {
    if (!expandAll) return open;
    return nodes.reduce<Record<string, boolean>>((acc, n) => {
      if (n.hasChildren) acc[n.id] = true;
      return acc;
    }, {});
  }, [expandAll, open, nodes]);

  const visible = useMemo(() => {
    const shown: Node[] = [];
    nodes.forEach((node, i) => {
      let p = node.parent;
      while (p !== -1) {
        if (!openMap[nodes[p].id]) return;
        p = nodes[p].parent;
      }
      shown.push({ ...node, parent: i });
    });
    return shown;
  }, [nodes, openMap]);

  // "Expand all" until every expandable node is open, not until ONE is. The
  // root starts open, so `some` would have labelled the button "Collapse all"
  // on first paint - offering to undo a state the reader never chose.
  const expandable = useMemo(() => nodes.filter((n) => n.hasChildren), [nodes]);
  const allOpen =
    expandAll || (expandable.length > 0 && expandable.every((n) => openMap[n.id]));

  const toggle = (node: Node) => {
    // Opening a level is the moment classes and subjects become worth fetching.
    if (node.kind === "Level" && !full) setFull(true);
    // Leaving the expand-all mode keeps what is on screen: the derived map
    // becomes the manual one, with this node flipped.
    setOpen({ ...openMap, [node.id]: !openMap[node.id] });
    setExpandAll(false);
  };

  const toggleAll = () => {
    if (allOpen) {
      setExpandAll(false);
      return setOpen({});
    }
    if (!full) setFull(true);
    setExpandAll(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-md bg-white p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded" />
        ))}
      </div>
    );
  }

  return (
    <section className="min-w-0 rounded-md bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white-02 px-4 py-3">
        <p className="text-sm text-gray-01 text-pretty">
          Expand a programme to see its levels, then a level to see its classes
          and the subjects offered there.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="border-primary text-primary"
          onClick={toggleAll}
          disabled={!nodes.length}
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </Button>
      </div>

      {/* Wide content scrolls inside its own box; the page never does. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-05">
              <th className="px-4 py-2 font-medium">Structure</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Contains</th>
              {multiBranch && <th className="px-4 py-2 font-medium">Scope</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((node) => (
              <tr
                key={node.id}
                className={cn("border-t border-white-02", node.depth === 0 && "bg-white-05")}
              >
                <td className="px-4 py-2">
                  <div
                    className="flex items-center gap-1.5"
                    style={{ paddingLeft: `${node.depth * 1.25}rem` }}
                  >
                    {node.hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggle(node)}
                        aria-expanded={!!openMap[node.id]}
                        aria-label={`${openMap[node.id] ? "Collapse" : "Expand"} ${node.label}`}
                        className="grid size-5 shrink-0 place-content-center rounded text-gray-06 hover:bg-gray-04"
                      >
                        {openMap[node.id] ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>
                    ) : (
                      <span className="size-5 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "min-w-0 truncate",
                        node.depth === 0 && "font-semibold text-black-01",
                        node.depth === 1 && "font-medium text-black-01",
                        node.depth > 2 && "text-gray-01",
                      )}
                    >
                      {node.label}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-05">{node.kind}</td>
                <td className="px-4 py-2 text-gray-01">{node.contains}</td>
                {multiBranch && (
                  <td className="px-4 py-2">
                    {node.scope_label ? (
                      node.is_shared ? (
                        <Badge variant="blue" className="rounded-full py-0 text-xs">
                          {node.scope_label}
                        </Badge>
                      ) : (
                        <span className="text-gray-05">{node.scope_label}</span>
                      )
                    ) : null}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFetching && (
        <p className="border-t border-white-02 px-4 py-2 text-xs text-gray-05">
          Loading classes and subjects…
        </p>
      )}
    </section>
  );
}
