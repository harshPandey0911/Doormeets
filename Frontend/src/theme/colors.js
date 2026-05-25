/**
 * Centralized Theme Colors Configuration
 * Separate themes for User and Vendor modules
 * Update colors here to change theme across entire app
 * 
 * Usage:
 * - User module: import { userTheme } from '../../../../theme'
 * - Vendor module: import { vendorTheme } from '../../../../theme'
 * - Worker module: import { workerTheme } from '../../../../theme'
 */

// Doormeets Core Brand Colors
const brand = {
  teal: '#9634f7',
  yellow: '#b87cff',
  orange: '#9634f7',
  gradient: 'linear-gradient(135deg, #9634f7 0%, #b87cff 50%, #9634f7 100%)',
  conic: 'conic-gradient(from 0deg, #9634f7, #b87cff, #9634f7)'
};

// User Theme Colors
const userTheme = {
  backgroundGradient: 'linear-gradient(180deg, #F5F3FF 0%, #F9F8FF 15%, #FFFFFF 30%)',
  gradient: brand.gradient,
  headerGradient: 'linear-gradient(135deg, #9634f7 0%, #b87cff 50%, #9634f7 100%)',
  headerBg: '#F5F3FF',
  button: brand.teal,
  primary: brand.teal,
  icon: brand.teal,
  cardShadow: '0 8px 16px -2px rgba(150, 52, 247, 0.15), 0 4px 8px -1px rgba(150, 52, 247, 0.1)',
  cardBorder: '1px solid rgba(150, 52, 247, 0.15)',
  brand: brand
};

// Vendor Theme Colors
const vendorTheme = {
  backgroundGradient: 'linear-gradient(to bottom, rgba(150, 52, 247, 0.03) 0%, rgba(150, 52, 247, 0.02) 10%, #ffffff 20%)',
  gradient: brand.gradient,
  headerGradient: brand.teal,
  button: brand.teal,
  primary: brand.teal,
  icon: brand.teal,
  brand: brand
};

// Worker Theme Colors
const workerTheme = {
  backgroundGradient: 'linear-gradient(to bottom, rgba(150, 52, 247, 0.03) 0%, rgba(150, 52, 247, 0.02) 10%, #ffffff 20%)',
  gradient: brand.gradient,
  headerGradient: brand.teal,
  button: brand.teal,
  primary: brand.teal,
  icon: brand.teal,
  brand: brand
};

// Default theme (for backward compatibility)
const themeColors = userTheme;

// Export all themes
export { userTheme, vendorTheme, workerTheme, brand };
export default themeColors;


