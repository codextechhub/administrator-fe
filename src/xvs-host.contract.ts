/**
 * Proof that this app satisfies the package's host contract.
 *
 * The package used to assert this itself, one line under the interface. It
 * could not work there and never had: TypeScript reports no diagnostics from
 * files under ``node_modules``, so the assertion compiled against whatever the
 * app happened to export and said nothing either way. A deliberately broken
 * line inside the package - ``const n: number = "not a number"`` - also passed.
 *
 * That silence is not theoretical. A contract member was added and its
 * re-export forgotten in the same change, and nothing anywhere complained; the
 * screens that imported it would have got ``undefined`` at render.
 *
 * So both halves are checked here, in the app's own source, where the compiler
 * is looking:
 *
 *   1. this app exports every member the contract declares, with the right shape;
 *   2. the package hands on every member it declares, so a screen importing one
 *      gets a function rather than undefined.
 *
 * Nothing imports this file. It exists to be compiled.
 */
import type { HostContract } from "@xvs/finance/host";
import * as packageHost from "@xvs/finance/host";
import * as app from "./xvs-host";

// 1. The app satisfies the contract.
const _appSatisfies: HostContract = app;
void _appSatisfies;

// 2. The package re-exports everything it declared. `Missing` is the set of
//    contract members the package does not hand on; assigning it to `never`
//    fails with the missing names in the message when that set is not empty.
type Missing = Exclude<keyof HostContract, keyof typeof packageHost>;
const _packageReExportsEverything: Missing[] = [];
void _packageReExportsEverything;
