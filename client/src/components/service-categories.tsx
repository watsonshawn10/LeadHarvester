import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServiceCategory } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ServiceCategories() {
  const { data: categories, isLoading } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service-categories'],
  });

  if (isLoading) {
    return (
      <section id="services" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-800 mb-4">Popular Service Categories</h2>
            <p className="text-lg text-neutral-600">Find qualified professionals for any home improvement project</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-40" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-800 mb-4">Popular Service Categories</h2>
          <p className="text-lg text-neutral-600">Find qualified professionals for any home improvement project</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((category) => (
            <Card key={category.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-neutral-200 hover:border-primary hover-lift">
              <img 
                src={category.image} 
                alt={category.name} 
                className="w-full h-40 object-cover" 
              />
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">{category.name}</h3>
                <p className="text-neutral-600 mb-4">{category.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-500">{category.prosAvailable} pros available</span>
                  <span className="text-primary font-semibold">From ${category.basePrice}/lead</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            View All Categories
          </Button>
        </div>
      </div>
    </section>
  );
}
