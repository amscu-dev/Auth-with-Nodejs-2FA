import { HTTPSTATUS, HttpStatusCode } from "@/config/http.config";

interface ApiResponseMetadata {
  requestId: string;
  count?: number;
  [key: string]: any;
}

interface ApiResponseOptions {
  success?: boolean;
  statusCode?: HttpStatusCode;
  message?: string;
  data?: any;
  metadata: ApiResponseMetadata;
}

export class ApiResponse {
  success: boolean;
  statusCode: HttpStatusCode;
  message: string;
  data: any;
  metadata: ApiResponseMetadata;

  constructor({
    success,
    statusCode,
    message,
    data,
    metadata,
  }: ApiResponseOptions) {
    this.statusCode = statusCode || HTTPSTATUS.OK;
    this.success = success !== undefined ? success : this.statusCode < 400;
    this.message = message || "";
    this.data = data || {};
    this.metadata = {
      timestamp: new Date().toISOString(),
      ...metadata,
    };
  }
}
