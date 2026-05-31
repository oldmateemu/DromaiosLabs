function hasOption(args, longName, shortName) {
  return args.some((arg) => arg === longName || arg === shortName || arg.startsWith(`${longName}=`));
}

export function buildNextDevArgs(rawArgs, options = {}) {
  const defaultHost = options.defaultHost ?? "127.0.0.1";
  const defaultPort = options.defaultPort ?? "3000";
  const args = [...rawArgs];

  while (args[0] === "--") {
    args.shift();
  }

  if (!hasOption(args, "--hostname", "-H")) {
    args.push("-H", defaultHost);
  }

  if (!hasOption(args, "--port", "-p")) {
    args.push("-p", defaultPort);
  }

  return ["dev", ...args];
}
