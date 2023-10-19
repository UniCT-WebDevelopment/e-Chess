import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);
  if (sessionStorage.getItem('isLogged') == "true") {
    return true;
  }

  router.navigate(['/login']);
  return false;

};

