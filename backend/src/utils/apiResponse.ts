// backend/src/utils/apiResponse.ts
export class ApiResponse {
  static success<T>(data: T, message = 'Sukces') {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, code = 400) {
    return {
      success: false,
      message,
      code,
    };
  }
}
