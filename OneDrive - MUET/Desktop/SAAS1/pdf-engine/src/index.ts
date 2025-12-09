import express from 'express';
import dotenv from 'dotenv';
import { generatePdf } from './generator.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'pdf-engine' });
});

// Generate PDF
app.post('/generate', async (req, res) => {
    try {
        const {
            auditId,
            url,
            score,
            analysisResult,
            aiSummary,
            topFixes,
            branding,
        } = req.body;

        const pdfUrl = await generatePdf({
            auditId,
            url,
            score,
            analysisResult,
            aiSummary,
            topFixes,
            branding,
        });

        res.json({ pdfUrl });
    } catch (error: any) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🖨️ PDF Engine running on port ${PORT}`);
});
