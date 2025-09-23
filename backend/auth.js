const { v4: uuidv4 } = require('uuid');
const userSchema = require('./mongo/user');

const SESSION_TTL = parseInt(process.env.SESSION_TTL, 10) || 3600; // 1 hour

function createAuth(redisClient) {
  async function login(username, password) {
    const user = await userSchema.findOne({ email: username });

    const sessionToken = uuidv4();

    await redisClient.setex(
      `session:${sessionToken}`,
      SESSION_TTL,
      JSON.stringify({ userId: user._id, username: username })
    );

    return sessionToken;
  }

  async function getSession(sessionToken) {
    const sessionData = await redisClient.get(`session:${sessionToken}`);
    if (!sessionData) return null;
    return JSON.parse(sessionData);
  }

  async function logout(sessionToken) {
    await redisClient.del(`session:${sessionToken}`);
  }

  return {
    login,
    getSession,
    logout,
  };
}

module.exports = createAuth;
