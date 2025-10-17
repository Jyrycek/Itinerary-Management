import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';
import { AuthGuard } from './core/guards/auth.guard';
import { ProfileComponent } from './profile/profile/profile.component';
import { PlanDetailsComponent } from './features/plan/plan-details/plan-details.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { PasswordRecoveryComponent } from './features/auth/password-recovery/password-recovery.component';
import { PasswordResetComponent } from './features/auth/password-reset/password-reset.component';


const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Domovská stránka' },
  { path: 'login', component: LoginComponent, title: 'Přihlášení' },
  { path: 'register', component: RegisterComponent, title: 'Registrace' },
  { path: 'recovery-password', component: PasswordRecoveryComponent, title: 'Obnovení hesla' },
  { path: 'password-reset', component: PasswordResetComponent, title: 'Obnovení hesla' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], title: "Seznam projektů" },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], title: "Uživatelský profil" },
  { path: 'dashboard/project/:id', component: PlanDetailsComponent, canActivate: [AuthGuard], title: "Správa projektu" },
  { path: '**', component: HomeComponent, title: 'Domovská stránka' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
