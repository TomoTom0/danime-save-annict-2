export interface StorageItems {
  token?: string;
  annictSend?: boolean;
  withTwitter?: boolean;
  withFacebook?: boolean;
  webhookSettings?: string;
  [key: `valid_${string}Annict`]: boolean | undefined;
  [key: `valid_${string}Webhook`]: boolean | undefined;
  [key: string]: any;
}
