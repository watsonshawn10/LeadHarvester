import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, Save } from "lucide-react";

interface Availability {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function AvailabilityManager() {
  const { toast } = useToast();
  const [availability, setAvailability] = useState<Record<number, Availability>>({});

  const { data: existingAvailability, isLoading } = useQuery({
    queryKey: ["/api/availability"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/availability");
      return res.json() as Promise<Availability[]>;
    },
  });

  // Initialize availability state when data loads
  React.useEffect(() => {
    if (existingAvailability) {
      const availabilityMap: Record<number, Availability> = {};
      
      // Initialize all days as unavailable
      DAYS_OF_WEEK.forEach(day => {
        availabilityMap[day.value] = {
          id: 0,
          dayOfWeek: day.value,
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: false,
        };
      });
      
      // Override with existing data
      existingAvailability.forEach(avail => {
        availabilityMap[avail.dayOfWeek] = avail;
      });
      
      setAvailability(availabilityMap);
    }
  }, [existingAvailability]);

  const saveAvailabilityMutation = useMutation({
    mutationFn: async (dayAvailability: Availability) => {
      const res = await apiRequest("POST", "/api/availability", {
        dayOfWeek: dayAvailability.dayOfWeek,
        startTime: dayAvailability.startTime,
        endTime: dayAvailability.endTime,
        isAvailable: dayAvailability.isAvailable,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability",
        variant: "destructive",
      });
    },
  });

  const handleAvailabilityChange = (dayOfWeek: number, field: keyof Availability, value: any) => {
    setAvailability(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
  };

  const handleSaveDay = (dayOfWeek: number) => {
    const dayAvailability = availability[dayOfWeek];
    if (!dayAvailability) return;

    // Validate times
    if (dayAvailability.isAvailable) {
      if (!dayAvailability.startTime || !dayAvailability.endTime) {
        toast({
          title: "Error",
          description: "Please set both start and end times",
          variant: "destructive",
        });
        return;
      }
      
      if (dayAvailability.startTime >= dayAvailability.endTime) {
        toast({
          title: "Error", 
          description: "Start time must be before end time",
          variant: "destructive",
        });
        return;
      }
    }

    saveAvailabilityMutation.mutate(dayAvailability);
  };

  const handleSaveAll = () => {
    Object.values(availability).forEach(dayAvailability => {
      if (dayAvailability.isAvailable) {
        if (!dayAvailability.startTime || !dayAvailability.endTime) {
          toast({
            title: "Error",
            description: `Please set times for ${DAYS_OF_WEEK.find(d => d.value === dayAvailability.dayOfWeek)?.label}`,
            variant: "destructive",
          });
          return;
        }
        
        if (dayAvailability.startTime >= dayAvailability.endTime) {
          toast({
            title: "Error",
            description: `Invalid times for ${DAYS_OF_WEEK.find(d => d.value === dayAvailability.dayOfWeek)?.label}`,
            variant: "destructive",
          });
          return;
        }
      }
      saveAvailabilityMutation.mutate(dayAvailability);
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Weekly Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const dayAvailability = availability[day.value];
          if (!dayAvailability) return null;

          return (
            <div key={day.value} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-24">
                <Label className="font-medium">{day.label}</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={dayAvailability.isAvailable}
                  onCheckedChange={(checked) => 
                    handleAvailabilityChange(day.value, "isAvailable", checked)
                  }
                />
                <span className="text-sm text-neutral-600">Available</span>
              </div>

              {dayAvailability.isAvailable && (
                <>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`start-${day.value}`} className="text-sm">From:</Label>
                    <Input
                      id={`start-${day.value}`}
                      type="time"
                      value={dayAvailability.startTime}
                      onChange={(e) => 
                        handleAvailabilityChange(day.value, "startTime", e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`end-${day.value}`} className="text-sm">To:</Label>
                    <Input
                      id={`end-${day.value}`}
                      type="time"
                      value={dayAvailability.endTime}
                      onChange={(e) => 
                        handleAvailabilityChange(day.value, "endTime", e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                </>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveDay(day.value)}
                disabled={saveAvailabilityMutation.isPending}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleSaveAll}
            disabled={saveAvailabilityMutation.isPending}
            className="w-full sm:w-auto"
          >
            {saveAvailabilityMutation.isPending ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}