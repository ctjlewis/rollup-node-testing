const userAgent = process.env.npm_config_user_agent;
const isYarn = Boolean(userAgent && userAgent.startsWith('yarn'));
const isNpm = Boolean(userAgent && userAgent.startsWith('npm'));
