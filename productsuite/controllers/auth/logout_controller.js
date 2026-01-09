


const { logger } = require("../../../logger/logger");

exports.logout = async (req, res) => {
  if (req.method === "GET") {
    logger.info("logout has called.....");
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        //res.status(500).json({ message: "Internal server error" });
      }
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
};