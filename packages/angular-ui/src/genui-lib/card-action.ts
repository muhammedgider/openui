import { ACTION_STEPS, BuiltinActionType, type ActionPlan } from "@openuidev/angular-lang";

/** Preserve upstream per-card action context without mutating shared plans or steps. */
export function withItemContext(
  action: unknown,
  itemContext: Record<string, unknown>,
): ActionPlan | { type: string; params: Record<string, unknown> } {
  const context = Object.fromEntries(
    Object.entries(itemContext).filter(([, value]) => value !== undefined),
  );
  if (action === null || action === undefined)
    return { type: BuiltinActionType.ContinueConversation, params: context };
  if (typeof action === "object" && "steps" in action && Array.isArray(action.steps)) {
    const plan = action as ActionPlan;
    if (!Object.keys(context).length) return plan;
    const suffix = `Selected item: ${JSON.stringify(context)}`;
    return {
      ...plan,
      steps: plan.steps.map((step) =>
        step.type === ACTION_STEPS.ToAssistant
          ? { ...step, context: step.context ? `${step.context}\n${suffix}` : suffix }
          : step,
      ),
    };
  }
  const legacy = action as {
    type?: string;
    params?: Record<string, unknown>;
    url?: string;
    context?: string;
  };
  return {
    type: legacy.type ?? BuiltinActionType.ContinueConversation,
    params: {
      ...legacy.params,
      ...(legacy.url !== undefined ? { url: legacy.url } : {}),
      ...(legacy.context ? { context: legacy.context } : {}),
      ...context,
    },
  };
}
