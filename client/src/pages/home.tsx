import Navigation from '@/components/navigation';
import HeroSection from '@/components/hero-section';
import ServiceCarouselSimple from '@/components/service-carousel-simple';
import ServiceCategories from '@/components/service-categories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Shield, DollarSign, Users, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <HeroSection />
      
      {/* Service Recommendation Carousel */}
      <section className="py-16 bg-gradient-to-b from-white to-neutral-50">
        <ServiceCarouselSimple />
      </section>
      
      <ServiceCategories />
      
      {/* Trust Section */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-800 mb-4">Why Choose TaskNab?</h2>
            <p className="text-lg text-neutral-600">Trusted by thousands of homeowners and service professionals</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-2">Verified Professionals</h3>
              <p className="text-neutral-600">All service providers are licensed, insured, and background-checked</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="text-secondary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-2">Fair Pricing</h3>
              <p className="text-neutral-600">Transparent lead pricing with no hidden fees or long-term contracts</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-purple-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-2">Quality Matches</h3>
              <p className="text-neutral-600">Smart matching algorithm connects the right pros with the right projects</p>
            </div>
          </div>

          {/* Competitive Pricing Section */}
          <div className="bg-white rounded-2xl p-8 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-neutral-800 mb-4">Competitive Lead Pricing</h3>
              <p className="text-neutral-600">See how TaskNab compares to Thumbtack for lead costs</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h4 className="text-lg font-semibold text-neutral-800 mb-4">Why Choose TaskNab?</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                    <span className="text-neutral-700">20-30% lower lead costs than Thumbtack</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                    <span className="text-neutral-700">Automatic lead distribution to qualified contractors</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                    <span className="text-neutral-700">Budget controls and spending limits</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                    <span className="text-neutral-700">No monthly subscription fees</span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-neutral-800 mb-4">Sample Lead Prices</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                    <span className="text-sm text-neutral-600">Kitchen Renovation</span>
                    <div className="text-right">
                      <span className="text-sm line-through text-neutral-400">$50-70</span>
                      <span className="text-sm font-semibold text-secondary ml-2">$45</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                    <span className="text-sm text-neutral-600">Electrical Work</span>
                    <div className="text-right">
                      <span className="text-sm line-through text-neutral-400">$30-40</span>
                      <span className="text-sm font-semibold text-secondary ml-2">$25</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                    <span className="text-sm text-neutral-600">Plumbing Services</span>
                    <div className="text-right">
                      <span className="text-sm line-through text-neutral-400">$25-35</span>
                      <span className="text-sm font-semibold text-secondary ml-2">$20</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                    <span className="text-sm text-neutral-600">House Painting</span>
                    <div className="text-right">
                      <span className="text-sm line-through text-neutral-400">$28-35</span>
                      <span className="text-sm font-semibold text-secondary ml-2">$22</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-neutral-600">Handyman Services</span>
                    <div className="text-right">
                      <span className="text-sm line-through text-neutral-400">$15-25</span>
                      <span className="text-sm font-semibold text-secondary ml-2">$12</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-neutral-500">
                  * Competitor pricing based on 2024 market research
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108755-2616b66639d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80" 
                    alt="Happy homeowner Sarah" 
                    className="w-12 h-12 rounded-full object-cover" 
                  />
                  <div>
                    <div className="flex text-yellow-400 mb-2">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                    <p className="text-neutral-600 mb-2">"Found an amazing contractor for our kitchen renovation. The whole process was seamless and professional."</p>
                    <div className="text-sm text-neutral-500">Sarah M. - Homeowner</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80" 
                    alt="Professional contractor Tom" 
                    className="w-12 h-12 rounded-full object-cover" 
                  />
                  <div>
                    <div className="flex text-yellow-400 mb-2">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                    <p className="text-neutral-600 mb-2">"TaskNab has transformed my business. Quality leads, fair pricing, and excellent ROI. Highly recommended!"</p>
                    <div className="text-sm text-neutral-500">Tom R. - Painting Contractor</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">Join thousands of satisfied customers and grow your business today</p>
          
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link href="/auth?type=homeowner">
              <Button className="bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors w-full h-auto">
                <div className="flex items-center justify-center">
                  <Users className="mr-2 h-5 w-5" />
                  I Need a Pro
                </div>
                <div className="text-sm text-neutral-600 mt-1">Find qualified contractors</div>
              </Button>
            </Link>
            
            <Link href="/auth?type=business">
              <Button className="bg-secondary text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-600 transition-colors border-2 border-green-400 w-full h-auto">
                <div className="flex items-center justify-center">
                  <Shield className="mr-2 h-5 w-5" />
                  I'm a Professional
                </div>
                <div className="text-sm text-green-100 mt-1">Get quality leads</div>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-800 text-neutral-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Shield className="text-primary text-2xl mr-2" />
                <span className="text-xl font-bold text-white">TaskNab</span>
              </div>
              <p className="text-sm text-neutral-400">Connecting homeowners with trusted service professionals nationwide.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">For Homeowners</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Find Contractors</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Project Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety & Trust</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">For Professionals</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Get Leads</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Business Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-neutral-700 mt-8 pt-8 text-center">
            <p className="text-sm text-neutral-400">&copy; 2024 TaskNab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
