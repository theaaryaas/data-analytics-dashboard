import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User { name?: string; email: string; password?: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private subject = new BehaviorSubject<User | null>(
    JSON.parse(localStorage.getItem('user') || 'null')
  );
  user$ = this.subject.asObservable();

  private set(user: User | null) {
    user ? localStorage.setItem('user', JSON.stringify(user)) : localStorage.removeItem('user');
    this.subject.next(user);
  }

  login(user: User)  { this.set(user); }
  signUp(user: User) { this.set(user); }
  logout()           { this.set(null); }
  isAuthenticated()  { return this.subject.value !== null; }
  getCurrentUser()   { return this.subject.value; }
}