import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface CharacterName {
  first: string;
  middle: string;
  last: string;
}

export interface CharacterImages {
  'head-shot': string;
  main: string;
}

export interface Character {
  id: number;
  name: CharacterName;
  images: CharacterImages;
  age: string;
  gender: string;
  species: string;
  homePlanet: string;
  occupation: string;
  sayings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private readonly API_URL = 'https://api.sampleapis.com/futurama/characters';
  private charactersSubject = new BehaviorSubject<Character[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public characters$ = this.charactersSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadCharacters(): Observable<Character[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<Character[]>(this.API_URL).pipe(
      map(characters => this.transformCharacters(characters)),
      tap(characters => {
        this.charactersSubject.next(characters);
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  private transformCharacters(characters: Character[]): Character[] {
    return characters.map(character => ({
      ...character,
      // Ensure all required fields exist with fallback values
      name: character.name || { first: 'Unknown', middle: '', last: '' },
      images: character.images || { 'head-shot': '', main: '' },
      age: character.age || 'Unknown',
      gender: character.gender || 'Unknown',
      species: character.species || 'Unknown',
      homePlanet: character.homePlanet || 'Unknown',
      occupation: character.occupation || 'Unknown',
      sayings: character.sayings || []
    }));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loadingSubject.next(false);
    let errorMessage = 'Bir hata oluştu';
    
    if (error.status === 404) {
      errorMessage = 'Veri bulunamadı';
    } else if (error.status === 0) {
      errorMessage = 'Bağlantı hatası';
    }
    
    this.errorSubject.next(errorMessage);
    return throwError(() => errorMessage);
  }
}