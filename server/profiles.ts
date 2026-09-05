import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface Profile {
  id: string;
  name: string;
  contracts: number;
  deaths: number;
  encounters: Record<string, { name: string; wins: number; losses: number }>;
}
type Stored = Profile & { tokenHash: string };
/** Device identity foundation, not an account/authentication product. Tokens stay private. */
export class ProfileStore {
  records: Stored[] = [];
  dirty = false;
  constructor(private directory = "data") {
    mkdirSync(directory, { recursive: true });
    try {
      this.records = JSON.parse(
        readFileSync(join(directory, "profiles.json"), "utf8"),
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
  resolve(token: unknown): { profile: Stored; token: string } {
    const raw =
      typeof token === "string" && /^[a-f0-9]{64}$/.test(token) ? token : "";
    const hash = (s: string) => createHash("sha256").update(s).digest("hex");
    const existing = raw
      ? this.records.find((p) => p.tokenHash === hash(raw))
      : undefined;
    if (existing) return { profile: existing, token: raw };
    const next = randomBytes(32).toString("hex"),
      id = randomUUID();
    const profile: Stored = {
      id,
      name: `GHOST-${id.slice(0, 4).toUpperCase()}`,
      tokenHash: hash(next),
      contracts: 0,
      deaths: 0,
      encounters: {},
    };
    this.records.push(profile);
    this.dirty = true;
    return { profile, token: next };
  }
  public(p: Profile): Profile {
    return {
      id: p.id,
      name: p.name,
      contracts: p.contracts,
      deaths: p.deaths,
      encounters: p.encounters,
    };
  }
  record(
    killer: Profile | undefined,
    victim: Profile | undefined,
    contract: boolean,
  ) {
    if (killer && contract) killer.contracts++;
    if (victim) victim.deaths++;
    if (killer && victim && killer.id !== victim.id) {
      for (const [a, b, win] of [
        [killer, victim, true],
        [victim, killer, false],
      ] as const) {
        a.encounters[b.id] ??= { name: b.name, wins: 0, losses: 0 };
        a.encounters[b.id][win ? "wins" : "losses"]++;
        const ids = Object.keys(a.encounters);
        if (ids.length > 50) delete a.encounters[ids[0]];
      }
    }
    if (killer || victim) this.dirty = true;
  }
  flush() {
    if (!this.dirty) return;
    const path = join(this.directory, "profiles.json");
    writeFileSync(path + ".tmp", JSON.stringify(this.records));
    renameSync(path + ".tmp", path);
    this.dirty = false;
  }
}
