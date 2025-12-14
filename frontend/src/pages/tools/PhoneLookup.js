import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Phone, Search, Loader2, User, MapPin, Building } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PhoneLookup = () => {
  const { refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const lookup = async () => {
    if (!phone) {
      toast.error("Please enter a phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/tools/phone-lookup`, { phone });
      setResult(response.data);
      toast.success(`Lookup complete! (-${response.data.credits_used} credit)`);
      refreshUser();
    } catch (error) {
      const message = error.response?.data?.detail || "Lookup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="phone-lookup-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Phone Lookup</h1>
          <p className="text-muted-foreground">Search phone numbers in the database</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          1 credit/lookup
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
              <Phone className="w-7 h-7 text-cyan-400" />
            </div>
            <CardTitle>Search Phone Number</CardTitle>
            <CardDescription>Enter a phone number to search the database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-testid="phone-input"
                  className="bg-muted/50 flex-1"
                />
                <Button onClick={lookup} disabled={loading} data-testid="lookup-btn">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Results
            </CardTitle>
            <CardDescription>Phone number information</CardDescription>
          </CardHeader>
          <CardContent>
            {result?.data ? (
              <div className="space-y-4" data-testid="lookup-results">
                {typeof result.data === "object" ? (
                  Object.entries(result.data).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        {key.toLowerCase().includes("name") ? (
                          <User className="w-5 h-5 text-primary" />
                        ) : key.toLowerCase().includes("address") ? (
                          <MapPin className="w-5 h-5 text-primary" />
                        ) : (
                          <Building className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{key}</p>
                        <p className="font-medium">{String(value) || "N/A"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <Phone className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No results yet</p>
                <p className="text-sm">Enter a phone number to search</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PhoneLookup;
