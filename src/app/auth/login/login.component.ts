import {Component, OnInit} from '@angular/core';
import {AppService} from '../../shared/app.service';
import {FormBuilder, Validators} from '@angular/forms';
import {BscRestService} from '../../shared/rest.service';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {EmitterService} from '../../shared/emitter.service';
import {CustomValidators} from '../../shared/utils/custom-validator';
import {HttpResponse} from '@angular/common/http';
import {LoaderService} from '../../shared/loader.service';
import {mergeMap} from 'rxjs/operators/mergeMap';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  onKeydown: boolean;
  InvalidUser: string = null;
  loginForm = this.formBuilder.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    grant_type: ['password']
  });

  constructor(private appService: AppService,
              private formBuilder: FormBuilder,
              private bscRestService: BscRestService,
              private http: HttpClient,
              private customValidators: CustomValidators,
              private emitterService: EmitterService,
              private loaderService: LoaderService,
              private router: Router) {
    this.onKeydown = true;
  }
  ngOnInit() {
    sessionStorage.clear();
  }

  RedirectToDashboard() {
    const formData: any = new FormData();
    if (this.loginForm.valid) {
      const user = this.loginForm.get('username').value;
      const password = this.loginForm.get('password').value;
      this.http.get(`http://localhost:2020/userAuth/tenant/${user}`).subscribe((data: any) => 
      { 
        if (data.status === '0') {
          sessionStorage.setItem('tenantId', data.data['tenantId']);
          this.http.post(`http://localhost:2020/userAuth/token?tenantId=
      ${sessionStorage.getItem('tenantId')}`, {password:password}).subscribe(
            (response: HttpResponse<any>) => {
              console.log(response);
              if (response['access_token']) {
                sessionStorage.setItem('access_token', response['access_token']);
                this.router.navigate(['/dashboard']);
                this.getOrganizations();
              }else{
              this.InvalidUser = 'Incorrect Credentials!';
              this.loaderService.hide();
              }
            }, (err) => {
              this.InvalidUser = 'Incorrect Credentials!';
              this.loaderService.hide();
            }
          );
        } else {
          this.InvalidUser = 'No User Exist with given Email Id!';
          this.loaderService.hide();
        }
      });
    }
  }

  getOrganizations() {
    this.bscRestService.getCodeAndName().subscribe((data: any) => {
      if (data.status === '0') {
        this.emitterService.broadcastOrgUnitCode(data.data['OrganisationList']);
      }
    });
  }

  preventAfterSubmit() {
    return this.onKeydown;
  }

}
