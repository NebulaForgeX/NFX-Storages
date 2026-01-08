

use std::sync::Arc;

use datafusion::physical_optimizer::PhysicalOptimizerRule;
use datafusion::physical_plan::ExecutionPlan;
use nebulafx_s3select_api::QueryResult;
use nebulafx_s3select_api::query::session::SessionCtx;

pub trait PhysicalOptimizer {
    fn optimize(&self, plan: Arc<dyn ExecutionPlan>, session: &SessionCtx) -> QueryResult<Arc<dyn ExecutionPlan>>;

    fn inject_optimizer_rule(&mut self, optimizer_rule: Arc<dyn PhysicalOptimizerRule + Send + Sync>);
}
