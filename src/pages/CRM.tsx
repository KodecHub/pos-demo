import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Star, Mail, Phone, TrendingUp, Users, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/Dashboard/StatCard";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";
import { UpgradeModal } from "@/components/Billing/UpgradeModal";
import { useFeature } from "@/hooks/useFeature";

const CRM = () => {
  const { isEnabled } = useFeature("crm");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isEnabled) {
      setShowUpgrade(true);
    }
  }, [isEnabled]);

  const [customers, setCustomers] = useState([
    { id: "C001", name: "Nimal Perera", email: "nimal.perera@gmail.com", phone: "+94 77 123 4567", visits: 24, totalSpent: 185000.0, lastVisit: "2026-04-06", tier: "Gold" },
    { id: "C002", name: "Kamalini Fernando", email: "kamalini.f@gmail.com", phone: "+94 71 234 5678", visits: 18, totalSpent: 142500.0, lastVisit: "2026-04-07", tier: "Gold" },
    { id: "C003", name: "Ruwan Silva", email: "ruwan.silva@yahoo.com", phone: "+94 76 345 6789", visits: 12, totalSpent: 89500.0, lastVisit: "2026-04-05", tier: "Silver" },
    { id: "C004", name: "Dilani Jayawardena", email: "dilani.j@outlook.com", phone: "+94 77 456 7890", visits: 8, totalSpent: 62500.0, lastVisit: "2026-04-04", tier: "Silver" },
    { id: "C005", name: "Samantha Wickramasinghe", email: "sam.w@hotmail.com", phone: "+94 70 567 8901", visits: 5, totalSpent: 38500.0, lastVisit: "2026-04-03", tier: "Bronze" },
    { id: "C006", name: "Tharindu De Silva", email: "tharindu.ds@gmail.com", phone: "+94 78 678 9012", visits: 3, totalSpent: 21500.0, lastVisit: "2026-04-02", tier: "Bronze" },
  ]);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    tier: 'Bronze'
  });

  const handleAddCustomer = () => {
    const customer = {
      id: `C${String(customers.length + 1).padStart(3, '0')}`,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      visits: 0,
      totalSpent: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      tier: newCustomer.tier
    };
    setCustomers([...customers, customer]);
    setNewCustomer({ name: '', email: '', phone: '', tier: 'Bronze' });
  };

  const loyaltyPrograms = [
    { tier: "Gold", customers: 28, benefits: "20% off, priority seating, free dessert on Avurudu", minSpend: 150000 },
    { tier: "Silver", customers: 54, benefits: "15% off, birthday treat, Vesak weekend bonus", minSpend: 75000 },
    { tier: "Bronze", customers: 123, benefits: "10% off, points on every order, SMS alerts", minSpend: 25000 },
  ];

  const recentFeedback = [
    { customer: "Nimal Perera", rating: 5, date: "2026-04-06", comment: "හොඳ සේවයක්, කෑම රසයි! ආපහු එනවා." },
    { customer: "Kamalini Fernando", rating: 5, date: "2026-04-07", comment: "Best kottu in Colombo — staff was friendly." },
    { customer: "Ruwan Silva", rating: 4, date: "2026-04-05", comment: "Rice & curry set was great; parking was tight." },
    { customer: "Dilani Jayawardena", rating: 5, date: "2026-04-04", comment: "Love the new menu — especially the devilled prawns!" },
  ];

  const campaigns = [
    { name: "Avurudu Family Feast Promo", type: "Email", sent: 450, opened: 298, clicked: 145, status: "active" },
    { name: "Colombo Weekend SMS – 20% off", type: "SMS", sent: 205, opened: 198, clicked: 89, status: "completed" },
    { name: "New Menu – Kandy & Galle branches", type: "Email", sent: 520, opened: 312, clicked: 178, status: "active" },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Customer Relationship Management</h1>
            <p className="text-muted-foreground mt-2">Manage customers, loyalty programs, and campaigns</p>
          </div>
          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input
                      id="campaign-name"
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="campaign-type">Campaign Type</Label>
                    <select
                      id="campaign-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="email">Email Marketing</option>
                      <option value="sms">SMS Campaign</option>
                      <option value="social">Social Media</option>
                      <option value="loyalty">Loyalty Program</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="campaign-message">Message</Label>
                    <textarea
                      id="campaign-message"
                      placeholder="Enter campaign message"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Campaign</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tier">Loyalty Tier</Label>
                    <select
                      id="tier"
                      value={newCustomer.tier}
                      onChange={(e) => setNewCustomer({...newCustomer, tier: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="Bronze">Bronze</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleAddCustomer}>Add Customer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Customers"
            value="1,247"
            change="+8.2%"
            icon={Users}
            trend="up"
          />
          <StatCard
            title="Active Loyalty Members"
            value="205"
            change="+12.5%"
            icon={Award}
            trend="up"
          />
          <StatCard
            title="Avg. Customer Value"
            value={formatCurrencyCompact(85000)}
            change="+6.3%"
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            title="Repeat Rate"
            value="68%"
            change="+4.1%"
            icon={Star}
            trend="up"
          />
        </div>

        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="loyalty">Loyalty Programs</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Customer Database</CardTitle>
                    <CardDescription>Manage your customer relationships</CardDescription>
                  </div>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Search customers..." className="pl-10" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Visits</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.id}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{customer.visits}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(customer.totalSpent)}</TableCell>
                        <TableCell>{customer.lastVisit}</TableCell>
                        <TableCell>
                          <Badge variant={customer.tier === "Gold" ? "default" : customer.tier === "Silver" ? "secondary" : "outline"}>
                            {customer.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loyalty">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loyaltyPrograms.map((program) => (
                <Card key={program.tier}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      {program.tier} Tier
                    </CardTitle>
                    <CardDescription>{program.customers} active members</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Minimum Spend</p>
                      <p className="text-2xl font-bold">{formatCurrency(program.minSpend)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Benefits</p>
                      <p className="text-sm text-muted-foreground">{program.benefits}</p>
                    </div>
                    <Button className="w-full" variant="outline">Manage Tier</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Recent Customer Feedback</CardTitle>
                <CardDescription>Reviews and ratings from customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentFeedback.map((feedback, index) => (
                  <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{feedback.customer}</p>
                        <p className="text-sm text-muted-foreground">{feedback.date}</p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < feedback.rating ? "fill-warning text-warning" : "text-muted"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm">{feedback.comment}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Campaigns</CardTitle>
                <CardDescription>Track your customer engagement campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Clicked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{campaign.type}</Badge>
                        </TableCell>
                        <TableCell>{campaign.sent}</TableCell>
                        <TableCell>{campaign.opened} ({Math.round(campaign.opened/campaign.sent*100)}%)</TableCell>
                        <TableCell>{campaign.clicked} ({Math.round(campaign.clicked/campaign.sent*100)}%)</TableCell>
                        <TableCell>
                          <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <UpgradeModal
          featureKey="crm"
          open={showUpgrade}
          onOpenChange={(open) => {
            setShowUpgrade(open);
            if (!open && !isEnabled) {
              const fallback = "/pos";
              const last = sessionStorage.getItem("lastUnlockedRoute") || fallback;
              navigate(last, { replace: true });
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default CRM;
