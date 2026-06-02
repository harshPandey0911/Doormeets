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
  teal: '#FF9F45', // Primary Orange
  yellow: '#FFB86C', // Secondary Orange
  orange: '#FFD8A8', // Accent Orange
  gradient: 'linear-gradient(135deg, #FF9F45 0%, #FFB86C 50%, #FFD8A8 100%)',
  conic: 'conic-gradient(from 0deg, #FF9F45, #FFB86C, #FFD8A8)'
};

// User Theme Colors
const userTheme = {
  backgroundGradient: 'linear-gradient(180deg, #FFF8F1 0%, #FFFDFB 15%, #FFFFFF 30%)',
  gradient: brand.gradient,
  headerGradient: 'linear-gradient(135deg, #FF9F45 0%, #FFB86C 50%, #FFD8A8 100%)',
  headerBg: '#FFF8F1',
  button: brand.teal,
  primary: brand.teal,
  icon: brand.teal,
  cardShadow: '0 8px 16px -2px rgba(255, 159, 69, 0.15), 0 4px 8px -1px rgba(255, 159, 69, 0.1)',
  cardBorder: '1px solid #EAEAEA',
  brand: brand
};

// Vendor Theme Colors
const vendorTheme = {
  backgroundGradient: 'linear-gradient(to bottom, rgba(255, 159, 69, 0.03) 0%, rgba(255, 184, 108, 0.02) 10%, #FFF8F1 20%)',
  gradient: brand.gradient,
  headerGradient: brand.teal,
  button: brand.teal,
  primary: brand.teal,
  icon: brand.teal,
  brand: brand
};

// Worker Theme Colors
const workerTheme = {
  backgroundGradient: 'linear-gradient(to bottom, rgba(255, 159, 69, 0.03) 0%, rgba(255, 184, 108, 0.02) 10%, #FFF8F1 20%)',
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
