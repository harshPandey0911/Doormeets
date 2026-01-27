# OTP Timer & Vendor Features Implementation Plan

## Overview
This document tracks the implementation of the OTP countdown timer and recent vendor-related features.

## Completed Tasks

1.  **OTP Timer (User Module)**
    -   [x] Login Page: `Frontend/src/modules/user/pages/login.jsx` (2-min timer)
    -   [x] Signup Page: `Frontend/src/modules/user/pages/signup.jsx` (2-min timer)

2.  **OTP Timer (Vendor Module)**
    -   [x] Login Page: `Frontend/src/modules/vendor/pages/login.jsx` (2-min timer)
    -   [x] Signup Page: `Frontend/src/modules/vendor/pages/signup.jsx` (2-min timer)

3.  **OTP Timer (Worker Module)**
    -   [x] Login Page: `Frontend/src/modules/worker/pages/login.jsx` (2-min timer)
    -   [x] Signup Page: `Frontend/src/modules/worker/pages/signup.jsx` (2-min timer)

4.  **Bug Fixes & Enhancements**
    -   [x] **Vendor Signup Scroll**: Fixed persistent scroll issue by isolating background elements in a fixed container and simplifying main container layout.
    -   [x] **Vendor Restriction**: Implemented strict backend checks (Status 200, Success: True for pending) to block access without treating it as an API error.
    -   [x] **All Apps Scroll Fix**: Removed `overflow-y-auto` from Login and Signup pages of User, Vendor and Worker apps to fix "hard scroll" issue and prevent unwanted scrollbars.
    -   [x] **Vendor Dashboard Date & Time**: Updated `PendingBookings` component and `BookingAlertModal` to display both Scheduled Date and Time for new job alerts.
    -   [x] **Admin Panel Fix**: Resolved login/kick-out loop by standardizing token role ('ADMIN'), making middleware robust (accepting 'admin'/'ADMIN'), and cleaning up debug logs code.
    -   [x] **Booking Support Buttons Fix**: Replaced `window.open` with programmatic `<a>` tag click injection to ensure compatibility with mobile WebViews for triggering native dialer/email applications.
    -   [x] **Carousel Dots Scroll Fix**: Implemented scroll listener in `PromoCarousel` to synchronize active dot indicator with the currently visible slide.
    -   [x] **Razorpay Brand Name**: Updated Razorpay checkout configuration in Checkout and BookingDetails pages to display 'Homster' instead of 'Appzeto'.
    -   [x] **Work Completion Photos**: Enforced mandatory photo upload in worker completion modal and enabled direct camera capture support on mobile devices.
    -   [x] **Checkout Contact Override**: Implemented a local edit modal in Checkout to allow changing Name and Phone for the specific booking without altering the user's global profile.
    -   [x] **Service Detail Branding Update**: Replaced 'Appzeto' with 'Homster' in text and replaced the generic checkmark with the Homster logo in the 'Cover Promise' section.
    -   [x] **Image Placeholders Replacement**: Replaced generic generic SVG placeholders with the Homster logo in `OptimizedImage`, `LazyImage`, and `ServiceWithRatingCard` for better brand consistency.
    -   [x] **Service Detail UI Cleanup**: Adjusted the `ServiceDynamic` page to auto-hide the sticky header and floating menu button when the 'View Details' modal is active for a cleaner user experience.
    -   [x] **Home Address Modal Fix**: Increased the bottom margin of the 'Save Address' button to `mb-24` and conditionally hid the BottomNav to prevent UI overlap issues.
    -   [x] **Notification Management Update**: Enhanced the User, Vendor, and Worker Notification pages with 'Delete' (individual) and 'Clear All' (global with custom confirmation modal) functionalities.
    -   [x] **Settlement Upload Optimization**: Implemented client-side image compression (max 1000px, 80% JPEG) for vendor settlement proof uploads to improve performance and reliability.
    -   [x] **Vendor Jobs Filter Fix**: Fixed the Active Jobs page filter which was not showing jobs correctly due to narrow status checks. Expanded status categories for 'Assigned', 'In Progress', and 'Completed'.
    -   [x] **Worker Jobs Filter Fix**: Fixed the Assigned Jobs list filter in the Worker app to correctly categorize jobs (Pending, Active, Completed) using expanded status lists.
    -   [x] **Dynamic Booking Ratings**: Updated User Booking Details to display actual dynamic ratings for Workers/Vendors from the database instead of the hardcoded 4.8 value.
    -   [x] **Vendor Dashboard Rating Fix**: Updated Vendor Dashboard logic to prioritize the stored Vendor rating from the database over recalculated averages, ensuring consistency with profile data.
    -   [x] **Vendor Profile Rating Correction**: Updated Vendor Profile API to prioritize stored database ratings over dynamic recalculations, resolving inconsistencies between dashboard and booking details.
    -   [x] **Cancellation Policy Page**: Created a new dedicated, modern Cancellation Policy page for Users with visual timeline and fee breakdown, linked from the Checkout screen.
    -   [x] **Signup Camera Functionality**: Added native-like camera support for document uploads in Vendor and Worker signup pages by implementing split "Gallery/Camera" options with `capture` attribute.
    -   [x] **Mobile Admin Sidebar Fix**: Increased z-index of the Admin sidebar on mobile to ensure it correctly overlays all other content and handles interactions properly.

## Next Steps / Pending
1.  [ ] Replicate changes in **HomeBuddy24** project (if required).

