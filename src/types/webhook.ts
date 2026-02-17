export interface WebhookSetting {
  postUrl: string;
  webhookNoMatched: boolean;
  webhookNoWorkId: boolean;
  webhookSuccess: boolean;
  webhookContentChanged: boolean;
  webhookContent: Record<string, string>;
}
