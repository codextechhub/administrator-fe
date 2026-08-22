import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import {
  useGetPermissionCatalogueQuery,
  useGetSchoolRoleQuery,
  useUpdateSchoolRolePermissionsMutation,
} from "@/redux/services/roles/roles-api";
import { apiErrorMessage } from "@/utils/api-error";
import { MODULE_LABEL } from "../onboarding-labels";

/**
 * "Role preview" - what a role can reach, and changing it.
 *
 * Two things about this are not cosmetic.
 *
 * **The save replaces rather than adds.** `permission_keys` on the role
 * endpoint is the role's whole grant list: anything it does not name is
 * dropped. So the drawer always sends every ticked box, and its state starts
 * from what the role actually holds rather than from empty.
 *
 * **A locked role is read-only, and says so.** CodeX seeds and owns the
 * baseline roles; the server refuses to change a locked one, so the boxes are
 * disabled and there is no Save rather than a Save that fails.
 */
export function RoleDrawer({
  roleKey,
  onClose,
}: {
  roleKey: string | null;
  onClose: () => void;
}) {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(P.MODIFY_ROLE);

  const role = useGetSchoolRoleQuery(roleKey as string, { skip: !roleKey });
  const catalogue = useGetPermissionCatalogueQuery(undefined, { skip: !roleKey });
  const [save, { isLoading: saving }] = useUpdateSchoolRolePermissionsMutation();

  const detail = role.data?.data;
  const locked = detail?.is_locked ?? false;
  const readOnly = locked || !canEdit;

  /** What the role holds on the server right now. */
  const baseline = useMemo(
    () =>
      new Set(
        (detail?.role_permissions ?? [])
          .filter((row) => row.granted)
          .map((row) => row.permission),
      ),
    [detail],
  );

  // Edits carry the role they belong to, so opening a different role falls
  // straight back to that role's own grants. The alternative - resetting in an
  // effect when the key changes - renders one frame of the previous role's
  // ticks against the new role's name, which is a lie about what is granted.
  const [edits, setEdits] = useState<{ key: string; set: Set<string> } | null>(
    null,
  );
  const ticked = edits && edits.key === roleKey ? edits.set : baseline;
  const dirty = !!edits && edits.key === roleKey;

  const modules = useMemo(() => catalogue.data?.data ?? [], [catalogue.data]);

  // Built from the PREVIOUS edit rather than from the render-time set. Two
  // boxes ticked inside one render both read the same stale set otherwise, and
  // the second silently discards the first - which on a list of 343 checkboxes
  // is not a rare race, it is ordinary use.
  const toggle = (key: string) => {
    if (!roleKey) return;
    setEdits((current) => {
      const from = current && current.key === roleKey ? current.set : baseline;
      const next = new Set(from);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { key: roleKey, set: next };
    });
  };

  const close = () => {
    setEdits(null);
    onClose();
  };

  const commit = async () => {
    if (!roleKey) return;
    try {
      await save({ key: roleKey, permission_keys: [...ticked] }).unwrap();
      toast.success(`Permissions updated for ${detail?.name ?? "the role"}.`);
      close();
    } catch (error) {
      toast.error(
        apiErrorMessage(error, "We could not save those permissions. Try again."),
      );
    }
  };

  const loading = role.isLoading || catalogue.isLoading;

  return (
    <Sheet open={!!roleKey} onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-full sm:max-w-[440px] flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-gray-05 font-mont">
            Role preview
          </p>
          <SheetTitle className="mt-1 text-lg font-semibold font-mont text-black-01">
            {detail?.name ?? roleKey ?? ""}
          </SheetTitle>
          <SheetDescription className="text-[13px] text-gray-06 text-pretty">
            {readOnly
              ? locked
                ? "CodeX maintains this role, so its permissions cannot be changed here. This is what it can reach."
                : "What a person with this role can reach. Your account can read this but not change it."
              : "Tick to grant, untick to remove. Changes apply when you save."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {locked && (
            <p className="flex items-start gap-2 rounded-md border border-border px-3 py-2.5 text-[13px] text-gray-06">
              <Lock className="size-3.5 shrink-0 mt-0.5 text-gray-05" />
              This is one of the roles CodeX set up for your school. To work
              differently, add a role of your own instead.
            </p>
          )}

          {loading &&
            [0, 1, 2].map((row) => (
              <div key={row} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}

          {!loading &&
            modules.map((group) => {
              const granted = group.permissions.filter((entry) =>
                ticked.has(entry.key),
              ).length;
              return (
                <div key={group.module}>
                  <div className="flex items-center justify-between gap-2.5">
                    <p className="text-[13px] font-semibold font-mont text-black-01">
                      {MODULE_LABEL[group.module] ?? group.module}
                    </p>
                    <span className="text-xs text-gray-05 shrink-0">
                      {granted} of {group.permissions.length} granted
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-col gap-2">
                    {group.permissions.map((entry) => {
                      const on = ticked.has(entry.key);
                      return (
                        <label
                          key={entry.key}
                          className={cn(
                            "flex items-start gap-2.5 text-[13px] text-pretty",
                            on ? "text-black-01" : "text-gray-05",
                            readOnly ? "cursor-default" : "cursor-pointer",
                          )}
                        >
                          <Checkbox
                            checked={on}
                            disabled={readOnly}
                            onCheckedChange={() => toggle(entry.key)}
                            className="mt-0.5 shrink-0"
                          />
                          <span className="min-w-0">{entry.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        <div className="border-t border-border px-5 py-3.5 flex gap-2.5">
          <Button variant="outline" className="flex-1" onClick={close}>
            Close
          </Button>
          {!readOnly && (
            <Button
              className="flex-1"
              onClick={commit}
              loading={saving}
              disabled={!dirty}
            >
              Save permissions
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
