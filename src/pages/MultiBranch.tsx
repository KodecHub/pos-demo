import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardLayout } from "@/components/Layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Phone, Users, DollarSign, TrendingUp, Plus, Edit } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { UpgradeModal } from "@/components/Billing/UpgradeModal"
import { useFeature } from "@/hooks/useFeature"

const branches = [
  {
    id: "1",
    name: "Downtown Branch",
    address: "123 Main Street, Downtown",
    phone: "+1 (555) 123-4567",
    manager: "John Smith",
    staff: 15,
    revenue: 125750,
    status: "active",
    lastUpdated: "2 hours ago"
  },
  {
    id: "2", 
    name: "Westside Branch",
    address: "456 Oak Avenue, Westside",
    phone: "+1 (555) 234-5678",
    manager: "Sarah Johnson",
    staff: 12,
    revenue: 98500,
    status: "active",
    lastUpdated: "1 hour ago"
  },
  {
    id: "3",
    name: "Eastside Branch", 
    address: "789 Pine Street, Eastside",
    phone: "+1 (555) 345-6789",
    manager: "Mike Brown",
    staff: 10,
    revenue: 72500,
    status: "maintenance",
    lastUpdated: "30 minutes ago"
  },
  {
    id: "4",
    name: "Airport Branch",
    address: "321 Airport Blvd, Terminal 2",
    phone: "+1 (555) 456-7890", 
    manager: "Emily Davis",
    staff: 8,
    revenue: 48500,
    status: "active",
    lastUpdated: "45 minutes ago"
  }
]

const MultiBranch = () => {
  const { isEnabled } = useFeature("multiBranch")
  const [showUpgrade, setShowUpgrade] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isEnabled) {
      setShowUpgrade(true)
    }
  }, [isEnabled])

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Multi-Branch Management
              </h1>
              <p className="text-muted-foreground mt-1 text-base">Manage all restaurant branches from one place</p>
            </div>
            <Button className="modern-button gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Branch
            </Button>
          </div>
        </div>

        <div className="px-4 pb-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="modern-card shadow-modern border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Branches</p>
                    <p className="text-2xl font-bold">{branches.length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card shadow-modern border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Staff</p>
                    <p className="text-2xl font-bold">{branches.reduce((sum, branch) => sum + branch.staff, 0)}</p>
                  </div>
                  <Users className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card shadow-modern border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(branches.reduce((sum, branch) => sum + branch.revenue, 0))}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card shadow-modern border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Branches</p>
                    <p className="text-2xl font-bold">{branches.filter(b => b.status === 'active').length}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <Card key={branch.id} className="modern-card shadow-modern-lg border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">{branch.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{branch.address}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={branch.status === 'active' ? 'default' : 'secondary'}
                      className={branch.status === 'active' ? 'bg-success text-white' : 'bg-warning text-white'}
                    >
                      {branch.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{branch.phone}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Manager: {branch.manager}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{branch.staff} staff members</span>
                    </div>
                    
                    <div className="pt-2 border-t border-muted/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Today's Revenue</span>
                        <span className="font-bold text-success">{formatCurrency(branch.revenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Last updated: {branch.lastUpdated}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Performance
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <UpgradeModal
            featureKey="multiBranch"
            open={showUpgrade}
            onOpenChange={(open) => {
              setShowUpgrade(open)
              if (!open && !isEnabled) {
                const fallback = "/pos"
                const last = sessionStorage.getItem("lastUnlockedRoute") || fallback
                navigate(last, { replace: true })
              }
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default MultiBranch
