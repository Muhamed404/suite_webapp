module.exports = (app, config, logger) => {
  app.listen(config.PORT, config.HOST, () => {
    logger.info(`✅ Server Started`);
    console.log(`✅ Server Started`);
    console.log(`🚀 Server listening at http://${config.HOST}:${config.PORT}`);
    console.log(`🚀 Healthcheck: http://${config.HOST}:${config.PORT}/health`);
    logger.info(`🔗 Host: ${config.HOST}:${config.PORT}`);
    logger.info(`🌐 Environment: ${config.NODE_ENV}`);
    logger.info(`🔐 Cookie & JWT Token Expiry: ${config.COOKIE_JWT_TOKEN_EXPIRY}`);
    logger.info(`📡 Listening at: http://${config.HOST}:${config.PORT}`);
  });
};
