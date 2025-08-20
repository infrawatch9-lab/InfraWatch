import { BaseServiceDto } from '../service.common-entity';

export class HttpConfigDto {
  endpoint!: string;
  method?: string = "GET";
  headers?: Record<string, string>;
  body?: Record<string, any>;

  authType?: "bearer" | "basic" | "none";
  authValue?: string;

  validateSSL?: boolean = true;
  followRedirects?: boolean = true;

  expectedStatus?: number;
  expectedBodyIncludes?: string;
  expectedResponseTimeMs?: number;
  expectedHeadersIncludes?: Record<string, string>;
}


export interface HttpDto extends BaseServiceDto {
  type: 'HTTP';
  httpConfig?: HttpConfigDto;
}