import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardLayout } from "@/components/Layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Settings as SettingsIcon,
  User,
  Globe,
  Save,
  Upload,
  Download,
  LogOut,
} from "lucide-react"

const Settings = () => {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      navigate("/pos", { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground mt-1 text-base">Configure your restaurant system preferences</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowLogoutDialog(true)}
                disabled={isLoggingOut}
                className="modern-button bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-red-500/25 border-0 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? "Logging out…" : "Logout"}
              </Button>
              <Button variant="outline" className="modern-button">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button className="modern-button gradient-primary">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="modern-button border-destructive text-destructive">
                    Log out
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Log out</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to log out from this device? You will need to sign in again to access the POS.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleLogout}
                    >
                      Log out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl mb-6">
              <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-modern">
                <SettingsIcon className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-modern">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="modern-card shadow-modern-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <SettingsIcon className="w-5 h-5 text-primary" />
                      Restaurant Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="restaurant-name">Restaurant Name</Label>
                      <Input id="restaurant-name" defaultValue="RestaurantOS" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="restaurant-address">Address</Label>
                      <Input id="restaurant-address" defaultValue="123 Main Street, Downtown" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="restaurant-phone">Phone Number</Label>
                      <Input id="restaurant-phone" defaultValue="+1 (555) 123-4567" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="restaurant-email">Email</Label>
                      <Input id="restaurant-email" defaultValue="info@restaurantos.com" className="mt-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="modern-card shadow-modern-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      System Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-save</Label>
                        <p className="text-sm text-muted-foreground">Automatically save changes</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Use dark theme</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sound Effects</Label>
                        <p className="text-sm text-muted-foreground">Play notification sounds</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Profile Settings */}
            <TabsContent value="profile" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="modern-card shadow-modern-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="admin-name">Full Name</Label>
                      <Input id="admin-name" defaultValue="Admin User" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="admin-email">Email Address</Label>
                      <Input id="admin-email" defaultValue="admin@restaurant.com" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="admin-phone">Phone Number</Label>
                      <Input id="admin-phone" defaultValue="+1 (555) 123-4567" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="admin-role">Role</Label>
                      <Input id="admin-role" defaultValue="System Administrator" className="mt-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="modern-card shadow-modern-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary" />
                      Profile Picture
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src="/Admin.png" 
                        alt="Admin" 
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </DashboardLayout>

    {/* Logout Confirmation Dialog */}
    <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
      <AlertDialogContent className="max-w-sm rounded-3xl border border-border/50 shadow-2xl bg-background p-0 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />

        <div className="p-7">
          <AlertDialogHeader className="text-center items-center gap-0 mb-4">
            {/* Icon circle */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-rose-600/20 flex items-center justify-center mb-5 ring-4 ring-red-500/10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <LogOut className="w-5 h-5 text-white" />
              </div>
            </div>
            <AlertDialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              Leaving DineMate?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground text-sm leading-relaxed mt-2">
              Are you sure you want to logout?<br />
              You'll need your credentials to sign back in.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col gap-3 mt-6 sm:flex-col">
            <AlertDialogAction
              onClick={handleLogout}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold border-0 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Yes, Logout
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-11 rounded-xl bg-muted text-foreground font-semibold border border-border hover:bg-muted/70 hover:text-foreground transition-all duration-200 mt-0">
              No, Stay Here
            </AlertDialogCancel>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

export default Settings
