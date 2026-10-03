/**
 * Enhanced Form Functionality for Sec Era Platform
 * Handles form validation, file uploads, and user interactions
 */

class FormEnhancer {
    constructor() {
        this.init();
    }

    init() {
        this.setupFormValidation();
        this.setupFileUploads();
        this.setupSearchForms();
        this.setupSubmitButtons();
    }

    setupFormValidation() {
        const forms = document.querySelectorAll('form[data-validate="true"]');
        forms.forEach(form => {
            form.addEventListener('submit', this.validateForm.bind(this));
            
            // Real-time validation
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });
        });
    }

    validateForm(event) {
        const form = event.target;
        let isValid = true;
        
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            event.preventDefault();
            this.showFormErrors(form);
        }
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldType = field.type || field.tagName.toLowerCase();
        let isValid = true;
        let errorMessage = '';

        // Required field check
        if (field.hasAttribute('required') && !value) {
            errorMessage = `${this.getFieldLabel(field)} is required.`;
            isValid = false;
        }
        // Email validation
        else if (fieldType === 'email' && value && !this.isValidEmail(value)) {
            errorMessage = 'Please enter a valid email address.';
            isValid = false;
        }
        // Password validation
        else if (fieldType === 'password' && value && value.length < 6) {
            errorMessage = 'Password must be at least 6 characters long.';
            isValid = false;
        }
        // File validation
        else if (fieldType === 'file' && field.files.length > 0) {
            const validationResult = this.validateFile(field.files[0], field);
            if (!validationResult.valid) {
                errorMessage = validationResult.message;
                isValid = false;
            }
        }

        this.setFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    validateFile(file, field) {
        const maxSize = parseInt(field.dataset.maxSize) || 5 * 1024 * 1024; // 5MB default
        const allowedTypes = field.dataset.allowedTypes ? field.dataset.allowedTypes.split(',') : [];

        if (file.size > maxSize) {
            return {
                valid: false,
                message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB.`
            };
        }

        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            return {
                valid: false,
                message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
            };
        }

        return { valid: true };
    }

    setFieldValidation(field, isValid, errorMessage) {
        const wrapper = field.closest('.mb-3') || field.closest('.form-group');
        const existingError = wrapper?.querySelector('.invalid-feedback');

        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            if (existingError) {
                existingError.remove();
            }
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            
            if (!existingError && errorMessage) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                errorDiv.textContent = errorMessage;
                field.parentNode.appendChild(errorDiv);
            }
        }
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid');
        const wrapper = field.closest('.mb-3') || field.closest('.form-group');
        const errorDiv = wrapper?.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    getFieldLabel(field) {
        const label = document.querySelector(`label[for="${field.id}"]`);
        return label ? label.textContent.replace('*', '').trim() : field.name || 'Field';
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    setupFileUploads() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', this.handleFileUpload.bind(this));
        });
    }

    handleFileUpload(event) {
        const input = event.target;
        const files = input.files;
        
        if (files.length > 0) {
            const file = files[0];
            this.showFilePreview(input, file);
        }
    }

    showFilePreview(input, file) {
        const wrapper = input.closest('.mb-3') || input.closest('.form-group');
        let preview = wrapper.querySelector('.file-preview');
        
        if (!preview) {
            preview = document.createElement('div');
            preview.className = 'file-preview mt-2';
            wrapper.appendChild(preview);
        }

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `
                    <div class="d-flex align-items-center">
                        <img src="${e.target.result}" alt="Preview" class="me-2" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
                        <div>
                            <div class="fw-semibold">${file.name}</div>
                            <small class="text-muted">${(file.size / 1024).toFixed(1)} KB</small>
                        </div>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-file-alt fa-2x text-muted me-2"></i>
                    <div>
                        <div class="fw-semibold">${file.name}</div>
                        <small class="text-muted">${(file.size / 1024).toFixed(1)} KB</small>
                    </div>
                </div>
            `;
        }
    }

    setupSearchForms() {
        const searchForms = document.querySelectorAll('.search-form');
        searchForms.forEach(form => {
            const input = form.querySelector('input[name="search"]');
            if (input) {
                // Debounced search
                let timeout;
                input.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        if (input.value.length > 2 || input.value.length === 0) {
                            form.submit();
                        }
                    }, 500);
                });
            }
        });
    }

    setupSubmitButtons() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', () => {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    this.setButtonLoading(submitBtn, true);
                }
            });
        });
    }

    setButtonLoading(button, loading) {
        const textSpan = button.querySelector('.btn-text');
        const loadingSpan = button.querySelector('.btn-loading');
        
        if (loading) {
            button.disabled = true;
            if (textSpan) textSpan.classList.add('d-none');
            if (loadingSpan) loadingSpan.classList.remove('d-none');
        } else {
            button.disabled = false;
            if (textSpan) textSpan.classList.remove('d-none');
            if (loadingSpan) loadingSpan.classList.add('d-none');
        }
    }

    showFormErrors(form) {
        const firstError = form.querySelector('.is-invalid');
        if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new FormEnhancer();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormEnhancer;
}
