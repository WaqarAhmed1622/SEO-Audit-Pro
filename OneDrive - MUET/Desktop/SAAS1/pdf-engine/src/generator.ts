import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// S3 Configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET || 'seo-audit-pdfs';

interface GeneratePdfOptions {
    auditId: string;
    url: string;
    score: number;
    analysisResult: any;
    aiSummary?: string;
    topFixes?: any[];
    branding?: {
        logoUrl?: string;
        companyName?: string;
        primaryColor?: string;
        secondaryColor?: string;
        footerText?: string;
    };
}

// Register Handlebars helpers
Handlebars.registerHelper('scoreColor', (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
});

Handlebars.registerHelper('scoreLabel', (score: number) => {
    if (score >= 80) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
});

Handlebars.registerHelper('impactBadge', (impact: string) => {
    const colors: Record<string, string> = {
        high: '#EF4444',
        medium: '#F59E0B',
        low: '#6B7280',
    };
    return colors[impact] || '#6B7280';
});

Handlebars.registerHelper('issueIcon', (type: string) => {
    const icons: Record<string, string> = {
        error: '❌',
        warning: '⚠️',
        recommendation: '💡',
        info: 'ℹ️',
    };
    return icons[type] || 'ℹ️';
});

Handlebars.registerHelper('checkIcon', (passed: boolean | null) => {
    if (passed === null) return '❓';
    return passed ? '✅' : '❌';
});

Handlebars.registerHelper('formatDate', (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
});

export async function generatePdf(options: GeneratePdfOptions): Promise<string> {
    const {
        auditId,
        url,
        score,
        analysisResult,
        aiSummary,
        topFixes,
        branding,
    } = options;

    // Load template
    const templatePath = path.join(__dirname, '..', 'templates', 'audit-report.hbs');
    let templateSource: string;

    try {
        templateSource = await fs.readFile(templatePath, 'utf-8');
    } catch {
        // Use inline template if file not found
        templateSource = getDefaultTemplate();
    }

    const template = Handlebars.compile(templateSource);

    // Prepare data
    const data = {
        auditId,
        url,
        score,
        generatedAt: new Date(),
        branding: {
            logoUrl: branding?.logoUrl || '',
            companyName: branding?.companyName || 'SEO Audit',
            primaryColor: branding?.primaryColor || '#3B82F6',
            secondaryColor: branding?.secondaryColor || '#1E40AF',
            footerText: branding?.footerText || 'Powered by SEO Audit Platform',
        },
        technical: analysisResult?.technical || {},
        onPage: analysisResult?.onPage || {},
        performance: analysisResult?.performance || {},
        security: analysisResult?.security || {},
        mobile: analysisResult?.mobile || {},
        aiSummary,
        topFixes: topFixes || [],
    };

    // Render HTML
    const html = template(data);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm',
            },
        });

        // Upload to S3
        const fileName = `audits/${auditId}/${uuidv4()}.pdf`;

        if (process.env.AWS_ACCESS_KEY_ID) {
            await s3Client.send(new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: fileName,
                Body: pdfBuffer,
                ContentType: 'application/pdf',
            }));

            return `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`;
        } else {
            // Local storage fallback
            const localPath = path.join(__dirname, '..', '..', 'pdfs', fileName);
            await fs.mkdir(path.dirname(localPath), { recursive: true });
            await fs.writeFile(localPath, pdfBuffer);
            return `/pdfs/${fileName}`;
        }
    } finally {
        await browser.close();
    }
}

function getDefaultTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    
    .page {
      page-break-after: always;
      padding: 20px;
    }
    
    .page:last-child {
      page-break-after: avoid;
    }
    
    /* Cover Page */
    .cover {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, {{branding.primaryColor}} 0%, {{branding.secondaryColor}} 100%);
      color: white;
    }
    
    .cover h1 {
      font-size: 48px;
      margin-bottom: 20px;
    }
    
    .cover .url {
      font-size: 20px;
      opacity: 0.9;
      word-break: break-all;
      max-width: 80%;
    }
    
    .cover .score-circle {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: 40px 0;
    }
    
    .cover .score-circle .score {
      font-size: 72px;
      font-weight: bold;
      color: {{scoreColor score}};
    }
    
    .cover .score-circle .label {
      font-size: 16px;
      color: #666;
    }
    
    .cover .date {
      margin-top: 40px;
      font-size: 14px;
      opacity: 0.8;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid {{branding.primaryColor}};
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    
    .header .logo {
      height: 40px;
    }
    
    .header h2 {
      color: {{branding.primaryColor}};
    }
    
    /* Sections */
    .section {
      margin-bottom: 30px;
    }
    
    .section h3 {
      color: {{branding.primaryColor}};
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    
    /* Score Cards */
    .score-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .score-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .score-card .name {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .score-card .value {
      font-size: 36px;
      font-weight: bold;
    }
    
    /* Issues List */
    .issues-list {
      list-style: none;
    }
    
    .issues-list li {
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 8px;
      border-left: 4px solid;
    }
    
    .issues-list li.error {
      background: #FEE2E2;
      border-color: #EF4444;
    }
    
    .issues-list li.warning {
      background: #FEF3C7;
      border-color: #F59E0B;
    }
    
    .issues-list li.recommendation {
      background: #E0F2FE;
      border-color: #3B82F6;
    }
    
    .issue-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    
    .issue-header .message {
      font-weight: 600;
    }
    
    .issue-header .impact {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 4px;
      color: white;
    }
    
    .issue-recommendation {
      font-size: 14px;
      color: #666;
    }
    
    /* Checklist */
    .checklist {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    
    .check-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #f9fafb;
      border-radius: 6px;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page cover">
    {{#if branding.logoUrl}}
    <img src="{{branding.logoUrl}}" alt="Logo" style="max-height: 60px; margin-bottom: 30px;">
    {{else}}
    <h2 style="margin-bottom: 30px;">{{branding.companyName}}</h2>
    {{/if}}
    
    <h1>SEO Audit Report</h1>
    <p class="url">{{url}}</p>
    
    <div class="score-circle">
      <span class="score">{{score}}</span>
      <span class="label">{{scoreLabel score}}</span>
    </div>
    
    <p class="date">Generated on {{formatDate generatedAt}}</p>
  </div>
  
  <!-- Executive Summary -->
  <div class="page">
    <div class="header">
      <h2>Executive Summary</h2>
    </div>
    
    <div class="score-cards">
      <div class="score-card">
        <div class="name">Technical SEO</div>
        <div class="value" style="color: {{scoreColor technical.score}}">{{technical.score}}</div>
      </div>
      <div class="score-card">
        <div class="name">On-Page SEO</div>
        <div class="value" style="color: {{scoreColor onPage.score}}">{{onPage.score}}</div>
      </div>
      <div class="score-card">
        <div class="name">Performance</div>
        <div class="value" style="color: {{scoreColor performance.score}}">{{performance.score}}</div>
      </div>
      <div class="score-card">
        <div class="name">Security</div>
        <div class="value" style="color: {{scoreColor security.score}}">{{security.score}}</div>
      </div>
      <div class="score-card">
        <div class="name">Mobile</div>
        <div class="value" style="color: {{scoreColor mobile.score}}">{{mobile.score}}</div>
      </div>
      <div class="score-card">
        <div class="name">Overall</div>
        <div class="value" style="color: {{scoreColor score}}">{{score}}</div>
      </div>
    </div>
    
    {{#if aiSummary}}
    <div class="section">
      <h3>AI Analysis</h3>
      <p>{{aiSummary}}</p>
    </div>
    {{/if}}
  </div>
  
  <!-- Technical SEO -->
  <div class="page">
    <div class="header">
      <h2>Technical SEO</h2>
      <span style="font-size: 24px; color: {{scoreColor technical.score}}">{{technical.score}}/100</span>
    </div>
    
    <div class="section">
      <h3>Issues Found</h3>
      <ul class="issues-list">
        {{#each technical.issues}}
        <li class="{{this.type}}">
          <div class="issue-header">
            <span class="message">{{issueIcon this.type}} {{this.message}}</span>
            <span class="impact" style="background: {{impactBadge this.impact}}">{{this.impact}}</span>
          </div>
          {{#if this.recommendation}}
          <p class="issue-recommendation">💡 {{this.recommendation}}</p>
          {{/if}}
        </li>
        {{/each}}
      </ul>
    </div>
    
    <div class="section">
      <h3>Checks</h3>
      <div class="checklist">
        {{#each technical.checks}}
        <div class="check-item">
          <span>{{checkIcon this}}</span>
          <span>{{@key}}</span>
        </div>
        {{/each}}
      </div>
    </div>
  </div>
  
  <!-- On-Page SEO -->
  <div class="page">
    <div class="header">
      <h2>On-Page SEO</h2>
      <span style="font-size: 24px; color: {{scoreColor onPage.score}}">{{onPage.score}}/100</span>
    </div>
    
    <div class="section">
      <h3>Issues Found</h3>
      <ul class="issues-list">
        {{#each onPage.issues}}
        <li class="{{this.type}}">
          <div class="issue-header">
            <span class="message">{{issueIcon this.type}} {{this.message}}</span>
            <span class="impact" style="background: {{impactBadge this.impact}}">{{this.impact}}</span>
          </div>
          {{#if this.recommendation}}
          <p class="issue-recommendation">💡 {{this.recommendation}}</p>
          {{/if}}
        </li>
        {{/each}}
      </ul>
    </div>
    
    <div class="section">
      <h3>Page Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Title</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">{{onPage.data.title}} ({{onPage.data.titleLength}} chars)</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Meta Description</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">{{onPage.data.metaDescriptionLength}} chars</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Word Count</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">{{onPage.data.wordCount}}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>H1 Tags</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">{{onPage.data.h1Count}}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Images Missing Alt</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">{{onPage.data.imagesWithoutAlt}}</td>
        </tr>
      </table>
    </div>
  </div>
  
  <!-- Performance -->
  <div class="page">
    <div class="header">
      <h2>Performance</h2>
      <span style="font-size: 24px; color: {{scoreColor performance.score}}">{{performance.score}}/100</span>
    </div>
    
    {{#if performance.data.lcp}}
    <div class="score-cards">
      <div class="score-card">
        <div class="name">LCP</div>
        <div class="value" style="font-size: 24px;">{{performance.data.lcp}}</div>
      </div>
      <div class="score-card">
        <div class="name">FCP</div>
        <div class="value" style="font-size: 24px;">{{performance.data.fcp}}</div>
      </div>
      <div class="score-card">
        <div class="name">CLS</div>
        <div class="value" style="font-size: 24px;">{{performance.data.cls}}</div>
      </div>
    </div>
    {{/if}}
    
    <div class="section">
      <h3>Issues Found</h3>
      <ul class="issues-list">
        {{#each performance.issues}}
        <li class="{{this.type}}">
          <div class="issue-header">
            <span class="message">{{issueIcon this.type}} {{this.message}}</span>
          </div>
          {{#if this.recommendation}}
          <p class="issue-recommendation">💡 {{this.recommendation}}</p>
          {{/if}}
        </li>
        {{/each}}
      </ul>
    </div>
  </div>
  
  <!-- Recommendations -->
  {{#if topFixes.length}}
  <div class="page">
    <div class="header">
      <h2>Top Recommendations</h2>
    </div>
    
    <ol style="padding-left: 20px;">
      {{#each topFixes}}
      <li style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
        <strong>{{this.title}}</strong>
        <p style="color: #666; margin-top: 5px;">{{this.description}}</p>
      </li>
      {{/each}}
    </ol>
  </div>
  {{/if}}
  
  <div class="footer">
    <p>{{branding.footerText}}</p>
  </div>
</body>
</html>
  `;
}
