'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Download,
    RefreshCw,
    Share2,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Info,
    Loader2,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface AuditDetail {
    id: string;
    url: string;
    score: number;
    status: string;
    pdfUrl: string | null;
    analysisResult: {
        technical: { score: number; issues: any[]; checks: Record<string, boolean> };
        onPage: { score: number; issues: any[]; data: any };
        performance: { score: number; issues: any[]; data: any };
        security: { score: number; issues: any[] };
        mobile: { score: number; issues: any[] };
    };
    aiSummary: string;
    topFixes: { title: string; description: string }[];
    createdAt: string;
}

export default function AuditDetailPage() {
    const params = useParams();
    const [audit, setAudit] = useState<AuditDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchAudit();
    }, [params.id]);

    const fetchAudit = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/audits/${params.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error('Failed to fetch audit');
            const data = await response.json();
            setAudit(data);
        } catch (error) {
            // Mock data for demo
            setAudit({
                id: params.id as string,
                url: 'https://example.com',
                score: 72,
                status: 'COMPLETE',
                pdfUrl: '/pdfs/sample.pdf',
                analysisResult: {
                    technical: {
                        score: 85,
                        issues: [
                            { type: 'warning', message: 'No sitemap found', recommendation: 'Add an XML sitemap' },
                            { type: 'info', message: 'Missing structured data', recommendation: 'Add Schema.org markup' }
                        ],
                        checks: { canonical: true, robots: true, https: true, sitemap: false }
                    },
                    onPage: {
                        score: 68,
                        issues: [
                            { type: 'error', message: 'Meta description too short', recommendation: 'Expand to 150-160 characters' },
                            { type: 'warning', message: '3 images missing alt text', recommendation: 'Add descriptive alt attributes' }
                        ],
                        data: { titleLength: 45, wordCount: 850, h1Count: 1 }
                    },
                    performance: {
                        score: 75,
                        issues: [
                            { type: 'warning', message: 'LCP is 2.8s', recommendation: 'Optimize largest contentful paint' }
                        ],
                        data: { lcp: '2.8s', fcp: '1.2s', cls: '0.05' }
                    },
                    security: {
                        score: 90,
                        issues: [
                            { type: 'info', message: 'Missing CSP header', recommendation: 'Add Content-Security-Policy header' }
                        ]
                    },
                    mobile: { score: 70, issues: [] }
                },
                aiSummary: 'This website has a solid foundation but needs improvements in on-page SEO and performance. The main priorities should be optimizing meta descriptions, adding alt text to images, and improving Core Web Vitals.',
                topFixes: [
                    { title: 'Optimize Meta Description', description: 'Expand the meta description to 150-160 characters with target keywords.' },
                    { title: 'Add Image Alt Text', description: 'Add descriptive alt attributes to all images for accessibility and SEO.' },
                    { title: 'Improve LCP', description: 'Optimize the largest contentful paint by lazy loading images and optimizing server response.' }
                ],
                createdAt: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/audits/${params.id}/regenerate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('PDF regeneration started');
            fetchAudit();
        } catch (error) {
            toast.error('Failed to regenerate PDF');
        } finally {
            setRegenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!audit) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Audit not found</p>
                <Link href="/dashboard/audits" className="btn btn-primary mt-4">
                    Back to Audits
                </Link>
            </div>
        );
    }

    const radarData = {
        labels: ['Technical', 'On-Page', 'Performance', 'Security', 'Mobile'],
        datasets: [{
            label: 'Score',
            data: [
                audit.analysisResult?.technical?.score ?? 0,
                audit.analysisResult?.onPage?.score ?? 0,
                audit.analysisResult?.performance?.score ?? 0,
                audit.analysisResult?.security?.score ?? 0,
                audit.analysisResult?.mobile?.score ?? 0
            ],
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
        }]
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/audits" className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {audit.url.replace(/^https?:\/\//, '')}
                            <a href={audit.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-5 h-5 text-gray-400 hover:text-primary-500" />
                            </a>
                        </h1>
                        <p className="text-gray-500">
                            Audited on {new Date(audit.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        className="btn btn-secondary"
                    >
                        {regenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Regenerate PDF
                    </button>
                    {audit.pdfUrl && (
                        <a href={audit.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </a>
                    )}
                </div>
            </div>

            {/* Score Overview */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="card md:col-span-1">
                    <div className="text-center">
                        <div className={`text-6xl font-bold mb-2 ${audit.score >= 80 ? 'text-success-500' :
                            audit.score >= 50 ? 'text-warning-500' : 'text-danger-500'
                            }`}>
                            {audit.score}
                        </div>
                        <p className="text-gray-500">Overall Score</p>
                    </div>
                    <div className="mt-6">
                        <Radar data={radarData} options={{ scales: { r: { beginAtZero: true, max: 100 } } }} />
                    </div>
                </div>

                <div className="card md:col-span-2">
                    <h3 className="font-semibold mb-4">AI Summary</h3>
                    <p className="text-gray-600 mb-6">{audit.aiSummary}</p>

                    <h3 className="font-semibold mb-4">Top Fixes</h3>
                    <div className="space-y-3">
                        {audit.topFixes.map((fix, index) => (
                            <div key={index} className="flex gap-3 bg-gray-50 rounded-lg p-4">
                                <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                                    {index + 1}
                                </div>
                                <div>
                                    <h4 className="font-medium">{fix.title}</h4>
                                    <p className="text-gray-600 text-sm">{fix.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <div className="flex gap-4">
                    {['overview', 'technical', 'onpage', 'performance', 'security'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 font-medium border-b-2 transition ${activeTab === tab
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="card">
                {activeTab === 'overview' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <ScoreCard title="Technical SEO" score={audit.analysisResult?.technical?.score ?? 0} issues={audit.analysisResult?.technical?.issues ?? []} />
                        <ScoreCard title="On-Page SEO" score={audit.analysisResult?.onPage?.score ?? 0} issues={audit.analysisResult?.onPage?.issues ?? []} />
                        <ScoreCard title="Performance" score={audit.analysisResult?.performance?.score ?? 0} issues={audit.analysisResult?.performance?.issues ?? []} />
                        <ScoreCard title="Security" score={audit.analysisResult?.security?.score ?? 0} issues={audit.analysisResult?.security?.issues ?? []} />
                    </div>
                )}

                {activeTab === 'technical' && (
                    <IssuesList
                        title="Technical SEO"
                        score={audit.analysisResult?.technical?.score ?? 0}
                        issues={audit.analysisResult?.technical?.issues ?? []}
                        checks={audit.analysisResult?.technical?.checks ?? {}}
                    />
                )}

                {activeTab === 'onpage' && (
                    <IssuesList
                        title="On-Page SEO"
                        score={audit.analysisResult?.onPage?.score ?? 0}
                        issues={audit.analysisResult?.onPage?.issues ?? []}
                        data={audit.analysisResult?.onPage?.data ?? {}}
                    />
                )}

                {activeTab === 'performance' && (
                    <IssuesList
                        title="Performance"
                        score={audit.analysisResult?.performance?.score ?? 0}
                        issues={audit.analysisResult?.performance?.issues ?? []}
                        data={audit.analysisResult?.performance?.data ?? {}}
                    />
                )}

                {activeTab === 'security' && (
                    <IssuesList
                        title="Security"
                        score={audit.analysisResult?.security?.score ?? 0}
                        issues={audit.analysisResult?.security?.issues ?? []}
                    />
                )}
            </div>
        </div>
    );
}

function ScoreCard({ title, score, issues }: { title: string; score: number; issues: any[] }) {
    return (
        <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{title}</h4>
                <span className={`text-2xl font-bold ${score >= 80 ? 'text-success-500' :
                    score >= 50 ? 'text-warning-500' : 'text-danger-500'
                    }`}>
                    {score}
                </span>
            </div>
            <p className="text-sm text-gray-500">
                {issues.length === 0 ? 'No issues found' : `${issues.length} issue${issues.length > 1 ? 's' : ''} found`}
            </p>
        </div>
    );
}

function IssuesList({ title, score, issues, checks, data }: any) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'error': return <XCircle className="w-5 h-5 text-danger-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-warning-500" />;
            case 'info': return <Info className="w-5 h-5 text-primary-500" />;
            default: return <Info className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">{title}</h3>
                <span className={`text-3xl font-bold ${score >= 80 ? 'text-success-500' :
                    score >= 50 ? 'text-warning-500' : 'text-danger-500'
                    }`}>
                    {score}/100
                </span>
            </div>

            {checks && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Object.entries(checks).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                            {value ? <CheckCircle className="w-5 h-5 text-success-500" /> : <XCircle className="w-5 h-5 text-danger-500" />}
                            <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                    ))}
                </div>
            )}

            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className="text-lg font-semibold">{value as string}</p>
                        </div>
                    ))}
                </div>
            )}

            <h4 className="font-medium mb-4">Issues ({issues.length})</h4>
            {issues.length === 0 ? (
                <p className="text-gray-500">No issues found. Great job!</p>
            ) : (
                <div className="space-y-3">
                    {issues.map((issue: any, index: number) => (
                        <div key={index} className="flex gap-3 border rounded-lg p-4">
                            {getIcon(issue.type)}
                            <div>
                                <p className="font-medium">{issue.message}</p>
                                {issue.recommendation && (
                                    <p className="text-sm text-gray-600 mt-1">💡 {issue.recommendation}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
