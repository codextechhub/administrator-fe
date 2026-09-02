import { Panel } from "@/components/custom/surface";
/**
 * An absence drawn as a shape, not as a failed container.
 *
 * The design uses this where an emptiness is the WHOLE answer to a screen or a
 * tab - no guardian linked, nobody waiting for a class - rather than a list
 * that happens to be short today.
 *
 * The distinction matters. A dashed rectangle with a sentence in it reads as a
 * box that did not get filled, which is indistinguishable from a load that
 * failed. A drawn ring reads as a state somebody meant, which is what "every
 * student has a class" is: not nothing, but the goal.
 */
export function EmptyRing({ children }: { children: React.ReactNode }) {
  return (
    <Panel className="grid place-content-center p-11">
      <div className="grid size-40 place-content-center rounded-full border border-primary p-5 text-center">
        <p className="text-[13px] text-gray-01">{children}</p>
      </div>
    </Panel>
  );
}
