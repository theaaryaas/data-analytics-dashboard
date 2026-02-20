import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

const passwordMatchValidator = (c: AbstractControl): ValidationErrors | null =>
  c.get('password')?.value !== c.get('confirmPassword')?.value ? { passwordMismatch: true } : null;

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div style="min-height:100vh;background:linear-gradient(135deg,#FFF8F5,#FFF5F0,#FFF0E6);display:flex;align-items:center;justify-content:center;padding:20px;position:relative;overflow:hidden">
      <div style="position:absolute;top:-50px;right:-50px;width:200px;height:200px;border-radius:50%;background:linear-gradient(135deg,rgba(255,138,101,.1),rgba(255,112,67,.05))"></div>
      <div style="position:absolute;bottom:-100px;left:-100px;width:300px;height:300px;border-radius:50%;background:linear-gradient(135deg,rgba(255,138,101,.08),rgba(255,112,67,.03))"></div>

      <mat-card style="width:100%;max-width:480px;border-radius:20px;border:1px solid rgba(255,179,167,.3);box-shadow:0 12px 40px rgba(255,112,67,.2);background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(255,248,245,.98));backdrop-filter:blur(20px);position:relative;z-index:1;padding:40px">
        <div style="text-align:center;margin-bottom:40px">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;border-radius:20px;background:linear-gradient(135deg,#FF8A65,#FF7043);margin-bottom:24px;box-shadow:0 8px 24px rgba(255,138,101,.3)">
            <mat-icon style="font-size:48px;height:48px;width:48px;color:white">bar_chart</mat-icon>
          </div>
          <h2 style="color:#4A5568;margin:0 0 8px;font-size:32px;font-weight:700;letter-spacing:-.5px">Create Account</h2>
          <p style="color:#7F8C8D;font-size:15px;margin:0">Sign up to start using Data Analytics Dashboard</p>
        </div>

        <form [formGroup]="signupForm" (ngSubmit)="onSignUp()" style="display:flex;flex-direction:column;gap:20px">
          <mat-form-field appearance="outline">
            <mat-label>Full Name</mat-label>
            <mat-icon matPrefix style="color:#FF8A65;margin-right:8px">person</mat-icon>
            <input matInput formControlName="name" placeholder="Enter your full name">
            <mat-error *ngIf="f('name')?.hasError('required') && f('name')?.touched">Full name is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email address</mat-label>
            <mat-icon matPrefix style="color:#FF8A65;margin-right:8px">email</mat-icon>
            <input matInput type="email" formControlName="email" placeholder="Enter your email">
            <mat-error *ngIf="f('email')?.hasError('required') && f('email')?.touched">Email is required</mat-error>
            <mat-error *ngIf="f('email')?.hasError('email') && f('email')?.touched">Please enter a valid email</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <mat-icon matPrefix style="color:#FF8A65;margin-right:8px">lock</mat-icon>
            <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="Create a password">
            <button mat-icon-button matSuffix (click)="hidePassword=!hidePassword" type="button" style="color:#7F8C8D">
              <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="f('password')?.hasError('required') && f('password')?.touched">Password is required</mat-error>
            <mat-error *ngIf="f('password')?.hasError('minlength') && f('password')?.touched">Password must be at least 6 characters</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Confirm Password</mat-label>
            <mat-icon matPrefix style="color:#FF8A65;margin-right:8px">lock</mat-icon>
            <input matInput [type]="hideConfirm ? 'password' : 'text'" formControlName="confirmPassword" placeholder="Confirm your password">
            <button mat-icon-button matSuffix (click)="hideConfirm=!hideConfirm" type="button" style="color:#7F8C8D">
              <mat-icon>{{ hideConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="signupForm.hasError('passwordMismatch') && f('confirmPassword')?.touched">Passwords do not match!</mat-error>
            <mat-error *ngIf="f('confirmPassword')?.hasError('required') && f('confirmPassword')?.touched">Please confirm your password</mat-error>
          </mat-form-field>

          <button mat-raised-button type="submit" [disabled]="loading||signupForm.invalid"
            style="width:100%;height:52px;border-radius:12px;background:linear-gradient(135deg,#FF8A65,#FF7043);border:none;font-weight:600;font-size:16px;margin-top:8px;color:white;box-shadow:0 4px 16px rgba(255,138,101,.4);transition:all .3s"
            [style.opacity]="loading||signupForm.invalid ? '0.6' : '1'">
            <span *ngIf="!loading">Create Account</span>
            <span *ngIf="loading" style="display:flex;align-items:center;justify-content:center;gap:8px">
              <mat-icon style="font-size:20px;height:20px;width:20px;animation:spin 1s linear infinite">sync</mat-icon>
              Creating account...
            </span>
          </button>
        </form>

        <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,179,167,.2)">
          <p style="color:#7F8C8D;margin:0;font-size:14px">
            Already have an account?
            <a routerLink="/login" style="color:#FF8A65;font-weight:600;text-decoration:none;margin-left:4px">Sign In</a>
          </p>
        </div>
      </mat-card>
    </div>`,
  styles: [`
    @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
    ::ng-deep .mat-mdc-form-field { --mdc-outlined-text-field-outline-color:rgba(255,179,167,.4); --mdc-outlined-text-field-focus-outline-color:#FF8A65; --mdc-outlined-text-field-label-text-color:#7F8C8D; --mdc-outlined-text-field-focus-label-text-color:#FF8A65; }
    ::ng-deep .mat-mdc-form-field-focus-overlay { background-color:rgba(255,138,101,.05) !important; }
    ::ng-deep .mat-mdc-text-field-wrapper { background-color:rgba(255,248,245,.5) !important; }
  `]
})
export class SignUpComponent {
  signupForm: FormGroup;
  loading = false; hidePassword = true; hideConfirm = true;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.signupForm = this.fb.group({
      name:            ['', Validators.required],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  f(name: string) { return this.signupForm.get(name); }

  onSignUp() {
    if (!this.signupForm.valid) return;
    this.loading = true;
    setTimeout(() => {
      const { name, email } = this.signupForm.value;
      this.authService.signUp({ name, email });
      this.router.navigate(['/dashboard']);
      this.loading = false;
    }, 1000);
  }
}