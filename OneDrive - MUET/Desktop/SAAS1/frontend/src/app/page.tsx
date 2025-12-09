import Link from 'next/link';
import { ArrowRight, Zap, Shield, Palette, BarChart3, Users, Globe } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">SEO Audit Pro</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</Link>
                            <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition">Blog</Link>
                            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition">Login</Link>
                            <Link href="/signup" className="btn btn-primary">
                                Start Free Trial
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <Zap className="w-4 h-4" />
                        Professional SEO Audits in 60 Seconds
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                        SEO Audits That
                        <span className="gradient-text block">Win Clients</span>
                    </h1>

                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                        Generate comprehensive, white-labeled SEO reports instantly.
                        Perfect for agencies, freelancers, and marketing professionals.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/audit" className="btn btn-primary text-lg px-8 py-4">
                            Try Free Audit
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                        <Link href="/pricing" className="btn btn-secondary text-lg px-8 py-4">
                            View Pricing
                        </Link>
                    </div>

                    <p className="text-sm text-gray-500 mt-4">
                        No credit card required • 1 free audit included
                    </p>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Everything You Need to Win More Clients
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Powerful features designed for agencies and SEO professionals
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="w-6 h-6" />}
                            title="60-Second Audits"
                            description="Complete SEO analysis including technical, on-page, performance, and security checks in under a minute."
                        />
                        <FeatureCard
                            icon={<Palette className="w-6 h-6" />}
                            title="White-Label Branding"
                            description="Add your logo, colors, and custom domain. Clients see your brand, not ours."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-6 h-6" />}
                            title="Beautiful PDF Reports"
                            description="Professionally designed reports that impress clients and close deals."
                        />
                        <FeatureCard
                            icon={<Users className="w-6 h-6" />}
                            title="Client Portal"
                            description="Give clients their own portal to view audits and track progress."
                        />
                        <FeatureCard
                            icon={<Globe className="w-6 h-6" />}
                            title="Embeddable Widget"
                            description="Capture leads with an audit widget on your website."
                        />
                        <FeatureCard
                            icon={<Shield className="w-6 h-6" />}
                            title="API Access"
                            description="Integrate audits into your workflows with our REST API."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-r from-primary-500 to-purple-500 rounded-3xl p-12 text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Close More Deals?
                        </h2>
                        <p className="text-lg opacity-90 mb-8">
                            Join thousands of agencies using SEO Audit Pro to win clients.
                        </p>
                        <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition">
                            Start Your Free Trial
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12 px-4">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-white">SEO Audit Pro</span>
                        </div>
                        <p className="text-sm">
                            Professional SEO audits in seconds. Your branding. No technical skills required.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Product</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                            <li><Link href="/features" className="hover:text-white transition">Features</Link></li>
                            <li><Link href="/api" className="hover:text-white transition">API</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Company</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/about" className="hover:text-white transition">About</Link></li>
                            <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-sm">
                    © {new Date().getFullYear()} SEO Audit Pro. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="card card-hover">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}
