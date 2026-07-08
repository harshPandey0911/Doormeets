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
  teal: '#FF6B4A', // Primary Red/Orange
  yellow: '#E05333', // Primary Hover
  orange: '#FFA08A', // Primary Light / Accent
  gradient: 'linear-gradient(135deg, #FF6B4A 0%, #FF8E75 100%)',
  conic: 'conic-gradient(from 0deg, #FF6B4A, #FF8E75, #E05333)'
};

// User Theme Colors
const userTheme = {
  backgroundGradient: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFC 100%)',
  gradient: brand.gradient,
  headerGradient: 'linear-gradient(135deg, #FF6B4A 0%, #FF8E75 100%)',
  headerBg: '#FFFFFF',
  button: brand.teal,
  primary: brand.teal,
  icon: brand.teal,
  cardShadow: '0 12px 30px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.01)',
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
