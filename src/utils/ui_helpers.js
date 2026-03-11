/**
 * Helper to get the dashboard label from a profile object.
 * Falls back to 'Days Together' if not set.
 * @param {Object} profile - The user profile object.
 * @returns {string} The label to display.
 */
export const getDashboardLabel = (profile) => {
    return profile?.dashboard_label || 'Days Together';
};

/**
 * Helper to get the user's nickname or a default.
 * @param {Object} profile - The user profile object.
 * @returns {string} The nickname to display.
 */
export const getNickname = (profile) => {
    return profile?.nickname || 'Bạn';
};

/**
 * Helper to get the partner's nickname or a default.
 * @param {Object} partner - The partner profile object.
 * @returns {string} The partner nickname to display.
 */
export const getPartnerNickname = (partner) => {
    return partner?.nickname || 'Người ấy';
};
