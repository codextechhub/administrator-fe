import { describe, expect, it } from "vitest";
import { getJwtExp, isJwtExpired } from "./jwt";

/**
 * Build a JWT the way SimpleJWT does: base64url segments (RFC 7515) - '+'
 * becomes '-', '/' becomes '_', and padding is stripped. The junk claim is
 * crafted so the encoded payload actually contains those characters, which is
 * exactly the case the old atob()-based decoder crashed on.
 */
const makeToken = (payload: Record<string, unknown>): string => {
  const enc = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${enc({ alg: "HS256", typ: "JWT" })}.${enc(payload)}.signature`;
};

const nowSec = () => Math.floor(Date.now() / 1000);

describe("getJwtExp", () => {
  it("reads exp from a plain payload", () => {
    expect(getJwtExp(makeToken({ exp: 1234567890 }))).toBe(1234567890);
  });

  it("decodes base64url payloads containing - and _ (the old atob crash)", () => {
    // ">>>?>>" forces '+' and '/' into the base64, i.e. '-'/'_' in base64url.
    const token = makeToken({ exp: 1234567890, junk: ">>>?>>", name: "ÿþ" });
    expect(token.split(".")[1]).toMatch(/[-_]/);
    expect(getJwtExp(token)).toBe(1234567890);
  });

  it("returns null for tokens without a numeric exp", () => {
    expect(getJwtExp(makeToken({ exp: "soon" }))).toBeNull();
    expect(getJwtExp(makeToken({ sub: "x" }))).toBeNull();
  });

  it("returns null for garbage", () => {
    expect(getJwtExp("not-a-jwt")).toBeNull();
    expect(getJwtExp("")).toBeNull();
    expect(getJwtExp("a.b.c")).toBeNull();
  });
});

describe("isJwtExpired", () => {
  it("is false for a future exp and true for a past exp", () => {
    expect(isJwtExpired(makeToken({ exp: nowSec() + 600 }))).toBe(false);
    expect(isJwtExpired(makeToken({ exp: nowSec() - 600 }))).toBe(true);
  });

  it("applies the buffer (expiring-soon counts as expired)", () => {
    const token = makeToken({ exp: nowSec() + 60 });
    expect(isJwtExpired(token)).toBe(false);
    expect(isJwtExpired(token, 120)).toBe(true);
  });

  it("treats unparseable tokens as expired", () => {
    expect(isJwtExpired("garbage")).toBe(true);
  });
});
