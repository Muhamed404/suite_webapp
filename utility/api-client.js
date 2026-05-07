
const axios = require('axios');
const config = require("../config/env.config");
const { logger } = require("../logger/logger");


/**
 * Create an Axios instance that includes JWT token from the request
 * @param {object} req - Express request object, used to get JWT from session or cookies
 * @returns {AxiosInstance} - Axios instance with Authorization header set
 */
function getApiClient(req) {
    // Get token from session or cookies (adjust based on your app)
    const token = req.session?.jwtToken || req.cookies?.token || '';
    const sessionID = req?.sessionID || 0;
    // Create Axios instance
    const apiClient = axios.create({
        baseURL: process.env.BACKEND_EP, // Your backend API base URL
        timeout: 300000,
    });

    const rawForwardedFor = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || req?.headers?.['cf-connecting-ip'] || req?.ip || req?.socket?.remoteAddress || '';
    const forwardedFor = Array.isArray(rawForwardedFor)
        ? rawForwardedFor.join(', ')
        : String(rawForwardedFor);

    // Attach JWT token to Authorization header if it exists
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        //console.log('[apiClient] Attached JWT Token:', token); // ✅ Log token
    } else {
        logger.warn('[apiClient] No JWT token found in session or cookies'); // 🚨 Log if missing
    }

    // Add interceptor to log outgoing headers
    apiClient.interceptors.request.use(config => {
        //console.log('[apiClient] Request Headers:', config.headers); // ✅ Log outgoing headers
        config.headers['X-Session-ID'] = sessionID;
        if (forwardedFor) {
            config.headers['X-Forwarded-For'] = forwardedFor;
            config.headers['X-Real-IP'] = forwardedFor.split(',')[0].trim();
        }

        // if (req.session?.user?.id) {
        //     config.headers['X-User-ID'] = req.user.id;
        // }

        // if (req.session?.permissions) {
        //     config.headers['X-Permissions'] = JSON.stringify(req.session.permissions);
        // }
        const fullUrl = `${config.baseURL || ''}${config.url}`;
        const method = config.method?.toUpperCase() || 'UNKNOWN';

        // If there are query params, append them
        if (config.params) {
            const queryParams = new URLSearchParams(config.params).toString();
            logger.info(`[apiClient] ${method} ${fullUrl}?${queryParams}`);
        } else {
            logger.info(`[apiClient] ${method} ${fullUrl}`);
        }
        return config;
    });



    // Response interceptor for logging and session handling
    apiClient.interceptors.response.use(
        response => {
            const newToken = response.headers['x-new-token'];
            if (newToken && req && req.session) {
                logger.info(`[apiClient] Received refreshed token from backend. Updating session jwtToken.`);
                req.session.jwtToken = newToken;
            }
            return response;
        },
        error => {
            logger.error(`[apiClient] Error during request: ${error?.response?.data || error?.message || 'Unknown error'}`, {
                method: error?.config?.method?.toUpperCase(),
                url: `${error?.config?.baseURL || ''}${error?.config?.url || ''}`,
                status: error?.response?.status,
                data: error?.response?.data,
            });

            // If token expired or unauthorized due to expired token, clear server session.
            // Do NOT send redirect here because this function can be reused in many controllers.
            if ((error?.response?.status === 401 || error?.response?.status === 403)
                && error?.response?.data?.message?.toLowerCase().includes('token')) {
                if (req && req.session) {
                    req.session.destroy(() => {
                        logger.info('[apiClient] Session destroyed because token expired/invalid');
                    });
                }
                error.isAuthExpired = true;
            }

            return Promise.reject(error);
        }
    );

    return apiClient;
}

module.exports = getApiClient;
