import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SERVER_PATH } from 'src/app/config';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit {

  ngOnInit(): void {
    sessionStorage.clear();
  }

  isnotValid = false;

  constructor(private router: Router, private http: HttpClient) {

  }

  loginForm = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });


  onLogin() {
    const value = this.loginForm.value;
    this.http.post(SERVER_PATH + "login", { "username": value.username, "password": value.password })
      .subscribe((res) => {
        if (res) {
          this.loginForm.reset();
          sessionStorage.setItem('isLogged', "true");
          sessionStorage.setItem('username', value.username!);
          this.router.navigate(["/home"]);
        }
        else {
          this.isnotValid = true;
          this.loginForm.reset();
          console.log(res);
        }
      },
        (error) => {
          console.log(error);
        }
      )
  }


  signup() {
    this.router.navigate(['/signup']);
  }

}
