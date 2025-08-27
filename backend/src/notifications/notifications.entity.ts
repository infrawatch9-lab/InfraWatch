interface slackService {
    webhookUrl : string;
    channel: string;
}

interface emailService {
    user: string;
    gmailAppPassword: string;
}

export interface CreateAlertChannelDto
{
    slack: slackService;
    email: emailService;
}