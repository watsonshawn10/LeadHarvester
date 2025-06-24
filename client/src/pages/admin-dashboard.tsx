import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Gift, Users, DollarSign, Star } from "lucide-react";

interface Contractor {
  id: number;
  username: string;
  email: string;
  businessName?: string;
  rating?: string;
  totalReviews?: number;
  freeLeadsRemaining?: number;
  canReceiveFreeLeads?: boolean;
  leadCredits?: string;
  autoLeadPurchase?: boolean;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedContractor, setSelectedContractor] = useState<number | null>(null);
  const [freeLeadsCount, setFreeLeadsCount] = useState<number>(1);

  const { data: contractors, isLoading } = useQuery({
    queryKey: ["/api/admin/contractors"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/contractors");
      return res.json() as Promise<Contractor[]>;
    },
  });

  const grantFreeLeadsMutation = useMutation({
    mutationFn: async ({ contractorId, count }: { contractorId: number; count: number }) => {
      const res = await apiRequest("POST", "/api/admin/grant-free-leads", {
        contractorId,
        count,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contractors"] });
      setSelectedContractor(null);
      setFreeLeadsCount(1);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to grant free leads",
        variant: "destructive",
      });
    },
  });

  const handleGrantFreeLeads = () => {
    if (!selectedContractor || freeLeadsCount <= 0) {
      toast({
        title: "Error",
        description: "Please select a contractor and enter a valid lead count",
        variant: "destructive",
      });
      return;
    }

    grantFreeLeadsMutation.mutate({
      contractorId: selectedContractor,
      count: freeLeadsCount,
    });
  };

  if (isLoading) {
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

  const totalContractors = contractors?.length || 0;
  const contractorsWithFreeLeads = contractors?.filter(c => c.canReceiveFreeLeads)?.length || 0;
  const totalFreeLeadsRemaining = contractors?.reduce((sum, c) => sum + (c.freeLeadsRemaining || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800">Admin Dashboard</h1>
          <p className="text-neutral-600 mt-2">Manage contractors and distribute free leads</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Total Contractors</p>
                  <p className="text-2xl font-bold text-neutral-800">{totalContractors}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Free Lead Recipients</p>
                  <p className="text-2xl font-bold text-neutral-800">{contractorsWithFreeLeads}</p>
                </div>
                <Gift className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Free Leads Remaining</p>
                  <p className="text-2xl font-bold text-neutral-800">{totalFreeLeadsRemaining}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Auto-Purchase Active</p>
                  <p className="text-2xl font-bold text-neutral-800">
                    {contractors?.filter(c => c.autoLeadPurchase)?.length || 0}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Grant Free Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Grant Free Leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contractor-select">Select Contractor</Label>
                <select
                  id="contractor-select"
                  className="w-full mt-1 p-2 border border-neutral-300 rounded-md bg-white"
                  value={selectedContractor || ""}
                  onChange={(e) => setSelectedContractor(Number(e.target.value))}
                >
                  <option value="">Choose a contractor...</option>
                  {contractors?.map((contractor) => (
                    <option key={contractor.id} value={contractor.id}>
                      {contractor.businessName || contractor.username} - {contractor.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="free-leads-count">Number of Free Leads</Label>
                <Input
                  id="free-leads-count"
                  type="number"
                  min="1"
                  max="50"
                  value={freeLeadsCount}
                  onChange={(e) => setFreeLeadsCount(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleGrantFreeLeads}
                disabled={grantFreeLeadsMutation.isPending || !selectedContractor}
                className="w-full"
              >
                {grantFreeLeadsMutation.isPending ? "Granting..." : "Grant Free Leads"}
              </Button>
            </CardContent>
          </Card>

          {/* Contractor List */}
          <Card>
            <CardHeader>
              <CardTitle>Contractor Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {contractors?.map((contractor) => (
                  <div
                    key={contractor.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-800 truncate">
                        {contractor.businessName || contractor.username}
                      </p>
                      <p className="text-sm text-neutral-600 truncate">{contractor.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {contractor.canReceiveFreeLeads && (
                          <Badge variant="secondary" className="text-xs">
                            {contractor.freeLeadsRemaining} free leads
                          </Badge>
                        )}
                        {contractor.autoLeadPurchase && (
                          <Badge variant="outline" className="text-xs">
                            Auto-purchase
                          </Badge>
                        )}
                        {contractor.rating && Number(contractor.rating) > 0 && (
                          <Badge variant="outline" className="text-xs">
                            ⭐ {Number(contractor.rating).toFixed(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}