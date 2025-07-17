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
  eyeColor?: string;
  hairColor?: string;
  modelNumber?: string;
  skills?: string[];
  description?: string;
}

export interface NewCharacterData {
  firstName: string;
  lastName: string;
  species: string;
  occupation: string;
  gender: string;
  homePlanet: string;
  age?: number;
  eyeColor: string;
  hairColor: string;
  modelNumber?: string;
  skills: string[];
  description: string;
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
        // Merge with any locally added characters
        const localCharacters = this.getLocalCharacters();
        const allCharacters = [...characters, ...localCharacters];
        this.charactersSubject.next(allCharacters);
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

  addCharacter(newCharacterData: NewCharacterData): Character {
    const currentCharacters = this.charactersSubject.value;
    const newId = Math.max(...currentCharacters.map(c => c.id), 0) + 1;

    const newCharacter: Character = {
      id: newId,
      name: {
        first: newCharacterData.firstName,
        middle: '',
        last: newCharacterData.lastName
      },
      images: {
        'head-shot': 'https://via.placeholder.com/150x150?text=New+Character',
        main: 'https://via.placeholder.com/300x400?text=New+Character'
      },
      gender: newCharacterData.gender,
      species: newCharacterData.species,
      homePlanet: newCharacterData.homePlanet,
      occupation: newCharacterData.occupation,
      sayings: newCharacterData.description ? [newCharacterData.description] : [],
      age: newCharacterData.age?.toString() || 'Unknown',
      eyeColor: newCharacterData.eyeColor,
      hairColor: newCharacterData.hairColor,
      modelNumber: newCharacterData.modelNumber,
      skills: newCharacterData.skills,
      description: newCharacterData.description
    };

    // Save to localStorage
    this.saveLocalCharacter(newCharacter);

    const updatedCharacters = [...currentCharacters, newCharacter];
    this.charactersSubject.next(updatedCharacters);

    return newCharacter;
  }

  getCharacters(): Character[] {
    return this.charactersSubject.value;
  }

  private saveLocalCharacter(character: Character): void {
    const localCharacters = this.getLocalCharacters();
    localCharacters.push(character);
    localStorage.setItem('local-characters', JSON.stringify(localCharacters));
  }

  private getLocalCharacters(): Character[] {
    try {
      const stored = localStorage.getItem('local-characters');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading local characters:', error);
      return [];
    }
  }

  private inferGender(firstName: string): string {
    // Simple gender inference based on common names
    const maleNames = ['john', 'james', 'robert', 'michael', 'william', 'david', 'richard', 'joseph', 'thomas', 'christopher', 'bender', 'fry', 'zoidberg'];
    const femaleNames = ['mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen', 'leela', 'amy'];

    const name = firstName.toLowerCase();
    if (maleNames.includes(name)) return 'Male';
    if (femaleNames.includes(name)) return 'Female';
    return 'Unknown';
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