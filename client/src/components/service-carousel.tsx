import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Star, ArrowRight, Hammer, Wrench, Paintbrush, Zap, Droplets, Thermometer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  icon?: string;
}

const serviceIcons: Record<string, any> = {
  'House Painting': Paintbrush,
  'Electrical Work': Zap,
  'Plumbing': Droplets,
  'HVAC': Thermometer,
  'General Contractor': Hammer,
  'Handyman': Wrench,
};

export default function ServiceCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['/api/service-categories'],
    select: (data: ServiceCategory[]) => data.slice(0, 8), // Limit to 8 services for carousel
  });

  console.log('ServiceCarousel - services:', services, 'loading:', isLoading, 'error:', error);

  const itemsPerView = 3;
  const maxIndex = Math.max(0, services.length - itemsPerView);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || services.length === 0) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, maxIndex, services.length]);

  const goToSlide = (index: number) => {
    const newDirection = index > currentIndex ? 1 : -1;
    setDirection(newDirection);
    setCurrentIndex(Math.max(0, Math.min(maxIndex, index)));
  };

  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    } else {
      setDirection(1);
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    } else {
      setDirection(-1);
      setCurrentIndex(maxIndex);
    }
  };

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Services</h2>
          <p className="text-gray-600">Loading recommended services...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Services</h2>
        <p className="text-gray-600">No services available at the moment.</p>
      </div>
    );
  }

  const visibleServices = services.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <div 
      className="w-full max-w-6xl mx-auto px-4 py-8"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h2 
          className="text-3xl font-bold text-gray-900 mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Popular Services
        </motion.h2>
        <motion.p 
          className="text-gray-600 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Discover top-rated home improvement services from verified professionals in your area
        </motion.p>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white/100 transition-all duration-200"
          onClick={prevSlide}
          disabled={services.length <= itemsPerView}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white/100 transition-all duration-200"
          onClick={nextSlide}
          disabled={services.length <= itemsPerView}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Carousel Content */}
        <div className="overflow-hidden mx-12">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {visibleServices.map((service, index) => {
                const IconComponent = serviceIcons[service.name] || Hammer;
                
                return (
                  <motion.div
                    key={service.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="group"
                  >
                    <Card className="h-full transition-all duration-300 hover:shadow-xl border-2 hover:border-primary/20 group-hover:scale-105">
                      <CardContent className="p-6 flex flex-col h-full">
                        {/* Service Icon */}
                        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                          <IconComponent className="h-8 w-8 text-primary" />
                        </div>

                        {/* Service Info */}
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-300">
                          {service.name}
                        </h3>
                        
                        <p className="text-gray-600 mb-4 flex-grow line-clamp-3">
                          {service.description || `Professional ${service.name.toLowerCase()} services with experienced contractors.`}
                        </p>

                        {/* Rating and Price */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 ml-2">4.8</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Starting at</p>
                            <p className="text-lg font-semibold text-primary">
                              ${service.basePrice || 150}
                            </p>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button 
                          className="w-full group-hover:bg-primary/90 transition-all duration-300"
                          onClick={() => window.location.href = '/lead-marketplace'}
                        >
                          Get Quotes
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot Indicators */}
        {services.length > itemsPerView && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Auto-play indicator */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            {isAutoPlaying ? 'Pause' : 'Play'} auto-rotation
          </button>
        </div>
      </div>
    </div>
  );
}