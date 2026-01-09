
module.exports = (req, res, next) => {
  // console.log(`Cookies: ${JSON.stringify(req.cookies)}`);
  // console.log(`Query param lang: ${req.query.lang}`);

  if (req.query.lang) {
    req.setLocale(req.query.lang);
    res.cookie('lang', req.query.lang, { maxAge: 900000, httpOnly: true });
    // console.log(`Locale manually set to: ${req.getLocale()}`);
  } else if (req.cookies.lang) {
    req.setLocale(req.cookies.lang);
    // console.log(`Locale set from cookie: ${req.getLocale()}`);
  } else {
    // console.log(`Locale from default: ${req.getLocale()}`);
  }
  next();
};
