export interface ResourceGroup {
  name: string;
  location: string;
  id?: string;
  tags?: Record<string, any>;
  provisioning_state?: string;
}

export interface ResourceItem {
  id: string;
  name: string;
  type: string;
  location: string;
  sku?: Record<string, any>;
  tags?: Record<string, any>;
  kind?: string;
  plan?: Record<string, any>;
  resource_group?: string;
  estimated_monthly_cost?: number;
  estimated_monthly_cost_formatted?: string;
}

export interface ResourceCostItem {
  name: string;
  type: string;
  current_cost: string;
  potential_savings: string;
  post_remediation_cost: string;
  status: string;
}

export interface CostIssue {
  id: string;
  title: string;
  category: string;
  severity: 'high' | 'medium' | 'low' | string;
  affected_resource: string;
  description: string;
  estimated_savings: string;
  fix_command: string;
}

export interface CostAnalysisDetail {
  summary: string;
  total_current_monthly_cost?: string;
  total_estimated_monthly_savings: string;
  projected_monthly_cost_after_remediation?: string;
  savings_percentage?: string;
  resource_cost_breakdown?: ResourceCostItem[];
  issues: CostIssue[];
  recommendations: string[];
}



export interface AnalysisRecord {
  id: string;
  user_id?: number;
  resource_group: string;
  resources_scanned: number;
  issues_found: number;
  estimated_savings: string;
  analysis_result: {
    resources?: ResourceItem[];
    analysis?: CostAnalysisDetail;
  };
  status: string;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
}

export interface ProgressMessage {
  analysis_id: string;
  message: string;
  step: number;
  total_steps: number;
  data?: any;
}
