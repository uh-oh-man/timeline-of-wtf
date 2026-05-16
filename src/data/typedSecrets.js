import { secretRegistry } from "./secretRegistry";

export const typedSecrets = secretRegistry.map((secret) => ({
  id: secret.id,
  trigger: secret.trigger,
  label: secret.title,
  description: secret.description,
  requiresAdmin: secret.requiresAdmin,
  category: secret.category,
}));
