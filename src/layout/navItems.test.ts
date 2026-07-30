import { describe, expect, it } from 'vitest';

import { homePathForRole, rolesForPath } from './navItems';

// These derive the route guards from the nav list, so the sidebar and the guards
// cannot disagree. Before that, `/` rendered the ADMIN-only Dashboard for everyone:
// an AGENT signing in landed on a page that 403s forever, with no Dashboard entry
// in their sidebar to explain why they had been sent there.

describe('rolesForPath', () => {
  it('resolves a list route', () => {
    expect(rolesForPath('/deliveries')).toEqual(['ADMIN']);
    expect(rolesForPath('/support')).toEqual(['AGENT', 'ADMIN']);
  });

  it('gives a detail route the same rule as its list', () => {
    expect(rolesForPath('/deliveries/abc-123')).toEqual(['ADMIN']);
    expect(rolesForPath('/support/t-1')).toEqual(['AGENT', 'ADMIN']);
  });

  it('matches the LONGEST prefix, so a detail route never resolves to "/"', () => {
    // '/' is a nav path too; a naive startsWith would match it first and hand
    // '/support/t-1' the Dashboard's ADMIN-only rule.
    expect(rolesForPath('/support/t-1')).not.toEqual(['ADMIN']);
  });

  it('returns no restriction for an unknown path', () => {
    expect(rolesForPath('/nope')).toEqual([]);
  });
});

describe('homePathForRole', () => {
  it('sends an ADMIN to the dashboard', () => {
    expect(homePathForRole('ADMIN')).toBe('/');
  });

  it('sends an AGENT to support — the first page they can actually open', () => {
    expect(homePathForRole('AGENT')).toBe('/support');
  });

  it('never sends a role to a page it cannot open', () => {
    for (const role of ['ADMIN', 'AGENT'] as const) {
      expect(rolesForPath(homePathForRole(role))).toContain(role);
    }
  });
});
