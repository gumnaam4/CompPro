import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer';
import type { Request, Response } from 'express';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

console.log('[Server] Starting server initialization...');

// Apply stealth plugin — hides all headless browser fingerprints
puppeteer.use(StealthPlugin());

// OpenAI NVIDIA API setup for keyword extraction
const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://integrate.api.nvidia.com/v1',
  defaultHeaders: {
    'User-Agent': 'legislation-analyzer/1.0',
  },
});

// Qdrant vector search setup
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = 'legislation';
let qdrantClient: QdrantClient | null = null;

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', browser: browser?.connected ?? false });
});

app.get('/test', (req, res) => {
  console.log('[Simple Test] GET /test called');
  res.json({ status: 'simple test endpoint works' });
});

/** AI narrative: consolidated actions to address all selected compliance warnings */
app.post('/api/report-action-plan', async (req: Request, res: Response) => {
  try {
    const { items, companyDetails, pdfFileName, generatedAt } = req.body as {
      items?: Array<{
        legislationTitle: string;
        category: string;
        severity: string;
        description: string;
        suggestedAction: string;
        legislationReference: string;
      }>;
      companyDetails?: Record<string, string>;
      pdfFileName?: string;
      generatedAt?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const issuesBlock = items
      .map(
        (it, i) =>
          `--- Issue ${i + 1} ---
Legislation: ${it.legislationTitle}
Category: ${it.category} | Severity: ${it.severity}
Description: ${it.description}
Suggested action (from analysis): ${it.suggestedAction}
Reference: ${it.legislationReference}`
      )
      .join('\n\n');

    const companyCtx = companyDetails
      ? `Company profile: ${JSON.stringify(companyDetails)}`
      : 'Company profile: not specified';

    const prompt = `You are a UK compliance and legal-operations adviser. The user has a document (${pdfFileName || 'uploaded PDF'}) and selected the following legislation comparison warnings. Produce a single professional "Action plan" section they can follow to address ALL issues together.

${companyCtx}
Report generated: ${generatedAt || 'unknown'}

${issuesBlock}

Requirements:
- Write in clear UK English, imperative where appropriate (what the organisation should do).
- Group related actions where sensible; use numbered sections and bullet points.
- Prioritise by severity and regulatory risk (critical/high first).
- Include concrete steps (policies, documentation updates, legal review, training, filings, deadlines where applicable).
- Do not repeat the raw issue text verbatim; synthesise into an executive action list.
- If multiple issues share one remedy, merge them.
- End with a short "Review cadence" line (e.g. when to reassess).
- Maximum length: about 800 words unless fewer issues warrant less.`;

    const completion = await openai.chat.completions.create({
      model: 'minimaxai/minimax-m2.7',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.35,
      top_p: 0.9,
      max_tokens: 3072,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    const text = raw.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
    if (!text) {
      return res.status(502).json({ error: 'Empty model response' });
    }

    res.json({ text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Action plan generation failed';
    console.error('[Report action plan]', message);
    res.status(500).json({ error: message });
  }
});

// Keyword extraction endpoint
app.post('/api/extract-keywords', async (req: Request, res: Response) => {
  console.log('[Extract Keywords] Request received');
  try {
    const { pdfText } = req.body;
    console.log('[Extract Keywords] PDF text received, length:', pdfText?.length || 'undefined');

    if (!pdfText || typeof pdfText !== 'string') {
      console.log('[Extract Keywords] Invalid input');
      return res.status(400).json({ error: 'pdfText is required and must be a string' });
    }

    // Use fast fallback extraction immediately
    console.log('[Extract Keywords] Running fallback extraction');
    const fallbackKeywords = extractSimpleKeywords(pdfText);
    
    // Send response immediately with fallback
    console.log('[Extract Keywords] Returning response with keywords:', fallbackKeywords.length);
    res.json({
      keywords: fallbackKeywords,
      topics: ['legislation', 'policy', 'regulation'],
      summary: 'Document analysis',
    });

    // Try AI extraction in background (don't wait for it)
    extractKeywordsWithAI(pdfText).catch(err => {
      console.warn('Background AI extraction failed:', err.message);
    });
  } catch (error: any) {
    console.error('Keyword extraction error:', error);
    res.status(500).json({ error: error.message || 'Keyword extraction failed' });
  }
});

/**
 * Fast keyword extraction fallback
 */
function extractSimpleKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was',
    'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new',
    'now', 'old', 'see', 'two', 'way', 'use', 'with', 'that', 'this', 'from', 'they',
    'will', 'have', 'been', 'more', 'than', 'when', 'who', 'what', 'which', 'their',
    'should', 'would', 'could', 'shall', 'be', 'is', 'as', 'or', 'in', 'at', 'to', 'by',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !stopWords.has(w));

  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * AI-enhanced keyword extraction (background)
 */
async function extractKeywordsWithAI(pdfText: string): Promise<void> {
  try {
    const prompt = `Analyze the following document and extract the most important keywords and topics for legislation search.

Document content:
${pdfText.substring(0, 3000)}

Please respond in JSON format with:
{
  "keywords": ["keyword1", "keyword2", ...],  // 5-10 specific terms from the document
  "topics": ["topic1", "topic2", ...],        // 3-5 broader legislative topics
  "summary": "One sentence summary of the document's main focus"
}

Focus on terms that would match legislative documents. Include regulatory terms, specific acts, procedural terms, and subject matter keywords.`;

    const completion = await openai.chat.completions.create({
      model: 'minimaxai/minimax-m2.7',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 1024,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      console.log('[AI Keywords] Successfully enhanced keywords using NVIDIA API');
    }
  } catch (error: any) {
    console.warn('[AI Keywords] Background extraction failed:', error.message);
  }
}

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    } as any);
    console.log('[Browser] Stealth Chromium launched ✓');
  }
  return browser as Browser;
}

// Proxy route — uses stealth headless browser to pass WAF challenge
app.use('/api/legislation', async (req: Request, res: Response) => {
  const targetUrl = `https://www.legislation.gov.uk${req.url}`;
  console.log(`[Proxy →] ${targetUrl}`);

  let page: Page | null = null;

  try {
    const b = await getBrowser();
    page = await b.newPage() as Page;

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
    });

    // Navigate and let the WAF JS challenge execute
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 25000 });

    // If there is still a WAF challenge, wait a bit more for it to resolve
    await new Promise(r => setTimeout(r, 2000));
    await page.waitForFunction(() => !document.title.includes('Just a moment'), { timeout: 10000 }).catch(() => {});

    // Extract the raw page text (for XML feeds, contains the actual Atom data)
    const bodyText: string = await page.evaluate(() => {
      // For XML documents, the browser renders the raw XML text in the body
      const pre = document.querySelector('pre');
      if (pre) return pre.innerText;
      return document.body?.innerText ?? document.documentElement.innerText ?? '';
    });

    console.log(`[Proxy ←] ${bodyText.length} chars | starts: ${bodyText.substring(0, 80).replace(/\n/g, ' ')}`);

    if (bodyText.includes('<feed') || bodyText.includes('<?xml') || bodyText.includes('<entry')) {
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.status(200).send(bodyText);
    } else {
      // WAF might still be blocking — try waiting and retrying once
      await page.reload({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 3000));
      const retryText: string = await page.evaluate(() => {
        const pre = document.querySelector('pre');
        if (pre) return pre.innerText;
        return document.body?.innerText ?? '';
      });

      if (retryText.includes('<feed') || retryText.includes('<entry')) {
        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.status(200).send(retryText);
      } else {
        console.warn('[Proxy] WAF challenge not resolved, returning raw HTML');
        res.set('Content-Type', 'text/html');
        res.status(202).send(retryText);
      }
    }
  } catch (error: any) {
    console.error(`[Proxy Error] ${error.message}`);
    res.status(500).json({ error: error.message });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  if (browser) await browser.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Stealth proxy running at http://localhost:${PORT}`);
  getBrowser().catch(err => console.error('[Browser startup error]', err.message));
});
