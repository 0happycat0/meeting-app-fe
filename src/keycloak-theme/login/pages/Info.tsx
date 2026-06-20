import type { PageProps } from "keycloakify/login/pages/PageProps";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Info(
  props: PageProps<Extract<KcContext, { pageId: "info.ftl" }>, I18n>,
) {
  const { kcContext, i18n } = props;
  const { advancedMsgStr, msg } = i18n;
  const {
    messageHeader,
    message,
    requiredActions,
    skipLink,
    pageRedirectUri,
    actionUri,
    client,
  } = kcContext;

  const getButtonLink = () => {
    if (skipLink) return null;
    if (pageRedirectUri) return pageRedirectUri;
    if (actionUri) return actionUri;
    if (client.baseUrl) return client.baseUrl;
    return null;
  };

  const getButtonLabel = () => {
    if (pageRedirectUri) return msg("backToApplication");
    if (actionUri) return msg("proceedWithAction");
    if (client.baseUrl) return msg("backToApplication");
    return null;
  };

  const buttonLink = getButtonLink();
  const buttonLabel = getButtonLabel();

  return (
    <div className="min-h-dvh flex items-center justify-center bg-linear-to-br from-[#d1e8fe] via-[#f8fafc] to-[#dfedff]">
      <Card className="w-full max-w-sm shadow-xl border-0 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            <span
              dangerouslySetInnerHTML={{
                __html: kcSanitize(
                  messageHeader
                    ? advancedMsgStr(messageHeader)
                    : message.summary,
                ),
              }}
            />
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p
            className="text-sm text-center text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: kcSanitize(
                (() => {
                  let html = message.summary?.trim();

                  if (requiredActions) {
                    html += " <span class='font-semibold text-foreground'>";
                    html += requiredActions
                      .map((requiredAction) =>
                        advancedMsgStr(`requiredAction.${requiredAction}`),
                      )
                      .join(", ");
                    html += "</span>";
                  }

                  return html;
                })(),
              ),
            }}
          />
        </CardContent>

        {buttonLink && buttonLabel && (
          <CardFooter>
            <a
              href={buttonLink}
              className="w-full"
            >
              <Button className="w-full h-9 gap-2">
                {buttonLabel}
              </Button>
            </a>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
