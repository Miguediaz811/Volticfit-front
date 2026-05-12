import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent }     from './app.component';
import { JwtInterceptor }   from './core/interceptors/jwt.interceptor';
import { UsersModule }      from './features/users/users.module';
import { SanctionsModule }  from './features/sanctions/sanctions.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    UsersModule,    
    SanctionsModule,
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi(),
    ),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}