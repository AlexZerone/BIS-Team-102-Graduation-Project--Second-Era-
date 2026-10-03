# Sec Era CSS Architecture

## Overview
This CSS architecture follows a component-based approach, organized across multiple files for better maintainability and performance.

## File Structure

### `style.css`
- Core styles and variables
- Base element styling
- Global typography and color definitions

### `components.css`
- UI component-specific styles
- Self-contained, reusable components
- Component variants and states

### `layout.css`
- Layout utilities and grid system
- Spacing utilities
- Flexbox and grid helpers
- Position utilities

### `responsive.css`
- Media queries for responsive design
- Device-specific overrides
- Responsive utilities

## Usage Guidelines

1. **For new components:**
   - Add component styles to `components.css`
   - Follow naming convention: `.component-name {}`
   - Use variants as: `.component-name-variant {}`

2. **For layout needs:**
   - Use utility classes from `layout.css`
   - Combine utilities for DRY code

3. **For responsive design:**
   - Define core styles first in component files
   - Add responsive adjustments in `responsive.css`

4. **Variable usage:**
   - Reference CSS variables defined in `style.css`
   - Example: `var(--primary-color)`

## Best Practices

- Avoid inline styles in templates
- Use utility classes for minor adjustments
- Follow BEM (Block Element Modifier) naming when applicable
- Keep specificity low for better CSS inheritance
