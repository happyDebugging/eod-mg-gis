import { Component } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { DbFunctionService } from '../shared/services/db-functions.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {

  href: string = '';

  sessionToken = '';
  userEmail = '';

  newUserPassword = '';
  newUserPasswordConfirmation = '';
  isPassword6Characters = true;
  isChangePasswordSuccessfull = false;
  isNewPasswordTheSame = false;
  errorMessageToShow = '';

  // Initialize Supabase
  private supabase: SupabaseClient

  constructor(private dbFunctionService: DbFunctionService, private router: Router) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  ngOnInit() {
    this.href = this.router.url;
    this.sessionToken = this.href.substr(this.href.lastIndexOf('token/') + 6, 6);
    this.userEmail = this.href.substr(this.href.lastIndexOf('/') + 1);
    console.log(this.sessionToken)
  }

  async UpdateUserPassword() {

    this.isNewPasswordTheSame = false;
    await this.supabase.auth.updateUser({ password: this.newUserPassword })
      .then((res) => {
        console.log(res.error?.code)

        if (res.error?.code == 'same_password') {
          this.errorMessageToShow = 'Ο νέος κωδικός πρόσβασης πρέπει να είναι διαφορετικός από τον προηγούμενο.';
          this.isNewPasswordTheSame = true;

          setTimeout(() => {
            this.isNewPasswordTheSame = false;
          }, 2500);
        } else if (res.error?.code == 'weak_password') {
          this.isPassword6Characters = false;

          setTimeout(() => {
            this.isPassword6Characters = true;
          }, 2500);
        } else {
          // Update successful
          this.isChangePasswordSuccessfull = true;

          this.newUserPassword = '';
          this.newUserPasswordConfirmation = '';
          this.isPassword6Characters = true;
          this.isNewPasswordTheSame = false;

          //this.UpdateUserDetails(res.data.user);

          setTimeout(() => {
            this.isChangePasswordSuccessfull = false;
            window.location.href = environment.appUrl;
          }, 2500);
        }

      }).catch((error) => {
        console.log(error)
      });

  }


}
