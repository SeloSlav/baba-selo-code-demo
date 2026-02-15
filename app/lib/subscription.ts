/**
 * Subscription / Pro status utilities
 * Free tier: one ephemeral chat, nothing saved, no chat list UI
 * Pro tier: unlimited chat history, save/pin chats, custom meal plans
 */

export type PlanType = 'free' | 'pro';

export function isProUser(plan?: PlanType | null): boolean {
  return plan === 'pro';
}
