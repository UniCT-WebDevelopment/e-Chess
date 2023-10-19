import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SERVER_PATH } from 'src/app/config';

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css']
})


export class SignupPageComponent implements OnInit {
  ngOnInit(): void {
    sessionStorage.clear();
  }


  constructor(private router: Router, private http: HttpClient) { }

  showAlert: boolean = false;
  usernameExist: boolean = false;

  submitForm = new FormGroup({
    name: new FormControl('', Validators.required),
    surname: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirm_pass: new FormControl('', Validators.required)

  });

  onSubmit() {

    const value = this.submitForm.value;

    if (value.password !== value.confirm_pass) {
      this.showAlert = true;
      this.submitForm.controls.password.setValue("");
      this.submitForm.controls.confirm_pass.setValue("");

      return;
    }

    this.http.get(SERVER_PATH + "getUsername/" + value.username).subscribe((res) => {

      if (res) {
        this.usernameExist = true;
        this.submitForm.controls.username.setValue("");
        return;
      }
      else {
        this.http.post(SERVER_PATH + "insertUser", { "name": value.name, "surname": value.surname, "username": value.username, "password": value.password, "score": 100 })
          .subscribe((res) => {
            if (res) {
              this.submitForm.reset();
              sessionStorage.setItem('isLogged', "true");
              sessionStorage.setItem('username', value.username!);
              this.router.navigate(["/home"]);
            }
            else {
              console.log(res);
            }
          })
      }
    })
  }
}
