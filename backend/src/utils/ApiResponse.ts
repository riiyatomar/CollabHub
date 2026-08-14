export class ApiResponse<T> {
  public success: boolean;
  public message: string;
  public data: T;
  public errors: any;

  constructor(statusCode: number, data: T, message: string = 'Success') {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.errors = null;
  }
}
