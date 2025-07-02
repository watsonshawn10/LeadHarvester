import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Hammer, Menu, X } from 'lucide-react';
import { useState } from 'react';

// Global logout function
(window as any).forceLogout = () => {
  console.log('Force logout called!');
  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(";").forEach((c) => { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  window.location.href = '/auth';
};

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Hammer className="text-primary text-2xl mr-2" />
              <span className="text-xl font-bold text-neutral-800">TaskNab</span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-8">
                <Link href="/#services">
                  <span className="text-neutral-600 hover:text-primary px-3 py-2 text-sm font-medium cursor-pointer">
                    Services
                  </span>
                </Link>
                <Link href="/#how-it-works">
                  <span className="text-neutral-600 hover:text-primary px-3 py-2 text-sm font-medium cursor-pointer">
                    How It Works
                  </span>
                </Link>
                <Link href="/#pricing">
                  <span className="text-neutral-600 hover:text-primary px-3 py-2 text-sm font-medium cursor-pointer">
                    Pricing
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href={user.userType === 'homeowner' ? '/homeowner-dashboard' : '/business-dashboard'}>
                  <Button variant="ghost" className="text-neutral-600 hover:text-primary">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/scheduler">
                  <Button variant="ghost" className="text-neutral-600 hover:text-primary">
                    Schedule
                  </Button>
                </Link>
                {user.userType === 'service_provider' && (
                  <>
                    <Link href="/lead-marketplace">
                      <Button variant="ghost" className="text-neutral-600 hover:text-primary">
                        Find Leads
                      </Button>
                    </Link>
                    <Link href="/contractor-settings">
                      <Button variant="ghost" className="text-neutral-600 hover:text-primary">
                        Settings
                      </Button>
                    </Link>
                    <Link href="/scheduler">
                      <Button variant="ghost" className="text-neutral-600 hover:text-primary">
                        Schedule
                      </Button>
                    </Link>
                  </>
                )}
                {user.userType === 'admin' && (
                  <Link href="/admin">
                    <Button variant="ghost" className="text-orange-600 hover:text-orange-700 font-medium">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <button 
                  onClick={() => (window as any).forceLogout()}
                  className="px-3 py-2 text-sm font-medium text-neutral-600 hover:text-primary"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" className="text-neutral-600 hover:text-primary">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth?type=business">
                  <Button className="bg-secondary text-white hover:bg-green-600">
                    Join as Pro
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-neutral-200">
              <Link href="/#services">
                <span className="text-neutral-600 hover:text-primary block px-3 py-2 text-base font-medium cursor-pointer">
                  Services
                </span>
              </Link>
              <Link href="/#how-it-works">
                <span className="text-neutral-600 hover:text-primary block px-3 py-2 text-base font-medium cursor-pointer">
                  How It Works
                </span>
              </Link>
              {user ? (
                <>
                  <Link href={user.userType === 'homeowner' ? '/homeowner-dashboard' : '/business-dashboard'}>
                    <span className="text-neutral-600 hover:text-primary block px-3 py-2 text-base font-medium cursor-pointer">
                      Dashboard
                    </span>
                  </Link>
                  {user.userType === 'service_provider' && (
                    <>
                      <Link href="/lead-marketplace">
                        <span className="text-neutral-600 hover:text-primary block px-3 py-2 text-base font-medium cursor-pointer">
                          Find Leads
                        </span>
                      </Link>
                      <Link href="/contractor-settings">
                        <span className="text-neutral-600 hover:text-primary block px-3 py-2 text-base font-medium cursor-pointer">
                          Settings
                        </span>
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => (window as any).forceLogout()}
                    className="text-neutral-600 hover:text-primary block px-3 py-2 text-base font-medium w-full text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth">
                    <span className="text-neutral-600 hover:text-primary block px-3 py-2 text-base font-medium cursor-pointer">
                      Sign In
                    </span>
                  </Link>
                  <Link href="/auth?type=business">
                    <span className="text-secondary hover:text-green-600 block px-3 py-2 text-base font-medium cursor-pointer">
                      Join as Pro
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
