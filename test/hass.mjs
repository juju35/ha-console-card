// The tests' mock Home Assistant: the screenshots' home (scripts/screenshots/mock.mjs), recording the services called.
import { home, st } from "../scripts/screenshots/mock.mjs";

export { st };

export const makeHass = (opts = {}, overrides = {}) => ({
  ...home(opts),
  calls: [],
  callService(domain, service, data) {
    this.calls.push([domain, service, data]);
  },
  ...overrides,
});
