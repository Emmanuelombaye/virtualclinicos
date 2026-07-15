import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import {
  getProfileService,
  updateProfileService,
  dismissWelcomeService,
  completeOnboardingStepService,
} from "@/lib/services/profile";

export async function GET(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const data = await getProfileService(user);
    return apiJson({ data }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}

export async function PATCH(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      timezone?: string;
      prefs?: Record<string, boolean>;
      dismissWelcome?: boolean;
      completeStep?: string;
    };

    if (body.dismissWelcome) {
      const onboarding = await dismissWelcomeService(user);
      return apiJson({ data: { onboarding } }, { requestId: rid });
    }
    if (body.completeStep) {
      const onboarding = await completeOnboardingStepService(
        user,
        body.completeStep,
      );
      return apiJson({ data: { onboarding } }, { requestId: rid });
    }

    const data = await updateProfileService(user, {
      name: body.name,
      timezone: body.timezone,
      prefs: body.prefs,
    });
    return apiJson({ data }, { requestId: rid });
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
