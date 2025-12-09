/**
 * SEO Audit Widget
 * Embeddable JavaScript widget for lead capture
 * 
 * Usage:
 * <script src="https://yourdomain.com/widget.js" data-widget-id="YOUR_WIDGET_ID"></script>
 */

(function () {
    'use strict';

    // Configuration
    const WIDGET_ID = document.currentScript?.getAttribute('data-widget-id');
    const API_BASE = document.currentScript?.getAttribute('data-api-url') || 'https://api.seoaudit.com';

    if (!WIDGET_ID) {
        console.error('SEO Audit Widget: Missing data-widget-id attribute');
        return;
    }

    // Styles
    const styles = `
    .seo-audit-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      max-width: 400px;
      margin: 20px auto;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      background: #ffffff;
    }
    
    .seo-audit-widget * {
      box-sizing: border-box;
    }
    
    .seo-audit-widget-header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .seo-audit-widget-logo {
      max-height: 40px;
      margin-bottom: 12px;
    }
    
    .seo-audit-widget-title {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    
    .seo-audit-widget-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
    
    .seo-audit-widget-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .seo-audit-widget-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }
    
    .seo-audit-widget-input:focus {
      border-color: var(--widget-primary-color, #3B82F6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .seo-audit-widget-input::placeholder {
      color: #9ca3af;
    }
    
    .seo-audit-widget-button {
      width: 100%;
      padding: 12px 24px;
      background: var(--widget-primary-color, #3B82F6);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    
    .seo-audit-widget-button:hover {
      filter: brightness(110%);
    }
    
    .seo-audit-widget-button:active {
      transform: scale(0.98);
    }
    
    .seo-audit-widget-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .seo-audit-widget-loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: seo-widget-spin 1s linear infinite;
      margin-right: 8px;
    }
    
    @keyframes seo-widget-spin {
      to { transform: rotate(360deg); }
    }
    
    .seo-audit-widget-success {
      text-align: center;
      padding: 20px;
    }
    
    .seo-audit-widget-success-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    
    .seo-audit-widget-success-message {
      font-size: 16px;
      color: #10b981;
      font-weight: 600;
    }
    
    .seo-audit-widget-error {
      background: #fef2f2;
      color: #dc2626;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 12px;
    }
    
    .seo-audit-widget-powered {
      text-align: center;
      margin-top: 16px;
      font-size: 12px;
      color: #9ca3af;
    }
    
    .seo-audit-widget-powered a {
      color: #6b7280;
      text-decoration: none;
    }
  `;

    // Widget class
    class SEOAuditWidget {
        constructor(containerId) {
            this.container = document.getElementById(containerId) || this.createContainer();
            this.config = null;
            this.init();
        }

        createContainer() {
            const container = document.createElement('div');
            container.id = 'seo-audit-widget-container';
            document.currentScript.parentNode.insertBefore(container, document.currentScript.nextSibling);
            return container;
        }

        async init() {
            this.injectStyles();
            await this.loadConfig();
            this.render();
        }

        injectStyles() {
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        async loadConfig() {
            try {
                const response = await fetch(`${API_BASE}/api/widget/public/${WIDGET_ID}/config`);
                if (!response.ok) throw new Error('Widget not found');
                this.config = await response.json();
            } catch (error) {
                console.error('SEO Audit Widget: Failed to load config', error);
                this.config = {
                    primaryColor: '#3B82F6',
                    buttonText: 'Get Free SEO Audit',
                    requireEmail: true,
                    requireName: false,
                };
            }
        }

        render() {
            const { config } = this;

            this.container.innerHTML = `
        <div class="seo-audit-widget" style="--widget-primary-color: ${config.primaryColor}">
          <div class="seo-audit-widget-header">
            ${config.branding?.logoUrl ? `<img src="${config.branding.logoUrl}" alt="Logo" class="seo-audit-widget-logo">` : ''}
            <h3 class="seo-audit-widget-title">Free SEO Audit</h3>
            <p class="seo-audit-widget-subtitle">Get your website analyzed in seconds</p>
          </div>
          
          <form class="seo-audit-widget-form" id="seo-audit-form">
            <input 
              type="url" 
              name="url" 
              class="seo-audit-widget-input" 
              placeholder="Enter your website URL"
              required
            >
            
            ${config.requireName ? `
              <input 
                type="text" 
                name="name" 
                class="seo-audit-widget-input" 
                placeholder="Your Name"
                required
              >
            ` : ''}
            
            ${config.requireEmail ? `
              <input 
                type="email" 
                name="email" 
                class="seo-audit-widget-input" 
                placeholder="Your Email"
                required
              >
            ` : ''}
            
            <button type="submit" class="seo-audit-widget-button">
              ${config.buttonText || 'Get Free SEO Audit'}
            </button>
          </form>
          
          <div id="seo-audit-error" class="seo-audit-widget-error" style="display: none;"></div>
          
          <div class="seo-audit-widget-powered">
            <a href="https://seoaudit.com" target="_blank">Powered by SEO Audit</a>
          </div>
        </div>
      `;

            this.attachEventListeners();
        }

        attachEventListeners() {
            const form = document.getElementById('seo-audit-form');
            form?.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        async handleSubmit(e) {
            e.preventDefault();

            const form = e.target;
            const button = form.querySelector('button');
            const errorDiv = document.getElementById('seo-audit-error');

            const formData = new FormData(form);
            const data = {
                widgetId: WIDGET_ID,
                url: formData.get('url'),
                email: formData.get('email') || undefined,
                name: formData.get('name') || undefined,
            };

            // Show loading
            button.disabled = true;
            button.innerHTML = '<span class="seo-audit-widget-loading"></span> Analyzing...';
            errorDiv.style.display = 'none';

            try {
                const response = await fetch(`${API_BASE}/api/widget/audit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Something went wrong');
                }

                // Show success
                this.showSuccess(result.message || this.config.successMessage);
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
                button.disabled = false;
                button.innerHTML = this.config.buttonText || 'Get Free SEO Audit';
            }
        }

        showSuccess(message) {
            const widget = this.container.querySelector('.seo-audit-widget');
            widget.innerHTML = `
        <div class="seo-audit-widget-success">
          <div class="seo-audit-widget-success-icon">✅</div>
          <p class="seo-audit-widget-success-message">${message}</p>
          <p style="color: #6b7280; margin-top: 12px; font-size: 14px;">
            Check your email for the full report!
          </p>
        </div>
        <div class="seo-audit-widget-powered">
          <a href="https://seoaudit.com" target="_blank">Powered by SEO Audit</a>
        </div>
      `;
        }
    }

    // Initialize widget when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new SEOAuditWidget());
    } else {
        new SEOAuditWidget();
    }
})();
