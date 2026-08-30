---
name: mobile-responsive-engine
description: Advanced Mobile UI/UX engine for Android and iOS devices, PWA standalone configuration, safe-area-insets, touch optimization, bottom navigation and sheet modals.
---

# Mobile Responsive & Native PWA Engine (Android & iOS)

This skill provides architectural standards, layout rules, and responsive patterns for delivering a 100% native mobile app feel on both Android and iOS devices.

## 📱 Core Principles

### 1. Viewport & Safe Area Handling
- **Viewport Meta**: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`
- **iOS Notch & Android Status Bar**: Utilize `env(safe-area-inset-top)` on topbars and headers.
- **Home Indicator (Gesture Bar)**: Utilize `env(safe-area-inset-bottom)` on BottomNav and bottom sheets.

### 2. Touch & Gesture Optimization
- Touch targets must be at least `44px x 44px` for thumb accessibility.
- Tap highlight color disabled (`-webkit-tap-highlight-color: transparent`).
- Smooth inertia scrolling on scrollable containers (`-webkit-overflow-scrolling: touch`).
- Prevent pull-down page refresh interference where custom pull-to-refresh or charts exist (`overscroll-behavior-y: contain`).

### 3. Navigation Hierarchy (Mobile First)
- **Bottom Navigation Bar**: Fixed at the bottom with 5 primary items (Principal, Transações, Central FAB `+`, Planejamento, Mais).
- **Header**: Compact header with avatar, notifications, quick month picker, and title.
- **Modals**: Render as bottom slide-up sheets on screens `< 768px` (sm/md breakpoints) and centered modals on desktop.

### 4. PWA Standalone Configuration
- Standalone display mode with custom icons (`192x192`, `512x512`, maskable).
- Status bar style: `black-translucent` on iOS.
