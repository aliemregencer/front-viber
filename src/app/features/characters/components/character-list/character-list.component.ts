import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil, startWith } from 'rxjs/operators';
import { CharacterService, Character } from '../../../../core/services/character.service';

@Component({
  selector: 'app-character-list',
  templateUrl: './character-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  characters$ = this.characterService.characters$;
  loading$ = this.characterService.loading$;
  error$ = this.characterService.error$;
  
  searchTerm$ = new Subject<string>();
  sortBy$ = new Subject<string>();
  genderFilter$ = new Subject<string>();
  speciesFilter$ = new Subject<string>();

  filteredCharacters$: Observable<Character[]>;

  // Pagination properties for ngx-pagination
  currentPage = 1;
  pageSize = 12;

  constructor(private characterService: CharacterService) {
    this.filteredCharacters$ = combineLatest([
      this.characters$,
      this.searchTerm$.pipe(startWith('')),
      this.sortBy$.pipe(startWith('name')),
      this.genderFilter$.pipe(startWith('')),
      this.speciesFilter$.pipe(startWith(''))
    ]).pipe(
      map(([characters, search, sort, gender, species]) => {
        let filtered = this.filterCharacters(characters, search, gender, species);
        filtered = this.sortCharacters(filtered, sort);
        return filtered;
      })
    );
  }

  ngOnInit() {
    this.characterService.loadCharacters()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(term: string) {
    this.searchTerm$.next(term);
    this.currentPage = 1; // Reset to first page when searching
  }

  onSort(field: string) {
    this.sortBy$.next(field);
  }

  onGenderFilter(gender: string) {
    this.genderFilter$.next(gender);
    this.currentPage = 1; // Reset to first page when filtering
  }

  onSpeciesFilter(species: string) {
    this.speciesFilter$.next(species);
    this.currentPage = 1; // Reset to first page when filtering
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  trackByFn(_: number, character: any): number {
    return character.id;
  }

  private filterCharacters(characters: Character[], search: string, gender: string, species: string): Character[] {
    let filtered = characters;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(char => {
        const fullName = this.getFullName(char).toLowerCase();
        const occupation = char.occupation?.toLowerCase() || '';
        const charSpecies = char.species?.toLowerCase() || '';

        return fullName.includes(searchLower) ||
               occupation.includes(searchLower) ||
               charSpecies.includes(searchLower);
      });
    }

    // Gender filter
    if (gender) {
      filtered = filtered.filter(char => char.gender === gender);
    }

    // Species filter
    if (species) {
      filtered = filtered.filter(char => char.species === species);
    }

    return filtered;
  }

  private getFullName(character: Character): string {
    if (!character?.name) return 'Unknown';
    const { first, middle, last } = character.name;
    return [first, middle, last].filter(Boolean).join(' ');
  }

  private sortCharacters(characters: Character[], sortBy: string): Character[] {
    return [...characters].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = this.getFullName(a);
          bValue = this.getFullName(b);
          break;
        case 'age':
          aValue = parseInt(a.age) || 0;
          bValue = parseInt(b.age) || 0;
          break;
        case 'gender':
          aValue = a.gender || '';
          bValue = b.gender || '';
          break;
        case 'species':
          aValue = a.species || '';
          bValue = b.species || '';
          break;
        case 'occupation':
          aValue = a.occupation || '';
          bValue = b.occupation || '';
          break;
        default:
          aValue = a[sortBy as keyof Character];
          bValue = b[sortBy as keyof Character];
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }

      return String(aValue).localeCompare(String(bValue));
    });
  }


}