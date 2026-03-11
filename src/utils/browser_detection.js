/**
 * Detects if the user is in an in-app browser like Facebook, Instagram, or Zalo.
 * @returns {boolean} True if inside an in-app browser.
 */
export const isInAppBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return (
        ua.indexOf('FBAN') > -1 || 
        ua.indexOf('FBAV') > -1 || 
        ua.indexOf('Instagram') > -1 || 
        ua.indexOf('Zalo') > -1 ||
        ua.indexOf('Messenger') > -1
    );
};

/**
 * Checks if the device is iOS.
 * @returns {boolean} True if iOS.
 */
export const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Checks if the device is Android.
 * @returns {boolean} True if Android.
 */
export const isAndroid = () => {
    return /Android/.test(navigator.userAgent);
};
