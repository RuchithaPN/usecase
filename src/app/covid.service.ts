import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CountryReports } from './countryReports';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CovidService {
  [x: string]: any;

//   constructor(private http:HttpClient) { }


//   public covid19Reports(){
//   return  this.http.get("https://corona.lmao.ninja/v2/countries");
//   }

  private apiUrl =  'http://localhost:3000/data'; // Replace with your API URL

  constructor(private http: HttpClient) {}

  // Fetch data from the API
  fetchData(): Observable<CountryReports[]> {
    return this.http.get<CountryReports[]>(this.apiUrl);
  }
}
