let enabled =
  !("NO_COLOR" in process.env) &&
  ("FORCE_COLOR" in process.env ||
    process.platform === "win32" ||
    (process.stdout != null &&
      process.stdout.isTTY &&
      process.env.TERM &&
      process.env.TERM !== "dumb"));

const options = Object.defineProperty({}, "enabled", {
  get: () => enabled,
  set: (value) => (enabled = value),
});
