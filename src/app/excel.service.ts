import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
    private baseUrl = 'http://localhost:8080/api/excel/upload'; // Replace with your backend URL

    constructor(private http: HttpClient) { }
  
    uploadExcelFile(file: File) {
      const formData: FormData = new FormData();
      formData.append('excelFile', file, file.name);
  
      return this.http.post(this.baseUrl, formData);
    }
}
