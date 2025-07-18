import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CharacterService, Character } from '../../core/services/character.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  characters = signal<Character[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  private destroy$ = new Subject<void>();

  // Computed properties for dashboard statistics
  totalCharacters = computed(() => this.characters().length);

  averageAge = computed(() => {
    const chars = this.characters();
    if (chars.length === 0) return 0;
    const validAges = chars
      .map(c => parseInt(c.age))
      .filter(age => !isNaN(age) && age > 0);
    return validAges.length > 0 ? Math.round(validAges.reduce((sum, age) => sum + age, 0) / validAges.length) : 0;
  });

  genderDistribution = computed(() => {
    const chars = this.characters();
    if (chars.length === 0) return { male: 0, female: 0, other: 0 };

    const distribution = chars.reduce((acc, char) => {
      const gender = char.gender?.toLowerCase();
      if (gender === 'male') acc.male++;
      else if (gender === 'female') acc.female++;
      else acc.other++;
      return acc;
    }, { male: 0, female: 0, other: 0 });

    const total = chars.length;
    return {
      male: Math.round((distribution.male / total) * 100),
      female: Math.round((distribution.female / total) * 100),
      other: Math.round((distribution.other / total) * 100)
    };
  });

  mostCommonSpecies = computed(() => {
    const chars = this.characters();
    if (chars.length === 0) return 'N/A';

    const speciesCount = chars.reduce((acc, char) => {
      const species = char.species || 'Unknown';
      acc[species] = (acc[species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(speciesCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
  });

  mostCommonOccupation = computed(() => {
    const chars = this.characters();
    if (chars.length === 0) return 'N/A';

    const occupationCount = chars.reduce((acc, char) => {
      const occupation = char.occupation || 'Unknown';
      acc[occupation] = (acc[occupation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(occupationCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
  });

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    // Subscribe to characters$ observable to get real-time updates
    this.characterService.characters$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.characters.set(data);
          this.loading.set(false);
        }
      });

    // Subscribe to loading state
    this.characterService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isLoading) => {
          this.loading.set(isLoading);
        }
      });

    // Subscribe to error state
    this.characterService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (error) => {
          this.error.set(error);
        }
      });

    // Load characters initially
    this.characterService.loadCharacters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          this.error.set(err || 'Bilinmeyen hata');
          this.loading.set(false);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
