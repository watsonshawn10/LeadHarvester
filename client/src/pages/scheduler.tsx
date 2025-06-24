import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Calendar as CalendarIcon, Clock, MapPin, User, CheckCircle, XCircle } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";

interface Appointment {
  id: number;
  projectId: number;
  homeownerId: number;
  serviceProviderId: number;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  status: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

interface Project {
  id: number;
  title: string;
  category: string;
}

interface Contractor {
  id: number;
  username: string;
  businessName?: string;
  email: string;
}

export default function Scheduler() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showBookingForm, setShowBookingForm] = useState(false);

  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/appointments");
      return res.json() as Promise<Appointment[]>;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/projects");
      return res.json() as Promise<Project[]>;
    },
    enabled: user?.userType === "homeowner",
  });

  const { data: contractors } = useQuery({
    queryKey: ["/api/contractors"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/contractors");
      return res.json() as Promise<Contractor[]>;
    },
    enabled: user?.userType === "homeowner",
  });

  const { data: availableSlots } = useQuery({
    queryKey: ["/api/available-slots", selectedContractor, format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!selectedContractor) return [];
      const res = await apiRequest("GET", `/api/available-slots/${selectedContractor}?date=${format(selectedDate, "yyyy-MM-dd")}`);
      return res.json() as Promise<string[]>;
    },
    enabled: !!selectedContractor,
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: {
      projectId: number;
      serviceProviderId: number;
      title: string;
      description?: string;
      scheduledAt: string;
      duration: number;
      location?: string;
    }) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setShowBookingForm(false);
      setSelectedTime("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule appointment",
        variant: "destructive",
      });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment",
        variant: "destructive",
      });
    },
  });

  const handleBookAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!selectedProject || !selectedContractor || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select project, contractor, and time",
        variant: "destructive",
      });
      return;
    }

    const scheduledAt = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    scheduledAt.setHours(parseInt(hours), parseInt(minutes));

    bookAppointmentMutation.mutate({
      projectId: selectedProject,
      serviceProviderId: selectedContractor,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      scheduledAt: scheduledAt.toISOString(),
      duration: parseInt(formData.get("duration") as string) || 60,
      location: formData.get("location") as string,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const todayAppointments = appointments?.filter(apt => {
    const aptDate = new Date(apt.scheduledAt);
    return format(aptDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
  }) || [];

  if (appointmentsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800">Schedule & Appointments</h1>
          <p className="text-neutral-600 mt-2">Manage your appointments and availability</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar & Booking */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                  disabled={(date) => date < new Date()}
                />
              </CardContent>
            </Card>

            {/* Book Appointment */}
            {user?.userType === "homeowner" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Book Appointment
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBookingForm(!showBookingForm)}
                    >
                      {showBookingForm ? "Cancel" : "New Booking"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                {showBookingForm && (
                  <CardContent>
                    <form onSubmit={handleBookAppointment} className="space-y-4">
                      <div>
                        <Label htmlFor="project">Project</Label>
                        <Select value={selectedProject?.toString() || ""} onValueChange={(value) => setSelectedProject(Number(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects?.map((project) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.title} ({project.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="contractor">Contractor</Label>
                        <Select value={selectedContractor?.toString() || ""} onValueChange={(value) => setSelectedContractor(Number(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a contractor" />
                          </SelectTrigger>
                          <SelectContent>
                            {contractors?.map((contractor) => (
                              <SelectItem key={contractor.id} value={contractor.id.toString()}>
                                {contractor.businessName || contractor.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedContractor && (
                        <div>
                          <Label htmlFor="time">Available Times</Label>
                          <Select value={selectedTime} onValueChange={setSelectedTime}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a time" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSlots?.map((slot) => (
                                <SelectItem key={slot} value={slot}>
                                  {slot}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input name="title" placeholder="Appointment title" required />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea name="description" placeholder="Appointment details" />
                      </div>

                      <div>
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input name="duration" type="number" defaultValue="60" min="30" max="480" />
                      </div>

                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input name="location" placeholder="Meeting location" />
                      </div>

                      <Button type="submit" disabled={bookAppointmentMutation.isPending} className="w-full">
                        {bookAppointmentMutation.isPending ? "Scheduling..." : "Schedule Appointment"}
                      </Button>
                    </form>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Appointments for Selected Date */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {format(selectedDate, "MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">No appointments scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="p-3 border rounded-lg bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-neutral-800">{appointment.title}</h4>
                          <Badge variant={getStatusBadgeVariant(appointment.status)} className="text-xs">
                            {appointment.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-neutral-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {format(new Date(appointment.scheduledAt), "h:mm a")} ({appointment.duration}m)
                          </div>
                          {appointment.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {appointment.location}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {user?.userType === "homeowner" ? "Contractor" : "Homeowner"}
                          </div>
                        </div>

                        {appointment.description && (
                          <p className="text-sm text-neutral-600 mt-2">{appointment.description}</p>
                        )}

                        {appointment.status === "scheduled" && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateAppointmentMutation.mutate({ id: appointment.id, status: "confirmed" })}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateAppointmentMutation.mutate({ id: appointment.id, status: "cancelled" })}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}