/**
 * Host half.
 *
 * The theme is a browser-only client plugin. This entry exists because the
 * DSH loader mounts a package through its bundle patch and expects a module;
 * it deliberately registers nothing model-facing and holds no server state.
 */
export const name = "dsh-apple-liquid-glass";
export const inject = [];

export function apply() {
  /* Browser half only. */
}
