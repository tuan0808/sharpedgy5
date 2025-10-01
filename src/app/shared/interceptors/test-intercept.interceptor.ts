import { HttpInterceptorFn } from '@angular/common/http';

export const testInterceptInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii')
  return next(req);
};
