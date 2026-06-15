import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, AlertCircle } from "lucide-react";

export default function AuditCreation() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Create New Audit</h1>
          <p className="text-muted-foreground mt-1">Set up a new audit workflow</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="audit-name">Audit Name</Label>
            <Input id="audit-name" placeholder="Enter audit name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-description">Description</Label>
            <Textarea id="audit-description" placeholder="Enter audit description" rows={4} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-frequency">Frequency</Label>
            <Input id="audit-frequency" placeholder="Daily, Weekly, Monthly" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-owner">Audit Owner</Label>
            <Input id="audit-owner" placeholder="Select owner" />
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline">Cancel</Button>
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Create Audit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
