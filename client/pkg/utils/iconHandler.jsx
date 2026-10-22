// src/utils/.ts

export const getNoticeIcon = (type) => {
    switch (type) {
        case "success":
            return "bx-check-circle";
        case "danger":
            return "bx-error-circle";
        case "warning":
            return "bx-help-circle";
        case "info":
            return "bx-info-circle";
        case "primary":
            return "bx-heart-circle";
        default:
            return "bx-circle";
    }
}

export const getCategoryIcon = (icon) => {
    switch (icon) {
        case "success":
            return "bx-check-circle";
        case "danger":
            return "bx-error-circle";
        case "warning":
            return "bx-help-circle";
        case "info":
            return "bx-info-circle";
        case "primary":
            return "bx-heart-circle";
        default:
            return "bx-circle";
    }
}

export const getToastType = (type) => {
    switch (type) {
        case 'Primary':
            return 'bg-primary';
        case 'Secondary':
            return 'bg-secondary';
        case 'Success':
            return 'bg-success';
        case 'Danger':
            return 'bg-danger';
        case 'Warning':
            return 'bg-warning';
        case 'Info':
            return 'bg-info';
        case 'Dark':
            return 'bg-dark';
        default:
            return 'bg-primary';
    }
}

export const getToastPosition = (position) => {
    switch (position) {
        case 'Top left':
            return 'top-0 start-0';
        case 'Top center':
            return 'top-0 start-50 translate-middle-x';
        case 'Top right':
            return 'top-0 end-0';
        case 'Middle left':
            return 'top-50 start-0 translate-middle-y';
        case 'Middle center':
            return 'top-50 start-50 translate-middle';
        case 'Middle right':
            return 'top-50 end-0 translate-middle-y';
        case 'Bottom left':
            return 'bottom-0 start-0';
        case 'Bottom center':
            return 'bottom-0 start-50 translate-middle-x';
        case 'Bottom right':
            return 'bottom-0 end-0';
        default:
            return 'top-0 end-0';
    }
}
