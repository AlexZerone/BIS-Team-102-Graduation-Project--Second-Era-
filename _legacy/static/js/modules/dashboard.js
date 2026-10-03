/**
 * Enhanced Dashboard Functionality for Sec Era Platform
 * Handles real-time updates, animations, and user interactions
 */

class Dashboard {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.startPeriodicUpdates();
    }

    init() {
        this.animateStatsCards();
        this.initializeCharts();
        this.setupTooltips();
    }

    animateStatsCards() {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    initializeCharts() {
        // Initialize any charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.createActivityChart();
            this.createProgressChart();
        }
    }

    createActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Activity',
                    data: [12, 19, 3, 5, 2, 3, 7],
                    borderColor: 'rgb(34, 57, 71)',
                    backgroundColor: 'rgba(34, 57, 71, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    setupEventListeners() {
        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', this.handleQuickAction.bind(this));
        });

        // Activity refresh
        const refreshBtn = document.querySelector('#refreshActivity');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.refreshActivity.bind(this));
        }
    }

    handleQuickAction(event) {
        const button = event.currentTarget;
        const action = button.dataset.action;
        
        // Add loading state
        button.classList.add('loading');
        button.disabled = true;
        
        // Simulate action (replace with actual API calls)
        setTimeout(() => {
            button.classList.remove('loading');
            button.disabled = false;
            this.showNotification(`${action} completed successfully!`, 'success');
        }, 1000);
    }

    refreshActivity() {
        const activityContainer = document.querySelector('.activity-timeline');
        if (!activityContainer) return;

        // Add loading spinner
        activityContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div></div>';

        // Simulate API call
        setTimeout(() => {
            this.loadActivityData();
        }, 1000);
    }

    loadActivityData() {
        // This would typically make an AJAX request
        // For now, we'll just reload the page section
        window.location.reload();
    }

    startPeriodicUpdates() {
        // Refresh notifications every 5 minutes
        setInterval(() => {
            this.checkForUpdates();
        }, 5 * 60 * 1000);
    }

    checkForUpdates() {
        // Check for new notifications, messages, etc.
        fetch('/api/check-updates')
            .then(response => response.json())
            .then(data => {
                if (data.hasUpdates) {
                    this.showNotification('New updates available!', 'info');
                }
            })
            .catch(error => {
                console.log('Update check failed:', error);
            });
    }

    setupTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.dashboard-content') || window.location.pathname.includes('Post-home')) {
        new Dashboard();
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}
