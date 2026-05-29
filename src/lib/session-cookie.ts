type CookieEnv = {
  COOKIE_SECURE?: string;
  NODE_ENV?: string;
};

export function shouldUseSecureSessionCookie(env: CookieEnv = process.env) {
  const explicit = env.COOKIE_SECURE?.trim().toLowerCase();
  if (explicit === "true" || explicit === "1" || explicit === "yes") return true;
  if (explicit === "false" || explicit === "0" || explicit === "no") return false;
  return false;
}
