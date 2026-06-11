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
  teal: '#B33A35', // Primary Red/Rust
  yellow: '#9E2E2A', // Primary Hover
  orange: '#D56C67', // Primary Light / Accent
  gradient: 'linear-gradient(135deg, #B33A35 0%, #D56C67 50%, #9E2E2A 100%)',
  conic: 'conic-gradient(from 0deg, #B33A35, #D56C67, #9E2E2A)'
};

// User Theme Colors
const userTheme = {
  backgroundGradient: 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
  gradient: brand.gradient,
  headerGradient: 'linear-gradient(135deg, #B33A35 0%, #D56C67 50%, #9E2E2A 100%)',
  headerBg: '#FFFFFF',
  button: brand.teal,
  primary: brand.teal,
  icon: brand.teal,
  cardShadow: '0 8px 16px -2px rgba(179, 58, 53, 0.15), 0 4px 8px -1px rgba(179, 58, 53, 0.1)',
  cardBorder: '1px solid #E5E7EB',
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
