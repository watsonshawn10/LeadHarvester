import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Home, Briefcase, Shield, Star } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="gradient-primary text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Connect with Trusted Home Service Professionals
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Get quality leads for your business or find verified contractors for your home projects. Safe, simple, and efficient.
            </p>
            
            {/* Dual CTA Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Choose your path:</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link href="/auth?type=homeowner">
                  <Button className="bg-white text-primary px-6 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors w-full h-auto">
                    <div className="flex flex-col items-start text-left">
                      <Home className="text-primary mb-2 text-xl" />
                      <div className="font-semibold">I'm a Homeowner</div>
                      <div className="text-sm text-neutral-600">Find contractors for my project</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/auth?type=business">
                  <Button className="bg-secondary text-white px-6 py-4 rounded-xl font-semibold hover:bg-green-600 transition-colors w-full h-auto">
                    <div className="flex flex-col items-start text-left">
                      <Briefcase className="text-white mb-2 text-xl" />
                      <div className="font-semibold">I'm a Service Pro</div>
                      <div className="text-sm text-green-100">Get qualified leads</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                <span>Licensed & Insured Pros</span>
              </div>
              <div className="flex items-center">
                <Star className="mr-2 h-4 w-4" />
                <span>4.8/5 Average Rating</span>
              </div>
            </div>
          </div>
          
          <div className="lg:pl-8">
            <img 
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Professional contractor working on home renovation" 
              className="rounded-2xl shadow-2xl w-full h-auto hover-lift" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
