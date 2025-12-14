import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Tv,
  Mail,
  Youtube,
  ImageIcon,
  Phone,
  Search,
  Smartphone,
  Coins,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const tools = [
  {
    name: "Live TV",
    description: "Stream live TV channels",
    path: "/tools/live-tv",
    icon: Tv,
    cost: 1,
    color: "bg-blue-500/20 text-blue-400",
  },
  {
    name: "Tamasha OTP",
    description: "Activate Tamasha with OTP",
    path: "/tools/tamasha-otp",
    icon: Smartphone,
    cost: 2,
    color: "bg-purple-500/20 text-purple-400",
  },
  {
    name: "Temp Email",
    description: "Generate temporary emails",
    path: "/tools/temp-email",
    icon: Mail,
    cost: 1,
    color: "bg-green-500/20 text-green-400",
  },
  {
    name: "YouTube Download",
    description: "Download YouTube videos",
    path: "/tools/youtube-downloader",
    icon: Youtube,
    cost: 3,
    color: "bg-red-500/20 text-red-400",
  },
  {
    name: "Image Enhance",
    description: "Enhance and upscale images",
    path: "/tools/image-enhance",
    icon: ImageIcon,
    cost: 2,
    color: "bg-yellow-500/20 text-yellow-400",
  },
  {
    name: "Phone Lookup",
    description: "Database phone number lookup",
    path: "/tools/phone-lookup",
    icon: Phone,
    cost: 1,
    color: "bg-cyan-500/20 text-cyan-400",
  },
  {
    name: "Eyecon Lookup",
    description: "Phone to name lookup",
    path: "/tools/eyecon-lookup",
    icon: Search,
    cost: 1,
    color: "bg-pink-500/20 text-pink-400",
  },
];

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          Access your digital toolkit from the command center
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Credits</p>
                <p className="text-4xl font-mono font-bold text-primary credit-counter">
                  {user?.credits?.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <Coins className="w-7 h-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Account Type</p>
                <p className="text-2xl font-bold text-foreground capitalize">{user?.role}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tools Available</p>
                <p className="text-2xl font-bold text-foreground">{tools.length}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground mb-4">Your Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              data-testid={`tool-card-${tool.path.split("/").pop()}`}
              className="group"
            >
              <Card className="h-full border-border/50 bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center`}>
                      <tool.icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {tool.cost} credit{tool.cost > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                  <div className="flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Open Tool</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Low Credits Warning */}
      {user?.credits < 5 && (
        <Card className="border-accent/50 bg-accent/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Low Credits</h3>
                <p className="text-sm text-muted-foreground">
                  You have {user?.credits} credits remaining. Contact admin to get more credits.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
