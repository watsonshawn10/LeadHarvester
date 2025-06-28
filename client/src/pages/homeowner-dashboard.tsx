import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/navigation';
import ProjectForm from '@/components/project-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { Project } from '@/types';
import { Calendar, MessageSquare, Star, Heart, Plus } from 'lucide-react';
import { Link, Redirect } from 'wouter';

export default function HomeownerDashboard() {
  const { user } = useAuth();
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/my'],
    enabled: !!user,
  });

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (user.userType !== 'homeowner') {
    return <Redirect to="/business-dashboard" />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="gradient-primary text-white rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {user.firstName || user.username}!</h1>
              <p className="text-blue-100">You have {projects?.filter(p => p.status === 'active').length || 0} active projects</p>
            </div>
            <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-primary hover:bg-blue-50">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <ProjectForm onSuccess={() => setNewProjectDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {projects?.filter(p => p.status === 'active').length || 0}
                  </div>
                  <div className="text-sm text-neutral-600">Active Projects</div>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    0
                  </div>
                  <div className="text-sm text-neutral-600">Total Quotes</div>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {projects?.filter(p => p.status === 'completed').length || 0}
                  </div>
                  <div className="text-sm text-neutral-600">Completed Jobs</div>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-neutral-600">Saved Pros</div>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Heart className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-auto p-4 flex flex-col items-center space-y-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                  <Plus className="h-6 w-6" />
                  <span className="text-sm font-medium">Post New Project</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <ProjectForm onSuccess={() => setNewProjectDialogOpen(false)} />
              </DialogContent>
            </Dialog>
            
            <Link href="/lead-marketplace">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 w-full">
                <MessageSquare className="h-6 w-6" />
                <span className="text-sm font-medium">Browse Pros</span>
              </Button>
            </Link>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm font-medium">Schedule Meeting</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Heart className="h-6 w-6" />
              <span className="text-sm font-medium">My Favorites</span>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active Projects */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Projects</span>
                  {projects && projects.length > 0 && (
                    <span className="text-sm text-neutral-500">
                      {projects.length} total
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="border border-neutral-200 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-neutral-200 rounded w-full mb-3"></div>
                        <div className="flex justify-between items-center">
                          <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                          <div className="h-6 bg-neutral-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : projects && projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-neutral-800">{project.title}</h3>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusLabel(project.status)}
                          </Badge>
                        </div>
                        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{project.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-neutral-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Posted {formatTimeAgo(project.createdAt)}</span>
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              <span>0 quotes received</span>
                            </div>
                          </div>
                          <Link href={`/project/${project.id}`}>
                            <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
                              View Details →
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-neutral-400 mb-4">
                      <Plus className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-800 mb-2">No projects yet</h3>
                    <p className="text-neutral-600 mb-4">Create your first project to get started with finding contractors.</p>
                    <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-primary text-white">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Project</DialogTitle>
                        </DialogHeader>
                        <ProjectForm onSuccess={() => setNewProjectDialogOpen(false)} />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommended Professionals */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended for You</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="text-center p-4 border border-neutral-200 rounded-lg">
                      <img 
                        src={`https://images.unsplash.com/photo-${i % 2 === 0 ? '1507003211169-0a1dd7228f2d' : '1472099645785-5658abf4ff4e'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`} 
                        alt="Professional contractor" 
                        className="w-12 h-12 rounded-full mx-auto mb-3 object-cover" 
                      />
                      <h4 className="font-semibold text-neutral-800">Professional {i + 1}</h4>
                      <p className="text-sm text-neutral-600 mb-2">Home Improvement Specialist</p>
                      <div className="flex items-center justify-center mb-2">
                        <div className="flex text-yellow-400 text-sm">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className="h-3 w-3 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm text-neutral-500 ml-1">(127)</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          View Profile
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Post New Project
                    </Button>
                  </DialogTrigger>
                </Dialog>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View Messages
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="mr-2 h-4 w-4" />
                  Favorite Contractors
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
