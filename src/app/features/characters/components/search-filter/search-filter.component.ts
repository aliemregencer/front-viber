import { Component, EventEmitter, Output } from '@angular/core';

export interface FilterOptions {
  searchTerm: string;
  sortBy: string;
  genderFilter: string;
  speciesFilter: string;
}

@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.css']
})
export class SearchFilterComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() genderFilterChange = new EventEmitter<string>();
  @Output() speciesFilterChange = new EventEmitter<string>();

  searchTerm: string = '';
  sortBy: string = 'name';
  genderFilter: string = '';
  speciesFilter: string = '';

  genderOptions = ['Male', 'Female', 'Robot'];
  speciesOptions = ['Human', 'Robot', 'Mutant', 'Martian', 'Decapodian', 'Omicronian', 'Amphibiosans'];
  sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'age', label: 'Age' },
    { value: 'gender', label: 'Gender' },
    { value: 'species', label: 'Species' },
    { value: 'occupation', label: 'Occupation' }
  ];

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchChange.emit(this.searchTerm);
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortBy = target.value;
    this.sortChange.emit(this.sortBy);
  }

  onGenderFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.genderFilter = target.value;
    this.genderFilterChange.emit(this.genderFilter);
  }

  onSpeciesFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.speciesFilter = target.value;
    this.speciesFilterChange.emit(this.speciesFilter);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.genderFilter = '';
    this.speciesFilter = '';
    this.sortBy = 'name';

    this.searchChange.emit('');
    this.genderFilterChange.emit('');
    this.speciesFilterChange.emit('');
    this.sortChange.emit('name');
  }
}
