const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');
const RENDER_PAGE_URLS = require('../../../config/render_ejs_urls');
const { redactEmail } = require("../../../utility/redact");

exports.renderLoginPage = (req, res) => {
    logger.info('[Render Login Page]: Product Suite Incoming request' + req.originalUrl)

    // Flash messages are already set in res.locals by server.js middleware
    const message = res.locals.message && res.locals.message.length > 0 ? res.locals.message[0] : null;
    const alertType = res.locals.alertType && res.locals.alertType.length > 0 ? res.locals.alertType[0] : 'error';

    if (req.originalUrl === '/phm/login') {

        return res.render(RENDER_PAGE_URLS.PhishMagnus.LOGIN, {
            layout: false,
            message: message,
            alertType: alertType
        });

    } else if (req.originalUrl === '/awm/login') {

        return res.render(RENDER_PAGE_URLS.AwareMagnud.LOGIN, {
            layout: false,
            message: message,
            alertType: alertType
        });

    } else {
        logger.info('login else')

        return res.render(RENDER_PAGE_URLS.ProductSuiteManagement.LOGIN, {
            layout: false,
            message: message,
            alertType: alertType
        });

    }
};




exports.postLogin = async (req, res) => {
    logger.info(`[PSuite Login Controller]: Original req` + req.originalUrl)
    // logger.info(`[PSuite Login Controller]: POST: Incoming request with values: ${JSON.stringify(req.body, null, 2)}`);

    const { email, password } = req.body;

    if (!email || !password) {
        logger.warn("[PSuite Login Controller]: POST: Missing email or password");
        return res.redirect(`/login?message=Missing credentials&alertType=error`);
    }

    const apiClient = getApiClient(req);
    const loginUrl = `/login`;

    logger.info(`[PSuite Login Controller]: POST: Authenticating via ${loginUrl}`);

    try {
        let userTimezone = req.body.userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        const { data } = await apiClient.post(loginUrl, 
            { email, password, userTimezone },
            {
                headers: {
                    'X-Product-Key': 'phm'
                }
            }
        );
        // logger.info(`[PSuite Login Controller]: POST: Received login response: ${JSON.stringify(data, null, 2)}`);
        const userToken = data?.object?.userToken || null;
        const mfaRequired = data?.object?.mfaRequired || false;
        logger.info(`[PSuite Login Controller]: POST: MFA Required: ${mfaRequired} for user ${redactEmail(email)}`);


        if (!userToken) {
            logger.error(`[PSuite Login Controller]: POST: Incomplete login response: ${JSON.stringify(data)}`);
            return res.redirect(`/login?message=${req.__('generic_label.unexpected_error')}&alertType=error`);
        }

        // 🚨 MFA required → Temporarily store pending session
        if (mfaRequired) {
            // console.log(`[PSuite Login Controller]: POST: MFA required for ${email}, ${JSON.stringify(userToken, null, 2)}`);
            req.session.mfaPendingUser = { userToken };

            logger.info(`[PSuite Login Controller]: POST: MFA required for ${redactEmail(email)}, redirecting to MFA screen`);
            return res.redirect("/mfa/verify");
        } else {
            logger.info(`[PSuite Login Controller]: POST: No MFA required for ${redactEmail(email)}, proceeding with login`);
            // ✅ Set full session for authenticated user
            // req.user = userData;
            req.session.jwtToken = userToken;

            logger.info(`[PSuite Login Controller]: POST: Session created for ${redactEmail(email)}`);
            return res.redirect("/home");
        }

    } catch (err) {
        const rawMessage = err?.response?.data?.message;
        let message;

        if (rawMessage && typeof rawMessage === 'string') {
            const norm = rawMessage.trim().toLowerCase();
            if (norm.includes('invalid') || norm.includes('credential')) {
                message = req.__('generic_label.invalid_credentials');
            } else if (norm.includes('user not found') || norm.includes('inactive')) {
                message = req.__('generic_label.user_not_found');
            } else if (norm.includes('permissions')) {
                message = req.__('generic_label.no_access_permissions');
            } else if (norm.includes('portal access')) {
                message = req.__('generic_label.no_portal_access');
            } else {
                message = rawMessage;
            }
        } else {
            message = req.__('generic_label.unexpected_error');
        }

        logger.error(`[PSuite Login Controller]: POST: Authentication failed for ${redactEmail(email)}: ${message}`);
        logger.error(err);
        logger.error(err.stack);
        req.flash("message", message);
        req.flash("alertType", "error");
        return res.redirect(`/login`);
    }
};



