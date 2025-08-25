import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Building2, Package, Users, Trash2 } from "lucide-react";
import { useLLMStore } from "@/store/llm-store";
import { OKRInput } from "./OKRInput";
import type { OKRs } from "@/types";

function CompanyContextForm() {
  const { settings, updateCompanyContext } = useLLMStore();
  const { company } = settings?.userContext || {};

  const handleChange = (field: string, value: string) => {
    updateCompanyContext({ [field]: value });
  };

  const handleOKRChange = (okrs: OKRs) => {
    updateCompanyContext({ okrs });
  };

  // Ensure company object exists with default values
  const companyData = company || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Company Context
        </CardTitle>
        <CardDescription>
          Information about your company to help the AI understand your business
          context
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              placeholder="e.g., Acme Corp"
              value={companyData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-industry">Industry</Label>
            <Input
              id="company-industry"
              placeholder="e.g., FinTech, Healthcare, E-commerce"
              value={companyData.industry || ""}
              onChange={(e) => handleChange("industry", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-size">Company Size</Label>
            <Input
              id="company-size"
              placeholder="e.g., 50-200 employees, Startup, Enterprise"
              value={companyData.size || ""}
              onChange={(e) => handleChange("size", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-strategy">Business Strategy</Label>
          <Textarea
            id="business-strategy"
            placeholder="Describe your company's overall business strategy, mission, and vision"
            value={companyData.business_strategy || ""}
            onChange={(e) => handleChange("business_strategy", e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-strategy">Product Strategy</Label>
          <Textarea
            id="product-strategy"
            placeholder="Describe your company's product strategy and approach"
            value={companyData.product_strategy || ""}
            onChange={(e) => handleChange("product_strategy", e.target.value)}
            rows={3}
          />
        </div>
        <OKRInput
          value={companyData.okrs as OKRs}
          onChange={handleOKRChange}
          label="Company OKRs"
          placeholder="Add your company's current objectives and key results"
        />
      </CardContent>
    </Card>
  );
}

function ProductContextForm() {
  const { settings, updateProductContext } = useLLMStore();
  const { product } = settings?.userContext || {};

  const handleChange = (field: string, value: string) => {
    updateProductContext({ [field]: value });
  };

  // Ensure product object exists with default values
  const productData = product || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Product Context
        </CardTitle>
        <CardDescription>
          Information about the specific product you're working on
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name</Label>
            <Input
              id="product-name"
              placeholder="e.g., Mobile Banking App"
              value={productData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current-stage">Current Stage</Label>
            <Input
              id="current-stage"
              placeholder="e.g., MVP, Growth, Mature"
              value={productData.current_stage || ""}
              onChange={(e) => handleChange("current_stage", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-description">Product Description</Label>
          <Textarea
            id="product-description"
            placeholder="Describe what your product does and its core value proposition"
            value={productData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="target-market">Target Market</Label>
          <Textarea
            id="target-market"
            placeholder="Describe your target users, market segments, and customer personas"
            value={productData.target_market || ""}
            onChange={(e) => handleChange("target_market", e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monetization-strategy">Monetization Strategy</Label>
          <Textarea
            id="monetization-strategy"
            placeholder="How does the product generate revenue? (subscription, freemium, ads, etc.)"
            value={productData.monetization_strategy || ""}
            onChange={(e) =>
              handleChange("monetization_strategy", e.target.value)
            }
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="competitors">Competitors</Label>
          <Textarea
            id="competitors"
            placeholder="List main competitors and competitive landscape"
            value={productData.competitors || ""}
            onChange={(e) => handleChange("competitors", e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function TeamContextForm() {
  const { settings, updateTeamContext } = useLLMStore();
  const { team } = settings?.userContext || {};

  const handleChange = (field: string, value: string) => {
    updateTeamContext({ [field]: value });
  };

  const handleOKRChange = (okrs: OKRs) => {
    updateTeamContext({ okrs });
  };

  // Ensure team object exists with default values
  const teamData = team || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Context
        </CardTitle>
        <CardDescription>Information about your team and role</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              placeholder="e.g., Growth Team, Platform Team"
              value={teamData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-role">Your Role</Label>
            <Input
              id="team-role"
              placeholder="e.g., Senior Product Manager, Lead PM"
              value={teamData.role || ""}
              onChange={(e) => handleChange("role", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-size">Team Size</Label>
            <Input
              id="team-size"
              placeholder="e.g., 8 people, 2 engineers + 1 designer + 1 PM"
              value={teamData.size || ""}
              onChange={(e) => handleChange("size", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="team-structure">Team Structure</Label>
          <Textarea
            id="team-structure"
            placeholder="Describe your team composition and organizational structure"
            value={teamData.structure || ""}
            onChange={(e) => handleChange("structure", e.target.value)}
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team-responsibilities">Team Responsibilities</Label>
          <Textarea
            id="team-responsibilities"
            placeholder="What does your team own? What are your key responsibilities?"
            value={teamData.responsibilities || ""}
            onChange={(e) => handleChange("responsibilities", e.target.value)}
            rows={3}
          />
        </div>
        <OKRInput
          value={teamData.okrs as OKRs}
          onChange={handleOKRChange}
          label="Team OKRs"
          placeholder="Add your team's current objectives and key results"
        />
      </CardContent>
    </Card>
  );
}

export function UserContextForm() {
  const { clearUserContext } = useLLMStore();

  const handleClearAll = () => {
    if (
      confirm("Are you sure you want to clear all user context information?")
    ) {
      clearUserContext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">User Context</h3>
          <p className="text-sm text-muted-foreground">
            Provide context about your company, product, and team to get more
            relevant AI responses
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleClearAll}>
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      <div className="space-y-6">
        <CompanyContextForm />
        <ProductContextForm />
        <TeamContextForm />
      </div>
    </div>
  );
}
