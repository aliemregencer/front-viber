import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FuturamaService {
  private apiUrl = 'https://api.sampleapis.com/futurama/characters';

  constructor(private http: HttpClient) {}

  getCharacters(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('API Hatası:', error);
        return throwError(() => new Error('Veri alınamadı'));
      })
    );
  }
}
